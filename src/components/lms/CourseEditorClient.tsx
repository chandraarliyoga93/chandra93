"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	NavArrowLeft,
	Page,
	Folder,
	Plus,
	Settings,
	Edit,
	Trash,
	StatsReport,
} from "iconoir-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { LmsLesson, QuizData } from "@/components/lms/lms-lesson-types";
import { CourseLessonsTable } from "./CourseLessonsTable";
import {
	CoursePublishSettingsCta,
	CourseReadinessBanner,
	getPublishSettingsDisabledReason,
} from "./CourseReadinessBanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	createModule,
	createLesson,
	updateModule,
	deleteModule,
} from "@/actions/lms-course-supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Module {
	id: string;
	title: string;
	order: number;
	courseId: string;
	createdAt: Date;
	updatedAt: Date;
	lessons: LmsLesson[];
}

interface Course {
	id: string;
	title: string;
	description: string | null;
	coverImage: string | null;
	status: "DRAFT" | "PUBLISHED";
	teacherId: string;
	createdAt: Date;
	updatedAt: Date;
	modules: Module[];
}

interface CourseEditorClientProps {
	course: Course;
}

export function CourseEditorClient({ course }: CourseEditorClientProps) {
	const router = useRouter();
	const [modules, setModules] = useState<Module[]>(course.modules);
	const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
	const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
	const [moduleTitle, setModuleTitle] = useState("");
	const [lessonTitle, setLessonTitle] = useState("");
	const [selectedModuleIdForLesson, setSelectedModuleIdForLesson] = useState<
		string | null
	>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingModule, setEditingModule] = useState<Module | null>(null);
	const [editModuleTitle, setEditModuleTitle] = useState("");
	const [editorActionFeedback, setEditorActionFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const moduleCount = modules.length;
	const lessonCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);
	const publishSettingsDisabledReason =
		course.status === "DRAFT"
			? getPublishSettingsDisabledReason(moduleCount, lessonCount)
			: null;

	const openLessonEditor = (lessonId: string) => {
		router.push(`/dashboard/guru/lms/${course.id}/lessons/${lessonId}`);
	};

	const normalizeLesson = (lesson: {
		id: string;
		title: string;
		content: string | null;
		attachments: unknown;
		order?: number;
		moduleId?: string;
		createdAt?: Date;
		updatedAt?: Date;
		type?: string;
		quizData?: any;
	}): LmsLesson => ({
		id: lesson.id,
		title: lesson.title,
		content: lesson.content,
		type: (lesson.type as "TEXT" | "QUIZ") || "TEXT",
		quizData: lesson.quizData as any as QuizData,
		attachments: Array.isArray(lesson.attachments)
			? (lesson.attachments as Array<{ name?: string }>)
			: undefined,
		order: lesson.order,
		moduleId: lesson.moduleId,
		createdAt: lesson.createdAt,
		updatedAt: lesson.updatedAt,
	});

	const handleCreateModule = async () => {
		if (!moduleTitle.trim()) return;
		setEditorActionFeedback(null);
		setIsSubmitting(true);
		const result = await createModule({
			title: moduleTitle,
			order: modules.length,
			courseId: course.id,
		});
		setIsSubmitting(false);
		if (result.success) {
			if (result.data) {
				setModules((prev) => [...prev, { ...result.data, lessons: [] }]);
			}
			setModuleTitle("");
			setIsCreateModuleOpen(false);
			toast.success("Modul berhasil dibuat");
			setEditorActionFeedback({
				type: "success",
				message: "Modul berhasil dibuat. Tambahkan materi di modul ini.",
			});
			router.refresh();
		} else {
			const msg = result.error || "Gagal membuat modul";
			toast.error(msg);
			setEditorActionFeedback({ type: "error", message: msg });
		}
	};

	const handleCreateLesson = async () => {
		if (!lessonTitle.trim() || !selectedModuleIdForLesson) return;
		setEditorActionFeedback(null);
		setIsSubmitting(true);
		const selectedModule = modules.find(
			(m) => m.id === selectedModuleIdForLesson,
		);
		const result = await createLesson({
			title: lessonTitle,
			content: null,
			attachments: null,
			order: selectedModule?.lessons.length || 0,
			moduleId: selectedModuleIdForLesson,
		});
		setIsSubmitting(false);
		if (result.success) {
			if (result.data) {
				const createdLesson = normalizeLesson(result.data);
				setModules((prev) =>
					prev.map((m) =>
						m.id === selectedModuleIdForLesson
							? { ...m, lessons: [...m.lessons, createdLesson] }
							: m,
					),
				);
				const newId = result.data.id;
				setLessonTitle("");
				setIsCreateLessonOpen(false);
				toast.success("Materi berhasil dibuat");
				router.push(`/dashboard/guru/lms/${course.id}/lessons/${newId}`);
				return;
			}
			setLessonTitle("");
			setIsCreateLessonOpen(false);
			toast.success("Materi berhasil dibuat");
			router.refresh();
		} else {
			const msg = result.error || "Gagal membuat materi";
			toast.error(msg);
			setEditorActionFeedback({ type: "error", message: msg });
		}
	};

	const handleAddLesson = (moduleId: string) => {
		setSelectedModuleIdForLesson(moduleId);
		setIsCreateLessonOpen(true);
	};

	const handleUpdateModule = async () => {
		if (!editingModule || !editModuleTitle.trim()) return;
		setEditorActionFeedback(null);
		setIsSubmitting(true);
		const result = await updateModule(editingModule.id, {
			title: editModuleTitle,
		});
		setIsSubmitting(false);
		if (result.success) {
			setModules((prev) =>
				prev.map((m) =>
					m.id === editingModule.id ? { ...m, title: editModuleTitle } : m,
				),
			);
			setEditingModule(null);
			toast.success("Modul berhasil diperbarui");
			setEditorActionFeedback({
				type: "success",
				message: "Nama modul diperbarui.",
			});
			router.refresh();
		} else {
			const msg = result.error || "Gagal memperbarui modul";
			toast.error(msg);
			setEditorActionFeedback({ type: "error", message: msg });
		}
	};

	return (
		<div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -m-6">
			{/* Header Bar */}
			<header className="flex h-14 items-center gap-4 border-b bg-background px-6">
				<Button asChild variant="ghost" size="icon" className="h-8 w-8">
					<Link href="/dashboard/guru/lms">
						<NavArrowLeft className="h-4 w-4" />
						<span className="sr-only">Kembali</span>
					</Link>
				</Button>
				<Separator orientation="vertical" className="h-6" />
				<div className="flex-1 truncate font-medium">{course.title}</div>
				<Badge
					variant={course.status === "PUBLISHED" ? "default" : "secondary"}
				>
					{course.status === "PUBLISHED" ? "Published" : "Draft"}
				</Badge>
				<CoursePublishSettingsCta
					courseId={course.id}
					moduleCount={moduleCount}
					lessonCount={lessonCount}
					courseStatus={course.status}
				/>
				<Button asChild variant="outline" size="sm">
					<Link href={`/dashboard/guru/lms/${course.id}/analytics`}>
						<StatsReport className="mr-2 h-4 w-4" />
						Analitik
					</Link>
				</Button>
				{publishSettingsDisabledReason ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled
						title={publishSettingsDisabledReason}
					>
						<Settings className="w-4 h-4 mr-2" />
						Pengaturan Kursus
					</Button>
				) : (
					<Button asChild variant="outline" size="sm">
						<Link href={`/dashboard/guru/lms/${course.id}/settings`}>
							<Settings className="w-4 h-4 mr-2" />
							Pengaturan Kursus
						</Link>
					</Button>
				)}
			</header>

			{/* Editor Layout */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar: Modules & Lessons */}
				<aside className="w-80 border-r bg-muted/30 flex flex-col">
					<div className="p-4 border-b bg-background flex justify-between items-center">
						<h3 className="font-semibold text-sm">Kurikulum</h3>
						<Button
							size="icon"
							variant="ghost"
							className="h-8 w-8"
							onClick={() => setIsCreateModuleOpen(true)}
						>
							<Plus className="w-4 h-4" />
						</Button>
					</div>

					<ScrollArea className="flex-1 p-4">
						{modules.length === 0 ? (
							<div className="text-center p-4 border border-dashed rounded-lg text-sm text-muted-foreground">
								Belum ada modul. Klik + untuk membuat modul baru.
							</div>
						) : (
							<div className="space-y-4">
								{modules.map((mod) => (
									<div key={mod.id} className="space-y-2">
										<div className="flex items-center justify-between font-medium text-sm group">
											<div className="flex items-center gap-2">
												<Folder className="w-4 h-4 text-primary" />
												<span>{mod.title}</span>
											</div>
											<div className="flex gap-1">
												<Button
													size="icon"
													variant="ghost"
													className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={() => {
														setEditingModule(mod);
														setEditModuleTitle(mod.title);
													}}
												>
													<Edit className="w-3 h-3" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
													onClick={async () => {
														setEditorActionFeedback(null);
														const result = await deleteModule(mod.id);
														if (result.success) {
															setModules((prev) =>
																prev.filter((m) => m.id !== mod.id),
															);
															toast.success("Modul berhasil dihapus");
															setEditorActionFeedback({
																type: "success",
																message: "Modul berhasil dihapus.",
															});
															router.refresh();
															return;
														}
														const msg = result.error || "Gagal menghapus modul";
														toast.error(msg);
														setEditorActionFeedback({
															type: "error",
															message: msg,
														});
													}}
												>
													<Trash className="w-3 h-3" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={() => handleAddLesson(mod.id)}
												>
													<Plus className="w-3 h-3" />
												</Button>
											</div>
										</div>

										<div className="pl-6 space-y-1">
											{mod.lessons.length === 0 ? (
												<div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
													Kosong
												</div>
											) : (
												mod.lessons.map((lesson) => (
													<button
														key={lesson.id}
														type="button"
														onClick={() => openLessonEditor(lesson.id)}
														className="flex items-center gap-2 w-full text-left p-2 text-sm rounded-md transition-colors hover:bg-accent/50"
													>
														<Page className="w-3.5 h-3.5 text-muted-foreground" />
														<span className="truncate">{lesson.title}</span>
													</button>
												))
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</aside>

				{/* Main Content Area */}
				<main className="flex-1 bg-background p-6 flex flex-col overflow-y-auto gap-6">
					<CourseReadinessBanner
						moduleCount={moduleCount}
						lessonCount={lessonCount}
						courseStatus={course.status}
					/>
					{editorActionFeedback ? (
						<Alert
							variant={
								editorActionFeedback.type === "error"
									? "destructive"
									: "default"
							}
							className={cn(
								editorActionFeedback.type === "error"
									? undefined
									: "border-primary/30 bg-primary/5",
							)}
							role="status"
							aria-live="polite"
						>
							<AlertTitle>
								{editorActionFeedback.type === "success" ? "Berhasil" : "Gagal"}
							</AlertTitle>
							<AlertDescription>
								{editorActionFeedback.message}
							</AlertDescription>
						</Alert>
					) : null}
					<Card className="shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Daftar materi</CardTitle>
							<CardDescription>
								Ringkasan materi. Klik baris atau{" "}
								<span className="font-medium text-foreground">Edit konten</span>{" "}
								untuk membuka editor penuh (teks kaya + YouTube).
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							<CourseLessonsTable
								modules={modules}
								onOpenLesson={openLessonEditor}
							/>
						</CardContent>
					</Card>

					<Card className="flex-1 border-dashed flex items-center justify-center bg-muted/10 shadow-none min-h-[160px]">
						<CardContent className="text-center max-w-md p-8">
							<div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
								<Page className="w-7 h-7 text-muted-foreground" />
							</div>
							<CardTitle className="mb-2 text-base">
								Editor materi di halaman terpisah
							</CardTitle>
							<CardDescription>
								Pilih materi di tabel atau di panel{" "}
								<span className="font-medium text-foreground">Kurikulum</span>.
								Anda akan dibuka ke halaman penuh dengan editor TipTap (format
								teks, tautan, sisipkan YouTube).
							</CardDescription>
						</CardContent>
					</Card>
				</main>
			</div>

			{/* Create Module Dialog */}
			<Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Buat Modul Baru</DialogTitle>
						<DialogDescription>
							Masukkan nama modul untuk kursus ini.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="moduleTitle">Nama Modul</Label>
							<Input
								id="moduleTitle"
								placeholder="Contoh: Bab 1 - Pengenalan"
								value={moduleTitle}
								onChange={(e) => setModuleTitle(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleCreateModule()}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateModuleOpen(false)}
						>
							Batal
						</Button>
						<Button
							onClick={handleCreateModule}
							disabled={isSubmitting || !moduleTitle.trim()}
						>
							{isSubmitting ? "Membuat..." : "Buat Modul"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create Lesson Dialog */}
			<Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Buat Materi Baru</DialogTitle>
						<DialogDescription>
							Masukkan nama materi untuk modul ini.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="lessonTitle">Nama Materi</Label>
							<Input
								id="lessonTitle"
								placeholder="Contoh: Pengenalan Materi"
								value={lessonTitle}
								onChange={(e) => setLessonTitle(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleCreateLesson()}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateLessonOpen(false)}
						>
							Batal
						</Button>
						<Button
							onClick={handleCreateLesson}
							disabled={isSubmitting || !lessonTitle.trim()}
						>
							{isSubmitting ? "Membuat..." : "Buat Materi"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Module Dialog */}
			<Dialog
				open={!!editingModule}
				onOpenChange={(open) => !open && setEditingModule(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Modul</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="editModuleTitle">Nama Modul</Label>
							<Input
								id="editModuleTitle"
								value={editModuleTitle}
								onChange={(e) => setEditModuleTitle(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingModule(null)}>
							Batal
						</Button>
						<Button
							onClick={handleUpdateModule}
							disabled={isSubmitting || !editModuleTitle.trim()}
						>
							{isSubmitting ? "Menyimpan..." : "Simpan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
