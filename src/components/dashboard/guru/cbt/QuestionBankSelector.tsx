"use client";

import { useState } from "react";
import {
	getQuestionTopicsSupabase,
	getQuestionsByTopicSupabase,
	Question,
} from "@/actions/questions-supabase";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Database,
	Search,
	Folder,
	NavArrowRight,
	Check,
	Plus,
	Lock,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateQuestionDialog } from "@/components/questions/CreateQuestionDialog";
import { MathRenderer } from "@/components/ui/math-renderer";

type SelectedExamQuestion = {
	id: string;
	bankQuestionId?: string;
	bankId?: string;
};

interface QuestionBankSelectorProps {
	selectedQuestions: SelectedExamQuestion[];
	onSelect: (questions: SelectedExamQuestion[]) => void;
}

export function isQuestionAlreadyAdded(
	selected: SelectedExamQuestion[],
	questionId: string,
): boolean {
	return selected.some(
		(q) =>
			q.bankQuestionId === questionId ||
			q.bankId === questionId ||
			q.id === questionId,
	);
}

export function QuestionBankSelector({
	selectedQuestions,
	onSelect,
}: QuestionBankSelectorProps) {
	const [open, setOpen] = useState(false);
	const [topics, setTopics] = useState<
		{ id: string; name: string; count: number }[]
	>([]);
	const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [tempSelected, setTempSelected] =
		useState<SelectedExamQuestion[]>(selectedQuestions);

	const loadTopics = async () => {
		setIsLoading(true);
		const result = await getQuestionTopicsSupabase({ pageSize: 100 });
		setTopics(result.data);
		setIsLoading(false);
	};

	const loadQuestions = async (topicId: string) => {
		setIsLoading(true);
		setSelectedTopic(topicId);
		const result = await getQuestionsByTopicSupabase({
			topicId,
			pageSize: 100,
		});
		// Support all question types
		setQuestions(result.data);
		setIsLoading(false);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (nextOpen) {
			setTempSelected([...selectedQuestions]);
			loadTopics();
		}
	};

	const toggleQuestion = (question: Question) => {
		const isAlreadySelected = isQuestionAlreadyAdded(tempSelected, question.id);
		if (isAlreadySelected) {
			setTempSelected(
				tempSelected.filter(
					(q) =>
						q.bankQuestionId !== question.id &&
						q.bankId !== question.id &&
						q.id !== question.id,
				),
			);
		} else {
			// Map Question to ExamQuestion format with a unique ID for this exam instance
			const examQuestion = {
				...question,
				id: question.id,
				bankQuestionId: question.id, // Keep reference to source
			};
			setTempSelected([...tempSelected, examQuestion]);
		}
	};

	const handleConfirm = () => {
		onSelect(tempSelected);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					type="button"
					className="w-full h-auto py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4 hover:border-zinc-900 dark:hover:border-zinc-50 transition-all group"
				>
					<div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
						<Database className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50" />
					</div>
					<div className="space-y-1">
						<p className="text-sm font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-tight">
							{selectedQuestions.length > 0
								? "Tambah Soal Lagi"
								: "Pilih Soal dari Bank"}
						</p>
						<p className="text-[10px] text-zinc-500 font-medium">
							{selectedQuestions.length} soal terpilih dari bank soal Anda.
						</p>
					</div>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-7xl h-[90vh] flex flex-col p-0 gap-0 rounded-[2rem] overflow-hidden border-none shadow-2xl">
				<DialogHeader className="p-8 border-b bg-white dark:bg-zinc-950 flex items-center justify-between shrink-0 space-y-0">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
							<Database className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
						</div>
						<div>
							<DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
								Eksplor Bank Soal
							</DialogTitle>
							<p className="text-xs text-zinc-500 font-medium">
								Temukan dan pilih soal terbaik untuk ujian Anda.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<Badge
							variant="secondary"
							className="rounded-xl font-black px-4 py-2 bg-primary/10 text-primary border-none text-xs"
						>
							{tempSelected.length} Terpilih
						</Badge>
						<Button
							onClick={handleConfirm}
							className="rounded-xl font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20 h-11"
						>
							Selesai Memilih
						</Button>
					</div>
				</DialogHeader>

				<div className="flex-1 flex overflow-hidden">
					{/* Sidebar: Topics */}
					<div className="w-72 border-r bg-zinc-50/50 dark:bg-zinc-900/20 overflow-y-auto p-6 space-y-2 shrink-0">
						<div className="flex items-center justify-between mb-4 px-2">
							<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
								Daftar Topik
							</h4>
							<CreateQuestionDialog
								initialTopic={selectedTopic || ""}
								onSuccess={() => {
									if (selectedTopic) loadQuestions(selectedTopic);
									loadTopics();
								}}
								trigger={
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 rounded-lg text-primary hover:bg-primary/10"
									>
										<Plus className="w-4 h-4" />
									</Button>
								}
							/>
						</div>
						{isLoading && topics.length === 0
							? Array.from({ length: 5 }).map((_, i) => (
									<Skeleton key={i} className="h-10 w-full rounded-xl" />
								))
							: topics.map((topic) => (
									<button
										key={topic.id}
										onClick={() => loadQuestions(topic.id)}
										className={cn(
											"w-full flex items-center justify-between p-3 rounded-xl text-left transition-all",
											selectedTopic === topic.id
												? "bg-zinc-950 text-zinc-50 shadow-lg translate-x-1"
												: "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
										)}
									>
										<div className="flex items-center gap-3">
											<Folder
												className={cn(
													"w-4 h-4",
													selectedTopic === topic.id
														? "text-zinc-400"
														: "text-zinc-300",
												)}
											/>
											<span className="text-xs font-bold truncate max-w-[120px]">
												{topic.name}
											</span>
										</div>
										<Badge
											variant="outline"
											className={cn(
												"text-[9px] border-none px-1.5",
												selectedTopic === topic.id
													? "bg-zinc-800 text-zinc-400"
													: "bg-zinc-100 dark:bg-zinc-800",
											)}
										>
											{topic.count}
										</Badge>
									</button>
								))}
					</div>

					{/* Main Content: Questions */}
					<div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
						{selectedTopic ? (
							<ScrollArea className="flex-1 h-full">
								<div className="p-6 space-y-4">
									<div className="flex items-center justify-between mb-6">
										<h3 className="text-lg font-black uppercase italic">
											{selectedTopic}
										</h3>
										<Button
											variant="ghost"
											size="sm"
											className="text-[10px] font-bold uppercase tracking-widest"
											onClick={() => {
												const allIds = questions.map((q) => q.id);
												const alreadyInTemp = tempSelected.filter((q) =>
													allIds.some(
														(id) =>
															q.bankQuestionId === id ||
															q.bankId === id ||
															q.id === id,
													),
												);
												if (alreadyInTemp.length === questions.length) {
													// Unselect all in this topic
													setTempSelected(
														tempSelected.filter(
															(q) =>
																!allIds.some(
																	(id) =>
																		q.bankQuestionId === id ||
																		q.bankId === id ||
																		q.id === id,
																),
														),
													);
												} else {
													// Select all in this topic
													const newOnes = questions
														.filter(
															(q) =>
																!tempSelected.some(
																	(t) =>
																		t.bankQuestionId === q.id ||
																		t.bankId === q.id ||
																		t.id === q.id,
																),
														)
														.map((q) => ({
															...q,
															id: q.id,
															bankQuestionId: q.id,
														}));
													setTempSelected([...tempSelected, ...newOnes]);
												}
											}}
										>
											Pilih Semua
										</Button>
									</div>

									{isLoading ? (
										Array.from({ length: 3 }).map((_, i) => (
											<Skeleton key={i} className="h-24 w-full rounded-2xl" />
										))
									) : questions.length === 0 ? (
										<div className="py-20 text-center space-y-2">
											<Search className="w-10 h-10 text-zinc-200 mx-auto" />
											<p className="text-zinc-400 font-medium">
												Belum ada data
											</p>
										</div>
									) : (
										questions.map((question) => {
											const isSelected = isQuestionAlreadyAdded(
												tempSelected,
												question.id,
											);
											return (
												<div
													key={question.id}
													onClick={() => toggleQuestion(question)}
													className={cn(
														"p-5 rounded-2xl border-2 transition-all cursor-pointer group flex gap-4",
														isSelected
															? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
															: "border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800",
													)}
													title={
														isSelected
															? "Klik untuk batal pilih"
															: "Tambahkan soal ke ujian"
													}
												>
													<div className="pt-1">
														<div
															className={cn(
																"w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
																isSelected
																	? "bg-zinc-900 border-zinc-900 dark:bg-zinc-50 dark:border-zinc-50"
																	: "border-zinc-200 dark:border-zinc-800",
															)}
														>
															{isSelected && (
																<Check className="w-3 h-3 text-white dark:text-zinc-950" />
															)}
														</div>
													</div>
													<div className="flex-1 space-y-3">
														<div className="flex items-start justify-between gap-4">
															<div className="text-sm font-bold leading-relaxed">
																<MathRenderer text={question.text} />
															</div>
															<div className="flex items-center gap-2 shrink-0">
																{isSelected && (
																	<Badge className="text-[9px] uppercase font-black bg-emerald-100 text-emerald-700 border-none gap-1">
																		<Lock className="w-3 h-3" />
																		Sudah Ditambahkan
																	</Badge>
																)}
																<Badge
																	variant="outline"
																	className="text-[9px] uppercase font-black"
																>
																	{question.type}
																</Badge>
															</div>
														</div>
														{question.imageUrl && (
															<div className="w-32 aspect-video rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 relative">
																<img
																	src={question.imageUrl}
																	alt="Question"
																	className="absolute inset-0 w-full h-full object-cover"
																/>
															</div>
														)}
														{question.type === "pg" ||
														question.type === "pg_kompleks" ||
														question.type === "mengurutkan" ? (
															<div className="grid grid-cols-2 gap-2">
																{question.options
																	?.slice(0, 4)
																	.map((opt, idx) => (
																		<div
																			key={opt.id}
																			className="text-[10px] flex gap-2 items-center text-zinc-500"
																		>
																			<span className="font-bold">
																				{String.fromCharCode(65 + idx)}.
																			</span>
																			<div className="truncate">
																				<MathRenderer text={opt.text} />
																			</div>
																		</div>
																	))}
															</div>
														) : question.type === "menjodohkan" ? (
															<div className="flex flex-wrap gap-2">
																{question.pairs
																	?.slice(0, 3)
																	.map((pair, idx) => (
																		<Badge
																			key={pair.id}
																			variant="secondary"
																			className="text-[8px] py-0"
																		>
																			Pasangan {idx + 1}
																		</Badge>
																	))}
															</div>
														) : (
															<p className="text-[10px] text-zinc-400 italic">
																Pertanyaan essay - Pratinjau tidak tersedia
															</p>
														)}
													</div>
												</div>
											);
										})
									)}
								</div>
							</ScrollArea>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
								<div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
									<NavArrowRight className="w-8 h-8 text-zinc-200" />
								</div>
								<div className="space-y-1">
									<h3 className="text-lg font-black uppercase italic">
										Pilih Topik
									</h3>
									<p className="text-sm text-zinc-500 max-w-[250px]">
										Silakan pilih topik di samping kiri untuk melihat daftar
										soal yang tersedia.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
