"use client";

import { useEffect, useState } from "react";
import { getGlobalStudentExamsSupabase } from "@/actions/exam-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flash, Timer, Trophy, NavArrowRight, Database } from "iconoir-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type GlobalExamListItem = {
	id: string;
	title: string;
	endTime: string;
	duration: number;
	className: string;
	rewards?: { xp?: number };
};

export function GlobalExamList() {
	const [exams, setExams] = useState<GlobalExamListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function fetchExams() {
			const res = await getGlobalStudentExamsSupabase();
			if (res.success)
				setExams((res.data as GlobalExamListItem[] | undefined) || []);
			setIsLoading(false);
		}
		fetchExams();
	}, []);

	if (isLoading)
		return <Skeleton className="h-[400px] w-full rounded-[2rem]" />;

	if (exams.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center h-full min-h-[300px]">
				<div className="bg-card border-4 border-neo-border p-6 rounded-3xl mb-6 shadow-[4px_4px_0px_0px_var(--neo-border)]">
					<Database className="w-12 h-12 text-muted-foreground" />
				</div>
				<h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">
					Semua Misi Kelar!
				</h3>
				<p className="text-muted-foreground max-w-xs mx-auto mt-2 font-bold text-sm">
					Gak ada ujian aktif sekarang. Waktunya istirahat atau cek nilai
					lamamu.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{exams.map((exam) => (
				<Card
					key={exam.id}
					className="group relative overflow-hidden border-4 border-neo-border bg-card text-card-foreground shadow-[6px_6px_0px_0px_var(--neo-border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--neo-border)] transition-all rounded-[2rem]"
				>
					<CardContent className="p-6">
						<div className="flex justify-between items-start mb-4">
							<div className="bg-neo-accent border-2 border-neo-border p-2 shadow-[2px_2px_0px_0px_var(--neo-border)]">
								<Flash className="w-5 h-5 text-black dark:text-zinc-950" />
							</div>
							<Badge className="bg-muted text-foreground border-2 border-neo-border font-black uppercase text-[10px]">
								{exam.className}
							</Badge>
						</div>
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-black uppercase italic tracking-tight leading-tight text-foreground group-hover:text-neo-primary transition-colors">
									{exam.title}
								</h3>
								<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
									Sampai:{" "}
									{format(new Date(exam.endTime), "dd MMM, HH:mm", {
										locale: idLocale,
									})}{" "}
									WIB
								</p>
							</div>
							<div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
								<span className="flex items-center gap-1">
									<Timer className="w-3.5 h-3.5" /> {exam.duration}m
								</span>
								<span className="flex items-center gap-1 text-neo-primary">
									<Trophy className="w-3.5 h-3.5" /> +{exam.rewards?.xp || 0} XP
								</span>
							</div>
							<Button
								asChild
								className="w-full bg-foreground text-background border-2 border-neo-border hover:bg-foreground/90 font-black uppercase tracking-widest rounded-xl shadow-[4px_4px_0px_0px_var(--neo-border)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
							>
								<Link href={`/dashboard/siswa/cbt/${exam.id}`}>
									GAS KERJAKAN <NavArrowRight className="ml-2 w-4 h-4" />
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
