"use client";

import { useEffect, useState } from "react";
import {
	getStudentExamsSupabase,
	getMyExamAttemptsSupabase,
} from "@/actions/exam-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Flash,
	Timer,
	Trophy,
	NavArrowRight,
	Database,
	Calendar,
} from "iconoir-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { progressBar } from "@/lib/progress-bar";
import { useAuth } from "../auth/AuthProvider";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ExamListProps {
	classId: string;
}

type ClassExamListItem = {
	id: string;
	status: string;
	type: string;
	title: string;
	startTime: string;
	endTime: string;
	duration: number;
	rewards: { xp: number };
};

type ExamAttemptSummary = {
	examId: string;
};

export function StudentExamList({ classId }: ExamListProps) {
	const { user } = useAuth();
	const [exams, setExams] = useState<ClassExamListItem[]>([]);
	const [attempts, setAttempts] = useState<Record<string, ExamAttemptSummary>>(
		{},
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!user?.id) return;

		const fetchData = async () => {
			const [examsRes, attemptsRes] = await Promise.all([
				getStudentExamsSupabase(classId),
				getMyExamAttemptsSupabase(),
			]);

			if (examsRes.success) {
				setExams((examsRes.data as ClassExamListItem[] | undefined) || []);
			} else {
				console.error("Failed to fetch student exams:", examsRes.error);
			}

			if (attemptsRes.success) {
				const attemptMap: Record<string, ExamAttemptSummary> = {};
				(attemptsRes.data as ExamAttemptSummary[] | undefined)?.forEach(
					(att) => {
						attemptMap[att.examId] = att;
					},
				);
				setAttempts(attemptMap);
			} else {
				console.error("Failed to fetch student attempts:", attemptsRes.error);
			}

			setIsLoading(false);
		};

		fetchData();
	}, [classId, user]);

	if (isLoading) {
		return (
			<div className="grid gap-4 sm:grid-cols-2">
				{[1, 2].map((i) => (
					<Skeleton key={i} className="h-40 w-full rounded-[2rem]" />
				))}
			</div>
		);
	}

	const activeExams = exams.filter(
		(exam) => exam.status === "published" && !attempts[exam.id],
	);

	if (activeExams.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
				<div className="bg-card border-4 border-neo-border p-6 rounded-3xl mb-6 shadow-[4px_4px_0px_0px_var(--neo-border)]">
					<Database className="w-12 h-12 text-muted-foreground" />
				</div>
				<h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">
					Tidak Ada Ujian Aktif
				</h3>
				<p className="text-muted-foreground max-w-xs mx-auto mt-2 font-bold text-sm">
					Semua ujian telah dikerjakan atau belum ada ujian baru dari guru.
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-6 sm:grid-cols-2">
			{activeExams.map((exam) => (
				<Card
					key={exam.id}
					className="group relative overflow-hidden border-4 border-neo-border bg-card text-card-foreground shadow-[var(--neo-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all rounded-[2rem]"
				>
					<CardContent className="p-8">
						<div className="flex justify-between items-start mb-6">
							<div className="bg-yellow-400 dark:bg-yellow-500 border-2 border-neo-border p-2 shadow-[2px_2px_0px_0px_var(--neo-border)] group-hover:scale-110 transition-transform">
								<Flash className="h-6 w-6 text-black dark:text-zinc-950" />
							</div>
							<div className="flex flex-col items-end gap-2">
								<Badge className="bg-muted text-foreground border-2 border-neo-border font-black uppercase text-[10px]">
									{exam.type}
								</Badge>
								{new Date(exam.startTime) > new Date() && (
									<Badge className="bg-blue-600 text-white border-2 border-neo-border font-black uppercase text-[8px] shadow-[2px_2px_0px_0px_var(--neo-border)]">
										Upcoming
									</Badge>
								)}
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="text-xl font-black uppercase italic tracking-tight leading-none text-foreground group-hover:text-neo-primary transition-colors">
								{exam.title}
							</h3>

							<div className="flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-muted/60 p-3">
								<div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
									<Calendar className="w-3 h-3" />
									Jadwal Ujian
								</div>
								<div className="flex flex-col">
									<span className="text-xs font-bold text-foreground">
										{format(new Date(exam.startTime), "dd MMM yyyy", {
											locale: idLocale,
										})}
									</span>
									<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
										{format(new Date(exam.startTime), "HH:mm")} -{" "}
										{format(new Date(exam.endTime), "HH:mm")} WIB
									</span>
								</div>
							</div>

							<div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
								<div className="flex items-center gap-1">
									<Timer className="w-3.5 h-3.5" />
									{exam.duration} Menit
								</div>
								<div className="flex items-center gap-1">
									<Trophy className="w-3.5 h-3.5 text-orange-500" />
									{exam.rewards.xp} XP
								</div>
							</div>

							<div className="pt-4">
								{new Date(exam.startTime) > new Date() ? (
									<Button
										disabled
										className="w-full cursor-not-allowed rounded-xl border-2 border-border bg-muted font-black uppercase tracking-widest text-muted-foreground"
									>
										BELUM DIMULAI
									</Button>
								) : (
									<Button
										asChild
										className="w-full rounded-xl border-2 border-neo-border bg-foreground font-black uppercase tracking-widest text-background shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all hover:bg-foreground/90 hover:shadow-none hover:translate-x-1 hover:translate-y-1"
										onClick={() => progressBar.start()}
									>
										<Link href={`/dashboard/siswa/cbt/${exam.id}`}>
											KERJAKAN SEKARANG
											<NavArrowRight className="ml-2 w-4 h-4" />
										</Link>
									</Button>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
