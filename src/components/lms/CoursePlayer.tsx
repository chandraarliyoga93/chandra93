"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { motion, AnimatePresence } from "framer-motion";
import {
	CheckCircle,
	NavArrowRight,
	NavArrowLeft,
	Menu,
	Xmark,
	Book,
	Youtube,
	QuestionMark,
	Flash,
	Trophy,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import {
	claimCourseReward,
	markLessonComplete,
} from "@/actions/lms-student-supabase";
import { parseCourseRewardsFromJson } from "@/lib/lms/course-rewards";
import { QuizPlayer, type QuizData } from "./QuizPlayer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface Lesson {
	id: string;
	title: string;
	content: string | null;
	attachments: unknown;
	order: number;
	moduleId: string;
	type: string;
	quizData: unknown;
}

export interface Module {
	id: string;
	title: string;
	order: number;
	lessons: Lesson[];
}

export interface Course {
	id: string;
	title: string;
	description: string | null;
	modules: Module[];
	rewards?: unknown;
}

export interface Progress {
	lessonId: string;
	isCompleted: boolean;
	completedAt: Date;
	score?: number | null;
	lastAttemptAt?: Date | null;
}

interface CoursePlayerProps {
	course: Course;
	initialProgress: Progress[];
	studentId: string;
	initialRewardClaimed?: boolean;
	viewerStats?: { xp: number; level: number };
}

function lessonContentIcon(lesson: Lesson) {
	if (lesson.type === "QUIZ") {
		return <QuestionMark className="w-4 h-4" aria-hidden />;
	}
	if (
		lesson.content?.includes("youtube.com") ||
		lesson.content?.includes("vimeo.com")
	) {
		return <Youtube className="w-4 h-4" aria-hidden />;
	}
	return <Book className="w-4 h-4" aria-hidden />;
}

export function LessonSidebarRow({
	lesson,
	activeLessonId,
	isComplete,
	onSelect,
}: {
	lesson: Lesson;
	activeLessonId: string;
	isComplete: boolean;
	onSelect: (id: string) => void;
}) {
	const isActive = activeLessonId === lesson.id;

	return (
		<button
			type="button"
			data-testid={`course-player-lesson-row-${lesson.id}`}
			data-lesson-complete={isComplete ? "true" : "false"}
			aria-current={isActive ? "page" : undefined}
			aria-label={`${lesson.title}${isComplete ? " — Selesai" : ""}`}
			onClick={() => onSelect(lesson.id)}
			className={cn(
				"w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all group border-2 border-transparent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
				isActive
					? "bg-neo-accent border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] -translate-x-[1px] -translate-y-[1px]"
					: "hover:bg-muted/50",
				isComplete && !isActive && "border-green-600/25 bg-green-500/5",
			)}
		>
			<div className="shrink-0" aria-hidden>
				{isComplete ? (
					<CheckCircle className="w-4 h-4 text-green-600" />
				) : (
					lessonContentIcon(lesson)
				)}
			</div>
			<span
				className={cn(
					"text-[11px] font-bold uppercase leading-tight line-clamp-2",
					isActive ? "text-black" : "text-foreground",
				)}
			>
				{lesson.title}
			</span>
		</button>
	);
}

export function parseProgressCompletedAt(value: unknown): Date {
	if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
	if (typeof value === "string" || typeof value === "number") {
		const d = new Date(value);
		if (!Number.isNaN(d.getTime())) return d;
	}
	return new Date();
}

export function getNextLessonId(
	course: Course,
	currentLessonId: string,
): string | null {
	const ids = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
	const idx = ids.indexOf(currentLessonId);
	if (idx === -1 || idx >= ids.length - 1) return null;
	return ids[idx + 1] ?? null;
}

export function upsertLessonCompleted(
	prev: Progress[],
	lessonId: string,
	completedAt: Date,
): Progress[] {
	const exists = prev.find((p) => p.lessonId === lessonId);
	if (exists) {
		return prev.map((p) =>
			p.lessonId === lessonId ? { ...p, isCompleted: true, completedAt } : p,
		);
	}
	return [...prev, { lessonId, isCompleted: true, completedAt }];
}

export function applyLessonCompletion(
	course: Course,
	prevProgress: Progress[],
	currentLessonId: string,
	completedAt: Date,
): { nextLessonId: string | null; nextProgress: Progress[] } {
	return {
		nextLessonId: getNextLessonId(course, currentLessonId),
		nextProgress: upsertLessonCompleted(
			prevProgress,
			currentLessonId,
			completedAt,
		),
	};
}

export function CoursePlayer({
	course,
	initialProgress,
	studentId,
	initialRewardClaimed = false,
	viewerStats,
}: CoursePlayerProps) {
	const router = useRouter();
	const [activeLessonId, setActiveLessonId] = useQueryState(
		"lesson",
		parseAsString.withDefault(course.modules[0]?.lessons[0]?.id || ""),
	);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [progress, setProgress] = useState<Progress[]>(initialProgress);
	const [isMarking, setIsMarking] = useState(false);
	const [rewardClaimed, setRewardClaimed] = useState(initialRewardClaimed);
	const [isClaimingReward, setIsClaimingReward] = useState(false);

	useEffect(() => {
		setProgress(initialProgress);
	}, [initialProgress]);

	useEffect(() => {
		setRewardClaimed(initialRewardClaimed);
	}, [initialRewardClaimed]);

	const allLessons = useMemo(() => {
		return course.modules.flatMap((m) => m.lessons);
	}, [course.modules]);

	const activeLesson = useMemo(() => {
		return allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
	}, [allLessons, activeLessonId]);

	const activeLessonProgress = useMemo(() => {
		return progress.find((p) => p.lessonId === activeLesson?.id);
	}, [progress, activeLesson]);

	const isCompleted = useMemo(() => {
		return activeLessonProgress?.isCompleted ?? false;
	}, [activeLessonProgress]);

	const nextLesson = useMemo(() => {
		if (!activeLesson) return null;
		const nid = getNextLessonId(course, activeLesson.id);
		return nid ? (allLessons.find((l) => l.id === nid) ?? null) : null;
	}, [allLessons, activeLesson, course]);

	const prevLesson = useMemo(() => {
		if (!activeLesson) return null;
		const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
		return allLessons[currentIndex - 1] || null;
	}, [allLessons, activeLesson]);

	const isLessonComplete = useCallback(
		(lessonId: string) =>
			progress.some((p) => p.lessonId === lessonId && p.isCompleted),
		[progress],
	);

	const allLessonsComplete = useMemo(() => {
		if (allLessons.length === 0) return false;
		return allLessons.every((lesson) =>
			progress.some((p) => p.lessonId === lesson.id && p.isCompleted),
		);
	}, [allLessons, progress]);

	const rewardPreview = useMemo(
		() => parseCourseRewardsFromJson(course.rewards),
		[course.rewards],
	);

	const canClaimReward = useMemo(() => {
		const xpBonus = rewardPreview.completionXp > 0;
		const badgeBonus = !!rewardPreview.badgeId;
		return allLessonsComplete && !rewardClaimed && (xpBonus || badgeBonus);
	}, [allLessonsComplete, rewardClaimed, rewardPreview]);

	const scrollToCourseCompletion = () => {
		document
			.getElementById("course-completion-panel")
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const handleClaimCourseReward = async () => {
		if (isClaimingReward) return;
		setIsClaimingReward(true);
		try {
			const res = await claimCourseReward(course.id, studentId);
			if (res.success) {
				setRewardClaimed(true);
				toast.success("Hadiah kursus berhasil diklaim!");
				router.refresh();
			} else {
				toast.error(res.error || "Gagal mengklaim hadiah");
			}
		} catch {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsClaimingReward(false);
		}
	};

	const handleMarkComplete = async () => {
		if (!activeLesson || isMarking) return;

		setIsMarking(true);
		try {
			const result = await markLessonComplete(activeLesson.id, studentId);
			if (result.success && result.data) {
				const completedAt = parseProgressCompletedAt(result.data.completedAt);

				const transition = applyLessonCompletion(
					course,
					progress,
					activeLesson.id,
					completedAt,
				);
				setProgress(transition.nextProgress);

				router.refresh();

				if (transition.nextLessonId) {
					await setActiveLessonId(transition.nextLessonId);
					toast.success("Materi selesai! Lanjut ke materi berikutnya.");
				} else {
					toast.success("Selamat! Kamu telah menyelesaikan semua materi.");
				}
			} else {
				toast.error(result.error || "Gagal memperbarui progres");
			}
		} catch {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsMarking(false);
		}
	};

	const selectLesson = (id: string) => {
		void setActiveLessonId(id);
	};

	const selectLessonMobile = (id: string) => {
		void setActiveLessonId(id);
		setIsSidebarOpen(false);
	};

	return (
		<div
			className={cn(
				"flex min-h-0 flex-1 md:h-[calc(100vh-120px)] w-full max-w-none overflow-visible md:overflow-hidden bg-neo-bg",
				// Mobile: full-bleed, no brutalist shadow boxing.
				"rounded-none border-y-2 border-neo-border [box-shadow:none]",
				// Desktop: keep neo-card feel.
				"md:rounded-2xl md:border-4 md:border-neo-border md:[box-shadow:var(--neo-shadow)]",
			)}
		>
			<motion.aside
				initial={false}
				animate={{ width: isSidebarOpen ? 320 : 0 }}
				className={cn(
					"border-r-2 border-neo-border h-full bg-neo-bg relative overflow-hidden hidden md:block",
					!isSidebarOpen && "border-r-0",
				)}
			>
				<div className="w-[320px] h-full flex flex-col">
					<div className="p-4 border-b-2 border-neo-border bg-neo-primary text-white">
						<h2 className="font-black uppercase italic text-sm tracking-tight leading-none truncate">
							{course.title}
						</h2>
						<p className="text-[10px] font-bold opacity-80 uppercase mt-1">
							Daftar Materi
						</p>
					</div>

					<ScrollArea className="flex-1">
						<div className="p-2 space-y-4">
							{course.modules.map((module) => (
								<div key={module.id} className="space-y-1">
									<h3 className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-muted-foreground bg-muted/30 rounded-sm">
										MODUL {module.order}: {module.title}
									</h3>
									<div className="space-y-0.5">
										{module.lessons.map((lesson) => (
											<LessonSidebarRow
												key={lesson.id}
												lesson={lesson}
												activeLessonId={activeLessonId || ""}
												isComplete={isLessonComplete(lesson.id)}
												onSelect={selectLesson}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				</div>
			</motion.aside>

			<main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-zinc-950">
				<header className="h-14 border-b-2 border-neo-border flex items-center justify-between px-4 bg-neo-bg">
					<div className="flex items-center gap-3 min-w-0">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Toggle Sidebar"
							className="md:hidden border-2 border-neo-border rounded-none"
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						>
							<Menu className="w-5 h-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Toggle Sidebar"
							className="hidden md:flex border-2 border-neo-border rounded-none h-8 w-8"
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						>
							{isSidebarOpen ? (
								<Xmark className="w-4 h-4" />
							) : (
								<Menu className="w-4 h-4" />
							)}
						</Button>

						<div className="min-w-0">
							<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">
								Materi Aktif
							</p>
							<h1 className="text-xs md:text-sm font-black uppercase italic tracking-tight truncate">
								{activeLesson?.title}
							</h1>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{viewerStats != null && (
							<div
								className="mr-1 flex min-w-0 max-w-[42vw] shrink items-center gap-1.5 overflow-hidden rounded-md border-2 border-neo-border bg-white px-1.5 py-1 text-[9px] font-black uppercase text-foreground shadow-[2px_2px_0px_0px_var(--neo-border)] sm:max-w-none sm:px-2 sm:text-[10px]"
								title="Total XP dan level kamu"
							>
								<Flash
									className="h-3.5 w-3.5 shrink-0 text-neo-accent"
									aria-hidden
								/>
								<span className="tabular-nums">
									{viewerStats.xp.toLocaleString("id-ID")} XP
								</span>
								<span className="text-muted-foreground">·</span>
								<span className="tabular-nums">Lv {viewerStats.level}</span>
							</div>
						)}
						{activeLesson?.type !== "QUIZ" && !isCompleted ? (
							<Button
								type="button"
								size="sm"
								data-testid="course-player-header-mark-complete"
								aria-label="Tandai materi selesai"
								onClick={() => void handleMarkComplete()}
								disabled={isMarking || !activeLesson}
								className="neo-btn h-8 shrink-0 px-2 sm:px-3 text-[10px] bg-green-500 hover:bg-green-600 text-black border-2 border-neo-border rounded-md shadow-[2px_2px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-0.5"
							>
								<CheckCircle className="h-4 w-4 sm:mr-1" aria-hidden />
								SELESAI
							</Button>
						) : null}
						<Button
							variant="outline"
							size="sm"
							disabled={!prevLesson}
							onClick={() =>
								prevLesson && void setActiveLessonId(prevLesson.id)
							}
							className="neo-btn h-8 px-2 md:px-3 text-[10px] bg-neo-bg rounded-md transition-all hover:-translate-y-0.5"
						>
							<NavArrowLeft className="w-4 h-4 mr-1 hidden md:block" />
							KEMBALI
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!nextLesson}
							onClick={() =>
								nextLesson && void setActiveLessonId(nextLesson.id)
							}
							className="neo-btn h-8 px-2 md:px-3 text-[10px] bg-neo-bg rounded-md transition-all hover:-translate-y-0.5"
						>
							LANJUT
							<NavArrowRight className="w-4 h-4 ml-1 hidden md:block" />
						</Button>
					</div>
				</header>

				<div className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] px-3 py-4 sm:px-4 md:p-8">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeLessonId}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.3 }}
								className="w-full max-w-none md:max-w-4xl md:mx-auto space-y-8"
							>
								<>
									{activeLesson?.type === "QUIZ" ? (
										<QuizPlayer
											lessonId={activeLesson.id}
											quizData={activeLesson.quizData as QuizData}
											initialProgress={activeLessonProgress}
											onComplete={() => {
												router.refresh();
												setProgress((prev) =>
													upsertLessonCompleted(
														prev,
														activeLesson.id,
														new Date(),
													),
												);
											}}
										/>
									) : (
										<>
											<div
												className={cn(
													"prose prose-sm sm:prose-base dark:prose-invert max-w-none min-w-0 break-words font-medium text-[13px] sm:text-sm md:text-base leading-relaxed prose-headings:font-bold prose-h2:text-lg prose-h3:text-base sm:prose-h2:text-xl sm:prose-h3:text-lg prose-a:text-neo-primary prose-a:underline prose-a:font-bold prose-a:underline-offset-2",
													"[&_img]:mx-auto [&_img]:my-4 [&_img]:block [&_img]:max-w-full [&_img]:min-w-0 [&_img]:h-auto [&_img]:rounded-md [&_img]:border [&_img]:border-border/70",
													"[&_picture]:mx-auto [&_picture]:my-4 [&_picture]:block [&_picture]:max-w-full [&_picture]:min-w-0",
													"[&_picture_img]:mx-auto [&_picture_img]:block [&_picture_img]:max-w-full [&_picture_img]:min-w-0 [&_picture_img]:h-auto",
													"[&_figure]:mx-auto [&_figure]:my-4 [&_figure]:block [&_figure]:max-w-full [&_figure]:min-w-0",
													"[&_figure_img]:mx-auto [&_figure_img]:block [&_figure_img]:max-w-full [&_figure_img]:min-w-0 [&_figure_img]:h-auto",
													"[&_iframe]:my-4 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-md [&_iframe]:border [&_iframe]:border-border/70",
													"[&_video]:my-4 [&_video]:mx-auto [&_video]:block [&_video]:h-auto [&_video]:max-w-full",
												)}
												dangerouslySetInnerHTML={{
													__html: activeLesson?.content || "",
												}}
											/>
										</>
									)}

									{allLessonsComplete && (
										<section
											id="course-completion-panel"
											className="scroll-mt-6 rounded-2xl border-4 border-neo-border bg-neo-accent/15 p-6 shadow-[6px_6px_0px_0px_var(--neo-border)]"
										>
											<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
												<div className="flex items-center gap-3">
													<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-4 border-neo-border bg-yellow-300 text-xl shadow-[3px_3px_0px_0px_var(--neo-border)]">
														<Trophy className="h-7 w-7" aria-hidden />
													</div>
													<div>
														<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
															Penutup kursus
														</p>
														<h3 className="text-xl font-black italic uppercase tracking-tight">
															Selamat, semua materi selesai!
														</h3>
														<p className="mt-1 text-sm font-bold text-muted-foreground">
															Hadiah mengikuti pengaturan guru di menu
															Pengaturan kursus.
														</p>
													</div>
												</div>
											</div>

											<ul className="mt-4 space-y-2 text-sm font-bold">
												<li>
													Bonus selesai kursus:{" "}
													<span className="tabular-nums">
														{rewardPreview.completionXp.toLocaleString("id-ID")}{" "}
														XP
													</span>
												</li>
												<li className="font-semibold text-muted-foreground">
													Badge (opsional):{" "}
													{rewardPreview.badgeId
														? `ID ${rewardPreview.badgeId}`
														: "Belum diatur guru"}
												</li>
											</ul>

											<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
												{canClaimReward ? (
													<Button
														type="button"
														onClick={() => void handleClaimCourseReward()}
														disabled={isClaimingReward}
														className="neo-btn h-11 px-6 text-sm md:text-base bg-green-500 hover:bg-green-600 text-black rounded-lg shadow-[4px_4px_0px_0px_var(--neo-border)]"
													>
														{isClaimingReward
															? "MENGIRIM..."
															: "KLAIM HADIAH KURSUS"}
													</Button>
												) : null}
												{rewardClaimed &&
													(rewardPreview.completionXp > 0 ||
														rewardPreview.badgeId) && (
														<p className="self-center text-sm font-black uppercase text-green-700">
															Hadiah sudah diklaim.
														</p>
													)}
												<Button
													type="button"
													onClick={() => router.push("/dashboard/siswa")}
													className="neo-btn h-11 px-6 text-sm md:text-base bg-black text-white hover:bg-zinc-800 rounded-lg shadow-[4px_4px_0px_0px_var(--neo-border)]"
												>
													SELESAI
												</Button>
											</div>
										</section>
									)}
								</>
							</motion.div>
						</AnimatePresence>
					</div>
					{activeLesson != null && activeLesson.type !== "QUIZ" ? (
						<footer className="shrink-0 border-t-2 border-dashed border-neo-border bg-neo-bg px-3 py-4 sm:px-4 md:px-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
							<div className="mx-auto w-full max-w-none space-y-3 md:max-w-4xl">
								<div className="text-center space-y-1.5">
									<h3 className="text-base font-black italic tracking-tight md:text-xl">
										{isCompleted
											? "MATERI INI SUDAH SELESAI!"
											: "SUDAH SELESAI BELAJAR?"}
									</h3>
									<p className="mx-auto max-w-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
										{isCompleted
											? nextLesson
												? "Lanjut ke materi berikutnya, atau ulang materi ini."
												: allLessonsComplete
													? "Ini materi terakhir — gulir ke atas untuk panel penutup kursus."
													: "Materi ini sudah selesai."
											: "Tandai selesai untuk mencatat progres (tombol ini tetap di bawah layar)."}
									</p>
								</div>
								<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
									{!isCompleted ? (
										<Button
											data-testid="course-player-mark-complete"
											onClick={() => void handleMarkComplete()}
											disabled={isMarking}
											className="neo-btn h-11 w-full rounded-lg bg-green-500 px-6 text-sm text-black shadow-[4px_4px_0px_0px_var(--neo-border)] hover:-translate-y-0.5 hover:bg-green-600 md:w-auto md:text-base"
										>
											<CheckCircle className="mr-2 h-5 w-5" />
											{isMarking ? "MEMPROSES..." : "SELESAI & LANJUT"}
										</Button>
									) : nextLesson ? (
										<Button
											onClick={() => void setActiveLessonId(nextLesson.id)}
											className="neo-btn h-11 w-full rounded-lg bg-neo-primary px-6 text-sm text-white shadow-[4px_4px_0px_0px_var(--neo-border)] hover:-translate-y-0.5 hover:bg-indigo-700 md:w-auto md:text-base"
										>
											MATERI BERIKUTNYA
											<NavArrowRight className="ml-2 h-5 w-5" />
										</Button>
									) : allLessonsComplete ? (
										<Button
											type="button"
											onClick={scrollToCourseCompletion}
											className="neo-btn h-11 w-full rounded-lg bg-neo-primary px-6 text-sm text-white shadow-[4px_4px_0px_0px_var(--neo-border)] hover:-translate-y-0.5 hover:bg-indigo-700 md:w-auto md:text-base"
										>
											MENUJU PENUTUP KURSUS
											<NavArrowRight className="ml-2 h-5 w-5" />
										</Button>
									) : null}
									<Button
										variant="outline"
										onClick={() => router.back()}
										className="neo-btn h-11 w-full rounded-lg bg-neo-bg px-6 text-sm shadow-[4px_4px_0px_0px_var(--neo-border)] hover:-translate-y-0.5 hover:bg-muted md:w-auto md:text-base"
									>
										KEMBALI
									</Button>
								</div>
							</div>
						</footer>
					) : null}
				</div>
			</main>

			<Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
				<SheetContent
					side="left"
					className="w-[320px] p-0 border-r-2 border-neo-border bg-neo-bg"
				>
					<SheetHeader className="p-4 border-b-2 border-neo-border bg-neo-primary text-white text-left">
						<h2 className="font-black uppercase italic text-sm tracking-tight truncate pr-8">
							{course.title}
						</h2>
						<p className="text-[10px] font-bold opacity-80 uppercase">
							Daftar Materi
						</p>
					</SheetHeader>
					<ScrollArea className="h-[calc(100vh-100px)]">
						<div className="p-2 space-y-4">
							{course.modules.map((module) => (
								<div key={module.id} className="space-y-1">
									<h3 className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30">
										MODUL {module.order}: {module.title}
									</h3>
									<div className="space-y-0.5">
										{module.lessons.map((lesson) => (
											<LessonSidebarRow
												key={lesson.id}
												lesson={lesson}
												activeLessonId={activeLessonId || ""}
												isComplete={isLessonComplete(lesson.id)}
												onSelect={selectLessonMobile}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				</SheetContent>
			</Sheet>
		</div>
	);
}
