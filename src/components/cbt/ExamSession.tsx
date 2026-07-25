"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Exam, ExamAttempt, MatrixColumn, MatrixRow } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
	SHADOW_SM,
	SHADOW_MD,
	SHADOW_LG,
	SHADOW_XL,
	SHADOW_2XL,
	SHADOW_3XL,
} from "@/lib/styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Timer,
	NavArrowLeft,
	NavArrowRight,
	ViewGrid,
	LogOut,
	WarningTriangle,
	Flash,
	CheckCircle,
	Page,
	Menu,
	ArrowUp,
	ArrowDown,
	Bookmark,
	Lock,
} from "iconoir-react";
import { toast } from "sonner";
import {
	submitExamSupabase,
	syncExamAttemptSupabase,
	lockExamAttemptSupabase,
} from "@/actions/exam-supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { ExamResult } from "./ExamResult";
import { MathRenderer } from "@/components/ui/math-renderer";
import { useIsMobile } from "@/hooks/use-mobile";

type AnswerValue = string | string[] | Record<string, string> | boolean;

type ViolationType =
	| "SWITCH_APP"
	| "SCREENSHOT_DETECTION"
	| "LAYOUT_VIOLATION"
	| "UI_LOCKDOWN";

interface ViolationLog {
	type: ViolationType;
	at: Date;
	detail: string;
}

interface ExamSessionProps {
	exam: Exam;
	attemptId?: string;
}

const VideoOverlay = ({ isMobile }: { isMobile: boolean }) => (
	<div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 pointer-events-none z-[9999]">
		<div
			className={cn(
				"border border-black/20 bg-white/40 px-2 py-1 backdrop-blur-[1px] rounded",
				isMobile ? "opacity-35" : "opacity-45",
			)}
		>
			<p
				className={cn(
					"font-black uppercase tracking-tight text-black/70 leading-none",
					isMobile ? "text-[9px]" : "text-[10px]",
				)}
			>
				Protected Session
			</p>
			<p
				className={cn(
					"font-semibold uppercase text-black/60 leading-none mt-0.5",
					isMobile ? "text-[8px]" : "text-[9px]",
				)}
			>
				{new Date().toLocaleDateString()}
			</p>
		</div>
	</div>
);

export function ExamSession({ exam, attemptId }: ExamSessionProps) {
	const { user: liveUser } = useAuth();

	// Keep a stable student ID to prevent session loss on short token expires
	const [studentId, setStudentId] = useState<string | null>(null);

	useEffect(() => {
		if (liveUser?.id && !studentId) {
			setStudentId(liveUser.id);
		}
	}, [liveUser, studentId]);

	// Use either live or initial student ID
	const effectiveUserId = liveUser?.id || studentId;

	const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
	const [direction, setDirection] = useState(0); // 0: initial, 1: next, -1: previous
	const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

	const answeredCount = useMemo(() => {
		let count = 0;
		exam.questions.forEach((question) => {
			const val = answers[question.id];
			if (val !== undefined && val !== null && val !== "") {
				if (Array.isArray(val) && val.length > 0) {
					count++;
				} else if (typeof val === "object" && Object.keys(val).length > 0) {
					count++;
				} else if (typeof val === "boolean" || typeof val === "string") {
					// For boolean (bs) or string (pg, essay)
					count++;
				}
			}
		});
		return count;
	}, [answers, exam.questions]);

	const totalQuestions = (exam.questions || []).length;
	const progressPercentage = (answeredCount / totalQuestions) * 100;

	const isQuestionAnswered = useCallback(
		(qId: string) => {
			const val = answers[qId];
			if (val === undefined || val === null || val === "") return false;
			if (Array.isArray(val)) return val.length > 0;
			if (typeof val === "object") return Object.keys(val).length > 0;
			return true; // boolean or non-empty string
		},
		[answers],
	);

	const handleNavigateQuestion = useCallback(
		(newIdx: number) => {
			if (newIdx < 0 || newIdx >= totalQuestions) return;
			setDirection(newIdx > currentQuestionIdx ? 1 : -1);
			setCurrentQuestionIdx(newIdx);
		},
		[currentQuestionIdx, totalQuestions],
	);

	const toggleMarked = useCallback((qId: string) => {
		setMarkedQuestions((prev) => {
			const next = new Set(prev);
			if (next.has(qId)) next.delete(qId);
			else next.add(qId);
			return next;
		});
	}, []);

	const [violations, setViolations] = useState(0);
	const [logBuffer, setLogBuffer] = useState<ViolationLog[]>([]);
	const [isLocked, setIsLocked] = useState(false);
	const [supportsFullscreen] = useState(() => {
		if (typeof document === "undefined") return false;
		const doc = document.documentElement as any;
		return !!(
			doc.requestFullscreen ||
			doc.webkitRequestFullscreen ||
			doc.mozRequestFullscreen ||
			doc.msRequestFullscreen
		);
	});
	const [isFullscreen, setIsFullscreen] = useState(() => {
		if (typeof document === "undefined") return false;
		const doc = document as any;
		return !!(
			doc.fullscreenElement ||
			doc.webkitFullscreenElement ||
			doc.mozFullScreenElement ||
			doc.msFullscreenElement
		);
	});
	const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
	const [isFinished, setIsFinished] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [blackout, setBlackout] = useState(false);
	const [showQuestionMap, setShowQuestionMap] = useState(false);
	const [showFloatingGrid, setShowFloatingGrid] = useState(false);
	const [showMobilePassage, setShowMobilePassage] = useState(false);
	const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
	const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(
		() => new Set(),
	);
	const [liveIsSubmitLocked, setLiveIsSubmitLocked] = useState(
		exam.isSubmitLocked,
	);
	const [liveIsSubmitEnabled, setLiveIsSubmitEnabled] = useState(false);

	const canSubmit = useMemo(
		() => !liveIsSubmitLocked || liveIsSubmitEnabled,
		[liveIsSubmitLocked, liveIsSubmitEnabled],
	);
	const prevCanSubmitRef = useRef(canSubmit);

	const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
	const [currentMatrixRowIdx, setCurrentMatrixRowIdx] = useState(0);
	const [examResult, setExamResult] = useState<{
		score: number;
		xpReward: number;
		coinReward: number;
		leveledUp: boolean;
		newLevel: number;
		badgesAwarded: number;
	} | null>(null);
	const startTimeRef = useRef(new Date());
	const passageScrollRef = useRef<Record<string, number>>({});
	const mobilePassageContentRef = useRef<HTMLDivElement>(null);
	const mobileQuestionBarRef = useRef<HTMLDivElement>(null);
	/** Kontainer scroll utama kolom soal (mobile/desktop) — direset ke atas tiap ganti nomor */
	const questionViewportRef = useRef<HTMLDivElement>(null);
	const lastViolationTimeRef = useRef<number>(0);
	const lastKeyboardTimeRef = useRef<number>(0);
	const blurTimeRef = useRef<number>(0);
	const initialHeightRef = useRef<number>(
		typeof window !== "undefined" ? window.innerHeight : 0,
	);
	const fullscreenEnterTimeRef = useRef<number>(0);

	const maxViolations = exam.settings?.antiCheat?.maxViolations ?? 3;
	const storageKey = `cbt_ans_${effectiveUserId}_${exam.id}`;
	const markedStorageKey = `cbt_marked_${effectiveUserId}_${exam.id}`;

	const isMobile = useIsMobile();
	const currentQuestion = exam.questions[currentQuestionIdx];

	useEffect(() => {
		console.log("DEBUG: Current Question Data:", {
			id: currentQuestion?.id,
			type: currentQuestion?.type,
			text: currentQuestion?.text,
			hasOptions: !!currentQuestion?.options,
			hasPairs: !!currentQuestion?.pairs,
			hasRows: !!currentQuestion?.rows,
		});
	}, [currentQuestion]);

	const currentPassage = currentQuestion.passageId
		? exam.passages?.[currentQuestion.passageId]
		: undefined;

	const logViolation = useCallback(
		(type: ViolationType, detail: string = "") => {
			if (isFinished || isSubmitting) return;

			// Cooldown 2s to prevent multiple triggers
			const now = Date.now();
			if (
				lastViolationTimeRef.current &&
				now - lastViolationTimeRef.current < 2000
			)
				return;
			lastViolationTimeRef.current = now;

			setViolations((v) => v + 1);
			setLogBuffer((prev) => [...prev, { type, at: new Date(), detail }]);

			// Haptic Feedback for Android
			if (typeof navigator !== "undefined" && navigator.vibrate) {
				navigator.vibrate([100]);
			}

			const messages: Record<ViolationType, string> = {
				SWITCH_APP: "Jangan pindah tab atau aplikasi!",
				SCREENSHOT_DETECTION: "Dilarang mengambil tangkapan layar!",
				LAYOUT_VIOLATION:
					"Jangan menggunakan Split Screen atau Floating Window!",
				UI_LOCKDOWN: "Aksi ini tidak diizinkan selama ujian!",
			};

			toast.error(messages[type], {
				description: detail,
				duration: 5000,
				position: "top-center",
			});
		},
		[isFinished, isSubmitting],
	);

	const handleSubmit = useCallback(
		async (status: ExamAttempt["status"] = "completed") => {
			if (!effectiveUserId) {
				toast.error("Sesi berakhir, silakan login kembali.");
				return;
			}

			setIsSubmitting(true);
			const timeTaken = Math.round((exam.duration * 60 - timeLeft) / 60);
			const latestAnswers = answersRef.current;
			const latestViolations = violationsRef.current;
			const latestLogs = logBufferRef.current;

			const attempt: Partial<ExamAttempt> = {
				examId: exam.id!,
				classId: exam.classId, // Pass classId for easier history filtering
				studentId: effectiveUserId,
				answers: latestAnswers,
				violations: latestViolations,
				violationLogs: latestLogs,
				startedAt: startTimeRef.current,
				submittedAt: new Date(),
				timeTaken: timeTaken > 0 ? timeTaken : 1,
				status,
			};

			try {
				// Best-effort: persist latest progress before final submit (avoid losing last-second answers).
				if (attemptId) {
					await syncExamAttemptSupabase({
						examId: exam.id!,
						attemptId,
						answers: latestAnswers,
						violations: latestViolations,
						violationLogs: latestLogs,
						timeTaken: timeTaken > 0 ? timeTaken : 1,
					});
				}
				const result = await submitExamSupabase(attempt);
				if (result.success && "data" in result) {
					localStorage.removeItem(storageKey);
					localStorage.removeItem(markedStorageKey);
					toast.success("Ujian berhasil dikirim!");
					if (document.fullscreenElement) {
						document.exitFullscreen().catch(console.error);
					}
					setExamResult(result.data);
				} else {
					const errorMsg =
						"error" in result ? result.error : "Gagal mengirim ujian.";
					toast.error(errorMsg);
					setIsSubmitting(false);
					setIsFinished(false);
				}
			} catch (err) {
				console.error("Submit error:", err);
				toast.error("Terjadi kesalahan sistem.");
				setIsSubmitting(false);
				setIsFinished(false);
			}
		},
		[
			effectiveUserId,
			exam.id,
			exam.duration,
			timeLeft,
			storageKey,
			exam.classId,
			attemptId,
			markedStorageKey,
		],
	);

	const handleAutoSubmit = useCallback(
		async (status: ExamAttempt["status"] = "completed") => {
			if (isSubmitting || isFinished) return;
			setIsFinished(true);
			await handleSubmit(status);
		},
		[isSubmitting, isFinished, handleSubmit],
	);

	const answersRef = useRef(answers);
	const violationsRef = useRef(violations);
	const logBufferRef = useRef(logBuffer);

	useEffect(() => {
		answersRef.current = answers;
	}, [answers]);

	useEffect(() => {
		violationsRef.current = violations;
	}, [violations]);

	useEffect(() => {
		logBufferRef.current = logBuffer;
	}, [logBuffer]);

	// Autosync (debounced) supaya tidak menunggu heartbeat 30 detik.
	useEffect(() => {
		if (!attemptId || isFinished || isSubmitting) return;
		if (!isOnline) return;
		if (!exam.id) return;

		const timer = window.setTimeout(() => {
			const timeTaken = Math.round((exam.duration * 60 - timeLeft) / 60);
			syncExamAttemptSupabase({
				examId: exam.id!,
				attemptId,
				answers: answersRef.current,
				violations: violationsRef.current,
				violationLogs: logBufferRef.current,
				timeTaken: timeTaken > 0 ? timeTaken : 1,
			}).catch((err) => console.error("Autosync error:", err));
		}, 2500);

		return () => window.clearTimeout(timer);
	}, [
		attemptId,
		isFinished,
		isSubmitting,
		isOnline,
		exam.id,
		exam.duration,
		timeLeft,
		answers,
	]);

	// Sync / Heartbeat tiap 30 detik (monitoring dapat lastActivityAt & answeredCount terbaru)
	useEffect(() => {
		if (!attemptId || isFinished || isSubmitting) return;
		const currentAttemptId = attemptId;

		const syncProgress = async () => {
			try {
				const timeTaken = Math.round((exam.duration * 60 - timeLeft) / 60);
				const res = await syncExamAttemptSupabase({
					examId: exam.id!,
					attemptId: currentAttemptId!,
					answers: answersRef.current,
					violations: violationsRef.current,
					violationLogs: logBufferRef.current,
					timeTaken: timeTaken > 0 ? timeTaken : 1,
				});

				if (res.success) {
					if (res.isSubmitLocked !== undefined)
						setLiveIsSubmitLocked(res.isSubmitLocked);
					if (res.isSubmitEnabled !== undefined)
						setLiveIsSubmitEnabled(res.isSubmitEnabled);
				}
			} catch (err) {
				console.error("Heartbeat sync error:", err);
			}
		};

		const interval = setInterval(syncProgress, 30000);
		return () => clearInterval(interval);
	}, [attemptId, isFinished, isSubmitting, exam.id, exam.duration]); // Removed changing data from deps

	// Listen for real-time exam and attempt changes
	useEffect(() => {
		if (!exam.id) return;

		// 1. Initial fetch for attempt status & exam lock status
		if (attemptId) {
			supabase
				.from("ExamAttempt")
				.select("isSubmitEnabled, violations, status")
				.eq("id", attemptId)
				.single()
				.then(({ data, error }) => {
					if (error)
						console.error("Error fetching initial attempt status:", error);
					if (data) {
						setLiveIsSubmitEnabled(data.isSubmitEnabled);
						setViolations(data.violations || 0);
						if (
							data.status?.toLowerCase() === "locked" ||
							data.violations >= maxViolations
						) {
							setIsLocked(true);
						}
					}
				});
		}

		// Fetch fresh exam lock status on mount
		supabase
			.from("Exam")
			.select("isSubmitLocked")
			.eq("id", exam.id)
			.single()
			.then(({ data, error }) => {
				if (error)
					console.error("Error fetching initial exam lock status:", error);
				if (data && "isSubmitLocked" in data) {
					setLiveIsSubmitLocked(data.isSubmitLocked);
				}
			});

		// 2. Listen for Exam changes (isSubmitLocked)
		const examChannel = supabase
			.channel(`exam_changes_${exam.id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "Exam",
					filter: `id=eq.${exam.id}`,
				},
				(payload) => {
					if (payload.new && "isSubmitLocked" in payload.new) {
						setLiveIsSubmitLocked(payload.new.isSubmitLocked);
					}
				},
			)
			.subscribe();

		// 3. Listen for ExamAttempt changes (isSubmitEnabled, violations, status)
		let attemptChannel: any;
		if (attemptId) {
			attemptChannel = supabase
				.channel(`attempt_changes_${attemptId}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "ExamAttempt",
						filter: `id=eq.${attemptId}`,
					},
					(payload) => {
						if (payload.new) {
							if ("isSubmitEnabled" in payload.new) {
								setLiveIsSubmitEnabled(payload.new.isSubmitEnabled);
							}
							if ("violations" in payload.new) {
								setViolations(payload.new.violations);
								// If violations are reset by guru, unlock the screen
								if (payload.new.violations < maxViolations) {
									setIsLocked(false);
								}
							}
							if ("status" in payload.new) {
								// If status is reset to IN_PROGRESS, unlock
								if (payload.new.status?.toLowerCase() === "in_progress") {
									setIsLocked(false);
									setIsFinished(false);
								}
							}
						}
					},
				)
				.subscribe();
		}

		return () => {
			supabase.removeChannel(examChannel);
			if (attemptChannel) supabase.removeChannel(attemptChannel);
		};
	}, [exam.id, attemptId, maxViolations]);

	// Visual feedback when canSubmit becomes true
	useEffect(() => {
		if (canSubmit && !prevCanSubmitRef.current) {
			toast.success("Guru telah mengizinkan pengumpulan jawaban!", {
				icon: <CheckCircle className="text-green-500" />,
			});
		}
		prevCanSubmitRef.current = canSubmit;
	}, [canSubmit]);

	// Keyboard Shortcuts Handler
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			lastKeyboardTimeRef.current = Date.now();
			if (
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLInputElement
			)
				return;

			const key = e.key.toLowerCase();
			const currentQ = exam.questions[currentQuestionIdx];
			const type = currentQ?.type?.toLowerCase();

			// Answer Selection (1-5 or A-E)
			if (/^[1-5a-e]$/.test(key)) {
				const idx = /^[1-5]$/.test(key)
					? parseInt(key) - 1
					: key.charCodeAt(0) - 97;
				if (type === "pg" || type === "pg_kompleks" || type === "bs") {
					if (type === "bs") {
						if (idx === 0)
							setAnswers((prev) => ({ ...prev, [currentQ.id]: true }));
						if (idx === 1)
							setAnswers((prev) => ({ ...prev, [currentQ.id]: false }));
					} else {
						const option = currentQ.options?.[idx];
						if (option) {
							if (type === "pg") {
								setAnswers((prev) => ({ ...prev, [currentQ.id]: option.id }));
							} else if (type === "pg_kompleks") {
								setAnswers((prev) => {
									const currentAnswers = (prev[currentQ.id] as string[]) || [];
									const isSelected = currentAnswers.includes(option.id);
									const next = isSelected
										? currentAnswers.filter((id) => id !== option.id)
										: [...currentAnswers, option.id];
									return { ...prev, [currentQ.id]: next };
								});
							}
						}
					}
				} else if (type === "matrix") {
					const col = currentQ.columns?.[idx];
					if (col) {
						const rowId = isMobile
							? currentQ.rows![currentMatrixRowIdx].id
							: currentQ.rows?.[0]?.id;
						if (rowId) {
							setAnswers((prev) => {
								const qAns =
									(prev[currentQ.id] as Record<string, string>) || {};
								return { ...prev, [currentQ.id]: { ...qAns, [rowId]: col.id } };
							});
						}
					}
				}
			}

			if (key === "arrowright" || key === "enter") {
				if (currentQuestionIdx < totalQuestions - 1) {
					handleNavigateQuestion(currentQuestionIdx + 1);
				} else if (canSubmit) {
					setShowConfirmSubmit(true);
				}
			} else if (key === "arrowleft") {
				if (currentQuestionIdx > 0)
					handleNavigateQuestion(currentQuestionIdx - 1);
			}

			if (key === " ") {
				e.preventDefault();
				if (currentPassage) setShowMobilePassage((prev) => !prev);
			} else if (key === "p") {
				if (isMobile) setShowQuestionMap((prev) => !prev);
				else setShowFloatingGrid((prev) => !prev);
			} else if ((key === "m" || key === "r") && currentQ) {
				e.preventDefault();
				toggleMarked(currentQ.id);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		currentQuestionIdx,
		totalQuestions,
		handleNavigateQuestion,
		exam.questions,
		answers,
		isMobile,
		currentMatrixRowIdx,
		currentPassage,
		toggleMarked,
	]);

	// Initialize from localStorage
	useEffect(() => {
		const saved = localStorage.getItem(storageKey);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				requestAnimationFrame(() => {
					setAnswers(parsed);
				});
			} catch (e) {
				console.error("Failed to parse saved answers", e);
			}
		}
		const savedMarked = localStorage.getItem(markedStorageKey);
		if (savedMarked) {
			try {
				const arr = JSON.parse(savedMarked) as string[];
				if (Array.isArray(arr)) setMarkedQuestions(new Set(arr));
			} catch (e) {
				console.error("Failed to parse saved marked", e);
			}
		}
	}, [storageKey, markedStorageKey]);

	// Save to localStorage
	useEffect(() => {
		if (Object.keys(answers).length > 0) {
			localStorage.setItem(storageKey, JSON.stringify(answers));
			setIsSaving(true);
			const timer = setTimeout(() => setIsSaving(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [answers, storageKey]);

	useEffect(() => {
		if (markedQuestions.size > 0) {
			localStorage.setItem(
				markedStorageKey,
				JSON.stringify([...markedQuestions]),
			);
		}
	}, [markedQuestions, markedStorageKey]);

	// Connectivity Guard
	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			toast.success("Kembali Online!", {
				description: "Koneksi internet telah pulih.",
				icon: <CheckCircle className="w-5 h-5 text-green-500" />,
			});
		};
		const handleOffline = () => {
			setIsOnline(false);
			toast.error("Koneksi Terputus!", {
				description: "Jawaban kamu tetap disimpan secara lokal.",
				icon: <WarningTriangle className="w-5 h-5 text-red-500" />,
				duration: Infinity,
			});
		};

		setIsOnline(navigator.onLine);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Warn before leaving the page and handle mobile back button
	useEffect(() => {
		if (isFinished || isSubmitting) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue =
				"Apakah Anda yakin ingin meninggalkan ujian? Jawaban Anda mungkin tidak tersimpan.";
			return e.returnValue;
		};

		// Block back button by pushing a dummy state
		window.history.pushState({ session: true }, "", window.location.href);
		const handlePopState = (e: PopStateEvent) => {
			if (!isFinished && !isSubmitting) {
				// Push state again to keep user on the same page
				window.history.pushState({ session: true }, "", window.location.href);
				toast.warning("Tombol Back Terdeteksi!", {
					description:
						"Gunakan tombol navigasi di dalam aplikasi untuk berpindah soal.",
					duration: 5000,
					position: "top-center",
				});
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("popstate", handlePopState);
		};
	}, [isFinished, isSubmitting]);

	// Timer logic
	useEffect(() => {
		if (timeLeft <= 0) {
			requestAnimationFrame(() => {
				handleAutoSubmit("auto_submitted");
			});
			return;
		}
		const timer = setInterval(() => {
			setTimeLeft((prev) => prev - 1);
		}, 1000);
		return () => clearInterval(timer);
	}, [timeLeft, handleAutoSubmit]);

	// Fullscreen, Visibility, Blur, Resize & UI Lockdown Logic
	const enterFullscreen = useCallback(async () => {
		try {
			const element = document.documentElement as any;
			if (element.requestFullscreen) {
				await element.requestFullscreen();
			} else if (element.webkitRequestFullscreen) {
				await element.webkitRequestFullscreen();
			} else if (element.msRequestFullscreen) {
				await element.msRequestFullscreen();
			}
		} catch (err) {
			console.error("Error attempting to enable full-screen mode", err);
		}
	}, []);

	useEffect(() => {
		const handleFullscreenChange = () => {
			const doc = document as any;
			const isCurrentlyFullscreen = !!(
				doc.fullscreenElement ||
				doc.webkitFullscreenElement ||
				doc.mozFullScreenElement ||
				doc.msFullscreenElement
			);

			setIsFullscreen(isCurrentlyFullscreen);

			if (isCurrentlyFullscreen) {
				fullscreenEnterTimeRef.current = Date.now();
			} else {
				fullscreenEnterTimeRef.current = 0;
			}

			const timeSinceStart =
				new Date().getTime() - startTimeRef.current.getTime();
			if (timeSinceStart < 3000) return;

			if (
				!isCurrentlyFullscreen &&
				!isFinished &&
				!isSubmitting &&
				exam.settings?.antiCheat?.forceFullscreen &&
				supportsFullscreen
			) {
				logViolation("SWITCH_APP", "Layar tidak dalam mode penuh.");
			}
		};

		const handleVisibilityChange = () => {
			const timeSinceStart =
				new Date().getTime() - startTimeRef.current.getTime();
			if (timeSinceStart < 3000) return;

			const now = Date.now();
			const doc = document as any;
			const isInFullscreen = !!(
				doc.fullscreenElement ||
				doc.webkitFullscreenElement ||
				doc.mozFullScreenElement ||
				doc.msFullscreenElement
			);

			if (
				document.visibilityState === "hidden" &&
				!isFinished &&
				!isSubmitting
			) {
				// Trigger blackout immediately if window hidden
				if (
					exam.settings?.antiCheat?.preventScreenshot ||
					exam.settings?.antiCheat?.preventScreenRecord
				) {
					setBlackout(true);
				}

				if (exam.settings?.antiCheat?.enabled) {
					// If fullscreen is not supported (like iPhone iOS), we can't rely on isInFullscreen
					// We rely solely on visibilityState and blur
					if (!supportsFullscreen) {
						logViolation("SWITCH_APP", "Jangan pindah tab!");
						return;
					}

					// Allow very brief visibility loss on mobile to account for system overlays/gestures
					if (isMobile && isInFullscreen && fullscreenEnterTimeRef.current) {
						const timeInFullscreen = now - fullscreenEnterTimeRef.current;
						if (timeInFullscreen < 500) return; // Ignore very brief flashes on mobile
					}

					if (isInFullscreen && fullscreenEnterTimeRef.current) {
						const timeInFullscreen = now - fullscreenEnterTimeRef.current;
						if (timeInFullscreen < 1000) return;
					}

					if (
						!isInFullscreen ||
						(fullscreenEnterTimeRef.current &&
							now - fullscreenEnterTimeRef.current >= 1000)
					) {
						logViolation("SWITCH_APP", "Jangan pindah tab!");
					}
				}
			} else {
				// Recover from blackout with a slight delay
				setTimeout(() => setBlackout(false), 500);
			}
		};

		const handleBlur = () => {
			if (isFinished || isSubmitting) return;
			blurTimeRef.current = Date.now();

			// Blackout on blur to prevent screenshot capturing focused state
			if (
				exam.settings?.antiCheat?.preventScreenshot ||
				exam.settings?.antiCheat?.preventScreenRecord
			) {
				setBlackout(true);
			}

			if (exam.settings?.antiCheat?.enabled) {
				// More lenient blur on mobile
				if (isMobile) {
					// On mobile, some gestures trigger blur. We check if focus returns quickly in handleFocus.
					return;
				}
				logViolation(
					"SWITCH_APP",
					"Fokus layar terputus (Tab Switch / Pop-up aplikasi lain).",
				);
			}
		};

		const handleFocus = () => {
			if (isFinished || isSubmitting) return;
			const now = Date.now();

			// Recover from blackout
			setBlackout(false);

			// Heuristic for screenshot detection if specific toggle is on
			if (
				exam.settings?.antiCheat?.preventScreenshot &&
				blurTimeRef.current &&
				now - blurTimeRef.current < 2000
			) {
				// If blur-focus cycle is very fast (< 2s), it often indicates a screenshot tool or quick switch
				// We log it as a screenshot attempt
				logViolation(
					"SCREENSHOT_DETECTION",
					"Percobaan tangkapan layar dideteksi!",
				);
			}
			blurTimeRef.current = 0;
		};

		const handleResize = () => {
			if (
				isFinished ||
				isSubmitting ||
				!exam.settings?.antiCheat?.preventSplitScreen
			)
				return;

			const timeSinceStart =
				new Date().getTime() - startTimeRef.current.getTime();
			if (timeSinceStart < 3000) return;

			const isKeyboardOpen = Date.now() - lastKeyboardTimeRef.current < 1000;

			// If innerHeight drops by > 30% without keyboard event (detect split-screen/floating windows)
			if (
				!isKeyboardOpen &&
				window.innerHeight < initialHeightRef.current * 0.7
			) {
				logViolation(
					"LAYOUT_VIOLATION",
					"Jangan gunakan split-screen atau resize jendela browser!",
				);
			}
		};

		const handlePrevent = (e: Event) => {
			if (!exam.settings?.antiCheat?.preventCopyPaste) return;
			e.preventDefault();
			logViolation("UI_LOCKDOWN", "Dilarang menyalin atau menempel jawaban.");
		};

		const handleScreenshotKey = (e: KeyboardEvent) => {
			const antiCheat = exam.settings?.antiCheat;
			if (!antiCheat?.preventScreenshot) return;

			// PrintScreen, Win+Shift+S (S), Cmd+Shift+3/4 (3 or 4)
			const key = e.key.toLowerCase();

			// Trigger blackout immediately on known screenshot keys
			const isScreenshotShortcut =
				key === "printscreen" ||
				(e.shiftKey &&
					(e.metaKey || e.ctrlKey) &&
					(key === "s" || key === "3" || key === "4"));

			if (isScreenshotShortcut) {
				setBlackout(true);
				logViolation("SCREENSHOT_DETECTION", "Shortcut screenshot terdeteksi!");
				// Brief blackout to ensure nothing useful is captured
				setTimeout(() => setBlackout(false), 1000);
			}
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
		document.addEventListener("mozfullscreenchange", handleFullscreenChange);
		document.addEventListener("MSFullscreenChange", handleFullscreenChange);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("blur", handleBlur);
		window.addEventListener("focus", handleFocus);
		window.addEventListener("resize", handleResize);
		window.addEventListener("keydown", handleScreenshotKey);

		// UI Lockdown
		document.addEventListener("contextmenu", handlePrevent);
		document.addEventListener("copy", handlePrevent);
		document.addEventListener("paste", handlePrevent);
		document.addEventListener("cut", handlePrevent);

		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
			document.removeEventListener(
				"webkitfullscreenchange",
				handleFullscreenChange,
			);
			document.removeEventListener(
				"mozfullscreenchange",
				handleFullscreenChange,
			);
			document.removeEventListener(
				"MSFullscreenChange",
				handleFullscreenChange,
			);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("keydown", handleScreenshotKey);

			document.removeEventListener("contextmenu", handlePrevent);
			document.removeEventListener("copy", handlePrevent);
			document.removeEventListener("paste", handlePrevent);
			document.removeEventListener("cut", handlePrevent);
		};
	}, [isFinished, isMobile, exam.settings?.antiCheat, logViolation]);

	// Violation check
	useEffect(() => {
		if (violations >= maxViolations && !isFinished && !isLocked) {
			setIsLocked(true);
			if (attemptId) {
				lockExamAttemptSupabase(attemptId).catch(console.error);
			}
			toast.error("Ujian dikunci karena terlalu banyak pelanggaran.");
		}
	}, [violations, maxViolations, isFinished, isLocked, attemptId]);

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	useEffect(() => {
		requestAnimationFrame(() => {
			setSelectedLeft(null);
			setCurrentMatrixRowIdx(0);

			// Soal baru: langsung balik ke atas area konten (tanpa siswa geser manual)
			questionViewportRef.current?.scrollTo({ top: 0, behavior: "auto" });

			// Auto-scroll mobile question bar
			if (isMobile && mobileQuestionBarRef.current) {
				const activeBtn = mobileQuestionBarRef.current.children[
					currentQuestionIdx
				] as HTMLElement;
				if (activeBtn) {
					const container = mobileQuestionBarRef.current;
					const scrollLeft =
						activeBtn.offsetLeft -
						container.offsetWidth / 2 +
						activeBtn.offsetWidth / 2;
					container.scrollTo({ left: scrollLeft, behavior: "smooth" });
				}
			}
		});
	}, [currentQuestionIdx, isMobile]);

	// Auto-initialize "mengurutkan" type questions
	useEffect(() => {
		const currentQuestion = exam.questions[currentQuestionIdx];
		if (
			currentQuestion.type?.toLowerCase() === "mengurutkan" &&
			!answers[currentQuestion.id]
		) {
			const optionIds = currentQuestion.options?.map((o) => o.id) || [];
			if (optionIds.length > 0) {
				setAnswers((prev) => {
					if (prev[currentQuestion.id]) return prev;
					return { ...prev, [currentQuestion.id]: optionIds };
				});
			}
		}
	}, [currentQuestionIdx, exam.questions, answers]);

	// Restore scroll position when mobile passage opens
	useEffect(() => {
		if (
			showMobilePassage &&
			currentPassage &&
			mobilePassageContentRef.current
		) {
			const savedPos = passageScrollRef.current[currentPassage.id] || 0;
			mobilePassageContentRef.current.scrollTop = savedPos;
		}
	}, [showMobilePassage, currentPassage]);

	const handlePassageScroll = (e: React.UIEvent<HTMLDivElement>) => {
		if (currentPassage) {
			passageScrollRef.current[currentPassage.id] = e.currentTarget.scrollTop;
		}
	};

	const shuffledRightItems = useMemo(() => {
		const type = currentQuestion.type?.toLowerCase();
		if (type !== "menjodohkan") return [];
		const items =
			currentQuestion.pairs?.map((p) => ({ id: p.id, text: p.right })) || [];
		const seed = currentQuestion.id
			.split("")
			.reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const deterministicRandom = (s: number) => {
			const x = Math.sin(s) * 10000;
			return x - Math.floor(x);
		};
		return [...items].sort((a, b) => {
			const randA = deterministicRandom(seed + a.id.length + a.text.length);
			const randB = deterministicRandom(seed + b.id.length + b.text.length);
			return randA - randB;
		});
	}, [currentQuestion.id, currentQuestion.type, currentQuestion.pairs]);

	// --- RENDERING COMPONENTS ---

	const renderPG = () => (
		<div className="grid grid-cols-1 gap-4">
			{currentQuestion.options?.map((option, idx) => (
				<motion.button
					key={option.id}
					whileTap={isMobile ? { scale: 0.97 } : undefined}
					onClick={() =>
						setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.id }))
					}
					className={cn(
						"w-full text-left p-5 sm:p-6 border-4 border-black font-semibold text-base sm:text-xl leading-relaxed transition-[background-color,transform,shadow] flex items-start gap-4 group focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none",
						isMobile && "min-h-[56px]",
						answers[currentQuestion.id] === option.id
							? "bg-green-400 translate-x-1 translate-y-1 shadow-none"
							: "bg-white dark:bg-zinc-900 SHADOW_LG hover:SHADOW_SM hover:translate-x-1 hover:translate-y-1",
					)}
				>
					<div className="flex items-center gap-4">
						<div
							className={cn(
								"min-w-[36px] h-9 border-2 border-black flex items-center justify-center bg-black text-white group-hover:bg-white dark:group-hover:bg-zinc-800 group-hover:text-black dark:group-hover:text-white transition-colors font-black",
								answers[currentQuestion.id] === option.id &&
									"bg-white dark:bg-zinc-800 text-black dark:text-white",
							)}
						>
							{String.fromCharCode(65 + idx)}
						</div>
						<MathRenderer text={option.text} className="pt-1 flex-1" />
						{!isMobile && (
							<span className="text-[10px] font-black opacity-30 ml-2">
								[{String.fromCharCode(65 + idx)}]
							</span>
						)}
					</div>
					{option.imageUrl && (
						<div className="ml-auto flex-shrink-0">
							<div className="w-24 h-24 border-2 border-black overflow-hidden bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center">
								<img
									src={option.imageUrl}
									alt={`Option ${String.fromCharCode(65 + idx)}`}
									className="w-full h-full object-contain"
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.src = "https://placehold.co/96x96?text=Image+Error";
									}}
								/>
							</div>
						</div>
					)}
				</motion.button>
			))}
		</div>
	);

	const renderPGKompleks = () => {
		const options = currentQuestion.options || [];
		if (options.length === 0) {
			return (
				<div className="p-6 border-4 border-black bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold uppercase text-center SHADOW_SM">
					Opsi pertanyaan tidak ditemukan
				</div>
			);
		}
		const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
		return (
			<div className="grid grid-cols-1 gap-4">
				{options.map((option, idx) => {
					const isSelected = currentAnswers.includes(option.id);
					return (
						<motion.label
							key={option.id}
							htmlFor={`pgk-${currentQuestion.id}-${option.id}`}
							whileTap={isMobile ? { scale: 0.97 } : undefined}
							className={cn(
								"w-full text-left p-5 sm:p-6 border-4 border-black font-semibold text-base sm:text-xl leading-relaxed transition-[background-color,transform,shadow] flex items-start gap-4 group focus-within:ring-4 focus-within:ring-yellow-400 outline-none cursor-pointer",
								isMobile && "min-h-[56px]",
								isSelected
									? "bg-blue-400 translate-x-1 translate-y-1 shadow-none"
									: "bg-white dark:bg-zinc-900 SHADOW_LG hover:SHADOW_SM hover:translate-x-1 hover:translate-y-1",
							)}
						>
							<Checkbox
								id={`pgk-${currentQuestion.id}-${option.id}`}
								checked={isSelected}
								onCheckedChange={(checked) => {
									const next = checked
										? [...currentAnswers, option.id]
										: currentAnswers.filter((id) => id !== option.id);
									setAnswers((prev) => ({
										...prev,
										[currentQuestion.id]: next,
									}));
								}}
								className="mt-1.5 size-6 shrink-0 border-2 border-black data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-700"
							/>
							<div className="flex flex-1 items-center gap-4 min-w-0">
								<MathRenderer text={option.text} className="pt-1 flex-1" />
							</div>
							{option.imageUrl && (
								<div className="ml-auto flex-shrink-0">
									<div className="w-24 h-24 border-2 border-black overflow-hidden bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center">
										<Image
											src={option.imageUrl}
											alt={`Option ${String.fromCharCode(65 + idx)}`}
											width={96}
											height={96}
											className="object-contain"
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.src =
													"https://placehold.co/96x96?text=Image+Error";
											}}
										/>
									</div>
								</div>
							)}
						</motion.label>
					);
				})}
				<p className="text-xs font-bold uppercase text-zinc-500 italic mt-2">
					* Pilih satu atau lebih jawaban benar
				</p>
			</div>
		);
	};

	const renderBS = () => (
		<div className="grid grid-cols-2 gap-6">
			{[
				{ label: "BENAR", value: true, color: "bg-emerald-400", shortcut: "A" },
				{ label: "SALAH", value: false, color: "bg-rose-400", shortcut: "B" },
			].map((opt) => (
				<motion.button
					key={String(opt.value)}
					whileTap={isMobile ? { scale: 0.97 } : undefined}
					onClick={() =>
						setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt.value }))
					}
					className={cn(
						"h-32 sm:h-40 border-4 border-black font-bold text-2xl sm:text-4xl transition-[background-color,transform,shadow] SHADOW_XL flex flex-col items-center justify-center text-black focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none",
						answers[currentQuestion.id] === opt.value
							? `${opt.color} translate-x-1 translate-y-1 shadow-none`
							: "bg-white dark:bg-zinc-900 dark:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
					)}
				>
					{opt.label}
					{!isMobile && (
						<span className="text-[10px] font-black opacity-30 mt-2">
							[{opt.shortcut}]
						</span>
					)}
				</motion.button>
			))}
		</div>
	);

	const renderMengurutkan = () => {
		const optionIds = currentQuestion.options?.map((o) => o.id) || [];
		const items = (answers[currentQuestion.id] as string[]) || optionIds;

		const moveItem = (index: number, direction: "up" | "down") => {
			const newItems = [...items];
			const targetIndex = direction === "up" ? index - 1 : index + 1;
			if (targetIndex < 0 || targetIndex >= newItems.length) return;
			[newItems[index], newItems[targetIndex]] = [
				newItems[targetIndex],
				newItems[index],
			];
			setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newItems }));
		};

		const itemContent = (id: string, index: number) => {
			const option = currentQuestion.options?.find((o) => o.id === id);
			if (!option) return null;
			return (
				<>
					<div className="flex items-center gap-3">
						<Menu className="w-5 h-5 text-zinc-400" />
						<div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs flex-shrink-0">
							{index + 1}
						</div>
					</div>
					<div className="flex-1 min-w-0">
						<MathRenderer text={option.text} />
					</div>
				</>
			);
		};

		// Mobile: tombol panah saja, no drag (bentrok dengan scroll)
		if (isMobile) {
			return (
				<div className="space-y-4">
					<p className="text-sm font-bold uppercase text-zinc-500 italic mb-4">
						Gunakan tombol panah untuk mengurutkan sesuai petunjuk
					</p>
					<div className="space-y-3">
						{items.map((id, index) => {
							const option = currentQuestion.options?.find((o) => o.id === id);
							if (!option) return null;
							return (
								<div
									key={id}
									className="bg-white dark:bg-zinc-900 border-4 border-black p-4 sm:p-5 font-medium text-lg leading-relaxed flex items-center gap-4 SHADOW_MD"
								>
									{itemContent(id, index)}
									<div className="flex flex-col gap-1 flex-shrink-0">
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-9 w-9 border-2 border-black rounded-none"
											onClick={() => moveItem(index, "up")}
											disabled={index === 0}
											aria-label="Pindahkan ke atas"
										>
											<ArrowUp className="w-4 h-4" />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-9 w-9 border-2 border-black rounded-none"
											onClick={() => moveItem(index, "down")}
											disabled={index === items.length - 1}
											aria-label="Pindahkan ke bawah"
										>
											<ArrowDown className="w-4 h-4" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			);
		}

		// Desktop: drag & drop
		return (
			<div className="space-y-4">
				<p className="text-sm font-bold uppercase text-zinc-500 italic mb-4">
					Drag item untuk mengurutkan sesuai petunjuk
				</p>
				<Reorder.Group
					axis="y"
					values={items}
					onReorder={(newOrder) =>
						setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newOrder }))
					}
					className="space-y-3"
				>
					{items.map((id, index) => {
						const option = currentQuestion.options?.find((o) => o.id === id);
						if (!option) return null;
						return (
							<Reorder.Item
								key={id}
								value={id}
								className="bg-white dark:bg-zinc-900 border-4 border-black p-4 sm:p-5 font-medium text-lg leading-relaxed flex items-center gap-4 cursor-grab active:cursor-grabbing SHADOW_MD hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-[background-color,transform,shadow] focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none"
							>
								{itemContent(id, index)}
							</Reorder.Item>
						);
					})}
				</Reorder.Group>
			</div>
		);
	};

	const renderMenjodohkan = () => {
		const pairs = currentQuestion.pairs || [];
		if (pairs.length === 0) {
			return (
				<div className="p-6 border-4 border-black bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold uppercase text-center SHADOW_SM">
					Pasangan pertanyaan tidak ditemukan
				</div>
			);
		}
		const currentPairs =
			(answers[currentQuestion.id] as Record<string, string>) || {};
		const leftItems = pairs.map((p) => ({ id: p.id, text: p.left })) || [];
		const rightItems = shuffledRightItems;

		if (isMobile) {
			return (
				<div className="flex min-w-0 w-full max-w-full flex-col gap-8">
					<div className="rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-3 dark:bg-blue-900/20">
						<p className="text-center text-[10px] font-black uppercase tracking-tighter text-blue-600">
							{selectedLeft
								? "Gulir ke bawah, lalu pilih pasangan di kolom jawaban"
								: "Langkah 1: pilih item di kolom soal, lalu pasangkan di kolom jawaban"}
						</p>
					</div>

					<div className="min-w-0 space-y-3">
						<p className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
							Kolom soal (kiri)
						</p>
						{leftItems.map((item) => {
							const matchedRightText = currentPairs[item.id];
							const isSelected = selectedLeft === item.id;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => setSelectedLeft(isSelected ? null : item.id)}
									className={cn(
										"relative w-full min-w-0 max-w-full rounded-xl border-2 border-black p-4 text-left text-sm font-medium leading-relaxed transition-all [overflow-wrap:anywhere]",
										isSelected
											? "bg-yellow-400 shadow-none ring-2 ring-black/10"
											: matchedRightText
												? "border-green-600 bg-green-100 opacity-80"
												: "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-900",
									)}
								>
									<MathRenderer
										className="min-w-0 break-words"
										text={item.text}
									/>
									{matchedRightText && (
										<CheckCircle className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white text-green-600 ring-2 ring-white" />
									)}
								</button>
							);
						})}
					</div>

					<div className="min-w-0 space-y-3">
						<p className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
							Kolom jawaban (kanan)
						</p>
						{rightItems.map((item) => {
							const isMatched = Object.values(currentPairs).includes(item.text);
							return (
								<button
									key={item.id}
									type="button"
									disabled={!selectedLeft || isMatched}
									onClick={() => {
										if (selectedLeft) {
											setAnswers((prev) => ({
												...prev,
												[currentQuestion.id]: {
													...((prev[currentQuestion.id] as Record<
														string,
														string
													>) || {}),
													[selectedLeft]: item.text,
												},
											}));
											setSelectedLeft(null);
										}
									}}
									className={cn(
										"w-full min-w-0 max-w-full rounded-xl border-2 border-black p-4 text-left text-sm font-medium leading-relaxed transition-all [overflow-wrap:anywhere]",
										isMatched
											? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 opacity-50"
											: !selectedLeft
												? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300"
												: "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:bg-yellow-400 dark:bg-zinc-900",
									)}
								>
									<MathRenderer
										className="min-w-0 break-words"
										text={item.text}
									/>
								</button>
							);
						})}
					</div>

					<Button
						variant="ghost"
						size="sm"
						className="text-[10px] font-black uppercase text-rose-600"
						onClick={() => {
							setAnswers((prev) => ({ ...prev, [currentQuestion.id]: {} }));
							setSelectedLeft(null);
						}}
					>
						Reset Semua Pasangan
					</Button>
				</div>
			);
		}

		return (
			<div className="min-w-0 w-full space-y-8">
				<div className="relative grid min-w-0 grid-cols-1 items-start gap-8 md:grid-cols-2">
					{selectedLeft && (
						<div className="col-span-full flex justify-center px-1">
							<div className="bg-black px-6 py-2 text-center text-xs font-black uppercase tracking-tight text-white shadow-xl animate-bounce rounded-full">
								PILIH PASANGAN DI KOLOM KANAN
							</div>
						</div>
					)}
					<div className="min-w-0 space-y-4">
						<h4 className="font-black text-center text-zinc-400 dark:text-zinc-200 text-xs uppercase tracking-widest mb-6 tracking-tighter">
							Pilih Pertanyaan
						</h4>
						{leftItems.map((item) => {
							const matchedRightText = currentPairs[item.id];
							return (
								<button
									key={item.id}
									onClick={() => setSelectedLeft(item.id)}
									className={cn(
										"group relative w-full min-w-0 max-w-full break-words border-4 border-black p-5 text-left text-sm font-medium leading-relaxed transition-[background-color,transform,shadow] outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 sm:text-base",
										selectedLeft === item.id
											? "bg-yellow-300 text-black translate-x-1 translate-y-1 shadow-none"
											: matchedRightText
												? "bg-green-100 dark:bg-green-900/30 border-green-600 shadow-none translate-x-0.5 translate-y-0.5"
												: "bg-white dark:bg-zinc-900 SHADOW_LG hover:translate-x-0.5 hover:translate-y-0.5 hover:SHADOW_SM",
									)}
								>
									<div className="flex min-w-0 flex-col gap-2">
										<MathRenderer className="min-w-0" text={item.text} />
										{matchedRightText && (
											<div className="pt-2 border-t border-green-200 dark:border-green-800 mt-2">
												<span className="text-[10px] font-black uppercase text-green-600 block mb-1">
													Terpasang dengan:
												</span>
												<div className="text-zinc-900 dark:text-zinc-100 font-medium">
													<MathRenderer
														className="min-w-0"
														text={matchedRightText}
													/>
												</div>
											</div>
										)}
									</div>
									{matchedRightText && (
										<div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 border-2 border-black rounded-full flex items-center justify-center SHADOW_SM">
											<CheckCircle
												className="w-4 h-4 text-white"
												aria-hidden="true"
											/>
										</div>
									)}
								</button>
							);
						})}
					</div>
					<div className="min-w-0 space-y-4">
						<h4 className="font-black text-center text-zinc-400 dark:text-zinc-200 text-xs uppercase tracking-widest mb-6 tracking-tighter">
							Pilih Jawaban
						</h4>
						{rightItems.map((item) => {
							const isMatched = Object.values(currentPairs).includes(item.text);
							return (
								<button
									key={item.id}
									disabled={!selectedLeft || isMatched}
									onClick={() => {
										if (selectedLeft) {
											setAnswers((prev) => {
												const currentQAnswers =
													(prev[currentQuestion.id] as Record<
														string,
														string
													>) || {};
												return {
													...prev,
													[currentQuestion.id]: {
														...currentQAnswers,
														[selectedLeft!]: item.text,
													},
												};
											});
											setSelectedLeft(null);
										}
									}}
									className={cn(
										"w-full min-w-0 max-w-full break-words border-4 border-black p-5 text-left text-sm font-medium leading-relaxed transition-[background-color,transform,shadow] outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 sm:text-base",
										isMatched
											? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 opacity-50 cursor-not-allowed"
											: !selectedLeft
												? "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-300 cursor-not-allowed"
												: "bg-white dark:bg-zinc-900 SHADOW_LG hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:translate-x-0.5 hover:translate-y-0.5",
									)}
								>
									<MathRenderer className="min-w-0" text={item.text} />
								</button>
							);
						})}
					</div>
				</div>
				<div className="flex justify-center pt-8">
					<Button
						variant="ghost"
						size="sm"
						className="text-xs font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-2 border-transparent hover:border-rose-200 dark:hover:border-rose-800 px-6 py-4 rounded-xl focus-visible:ring-4 focus-visible:ring-yellow-400"
						onClick={() => {
							setAnswers((prev) => ({ ...prev, [currentQuestion.id]: {} }));
							setSelectedLeft(null);
						}}
					>
						Reset Semua Pasangan
					</Button>
				</div>
			</div>
		);
	};

	const renderMatrix = () => {
		const matrixAnswers =
			(answers[currentQuestion.id] as Record<string, string>) || {};
		const handleCellClick = (rowId: string, colId: string) => {
			setAnswers((prev) => {
				const currentQAnswers =
					(prev[currentQuestion.id] as Record<string, string>) || {};
				return {
					...prev,
					[currentQuestion.id]: { ...currentQAnswers, [rowId]: colId },
				};
			});
		};

		if (
			!currentQuestion.rows ||
			!currentQuestion.columns ||
			currentQuestion.rows.length === 0
		) {
			return (
				<div className="p-6 border-4 border-black bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold uppercase text-center SHADOW_SM">
					Data baris atau kolom matriks tidak ditemukan
				</div>
			);
		}

		if (isMobile) {
			const currentRow = currentQuestion.rows[currentMatrixRowIdx];
			return (
				<div className="space-y-6">
					<div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 border-2 border-black p-3">
						<span className="font-black text-[10px] uppercase tracking-widest">
							Pernyataan {currentMatrixRowIdx + 1} dari{" "}
							{currentQuestion.rows.length}
						</span>
						<div className="flex gap-1">
							{currentQuestion.rows.map((_, i) => (
								<div
									key={i}
									className={cn(
										"w-2 h-2 border border-black",
										i === currentMatrixRowIdx
											? "bg-yellow-400"
											: matrixAnswers[currentQuestion.rows![i].id]
												? "bg-green-400"
												: "bg-white dark:bg-zinc-700",
									)}
								/>
							))}
						</div>
					</div>
					<div className="bg-white dark:bg-zinc-900 border-4 border-black p-6 SHADOW_LG">
						<h4 className="font-black text-xs uppercase text-zinc-400 dark:text-zinc-200 mb-2 tracking-tighter">
							Pertanyaan/Pernyataan:
						</h4>
						<div className="text-lg font-medium leading-relaxed">
							<MathRenderer text={currentRow.text} />
						</div>
					</div>
					<div className="grid grid-cols-1 gap-3">
						{currentQuestion.columns.map((col, idx) => {
							const isSelected = matrixAnswers[currentRow.id] === col.id;
							return (
								<motion.button
									key={col.id}
									whileTap={{ scale: 0.97 }}
									onClick={() => handleCellClick(currentRow.id, col.id)}
									className={cn(
										"w-full p-5 min-h-[56px] border-4 border-black font-medium text-left leading-relaxed flex items-center justify-between transition-[background-color,transform,shadow] focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none",
										isSelected
											? "bg-yellow-400 translate-x-1 translate-y-1 shadow-none"
											: "bg-white dark:bg-zinc-900 SHADOW_MD",
									)}
								>
									<div className="flex items-center gap-2">
										<MathRenderer text={col.text} />
										{!isMobile && (
											<span className="text-[10px] font-black opacity-30 ml-2">
												[{idx + 1}]
											</span>
										)}
									</div>
									{isSelected && (
										<CheckCircle className="w-6 h-6" aria-hidden="true" />
									)}
								</motion.button>
							);
						})}
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							onClick={() => setCurrentMatrixRowIdx((p) => Math.max(0, p - 1))}
							disabled={currentMatrixRowIdx === 0}
							variant="outline"
							className="flex-1 h-14 border-4 border-black font-black uppercase text-xs rounded-none SHADOW_MD disabled:opacity-30 focus-visible:ring-4 focus-visible:ring-yellow-400"
						>
							<NavArrowLeft className="mr-2" aria-hidden="true" /> SEBELUMNYA
						</Button>
						<Button
							onClick={() =>
								setCurrentMatrixRowIdx((p) =>
									Math.min(currentQuestion.rows!.length - 1, p + 1),
								)
							}
							disabled={currentMatrixRowIdx === currentQuestion.rows.length - 1}
							className="flex-1 h-14 bg-black text-white dark:bg-white dark:text-black border-4 border-black font-black uppercase text-xs rounded-none SHADOW_MD disabled:opacity-30 focus-visible:ring-4 focus-visible:ring-yellow-400"
						>
							SELANJUTNYA <NavArrowRight className="ml-2" aria-hidden="true" />
						</Button>
					</div>
				</div>
			);
		}

		return (
			<div className="overflow-x-auto border-4 border-black SHADOW_XL bg-white dark:bg-zinc-950 p-4">
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="p-3 border-b-4 border-black bg-black text-white font-black text-sm uppercase tracking-widest text-left min-w-[200px]">
								Pernyataan
							</th>
							{currentQuestion.columns.map((col, idx) => (
								<th
									key={col.id}
									className="p-3 border-b-4 border-black bg-black text-white font-black text-sm uppercase tracking-widest text-center min-w-[100px]"
								>
									<MathRenderer text={col.text} />
									{!isMobile && (
										<div className="text-[10px] font-black opacity-30 mt-1">
											[{idx + 1}]
										</div>
									)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{currentQuestion.rows.map((row) => (
							<tr
								key={row.id}
								className="border-b-2 border-black last:border-b-0"
							>
								<td className="p-3 font-medium leading-relaxed text-left border-r-2 border-black bg-zinc-50 dark:bg-zinc-900">
									<MathRenderer text={row.text} />
								</td>
								{currentQuestion.columns!.map((col) => {
									const isSelected = matrixAnswers[row.id] === col.id;
									return (
										<td key={col.id} className="p-1 text-center">
											<button
												type="button"
												onClick={() => handleCellClick(row.id, col.id)}
												className={cn(
													"w-full py-4 px-2 border-2 border-black font-medium transition-[background-color,transform,shadow] flex items-center justify-center focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none",
													isSelected
														? "bg-yellow-400 text-black translate-x-0.5 translate-y-0.5 shadow-none"
														: "bg-white dark:bg-zinc-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5",
												)}
											>
												{isSelected ? (
													<CheckCircle className="w-6 h-6" aria-hidden="true" />
												) : (
													<div className="w-6 h-6" />
												)}
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	const renderEssay = () => (
		<div className="space-y-4">
			<textarea
				value={(answers[currentQuestion.id] as string) || ""}
				onChange={(e) =>
					setAnswers((prev) => ({
						...prev,
						[currentQuestion.id]: e.target.value,
					}))
				}
				placeholder="Tuliskan jawaban Anda di sini…"
				aria-label="Jawaban essay"
				className="w-full h-64 p-6 border-4 border-black bg-white dark:bg-zinc-900 text-foreground font-medium text-lg sm:text-xl leading-relaxed SHADOW_XL focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-[background-color,transform,shadow] outline-none resize-none focus-visible:ring-4 focus-visible:ring-yellow-400"
			/>
			<div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-200 text-xs font-bold uppercase tracking-widest italic">
				<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
				Auto-Saving...
			</div>
		</div>
	);

	const renderQuestionUI = () => {
		const type = currentQuestion.type?.toLowerCase();
		switch (type) {
			case "pg":
				return renderPG();
			case "pg_kompleks":
				return renderPGKompleks();
			case "bs":
				return renderBS();
			case "menjodohkan":
				return renderMenjodohkan();
			case "mengurutkan":
				return renderMengurutkan();
			case "matrix":
				return renderMatrix();
			case "short_answer":
				return (
					<div className="space-y-4">
						<textarea
							value={(answers[currentQuestion.id] as string) || ""}
							onChange={(e) =>
								setAnswers((prev) => ({
									...prev,
									[currentQuestion.id]: e.target.value,
								}))
							}
							placeholder="Tuliskan jawaban singkat Anda di sini…"
							aria-label="Jawaban isian singkat"
							className="w-full h-32 p-4 border-4 border-black bg-white dark:bg-zinc-900 text-foreground font-medium text-base sm:text-lg leading-relaxed SHADOW_XL focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-[background-color,transform,shadow] outline-none resize-none focus-visible:ring-4 focus-visible:ring-yellow-400"
						/>
						<div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-200 text-xs font-bold uppercase tracking-widest italic">
							<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
							Auto-Saving...
						</div>
					</div>
				);
			case "essay":
				return renderEssay();
			default:
				// Fallback for case-insensitive types or slight variations
				if (
					type === "pg" ||
					(currentQuestion.options && currentQuestion.options.length > 0)
				) {
					return renderPG();
				}
				if (currentQuestion.pairs && currentQuestion.pairs.length > 0) {
					return renderMenjodohkan();
				}
				if (currentQuestion.rows && currentQuestion.rows.length > 0) {
					return renderMatrix();
				}

				return (
					<div className="p-8 border-4 border-black bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-black uppercase text-center SHADOW_MD">
						<div className="space-y-2">
							<p>Tipe soal tidak dikenali atau data tidak lengkap</p>
							<p className="text-[10px] opacity-50">
								Tipe: {currentQuestion.type || "Undefined"} | ID:{" "}
								{currentQuestion.id}
							</p>
						</div>
					</div>
				);
		}
	};

	if (examResult)
		return (
			<ExamResult
				{...examResult}
				showScore={
					exam.settings?.showScoreImmediately || exam.status === "archived"
				}
			/>
		);

	// Force fullscreen only if supported by browser/device
	const isFullscreenRequired =
		exam.settings?.antiCheat?.forceFullscreen && supportsFullscreen;

	if (isLocked && !isFinished) {
		return (
			<div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="bg-red-500 border-4 border-black p-10 SHADOW_XL max-w-md w-full space-y-6"
				>
					<WarningTriangle className="w-20 h-20 text-white mx-auto mb-2" />
					<h1 className="text-4xl font-black text-white uppercase leading-tight">
						UJIAN DIKUNCI
					</h1>
					<p className="text-white font-bold uppercase tracking-tight">
						Terlalu banyak pelanggaran terdeteksi. Hubungi guru untuk membuka
						kembali ujianmu.
					</p>
					<Button
						className="w-full bg-white text-black border-4 border-black font-black text-xl py-4 rounded-none SHADOW_MD"
						disabled
					>
						Menunggu Guru...
					</Button>
				</motion.div>
			</div>
		);
	}

	if (isFullscreenRequired && !isFullscreen && !isFinished) {
		return (
			<div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="bg-red-500 border-4 border-black p-10 SHADOW_XL max-w-md w-full"
				>
					<WarningTriangle className="w-20 h-20 text-white mx-auto mb-4" />
					<h1 className="text-4xl font-black text-white uppercase mb-2 leading-none">
						LAYAR TERKUNCI
					</h1>
					<p className="text-white font-bold mb-8 uppercase tracking-tight">
						Sistem mendeteksi kamu keluar dari mode ujian.
					</p>
					<Button
						onClick={enterFullscreen}
						className="w-full bg-white text-black border-4 border-black hover:bg-black hover:text-white font-black text-xl py-8 SHADOW_MD hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-[background-color,transform,shadow] rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400"
					>
						MASUK KEMBALI
					</Button>
				</motion.div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"fixed inset-0 z-[100] h-[100dvh] bg-neutral-100 dark:bg-zinc-900 flex flex-col font-sans overflow-hidden text-foreground selection:bg-yellow-200 selection:text-black",
				(exam.settings?.antiCheat?.preventCopyPaste ||
					exam.settings?.antiCheat?.preventScreenRecord) &&
					"select-none",
			)}
		>
			{exam.settings?.antiCheat?.preventScreenRecord && (
				<VideoOverlay isMobile={isMobile} />
			)}

			{/* Blackout/Blur Overlay for Screenshot Protection */}
			<AnimatePresence>
				{blackout && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-3xl flex items-center justify-center text-center p-10"
					>
						<div className="space-y-4">
							<WarningTriangle className="w-20 h-20 text-yellow-400 mx-auto animate-pulse" />
							<h2 className="text-3xl font-black text-white uppercase italic">
								Konten Dilindungi
							</h2>
							<p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">
								Tangkapan layar dan perekaman layar dilarang selama ujian.
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{!isOnline && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="bg-rose-500 text-white border-b-4 border-black px-4 py-2 flex items-center justify-center gap-2 overflow-hidden z-[60]"
					>
						<WarningTriangle
							className="w-5 h-5 flex-shrink-0"
							aria-hidden="true"
						/>
						<span className="font-black uppercase text-[10px] sm:text-xs tracking-widest text-center">
							Koneksi Terputus! Jawaban disimpan secara lokal.
						</span>
					</motion.div>
				)}
			</AnimatePresence>

			<header className="bg-white dark:bg-zinc-950 border-b-4 border-black px-4 sm:px-6 py-2 sm:py-0 sm:h-20 z-50 transition-all">
				<div className="flex items-center gap-3 sm:gap-4 min-w-0">
					<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
						<div className="bg-yellow-400 border-2 border-black p-1.5 sm:p-2 SHADOW_SM flex-shrink-0">
							<Flash
								className="w-5 h-5 sm:w-6 sm:h-6 text-black"
								aria-hidden="true"
							/>
						</div>
						<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
							<h1 className="min-w-0 text-sm sm:text-xl font-black uppercase leading-tight line-clamp-2 break-words">
								{exam.title}
							</h1>
							<div className="flex items-center gap-1.5">
								<motion.div
									animate={
										isSaving
											? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
											: {}
									}
									transition={{ duration: 0.5, repeat: isSaving ? Infinity : 0 }}
									className={cn(
										"w-2 h-2 rounded-full border border-black",
										isSaving
											? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
											: "bg-green-600/30",
									)}
								/>
								<span
									className={cn(
										"font-black uppercase text-[8px] sm:text-[10px] tracking-tighter transition-opacity duration-300",
										isSaving ? "opacity-100 text-green-600" : "opacity-0",
									)}
								>
									<span className="hidden sm:inline">Saved</span>
								</span>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 sm:gap-4 pb-1 sm:pb-0 flex-shrink-0">
					<div
						aria-live="polite"
						aria-atomic="true"
						className="shrink-0 flex items-center gap-1.5 sm:gap-2 border-2 sm:border-4 border-black px-2 sm:px-3 py-1 sm:py-2 font-black text-xs sm:text-base SHADOW_SM sm:SHADOW_MD bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
						role="status"
					>
						<span className="sr-only">Jawaban: </span>
						<span className="tabular-nums">{answeredCount}</span>
						<span
							className="text-zinc-400 dark:text-zinc-500 font-normal"
							aria-hidden="true"
						>
							/
						</span>
						<span className="tabular-nums">{totalQuestions}</span>
						<span className="sr-only"> dari {totalQuestions} soal</span>
					</div>
					<div
						className={cn(
							"shrink-0 flex items-center gap-1.5 sm:gap-2 border-2 sm:border-4 border-black px-2 sm:px-4 py-1 sm:py-2 font-black text-base sm:text-xl SHADOW_SM sm:SHADOW_MD bg-white dark:bg-zinc-900",
							timeLeft < 300
								? "text-red-500 bg-red-50 dark:bg-red-950/30"
								: "text-black dark:text-white",
						)}
					>
						<Timer className="w-4 h-4 sm:w-6 sm:h-6" aria-hidden="true" />
						<span>{formatTime(timeLeft)}</span>
					</div>
					{(exam.settings?.antiCheat?.enabled ||
						exam.settings?.antiCheat?.forceFullscreen ||
						exam.settings?.antiCheat?.preventScreenshot ||
						exam.settings?.antiCheat?.preventSplitScreen) && (
						<div className="shrink-0 flex items-center gap-1.5 sm:gap-2 border-2 sm:border-4 border-black px-2 sm:px-4 py-1 sm:py-2 font-black text-base sm:text-xl bg-white dark:bg-zinc-900 SHADOW_SM sm:SHADOW_MD text-orange-600">
							<WarningTriangle
								className="w-4 h-4 sm:hidden"
								aria-hidden="true"
							/>
							<span>
								{violations}/{maxViolations}
							</span>
						</div>
					)}
					</div>
				</div>
			</header>

			<main
				className={cn(
					"flex-1 flex min-w-0 overflow-hidden relative",
					currentPassage && "lg:grid lg:grid-cols-2",
				)}
			>
				{currentPassage && (
					<div className="hidden lg:flex flex-col flex-1 min-w-0 overflow-hidden border-r-4 border-black bg-zinc-50/50 dark:bg-zinc-900/20 relative">
						<div className="absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 z-20">
							<motion.div
								className="h-full bg-yellow-400"
								initial={{ width: "0%" }}
								animate={{ width: "100%" }}
								transition={{ duration: 0.5 }}
							/>
						</div>
						<div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar">
							<div className="max-w-2xl mx-auto space-y-8">
								<header className="space-y-4">
									<Badge className="bg-black text-white dark:bg-white dark:text-black rounded-none font-black text-[10px] px-3 py-1">
										MATERI LITERASI
									</Badge>
									<h3 className="text-3xl sm:text-4xl font-black uppercase leading-tight tracking-tighter">
										<MathRenderer text={currentPassage.title} />
									</h3>
									<div className="h-2 w-20 bg-yellow-400" />
								</header>
								{currentPassage.imageUrl?.trim() && (
									<div className="border-4 border-black overflow-hidden bg-neutral-100 dark:bg-zinc-900 relative min-h-[200px] w-full flex items-center justify-center my-8">
										<img
											src={currentPassage.imageUrl.trim()}
											alt=""
											className="w-full max-h-[min(50dvh,480px)] object-contain"
										/>
									</div>
								)}
								<article className="prose dark:prose-invert max-w-none">
									<MathRenderer
										text={currentPassage.content}
										className="text-lg sm:text-xl leading-relaxed font-medium text-zinc-800 dark:text-zinc-200"
									/>
								</article>
								<div className="pt-10 pb-20">
									<div className="p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center text-center gap-2">
										<Page
											className="w-8 h-8 text-zinc-300"
											aria-hidden="true"
										/>
										<p className="text-xs font-bold text-zinc-400 dark:text-zinc-200 uppercase tracking-widest">
											Akhir dari bacaan. Silakan jawab soal di kolom kanan.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				<div
					ref={questionViewportRef}
					className={cn(
						"flex-1 min-w-0 overflow-auto p-4 flex flex-col items-center transition-colors duration-300",
						!isMobile &&
							"sm:p-0 bg-neutral-100 dark:bg-zinc-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px]",
						isMobile && "bg-white dark:bg-zinc-950",
						currentPassage && "lg:shadow-[-20px_0px_40px_rgba(0,0,0,0.05)]",
					)}
				>
					<div
						className={cn(
							"w-full min-w-0 flex-1 flex flex-col items-center",
							!isMobile && "py-12 px-6 sm:px-12",
						)}
					>
						<div
							className={cn(
								"w-full min-w-0 max-w-4xl",
								!isMobile &&
									"bg-white dark:bg-zinc-950 border-4 border-black SHADOW_2XL p-8 sm:p-12 min-h-[70dvh] flex flex-col relative",
							)}
						>
							<div className="absolute top-0 left-0 w-full h-2 bg-gray-200 dark:bg-gray-700 z-10">
								<motion.div
									className="h-full bg-green-500"
									initial={{ width: "0%" }}
									animate={{ width: `${progressPercentage}%` }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
								/>
							</div>
							<AnimatePresence mode="popLayout">
								<motion.div
									key={currentQuestion.id}
									initial={{ x: direction > 0 ? 100 : -100, opacity: 0 }}
									animate={{ x: 0, opacity: 1 }}
									exit={{ x: direction > 0 ? -100 : 100, opacity: 0 }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
									className="w-full min-w-0 space-y-6 sm:space-y-8 pb-24"
								>
									<div className="bg-white dark:bg-zinc-950 border-4 border-black p-5 sm:p-10 SHADOW_XL relative">
										<div className="absolute -top-5 -left-3 bg-black text-white px-5 py-1.5 font-black text-xl skew-x-[-10deg]">
											#{currentQuestionIdx + 1}
										</div>
										{/* Mobile: wacana tidak ada di footer; tampilkan CTA di alur baca soal */}
										{isMobile && currentPassage && (
											<button
												type="button"
												onClick={() => setShowMobilePassage(true)}
												className="relative z-10 mt-9 w-full flex items-center gap-3 px-4 py-3.5 border-4 border-black bg-yellow-400 text-black font-black text-left uppercase tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 rounded-none"
												aria-label="Buka bacaan wacana untuk soal ini"
											>
												<Page
													className="w-7 h-7 shrink-0"
													aria-hidden="true"
												/>
												<span className="flex-1 min-w-0">
													<span className="block text-sm leading-tight">
														Buka bacaan wacana
													</span>
													<span className="block text-[10px] font-bold normal-case opacity-85 mt-1 leading-snug">
														Baca teks pendukung dulu. Pintasan: tombol spasi.
													</span>
												</span>
												<NavArrowRight
													className="w-5 h-5 shrink-0 opacity-60"
													aria-hidden="true"
												/>
											</button>
										)}
										{/* Desktop: tombol di pojok. Mobile: pindah ke bawah soal agar tidak menghalangi */}
										{!isMobile && (
											<motion.button
												type="button"
												onClick={() => toggleMarked(currentQuestion.id)}
												aria-pressed={markedQuestions.has(currentQuestion.id)}
												aria-label={
													markedQuestions.has(currentQuestion.id)
														? "Hapus tanda ragu-ragu"
														: "Tandai ragu-ragu"
												}
												className={cn(
													"absolute top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-black font-bold text-xs uppercase tracking-wider transition-all focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none",
													markedQuestions.has(currentQuestion.id)
														? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
														: "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400",
												)}
											>
												<Bookmark
													className={cn(
														"w-4 h-4",
														markedQuestions.has(currentQuestion.id) &&
															"fill-current",
													)}
													aria-hidden="true"
												/>
												<span>
													{markedQuestions.has(currentQuestion.id)
														? "Ditandai"
														: "Ragu-Ragu"}
												</span>
												<span className="text-[9px] font-black opacity-40 ml-1">
													[M]
												</span>
											</motion.button>
										)}
										<div
											className={cn(
												"text-lg sm:text-2xl font-semibold leading-relaxed pt-4",
												!isMobile && "pr-24",
											)}
										>
											<MathRenderer text={currentQuestion.text} />
										</div>
										{currentQuestion.imageUrl && (
											<div className="mt-6 border-4 border-black overflow-hidden bg-neutral-100 dark:bg-zinc-900 relative min-h-[200px] w-full flex items-center justify-center">
												<img
													src={currentQuestion.imageUrl}
													alt="Question"
													className="absolute inset-0 w-full h-full object-contain"
													onError={(e) => {
														(e.target as HTMLImageElement).src =
															"/images/image-error.svg";
													}}
												/>
											</div>
										)}
										{/* Mobile: icon saja di bawah soal, tidak menghalangi fokus */}
										{isMobile && (
											<div className="mt-4 pt-3 flex justify-end">
												<motion.button
													type="button"
													onClick={() => toggleMarked(currentQuestion.id)}
													aria-pressed={markedQuestions.has(currentQuestion.id)}
													aria-label={
														markedQuestions.has(currentQuestion.id)
															? "Hapus tanda ragu-ragu"
															: "Tandai ragu-ragu"
													}
													className={cn(
														"p-2.5 rounded-full border-2 transition-all focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none",
														markedQuestions.has(currentQuestion.id)
															? "bg-amber-100 dark:bg-amber-950/50 border-amber-400 text-amber-700"
															: "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-amber-300 hover:text-amber-600",
													)}
												>
													<Bookmark
														className={cn(
															"w-5 h-5",
															markedQuestions.has(currentQuestion.id) &&
																"fill-current",
														)}
														aria-hidden="true"
													/>
												</motion.button>
											</div>
										)}
									</div>
									{renderQuestionUI()}
								</motion.div>
							</AnimatePresence>
						</div>
					</div>
				</div>

			</main>

			{isMobile && (
				<div
					ref={mobileQuestionBarRef}
					className="bg-white dark:bg-zinc-950 border-t-2 border-black overflow-x-auto flex gap-2 px-4 py-2 z-40 scrollbar-hide no-scrollbar shadow-inner h-12 flex-shrink-0"
				>
					{exam.questions.map((q, idx) => {
						const val = answers[q.id];
						const isAnswered =
							val !== undefined &&
							val !== null &&
							val !== "" &&
							(Array.isArray(val)
								? val.length > 0
								: typeof val === "object"
									? Object.keys(val).length > 0
									: true);
						const isCurrent = currentQuestionIdx === idx;
						const isMarked = markedQuestions.has(q.id);
						return (
							<button
								key={q.id}
								onClick={() => handleNavigateQuestion(idx)}
								className={cn(
									"min-w-[36px] h-8 border-2 border-black font-black text-[10px] flex items-center justify-center transition-[background-color,transform,shadow] flex-shrink-0 focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none relative",
									isCurrent
										? "bg-yellow-400 translate-y-[-2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
										: isMarked
											? "bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
											: isAnswered
												? "bg-green-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
												: "bg-white dark:bg-zinc-900",
								)}
							>
								{idx + 1}
								{isMarked && (
									<span
										className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-600 rounded-full border border-black"
										aria-hidden="true"
									/>
								)}
							</button>
						);
					})}
				</div>
			)}

			<AnimatePresence>
				{showMobilePassage && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setShowMobilePassage(false)}
							className="fixed inset-0 bg-black/60 z-[105] backdrop-blur-sm"
						/>
						<motion.div
							initial={{ y: "100%" }}
							animate={{ y: 0 }}
							exit={{ y: "100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							className="fixed inset-x-0 bottom-0 h-[85dvh] p-6 border-t-4 border-black bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-[0px_-8px_0px_0px_rgba(0,0,0,1)] rounded-t-[32px] z-[110] flex flex-col"
						>
							<div className="flex justify-between items-start mb-4 shrink-0">
								<div className="flex flex-col gap-1.5">
									<Badge className="bg-yellow-400 text-black border-2 border-black rounded-none font-black text-[10px] px-3 py-1 SHADOW_SM w-max">
										MATERI LITERASI
									</Badge>
									<h2 className="text-2xl sm:text-3xl font-black uppercase text-black dark:text-white leading-tight tracking-tighter mt-4">
										<MathRenderer text={currentPassage?.title || "Wacana"} />
									</h2>
									<div className="h-1.5 w-16 bg-yellow-400 mt-2" />
									<span className="sr-only">
										Baca wacana terkait pertanyaan ini.
									</span>
								</div>
								<Button
									onClick={() => setShowMobilePassage(false)}
									className="h-10 w-10 p-0 rounded-full bg-zinc-100 dark:bg-zinc-900 border-2 border-black hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0"
									aria-label="Tutup Wacana"
								>
									<svg
										className="w-5 h-5 font-black text-black dark:text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={3}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</Button>
							</div>
							<div
								ref={mobilePassageContentRef}
								onScroll={handlePassageScroll}
								className="overflow-y-auto flex-1 pr-2 custom-scrollbar pb-20"
							>
								{currentPassage?.imageUrl?.trim() && (
									<div className="border-4 border-black overflow-hidden bg-neutral-100 dark:bg-zinc-900 mb-6 flex justify-center">
										<img
											src={currentPassage.imageUrl.trim()}
											alt=""
											className="w-full max-h-[40dvh] object-contain"
										/>
									</div>
								)}
								<article className="prose dark:prose-invert max-w-none">
									<MathRenderer
										text={currentPassage?.content || ""}
										className="text-lg leading-relaxed font-medium text-zinc-800 dark:text-zinc-200"
									/>
								</article>
								<div className="mt-12 p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center text-center gap-2">
									<Page className="w-8 h-8 text-zinc-300" aria-hidden="true" />
									<p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
										Akhir dari bacaan. Silakan tutup untuk menjawab.
									</p>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			<footer className="h-20 sm:h-24 bg-white dark:bg-zinc-950 border-t-4 border-black flex items-center justify-between px-4 sm:px-6 z-50 transition-all">
				<div className="flex gap-2 sm:gap-4">
					<Button
						onClick={() => handleNavigateQuestion(currentQuestionIdx - 1)}
						disabled={currentQuestionIdx === 0}
						className="h-12 sm:h-14 bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black SHADOW_MD font-black hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-50 rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400"
					>
						<NavArrowLeft className="mr-1 sm:mr-2" aria-hidden="true" />{" "}
						<span className="text-[10px] sm:text-base">PREV</span>{" "}
						{!isMobile && (
							<span className="text-[10px] font-black opacity-30 ml-2">
								[←]
							</span>
						)}
					</Button>
					<Button
						onClick={() => {
							if (currentQuestionIdx === (exam.questions || []).length - 1) {
								if (canSubmit) setShowConfirmSubmit(true);
							} else {
								handleNavigateQuestion(currentQuestionIdx + 1);
							}
						}}
						disabled={
							currentQuestionIdx === (exam.questions || []).length - 1 &&
							!canSubmit
						}
						className={cn(
							"h-12 sm:h-14 border-4 border-black SHADOW_MD font-black rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400 transition-[background-color,transform,shadow]",
							currentQuestionIdx === (exam.questions || []).length - 1
								? canSubmit
									? "bg-green-500 text-white hover:bg-green-600 px-6 sm:px-10"
									: "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-6 sm:px-10 cursor-not-allowed"
								: "bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800",
						)}
					>
						<span className="text-[10px] sm:text-base flex items-center gap-2">
							{currentQuestionIdx === (exam.questions || []).length - 1
								? canSubmit
									? "SELESAI"
									: "Terkunci oleh Guru"
								: "NEXT"}
							{currentQuestionIdx === (exam.questions || []).length - 1 &&
								!canSubmit && <Lock className="w-4 h-4" />}
						</span>
						{!isMobile && (
							<span className="text-[10px] font-black opacity-30 ml-2">
								{currentQuestionIdx === (exam.questions || []).length - 1
									? "[FINISH]"
									: "[→/ENTER]"}
							</span>
						)}
						{currentQuestionIdx === (exam.questions || []).length - 1 ? (
							<CheckCircle className="sm:ml-2 w-5 h-5" aria-hidden="true" />
						) : (
							<NavArrowRight className="sm:ml-2" aria-hidden="true" />
						)}
					</Button>
				</div>
				<div className="flex gap-2 sm:gap-4">
					{currentPassage && !isMobile && (
						<Button
							onClick={() => setShowMobilePassage(!showMobilePassage)}
							className="h-12 sm:h-14 bg-yellow-400 text-black border-4 border-black SHADOW_MD font-black hover:bg-yellow-500 rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400"
							aria-label="Toggle Wacana"
						>
							<Page className="sm:mr-2" aria-hidden="true" />{" "}
							<span className="hidden sm:inline">WACANA</span>{" "}
							<span className="text-[10px] font-black opacity-30 ml-2">
								[SPACE]
							</span>
						</Button>
					)}
					{/* PETA button removed on mobile to favor the horizontal number bar */}
					<Button
						onClick={() => setShowConfirmSubmit(true)}
						disabled={!canSubmit}
						className={cn(
							"h-12 sm:h-14 border-4 border-black SHADOW_MD font-black rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400 hidden sm:flex",
							canSubmit
								? "bg-green-500 text-white hover:bg-green-600"
								: "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed",
						)}
					>
						{canSubmit ? (
							<LogOut className="sm:mr-2" aria-hidden="true" />
						) : (
							<Lock className="sm:mr-2" aria-hidden="true" />
						)}
						<span className="hidden sm:inline">
							{canSubmit ? "SELESAI" : "Terkunci"}
						</span>
					</Button>
				</div>
			</footer>

			<AnimatePresence>
				{showQuestionMap && (
					<motion.div
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						className="fixed inset-x-0 bottom-24 bg-white dark:bg-zinc-950 border-t-4 border-black p-6 sm:p-8 z-40 shadow-[0px_-10px_30px_rgba(0,0,0,0.15)]"
					>
						<div className="max-w-4xl mx-auto">
							<div className="flex justify-between items-center mb-6">
								<h3 className="text-2xl font-black uppercase italic tracking-tighter">
									PETA JAWABAN
								</h3>
								<Button
									onClick={() => setShowQuestionMap(false)}
									variant="ghost"
									className="font-bold rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400"
								>
									TUTUP
								</Button>
							</div>
							<div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
								{exam.questions.map((q, idx) => {
									const isMarked = markedQuestions.has(q.id);
									const isAnswered =
										answers[q.id] !== undefined &&
										answers[q.id] !== null &&
										answers[q.id] !== "" &&
										(Array.isArray(answers[q.id])
											? (answers[q.id] as unknown[]).length > 0
											: typeof answers[q.id] === "object"
												? Object.keys(answers[q.id] as object).length > 0
												: true);
									return (
										<button
											key={q.id}
											onClick={() => {
												setCurrentQuestionIdx(idx);
												setShowQuestionMap(false);
											}}
											className={cn(
												"h-12 border-4 border-black font-black transition-[background-color,transform,shadow] flex items-center justify-center focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none relative",
												currentQuestionIdx === idx
													? "bg-yellow-400 -translate-y-1"
													: "hover:bg-neutral-100 dark:hover:bg-zinc-800",
												isMarked
													? "bg-amber-400"
													: isAnswered
														? currentQuestionIdx === idx
															? "bg-yellow-400"
															: "bg-green-400"
														: "bg-white dark:bg-zinc-900",
											)}
										>
											{idx + 1}
											{isMarked && (
												<Bookmark
													className="absolute -top-1 -right-1 w-3 h-3 fill-current text-amber-700"
													aria-hidden="true"
												/>
											)}
										</button>
									);
								})}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showConfirmSubmit && (
					<div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
						<motion.div
							initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
							animate={{ scale: 1, opacity: 1, rotate: 0 }}
							className="bg-white dark:bg-zinc-950 border-4 border-black p-8 SHADOW_3XL max-w-md w-full"
						>
							<h3 className="text-4xl font-black uppercase mb-4 leading-none tracking-tighter italic text-black dark:text-white">
								Yakin Selesai?
							</h3>
							<p className="font-bold mb-4 text-neutral-600 dark:text-neutral-400 uppercase tracking-tight leading-snug">
								{Object.keys(answers).length} dari{" "}
								{(exam.questions || []).length} soal sudah terisi. Kamu tidak
								bisa kembali setelah menekan tombol selesai.
							</p>
							{markedQuestions.size > 0 && (
								<div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600">
									<WarningTriangle
										className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
										aria-hidden="true"
									/>
									<div>
										<p className="font-black text-amber-800 dark:text-amber-200 uppercase text-sm tracking-tight">
											Ada {markedQuestions.size} soal ditandai ragu-ragu
										</p>
										<p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
											Periksa kembali sebelum mengirim jika ingin memastikan
											jawaban.
										</p>
									</div>
								</div>
							)}
							<div className="flex flex-col gap-3">
								<Button
									onClick={() => handleAutoSubmit()}
									disabled={isSubmitting}
									className="w-full bg-green-500 text-white border-4 border-black h-16 font-black text-2xl SHADOW_LG hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-[background-color,transform,shadow] rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400"
								>
									{isSubmitting ? "MENGIRIM..." : "YA, SELESAI!"}
								</Button>
								{markedQuestions.size > 0 && (
									<Button
										onClick={() => {
											setShowConfirmSubmit(false);
											const firstMarkedIdx = exam.questions.findIndex((q) =>
												markedQuestions.has(q.id),
											);
											if (firstMarkedIdx >= 0)
												handleNavigateQuestion(firstMarkedIdx);
											if (isMobile) setShowQuestionMap(true);
											else setShowFloatingGrid(true);
										}}
										disabled={isSubmitting}
										className="w-full bg-amber-400 text-black border-4 border-black h-14 font-black text-lg SHADOW_MD hover:bg-amber-500 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400"
									>
										<Bookmark className="w-5 h-5 mr-2" aria-hidden="true" /> CEK
										SOAL RAGU-RAGU
									</Button>
								)}
								<Button
									onClick={() => setShowConfirmSubmit(false)}
									disabled={isSubmitting}
									className="w-full bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black h-14 font-black text-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-none focus-visible:ring-4 focus-visible:ring-yellow-400"
								>
									BELUM, KEMBALI
								</Button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{!isMobile && (
				<>
					<AnimatePresence>
						{showFloatingGrid && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setShowFloatingGrid(false)}
								className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[70]"
							/>
						)}
					</AnimatePresence>
					<div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-4">
						<AnimatePresence>
							{showFloatingGrid && (
								<motion.div
									initial={{
										scale: 0.8,
										opacity: 0,
										y: 20,
										x: 20,
										originX: "100%",
										originY: "100%",
									}}
									animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
									exit={{ scale: 0.8, opacity: 0, y: 20, x: 20 }}
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
									className="bg-white dark:bg-zinc-950 border-[4px] border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] w-[360px] mb-4"
								>
									<div className="flex justify-between items-center mb-6">
										<h3 className="font-black uppercase italic tracking-tighter text-2xl">
											PETA SOAL
										</h3>
										<div className="bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-[10px] font-black uppercase border-2 border-black">
											{answeredCount} / {totalQuestions}
										</div>
									</div>
									<div className="grid grid-cols-6 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar p-1">
										{exam.questions.map((q, idx) => {
											const isMarked = markedQuestions.has(q.id);
											return (
												<motion.button
													key={q.id}
													whileHover={{ scale: 1.1, zIndex: 10 }}
													whileTap={{ scale: 0.9 }}
													onClick={() => {
														handleNavigateQuestion(idx);
														setShowFloatingGrid(false);
													}}
													className={cn(
														"aspect-square border-[3px] border-black font-black text-xs flex items-center justify-center transition-all focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none relative",
														currentQuestionIdx === idx
															? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-1"
															: isMarked
																? "bg-amber-400"
																: isQuestionAnswered(q.id)
																	? "bg-green-400"
																	: "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800",
													)}
												>
													{idx + 1}
													{isMarked && (
														<Bookmark
															className="absolute top-0.5 right-0.5 w-2.5 h-2.5 fill-current text-amber-700"
															aria-hidden="true"
														/>
													)}
												</motion.button>
											);
										})}
									</div>
									<div className="mt-6 flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">
										<div className="flex items-center gap-1">
											<div className="w-3 h-3 bg-yellow-400 border-2 border-black" />
											<span>Aktif</span>
										</div>
										<div className="flex items-center gap-1">
											<div className="w-3 h-3 bg-green-400 border-2 border-black" />
											<span>Terisi</span>
										</div>
										<div className="flex items-center gap-1">
											<div className="w-3 h-3 bg-amber-400 border-2 border-black" />
											<span>Ragu</span>
										</div>
										<div className="flex items-center gap-1">
											<div className="w-3 h-3 bg-white dark:bg-zinc-900 border-2 border-black" />
											<span>Kosong</span>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
						<motion.button
							whileHover={{ scale: 1.05, y: -4 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setShowFloatingGrid(!showFloatingGrid)}
							className={cn(
								"flex items-center gap-4 bg-white dark:bg-zinc-950 border-[4px] border-black px-6 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] font-black uppercase text-sm group transition-all focus-visible:ring-4 focus-visible:ring-yellow-400 outline-none",
								showFloatingGrid &&
									"bg-yellow-400 shadow-none translate-y-1 translate-x-1",
							)}
							aria-label="Toggle Peta Soal"
						>
							<div className="flex flex-col items-start leading-none">
								<span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
									Status Ujian
								</span>
								<span className="text-base tracking-tighter">
									{answeredCount} / {totalQuestions} Terjawab
								</span>
							</div>
							<ViewGrid
								className={cn(
									"w-7 h-7 transition-transform duration-500",
									showFloatingGrid && "rotate-180",
								)}
								aria-hidden="true"
							/>
						</motion.button>
					</div>
				</>
			)}
		</div>
	);
}
