"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Plus,
	InfoCircle as Info,
	Shield,
	Trophy,
	Timer,
	Key,
	Book,
	Trash,
	Menu,
	Flash,
	Copy,
	Screenshot,
	ViewGrid as LayoutGrid,
	VideoCamera,
	Calendar,
	Eye,
} from "iconoir-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
	createExamSupabase,
	updateExamSupabase,
} from "@/actions/exam-supabase";
import { assignExamToClassesAction } from "@/actions/exam-assignment";
import { ClassData } from "@/actions/classes-supabase";
import { Exam, ExamQuestion } from "@/types/exam";
import { cn } from "@/lib/utils";
import { QuestionBankSelector } from "./QuestionBankSelector";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { MathRenderer } from "@/components/ui/math-renderer";

const formSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, "Judul harus diisi"),
	type: z.enum(["exam", "quiz"]),
	// New Assignment fields for creation flow
	assignments: z
		.array(
			z.object({
				classId: z.string().min(1),
				startTime: z.string().min(1),
				endTime: z.string().min(1),
				status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]),
			}),
		)
		.optional(),
	duration: z.number().min(1, "Durasi minimal 1 menit"),
	token: z.string().optional(),
	isSubmitLocked: z.boolean(),
	questions: z.array(z.any()).min(1, "Pilih minimal 1 soal"),
	rewards: z.object({
		xp: z.number().min(0),
		coin: z.number().min(0),
	}),
	settings: z.object({
		requireToken: z.boolean(),
		shuffleQuestions: z.boolean(),
		shuffleOptions: z.boolean(),
		showScoreImmediately: z.boolean(),
		antiCheat: z.object({
			enabled: z.boolean(),
			maxViolations: z.number().min(0),
			forceFullscreen: z.boolean(),
			preventCopyPaste: z.boolean(),
			preventScreenshot: z.boolean(),
			preventSplitScreen: z.boolean(),
			preventScreenRecord: z.boolean(),
		}),
	}),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateExamDialogProps {
	classes: ClassData[];
	initialData?: Exam;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function dedupeExamQuestionsForSubmit(questions: ExamQuestion[]) {
	return questions.filter((q, index, arr) => {
		// Prefer stable per-question identifiers.
		// bankId points to question bank/topic and is shared across many questions.
		const key = q.bankQuestionId || q.id || q.bankId;
		return (
			arr.findIndex(
				(item) => (item.bankQuestionId || item.id || item.bankId) === key,
			) === index
		);
	});
}

export function CreateExamDialog({
	classes,
	initialData,
	trigger,
	onSuccess,
}: CreateExamDialogProps) {
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("info");
	const [isPending, startTransition] = useTransition();

	const isEditing = !!initialData;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			id: initialData?.id || undefined,
			title: initialData?.title || "",
			type: (initialData?.type as "exam" | "quiz") || "quiz",
			assignments: [],
			duration: initialData?.duration || 30,
			token: initialData?.token || "",
			isSubmitLocked: initialData?.isSubmitLocked ?? false,
			questions: initialData?.questions || [],
			rewards: {
				xp: initialData?.rewards?.xp ?? 100,
				coin: initialData?.rewards?.coin ?? 50,
			},
			settings: {
				requireToken: initialData?.settings?.requireToken ?? false,
				shuffleQuestions: initialData?.settings?.shuffleQuestions ?? true,
				shuffleOptions: initialData?.settings?.shuffleOptions ?? true,
				showScoreImmediately:
					initialData?.settings?.showScoreImmediately ?? true,
				antiCheat: {
					enabled: initialData?.settings?.antiCheat?.enabled ?? false,
					maxViolations: initialData?.settings?.antiCheat?.maxViolations ?? 3,
					forceFullscreen:
						initialData?.settings?.antiCheat?.forceFullscreen ?? false,
					preventCopyPaste:
						initialData?.settings?.antiCheat?.preventCopyPaste ?? true,
					preventScreenshot:
						initialData?.settings?.antiCheat?.preventScreenshot ?? true,
					preventSplitScreen:
						initialData?.settings?.antiCheat?.preventSplitScreen ?? true,
					preventScreenRecord:
						initialData?.settings?.antiCheat?.preventScreenRecord ?? true,
				},
			},
		},
	});

	const onSubmit = useCallback(
		async (values: FormValues) => {
			startTransition(async () => {
				const normalizedQuestions: ExamQuestion[] = (
					(values.questions as ExamQuestion[]) || []
				).map((q) => ({
					...q,
					// Keep bank linkage stable for duplicate detection when editing later.
					bankId: q.bankId || q.bankQuestionId,
				}));

				const dedupedQuestions = dedupeExamQuestionsForSubmit(
					normalizedQuestions,
				);

				const examData: Partial<Exam> = {
					title: values.title,
					type: values.type,
					duration: values.duration,
					token: values.token || undefined,
					isSubmitLocked: values.isSubmitLocked,
					rewards: values.rewards,
					settings: values.settings,
					questions: dedupedQuestions,
					status: initialData?.status || "draft",
				};

				const result = (
					isEditing
						? await updateExamSupabase(initialData.id!, examData)
						: await createExamSupabase(examData)
				) as { success: boolean; id?: string; error?: string };

				if (result.success) {
					// If there are assignments, process them
					if (values.assignments && values.assignments.length > 0) {
						const examId = isEditing ? initialData.id! : result.id!;

						// Group assignments by schedule/status to use createMany efficiently
						// For simplicity in this UI, we assume they share the same schedule if created together
						const first = values.assignments[0];
						await assignExamToClassesAction({
							examId,
							classIds: values.assignments.map((a) => a.classId),
							startTime: new Date(first.startTime),
							endTime: new Date(first.endTime),
							status: first.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
						});
					}

					toast.success("Berhasil disimpan");
					setOpen(false);
					if (!isEditing) form.reset();
					onSuccess?.();
				} else {
					toast.error("Terjadi Kesalahan", {
						description: result.error || "Gagal menyimpan ujian",
					});
				}
			});
		},
		[form, initialData, isEditing, onSuccess],
	);

	// Keyboard shortcut: Cmd/Ctrl + Enter to submit
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				form.handleSubmit(onSubmit)();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [form, onSubmit]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="rounded-xl font-bold gap-2 bg-zinc-950 text-zinc-50 hover:bg-zinc-800 transition-all">
						<Plus className="w-4 h-4" />
						Buat Ujian Baru
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-7xl h-[95vh] p-0 overflow-hidden flex flex-col gap-0 border-none sm:rounded-2xl shadow-2xl">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex-1 flex flex-col overflow-hidden"
					>
						{/* Header */}
						<header className="p-6 border-b bg-white dark:bg-zinc-950 flex items-center justify-between shrink-0">
							<div className="flex items-center gap-4">
								<div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-zinc-50 flex items-center justify-center text-zinc-50 dark:text-zinc-950">
									<Book className="w-5 h-5" />
								</div>
								<div>
									<DialogTitle className="text-xl font-bold tracking-tight uppercase italic">
										{isEditing ? "Edit Konfigurasi Ujian" : "Konfigurasi Ujian"}
									</DialogTitle>
									<DialogDescription className="text-xs font-medium">
										{isEditing
											? "Perbarui detail ujian dan pengaturan keamanan."
											: "Atur detail ujian, hadiah, dan sistem keamanan di sini."}
									</DialogDescription>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<Button
									type="button"
									variant="ghost"
									onClick={() => setOpen(false)}
									className="font-bold text-xs uppercase tracking-widest"
								>
									Batal
								</Button>
								<Button
									type="submit"
									disabled={isPending}
									className="font-black uppercase tracking-widest bg-zinc-950 text-zinc-50 hover:bg-zinc-800 px-8 shadow-xl shadow-zinc-950/20 transition-all h-11"
								>
									{isPending ? "Memuat..." : "Simpan & Publikasi"}
								</Button>
							</div>
						</header>

						<div className="flex-1 flex overflow-hidden">
							{/* Sidebar Navigation */}
							<nav
								role="tablist"
								className="w-64 border-r bg-zinc-50/50 dark:bg-zinc-900/20 p-4 flex flex-col gap-2 shrink-0"
							>
								<button
									type="button"
									role="tab"
									aria-selected={activeTab === "info"}
									onClick={() => setActiveTab("info")}
									className={cn(
										"flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
										activeTab === "info"
											? "bg-white dark:bg-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700"
											: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
									)}
								>
									<Info
										className={cn(
											"w-4 h-4",
											activeTab === "info" ? "text-primary" : "",
										)}
									/>
									Informasi Dasar
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={activeTab === "questions"}
									onClick={() => setActiveTab("questions")}
									className={cn(
										"flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
										activeTab === "questions"
											? "bg-white dark:bg-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700"
											: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
									)}
								>
									<Book
										className={cn(
											"w-4 h-4",
											activeTab === "questions" ? "text-primary" : "",
										)}
									/>
									Pilih Soal
									<Badge className="ml-auto bg-primary/10 text-primary border-none text-[10px] h-5 px-1.5">
										{(form.watch("questions") || []).length}
									</Badge>
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={activeTab === "rewards"}
									onClick={() => setActiveTab("rewards")}
									className={cn(
										"flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
										activeTab === "rewards"
											? "bg-white dark:bg-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700"
											: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
									)}
								>
									<Trophy
										className={cn(
											"w-4 h-4",
											activeTab === "rewards" ? "text-primary" : "",
										)}
									/>
									Rewards
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={activeTab === "security"}
									onClick={() => setActiveTab("security")}
									className={cn(
										"flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
										activeTab === "security"
											? "bg-white dark:bg-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700"
											: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
									)}
								>
									<Shield
										className={cn(
											"w-4 h-4",
											activeTab === "security" ? "text-primary" : "",
										)}
									/>
									Keamanan
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={activeTab === "assignments"}
									onClick={() => setActiveTab("assignments")}
									className={cn(
										"flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
										activeTab === "assignments"
											? "bg-white dark:bg-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700"
											: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
									)}
								>
									<Calendar
										className={cn(
											"w-4 h-4",
											activeTab === "assignments" ? "text-primary" : "",
										)}
									/>
									Penugasan
								</button>
							</nav>

							{/* Main Content Area */}
							<div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
								<div className="w-full p-8 lg:p-12">
									{activeTab === "info" && (
										<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
											<div className="space-y-1">
												<h3 className="text-xl font-black uppercase italic tracking-tight">
													Informasi Dasar
												</h3>
												<p className="text-sm text-zinc-500 font-medium">
													Lengkapi detail utama pelaksanaan ujian.
												</p>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
												<FormField
													control={form.control}
													name="title"
													render={({ field }) => (
														<FormItem className="col-span-2">
															<FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
																Judul Ujian / Kuis
															</FormLabel>
															<FormControl>
																<Input
																	placeholder="Contoh: Ulangan Harian Bab 1"
																	{...field}
																	className="h-12 text-lg font-bold border-2 focus:border-zinc-950 rounded-xl"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="type"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
																Tipe Pelaksanaan
															</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger className="h-11 rounded-xl font-bold">
																		<SelectValue placeholder="Pilih tipe" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent className="rounded-xl">
																	<SelectItem value="exam">
																		Exam (Ujian Formal)
																	</SelectItem>
																	<SelectItem value="quiz">
																		Quiz (Latihan)
																	</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="duration"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
																Durasi (Menit)
															</FormLabel>
															<FormControl>
																<div className="relative">
																	<Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
																	<Input
																		type="number"
																		{...field}
																		onChange={(e) =>
																			field.onChange(Number(e.target.value))
																		}
																		className="pl-10 h-11 rounded-xl font-bold"
																	/>
																</div>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="token"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
																Token Akses (Opsional)
															</FormLabel>
															<FormControl>
																<div className="relative">
																	<Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
																	<Input
																		placeholder="6 Karakter"
																		maxLength={6}
																		{...field}
																		className="pl-10 h-11 rounded-xl font-mono font-black uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900"
																	/>
																</div>
															</FormControl>
															<FormDescription className="text-[10px]">
																Kosongkan untuk akses tanpa token.
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>
									)}

									{activeTab === "assignments" && (
										<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
											<div className="space-y-1">
												<h3 className="text-xl font-black uppercase italic tracking-tight">
													Penugasan & Jadwal
												</h3>
												<p className="text-sm text-zinc-500 font-medium">
													Tentukan kelas mana saja yang mendapatkan ujian ini
													dan kapan bisa dikerjakan.
												</p>
											</div>

											<div className="p-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-6">
												<div className="space-y-4">
													<Label className="text-xs font-black uppercase tracking-widest text-zinc-400">
														Pilih Kelas Target
													</Label>
													<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
														{classes.map((cls) => (
															<div
																key={cls.id}
																className={cn(
																	"flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer",
																	(form.watch("assignments") || []).some(
																		(a) => a.classId === cls.id,
																	)
																		? "bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-lg shadow-zinc-950/20"
																		: "bg-zinc-50 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800",
																)}
																onClick={() => {
																	const current =
																		form.getValues("assignments") || [];
																	const exists = current.some(
																		(a) => a.classId === cls.id,
																	);
																	if (exists) {
																		form.setValue(
																			"assignments",
																			current.filter(
																				(a) => a.classId !== cls.id,
																			),
																		);
																	} else {
																		// Default times: now to 1 week from now
																		const now = new Date();
																		const nextWeek = new Date(
																			Date.now() + 7 * 24 * 60 * 60 * 1000,
																		);

																		// Format for datetime-local: YYYY-MM-DDThh:mm
																		const formatDate = (d: Date) => {
																			const pad = (n: number) =>
																				n.toString().padStart(2, "0");
																			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
																		};

																		form.setValue("assignments", [
																			...current,
																			{
																				classId: cls.id!,
																				startTime: formatDate(now),
																				endTime: formatDate(nextWeek),
																				status: "PUBLISHED",
																			},
																		]);
																	}
																}}
															>
																<div
																	className={cn(
																		"w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
																		(form.watch("assignments") || []).some(
																			(a) => a.classId === cls.id,
																		)
																			? "bg-white border-white text-zinc-950 dark:bg-zinc-950 dark:border-zinc-950 dark:text-white"
																			: "border-zinc-300 dark:border-zinc-700",
																	)}
																>
																	{(form.watch("assignments") || []).some(
																		(a) => a.classId === cls.id,
																	) && <Plus className="w-3 h-3 stroke-[4]" />}
																</div>
																<span className="text-xs font-black uppercase tracking-tight truncate">
																	{cls.name}
																</span>
															</div>
														))}
													</div>
												</div>

												{(form.watch("assignments") || []).length > 0 && (
													<div className="space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
														<div className="space-y-4">
															<Label className="text-xs font-black uppercase tracking-widest text-zinc-400">
																Atur Jadwal & Status (Berlaku untuk Semua Kelas
																Terpilih)
															</Label>

															<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
																<div className="space-y-2">
																	<Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
																		Mulai Berlaku
																	</Label>
																	<div className="relative">
																		<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
																		<Input
																			type="datetime-local"
																			className="pl-10 h-11 rounded-xl font-bold text-xs"
																			value={
																				(form.watch("assignments") || [])[0]
																					?.startTime
																			}
																			onChange={(e) => {
																				const current =
																					form.getValues("assignments") || [];
																				form.setValue(
																					"assignments",
																					current.map((a) => ({
																						...a,
																						startTime: e.target.value,
																					})),
																				);
																			}}
																		/>
																	</div>
																</div>
																<div className="space-y-2">
																	<Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
																		Batas Akhir
																	</Label>
																	<div className="relative">
																		<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
																		<Input
																			type="datetime-local"
																			className="pl-10 h-11 rounded-xl font-bold text-xs text-rose-600"
																			value={
																				(form.watch("assignments") || [])[0]
																					?.endTime
																			}
																			onChange={(e) => {
																				const current =
																					form.getValues("assignments") || [];
																				form.setValue(
																					"assignments",
																					current.map((a) => ({
																						...a,
																						endTime: e.target.value,
																					})),
																				);
																			}}
																		/>
																	</div>
																</div>
															</div>

															<div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-inner">
																<div className="flex items-center gap-3">
																	<div
																		className={cn(
																			"w-10 h-10 rounded-xl flex items-center justify-center transition-all",
																			(form.watch("assignments") || [])[0]
																				?.status === "PUBLISHED"
																				? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
																				: "bg-zinc-200 text-zinc-500",
																		)}
																	>
																		<Eye className="w-5 h-5" />
																	</div>
																	<div className="flex flex-col">
																		<span className="text-xs font-black uppercase tracking-tight">
																			Publikasi Ujian
																		</span>
																		<span className="text-[10px] font-medium text-zinc-500 uppercase tracking-tighter">
																			{(form.watch("assignments") || [])[0]
																				?.status === "PUBLISHED"
																				? "Siswa dapat melihat & mengerjakan"
																				: "Draft (Disembunyikan dari siswa)"}
																		</span>
																	</div>
																</div>
																<Switch
																	checked={
																		(form.watch("assignments") || [])[0]
																			?.status === "PUBLISHED"
																	}
																	onCheckedChange={(checked) => {
																		const current =
																			form.getValues("assignments") || [];
																		form.setValue(
																			"assignments",
																			current.map((a) => ({
																				...a,
																				status: checked ? "PUBLISHED" : "DRAFT",
																			})),
																		);
																	}}
																	className="data-[state=checked]:bg-emerald-500"
																/>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									)}

									{activeTab === "questions" && (
										<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
											<div className="space-y-1">
												<h3 className="text-xl font-black uppercase italic tracking-tight">
													Pilih Soal
												</h3>
												<p className="text-sm text-zinc-500 font-medium">
													Pilih soal dari bank soal untuk dimasukkan ke ujian
													ini.
												</p>
											</div>

											<FormField
												control={form.control}
												name="questions"
												render={({ field }) => (
													<FormItem className="space-y-6">
														<QuestionBankSelector
															selectedQuestions={field.value}
															onSelect={field.onChange}
														/>

														{field.value.length > 0 && (
															<div className="space-y-4">
																<div className="flex items-center justify-between">
																	<p className="text-xs font-black uppercase tracking-widest text-zinc-400">
																		Daftar Soal Terpilih ({field.value.length})
																	</p>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger asChild>
																				<Button
																					variant="ghost"
																					size="sm"
																					type="button"
																					onClick={() => field.onChange([])}
																					className="h-8 text-[10px] font-bold uppercase text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
																				>
																					Hapus Semua
																				</Button>
																			</TooltipTrigger>
																			<TooltipContent>
																				Kosongkan semua soal yang telah dipilih
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</div>
																<div className="grid gap-3">
																	{field.value.map(
																		(q: ExamQuestion, index: number) => (
																			<div
																				key={q.id}
																				className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border group transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
																			>
																				<div className="flex items-center gap-4 overflow-hidden">
																					<div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center shrink-0">
																						<span className="text-xs font-black">
																							{index + 1}
																						</span>
																					</div>
																					<div className="text-sm font-bold truncate pr-4">
																						<MathRenderer text={q.text} />
																					</div>
																				</div>
																				<TooltipProvider>
																					<Tooltip>
																						<TooltipTrigger asChild>
																							<Button
																								variant="ghost"
																								size="icon"
																								type="button"
																								onClick={() => {
																									const next = [...field.value];
																									next.splice(index, 1);
																									field.onChange(next);
																								}}
																								className="h-8 w-8 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
																							>
																								<Trash className="w-3.5 h-3.5" />
																							</Button>
																						</TooltipTrigger>
																						<TooltipContent side="left">
																							Hapus soal ini
																						</TooltipContent>
																					</Tooltip>
																				</TooltipProvider>
																			</div>
																		),
																	)}
																</div>
															</div>
														)}
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}

									{activeTab === "rewards" && (
										<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
											<div className="space-y-1">
												<h3 className="text-xl font-black uppercase italic tracking-tight text-indigo-600">
													Rewards & Economy
												</h3>
												<p className="text-sm text-zinc-500 font-medium">
													Tentukan hadiah yang didapatkan siswa setelah
													menyelesaikan ujian.
												</p>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
												<FormField
													control={form.control}
													name="rewards.xp"
													render={({ field }) => (
														<FormItem className="p-6 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30">
															<FormLabel className="text-xs font-bold uppercase tracking-wider text-indigo-600">
																XP Reward
															</FormLabel>
															<FormControl>
																<div className="relative mt-2">
																	<Flash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 fill-indigo-500" />
																	<Input
																		type="number"
																		{...field}
																		onChange={(e) =>
																			field.onChange(Number(e.target.value))
																		}
																		className="pl-11 h-14 text-2xl font-black rounded-xl border-none shadow-inner bg-white"
																	/>
																</div>
															</FormControl>
															<FormMessage />
															<p className="text-[10px] text-indigo-400 mt-2 font-medium italic">
																*XP membantu siswa naik level.
															</p>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="rewards.coin"
													render={({ field }) => (
														<FormItem className="p-6 rounded-2xl border-2 border-yellow-100 bg-yellow-50/30">
															<FormLabel className="text-xs font-bold uppercase tracking-wider text-yellow-600">
																GuruCoin Reward
															</FormLabel>
															<FormControl>
																<div className="relative mt-2">
																	<div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center font-black text-yellow-800 text-[10px]">
																		G
																	</div>
																	<Input
																		type="number"
																		{...field}
																		onChange={(e) =>
																			field.onChange(Number(e.target.value))
																		}
																		className="pl-11 h-14 text-2xl font-black rounded-xl border-none shadow-inner bg-white"
																	/>
																</div>
															</FormControl>
															<FormMessage />
															<p className="text-[10px] text-yellow-600/60 mt-2 font-medium italic">
																*Coin digunakan untuk belanja di Market.
															</p>
														</FormItem>
													)}
												/>
											</div>

											<div className="p-6 rounded-2xl border bg-zinc-50/50 space-y-4">
												<h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
													Pengaturan Tampilan
												</h4>
												<FormField
													control={form.control}
													name="settings.showScoreImmediately"
													render={({ field }) => (
														<FormItem className="flex items-center justify-between">
															<div className="space-y-0.5">
																<FormLabel className="text-sm font-bold">
																	Tampilkan Skor Instan
																</FormLabel>
																<FormDescription className="text-xs">
																	Siswa langsung melihat nilai setelah selesai.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											</div>
										</div>
									)}

									{activeTab === "security" && (
										<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
											<div className="space-y-1">
												<h3 className="text-xl font-black uppercase italic tracking-tight text-rose-600">
													Keamanan & Anti-Cheat
												</h3>
												<p className="text-sm text-zinc-500 font-medium">
													Aktifkan fitur pengawasan untuk mencegah kecurangan.
												</p>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="settings.antiCheat.enabled"
													render={({ field }) => (
														<FormItem className="flex items-center justify-between p-5 rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:border-rose-200">
															<div className="space-y-1">
																<div className="flex items-center gap-2">
																	<Menu className="w-4 h-4 text-rose-600" />
																	<FormLabel className="text-sm font-black uppercase italic tracking-tighter">
																		Deteksi Ganti Tab & Pop-up
																	</FormLabel>
																</div>
																<FormDescription className="text-[10px] font-medium leading-tight pr-4">
																	Sistem mendeteksi jika siswa membuka tab lain
																	atau muncul pop-up aplikasi lain.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																	className="data-[state=checked]:bg-rose-600"
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="settings.antiCheat.forceFullscreen"
													render={({ field }) => (
														<FormItem className="flex items-center justify-between p-5 rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:border-rose-200">
															<div className="space-y-1">
																<div className="flex items-center gap-2">
																	<Shield className="w-4 h-4 text-rose-600" />
																	<FormLabel className="text-sm font-black uppercase italic tracking-tighter">
																		Paksa Fullscreen
																	</FormLabel>
																</div>
																<FormDescription className="text-[10px] font-medium leading-tight pr-4">
																	Ujian berhenti dan terkirim otomatis jika
																	siswa keluar dari mode layar penuh.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																	className="data-[state=checked]:bg-rose-600"
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="settings.antiCheat.preventCopyPaste"
													render={({ field }) => (
														<FormItem className="flex items-center justify-between p-5 rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:border-rose-200">
															<div className="space-y-1">
																<div className="flex items-center gap-2">
																	<Copy className="w-4 h-4 text-rose-600" />
																	<FormLabel className="text-sm font-black uppercase italic tracking-tighter">
																		Blokir Copy-Paste
																	</FormLabel>
																</div>
																<FormDescription className="text-[10px] font-medium leading-tight pr-4">
																	Mencegah siswa menyalin soal atau menempel
																	jawaban dari luar.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																	className="data-[state=checked]:bg-rose-600"
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="settings.antiCheat.preventScreenshot"
													render={({ field }) => (
														<FormItem className="flex items-center justify-between p-5 rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:border-rose-200">
															<div className="space-y-1">
																<div className="flex items-center gap-2">
																	<Screenshot className="w-4 h-4 text-rose-600" />
																	<FormLabel className="text-sm font-black uppercase italic tracking-tighter">
																		Deteksi Screenshot
																	</FormLabel>
																</div>
																<FormDescription className="text-[10px] font-medium leading-tight pr-4">
																	Mendeteksi penggunaan shortcut screenshot
																	(PrintScreen, dsb).
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																	className="data-[state=checked]:bg-rose-600"
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="settings.antiCheat.preventSplitScreen"
													render={({ field }) => (
														<FormItem className="flex items-center justify-between p-5 rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:border-rose-200">
															<div className="space-y-1">
																<div className="flex items-center gap-2">
																	<LayoutGrid className="w-4 h-4 text-rose-600" />
																	<FormLabel className="text-sm font-black uppercase italic tracking-tighter">
																		Blokir Split Screen
																	</FormLabel>
																</div>
																<FormDescription className="text-[10px] font-medium leading-tight pr-4">
																	Mendeteksi jika jendela browser terlalu kecil
																	atau di-resize paksa.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																	className="data-[state=checked]:bg-rose-600"
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="settings.antiCheat.preventScreenRecord"
													render={({ field }) => (
														<FormItem className="flex items-center justify-between p-5 rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:border-rose-200">
															<div className="space-y-1">
																<div className="flex items-center gap-2">
																	<VideoCamera className="w-4 h-4 text-rose-600" />
																	<FormLabel className="text-sm font-black uppercase italic tracking-tighter">
																		Cegah Screen Record
																	</FormLabel>
																</div>
																<FormDescription className="text-[10px] font-medium leading-tight pr-4">
																	Menggunakan teknik CSS untuk mempersulit
																	perekaman layar.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																	className="data-[state=checked]:bg-rose-600"
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											</div>

											<div className="space-y-4">
												{(form.watch("settings.antiCheat.enabled") ||
													form.watch("settings.antiCheat.forceFullscreen") ||
													form.watch("settings.antiCheat.preventScreenshot") ||
													form.watch(
														"settings.antiCheat.preventSplitScreen",
													)) && (
													<FormField
														control={form.control}
														name="settings.antiCheat.maxViolations"
														render={({ field }) => (
															<FormItem className="p-6 rounded-2xl border-2 border-rose-100 bg-rose-50/30 animate-in zoom-in-95">
																<FormLabel className="text-xs font-black uppercase tracking-widest text-rose-600">
																	Batas Toleransi Pelanggaran
																</FormLabel>
																<FormControl>
																	<div className="flex items-center gap-4 mt-2">
																		<Input
																			type="number"
																			{...field}
																			onChange={(e) =>
																				field.onChange(Number(e.target.value))
																			}
																			className="w-24 h-12 text-2xl font-black rounded-xl border-rose-200 focus:border-rose-600 text-center"
																		/>
																		<p className="text-xs font-bold text-rose-600/70 italic leading-tight">
																			Setelah {field.value} kali terdeteksi
																			pelanggaran aktif, ujian akan langsung
																			dikunci dan dikirim secara paksa.
																		</p>
																	</div>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
													<FormField
														control={form.control}
														name="isSubmitLocked"
														render={({ field }) => (
															<FormItem className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/20">
																<div className="space-y-0.5">
																	<FormLabel className="text-sm font-bold text-rose-600">
																		Kunci Tombol Selesai
																	</FormLabel>
																	<FormDescription className="text-[10px] leading-tight">
																		Siswa tidak bisa mengumpulkan jawaban sampai
																		Anda membukanya di halaman monitoring.
																	</FormDescription>
																</div>
																<FormControl>
																	<Switch
																		checked={field.value}
																		onCheckedChange={field.onChange}
																		className="data-[state=checked]:bg-rose-600"
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
													<FormField
														control={form.control}
														name="settings.shuffleQuestions"
														render={({ field }) => (
															<FormItem className="flex items-center justify-between p-4 rounded-xl border bg-zinc-50/50">
																<FormLabel className="text-sm font-bold">
																	Acak Urutan Soal
																</FormLabel>
																<FormControl>
																	<Switch
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
													<FormField
														control={form.control}
														name="settings.shuffleOptions"
														render={({ field }) => (
															<FormItem className="flex items-center justify-between p-4 rounded-xl border bg-zinc-50/50">
																<FormLabel className="text-sm font-bold">
																	Acak Urutan Opsi
																</FormLabel>
																<FormControl>
																	<Switch
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
