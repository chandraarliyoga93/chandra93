"use client";

import { useEffect, useState } from "react";
import {
	getStudentExamsSupabase,
	getMyExamAttemptsSupabase,
} from "@/actions/exam-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Database, CheckCircle, Lock, Calendar } from "iconoir-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../auth/AuthProvider";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ExamHistoryProps {
	classId: string;
}

type ClassExamHistoryItem = {
	id: string;
	type: string;
	title: string;
	status: string;
	rewards: { xp: number };
	settings?: { showScoreImmediately?: boolean };
};

type ExamAttemptHistory = {
	examId: string;
	submittedAt?: string;
	score: number;
};

export function StudentExamHistory({ classId }: ExamHistoryProps) {
	const { user } = useAuth();
	const [exams, setExams] = useState<ClassExamHistoryItem[]>([]);
	const [attempts, setAttempts] = useState<Record<string, ExamAttemptHistory>>(
		{},
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!user) return;

		const fetchData = async () => {
			const [examsRes, attemptsRes] = await Promise.all([
				getStudentExamsSupabase(classId),
				getMyExamAttemptsSupabase(),
			]);

			if (examsRes.success && attemptsRes.success) {
				const examsData =
					(examsRes.data as ClassExamHistoryItem[] | undefined) || [];
				const attemptsData =
					(attemptsRes.data as ExamAttemptHistory[] | undefined) || [];

				const attemptMap: Record<string, ExamAttemptHistory> = {};
				const completedExams: ClassExamHistoryItem[] = [];

				attemptsData.forEach((att) => {
					const examInfo = examsData.find((e) => e.id === att.examId);
					if (examInfo) {
						attemptMap[att.examId] = att;
						completedExams.push(examInfo);
					}
				});

				setExams(completedExams);
				setAttempts(attemptMap);
			}
			setIsLoading(false);
		};

		fetchData();
	}, [classId, user]);

	if (isLoading) {
		return (
			<div className="grid gap-4">
				{[1, 2].map((i) => (
					<Skeleton key={i} className="h-32 w-full rounded-3xl" />
				))}
			</div>
		);
	}

	if (exams.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
				<div className="bg-card border-4 border-neo-border p-6 rounded-3xl mb-6 shadow-[4px_4px_0px_0px_var(--neo-border)]">
					<Database className="w-12 h-12 text-muted-foreground" />
				</div>
				<h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">
					Belum Ada Riwayat
				</h3>
				<p className="text-muted-foreground max-w-xs mx-auto mt-2 font-bold text-sm">
					Selesaikan ujianmu untuk melihat hasilnya di sini!
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-6">
			{exams.map((exam) => {
				const attempt = attempts[exam.id];
				const showScore =
					exam.settings?.showScoreImmediately || exam.status === "archived";

				return (
					<Card
						key={exam.id}
						className="group overflow-hidden border-4 border-neo-border bg-card text-card-foreground shadow-[var(--neo-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all rounded-[2rem]"
					>
						<CardContent className="p-6 sm:p-8">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
								<div className="space-y-3 flex-1">
									<div className="flex items-center gap-2">
										<Badge className="bg-muted text-foreground border-2 border-neo-border font-black uppercase text-[10px]">
											{exam.type}
										</Badge>
										<div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
											<Calendar className="w-3 h-3" />
											{attempt?.submittedAt
												? format(
														new Date(attempt.submittedAt),
														"dd MMMM yyyy",
														{ locale: idLocale },
													)
												: "-"}
										</div>
									</div>

									<h3 className="text-xl font-black uppercase italic tracking-tight leading-none text-foreground group-hover:text-neo-primary transition-colors">
										{exam.title}
									</h3>

									<div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
										<div className="flex items-center gap-1">
											<Trophy className="w-3 h-3 text-orange-500" />
											{exam.rewards.xp} XP Didapat
										</div>
									</div>
								</div>

								<div className="w-full sm:w-auto">
									{showScore ? (
										<div
											className={cn(
												"flex items-center justify-between sm:justify-center sm:flex-col gap-2 rounded-2xl border-4 border-neo-border p-4 shadow-[4px_4px_0px_0px_var(--neo-border)] min-w-[120px]",
												attempt.score >= 75
													? "bg-emerald-400"
													: attempt.score >= 50
														? "bg-yellow-400"
														: "bg-rose-400",
											)}
										>
											<div className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest text-black/60 dark:text-zinc-900">
												<CheckCircle className="w-4 h-4 text-black/60 dark:text-zinc-900" />
												SKOR
											</div>
											<span className="font-black text-3xl tabular-nums leading-none">
												{attempt.score}
											</span>
										</div>
									) : (
										<div className="flex min-w-[120px] items-center justify-center rounded-2xl border-4 border-neo-border bg-muted p-4 shadow-[4px_4px_0px_0px_var(--neo-border)]">
											<div className="flex flex-col items-center gap-1">
												<Lock className="h-5 w-5 text-muted-foreground" />
												<span className="text-center text-[10px] font-black uppercase leading-tight text-muted-foreground">
													NILAI BELUM
													<br />
													DIRILIS
												</span>
											</div>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
