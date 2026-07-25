"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Play,
	CheckCircle,
	XmarkCircle,
	Timer,
	InfoCircle,
	NavArrowRight,
	Refresh,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { submitQuizAttempt } from "@/actions/lms-course-supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface QuizQuestion {
	id: string;
	text: string;
	options: string[];
	explanation?: string;
}

export interface QuizData {
	passingGrade: number;
	coolDownMinutes: number;
	questions: QuizQuestion[];
}

export interface QuizFeedback {
	correct: boolean;
	explanation?: string;
}

interface QuizPlayerProps {
	lessonId: string;
	quizData: QuizData;
	initialProgress?: {
		isCompleted: boolean;
		score?: number | null;
		lastAttemptAt?: Date | null;
	};
	onComplete: () => void;
}

type QuizState = "INTRO" | "QUESTION" | "RESULT";

export function QuizPlayer({
	lessonId,
	quizData,
	initialProgress,
	onComplete,
}: QuizPlayerProps) {
	const router = useRouter();
	const [state, setState] = useState<QuizState>("INTRO");
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<number[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<{
		score: number;
		passed: boolean;
		feedback: QuizFeedback[];
	} | null>(null);
	const [timeLeft, setTimeLeft] = useState<number>(0);

	const questions = quizData.questions || [];
	const passingGrade = quizData.passingGrade || 0;
	const coolDownMinutes = quizData.coolDownMinutes || 0;

	// Calculate cooldown
	useEffect(() => {
		if (initialProgress?.lastAttemptAt && coolDownMinutes > 0) {
			const calculateTimeLeft = () => {
				const now = new Date();
				const lastAttempt = new Date(initialProgress.lastAttemptAt!);
				const diffMs = now.getTime() - lastAttempt.getTime();
				const diffMins = diffMs / (1000 * 60);

				if (diffMins < coolDownMinutes) {
					setTimeLeft(Math.ceil((coolDownMinutes - diffMins) * 60));
				} else {
					setTimeLeft(0);
				}
			};

			calculateTimeLeft();
			const timer = setInterval(calculateTimeLeft, 1000);
			return () => clearInterval(timer);
		}
	}, [initialProgress, coolDownMinutes]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}m ${secs}s`;
	};

	const handleStart = () => {
		if (timeLeft > 0 && !initialProgress?.isCompleted) {
			toast.error(
				`Sabar ya! Kamu bisa coba lagi dalam ${formatTime(timeLeft)}`,
			);
			return;
		}
		setAnswers(new Array(questions.length).fill(-1));
		setCurrentQuestionIndex(0);
		setState("QUESTION");
	};

	const handleSelectOption = (optionIndex: number) => {
		const newAnswers = [...answers];
		newAnswers[currentQuestionIndex] = optionIndex;
		setAnswers(newAnswers);
	};

	const handleNext = () => {
		if (answers[currentQuestionIndex] === -1) {
			toast.warning("Pilih salah satu jawaban dulu ya!");
			return;
		}

		if (currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		} else {
			void handleSubmit();
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			const res = await submitQuizAttempt(lessonId, answers);
			if (res.success && res.data) {
				setResult(res.data);
				setState("RESULT");
				router.refresh();
				if (res.data.passed) {
					onComplete();
				}
			} else {
				toast.error(res.error || "Gagal mengirim kuis");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetQuiz = () => {
		setState("INTRO");
		setResult(null);
	};

	return (
		<div className="w-full max-w-2xl mx-auto">
			<AnimatePresence mode="wait">
				{state === "INTRO" && (
					<motion.div
						key="intro"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="bg-white border-4 border-neo-border p-8 rounded-2xl shadow-[8px_8px_0px_0px_var(--neo-border)] space-y-6"
					>
						<div className="text-center space-y-2">
							<h2 className="text-3xl font-black uppercase italic tracking-tight">
								Siap untuk Kuis?
							</h2>
							<p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
								Uji pemahamanmu tentang materi ini
							</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="p-4 border-2 border-neo-border bg-neo-accent rounded-xl space-y-1">
								<p className="text-[10px] font-black uppercase opacity-60">
									Passing Grade
								</p>
								<p className="text-2xl font-black">{passingGrade}%</p>
							</div>
							<div className="p-4 border-2 border-neo-border bg-neo-secondary/20 rounded-xl space-y-1">
								<p className="text-[10px] font-black uppercase opacity-60">
									Jumlah Soal
								</p>
								<p className="text-2xl font-black">{questions.length}</p>
							</div>
						</div>

						{timeLeft > 0 && !initialProgress?.isCompleted && (
							<div className="flex items-center gap-3 p-4 border-2 border-red-500 bg-red-50 text-red-600 rounded-xl">
								<Timer className="w-6 h-6 shrink-0" />
								<div className="space-y-0.5">
									<p className="text-xs font-black uppercase leading-none">
										Cool-down Aktif
									</p>
									<p className="text-sm font-bold">
										Kamu bisa mencoba lagi dalam {formatTime(timeLeft)}
									</p>
								</div>
							</div>
						)}

						{initialProgress?.isCompleted && (
							<div className="flex items-center gap-3 p-4 border-2 border-green-500 bg-green-50 text-green-600 rounded-xl">
								<CheckCircle className="w-6 h-6 shrink-0" />
								<div className="space-y-0.5">
									<p className="text-xs font-black uppercase leading-none">
										Kuis Selesai
									</p>
									<p className="text-sm font-bold">
										Skor terakhir: {initialProgress.score}%
									</p>
								</div>
							</div>
						)}

						<Button
							onClick={handleStart}
							disabled={timeLeft > 0 && !initialProgress?.isCompleted}
							className="w-full neo-btn h-14 text-lg font-black bg-neo-primary hover:bg-indigo-700 text-white rounded-xl shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-1 active:translate-y-0"
						>
							{initialProgress?.isCompleted
								? "ULANGI KUIS"
								: "MULAI KUIS SEKARANG"}
							<Play className="w-5 h-5 ml-2 fill-current" />
						</Button>
					</motion.div>
				)}

				{state === "QUESTION" && (
					<motion.div
						key="question"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="space-y-6"
					>
						<div className="flex justify-between items-end px-2">
							<div className="space-y-1">
								<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">
									Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
								</p>
								<div className="h-2 w-48 bg-muted border-2 border-neo-border rounded-full overflow-hidden">
									<motion.div
										className="h-full bg-neo-primary"
										initial={{ width: 0 }}
										animate={{
											width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
										}}
									/>
								</div>
							</div>
						</div>

						<div className="bg-white border-4 border-neo-border p-6 md:p-8 rounded-2xl shadow-[8px_8px_0px_0px_var(--neo-border)] space-y-8">
							<h3 className="text-lg md:text-xl font-black leading-tight">
								{questions[currentQuestionIndex].text}
							</h3>

							<div className="space-y-3">
								{questions[currentQuestionIndex].options.map((option, idx) => (
									<button
										key={idx}
										onClick={() => handleSelectOption(idx)}
										className={cn(
											"w-full flex items-center gap-4 p-4 text-left border-2 transition-all rounded-xl font-bold text-sm md:text-base",
											answers[currentQuestionIndex] === idx
												? "bg-neo-accent border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)] -translate-x-0.5 -translate-y-0.5"
												: "border-muted hover:border-neo-border/30 hover:bg-muted/30",
										)}
									>
										<div
											className={cn(
												"w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border-2 border-neo-border font-black",
												answers[currentQuestionIndex] === idx
													? "bg-white"
													: "bg-muted text-muted-foreground",
											)}
										>
											{String.fromCharCode(65 + idx)}
										</div>
										{option}
									</button>
								))}
							</div>
						</div>

						<div className="flex justify-end pt-2">
							<Button
								onClick={handleNext}
								disabled={isSubmitting || answers[currentQuestionIndex] === -1}
								className="neo-btn h-12 px-8 font-black bg-neo-primary hover:bg-indigo-700 text-white rounded-xl shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-1"
							>
								{isSubmitting ? (
									"MENGIRIM..."
								) : currentQuestionIndex < questions.length - 1 ? (
									<>
										LANJUT
										<NavArrowRight className="w-5 h-5 ml-2" />
									</>
								) : (
									"SELESAI & KIRIM"
								)}
							</Button>
						</div>
					</motion.div>
				)}

				{state === "RESULT" && result && (
					<motion.div
						key="result"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="space-y-6"
					>
						<div
							className={cn(
								"border-4 p-8 rounded-2xl shadow-[8px_8px_0px_0px_var(--neo-border)] text-center space-y-4",
								result.passed
									? "bg-green-50 border-green-600 text-green-900"
									: "bg-red-50 border-red-600 text-red-900",
							)}
						>
							<div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-current mb-2">
								{result.passed ? (
									<CheckCircle className="w-12 h-12" />
								) : (
									<XmarkCircle className="w-12 h-12" />
								)}
							</div>
							<div className="space-y-1">
								<h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">
									{result.passed ? "GG! KAMU LULUS!" : "COBA LAGI YA!"}
								</h2>
								<p className="text-sm font-bold uppercase tracking-widest opacity-70">
									Skor Kamu: {result.score.toFixed(0)}% (Lulus: {passingGrade}%)
								</p>
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">
								Review Jawaban
							</h3>
							{questions.map((q, idx) => (
								<div
									key={q.id}
									className="bg-white border-2 border-neo-border p-5 rounded-xl space-y-3"
								>
									<div className="flex gap-3 items-start">
										{result.feedback[idx].correct ? (
											<CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
										) : (
											<XmarkCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
										)}
										<p className="font-bold text-sm">{q.text}</p>
									</div>

									<div className="pl-8 space-y-2">
										<div className="p-3 bg-muted/30 rounded-lg border border-neo-border/10 text-xs">
											<span className="font-black uppercase text-[10px] opacity-60 block mb-1">
												Jawaban Kamu
											</span>
											{q.options[answers[idx]]}
										</div>

										{result.feedback[idx].explanation && (
											<div className="p-3 bg-neo-accent/30 rounded-lg border border-neo-border/10 text-xs flex gap-2">
												<InfoCircle className="w-4 h-4 shrink-0 text-neo-primary" />
												<div>
													<span className="font-black uppercase text-[10px] opacity-60 block mb-1">
														Penjelasan
													</span>
													{result.feedback[idx].explanation}
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={resetQuiz}
								className="flex-1 neo-btn h-12 font-black bg-white rounded-xl shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-1"
							>
								<Refresh className="w-5 h-5 mr-2" />
								ULANGI DARI AWAL
							</Button>
							{result.passed && (
								<Button
									onClick={onComplete}
									className="flex-1 neo-btn h-12 font-black bg-neo-primary hover:bg-indigo-700 text-white rounded-xl shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-1"
								>
									LANJUT BELAJAR
									<NavArrowRight className="w-5 h-5 ml-2" />
								</Button>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
