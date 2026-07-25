"use client";

import { useEffect, useState } from "react";
import { getMyExamAttemptsSupabase } from "@/actions/exam-supabase";
import { getGlobalStudentGradesSupabase } from "@/actions/grades-supabase";
import { Trophy, Medal, NavArrowRight, ClipboardCheck, Flash } from "iconoir-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GradeItem {
  id: string;
  title: string;
  score: number;
  type: "task" | "exam";
  date: string;
  classId?: string;
}

export function RecentGradesFeed() {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllGrades() {
      const [examRes, taskRes] = await Promise.all([
        getMyExamAttemptsSupabase(),
        getGlobalStudentGradesSupabase()
      ]);

      const merged: GradeItem[] = [];

      if (examRes.success && examRes.data) {
        examRes.data.forEach((att) => {
          merged.push({
            id: `exam-${att.id}`,
            title: att.exam?.title || "Ujian",
            score: att.score || 0,
            type: "exam",
            date: att.submittedAt ? new Date(att.submittedAt).toISOString() : new Date().toISOString()
          });
        });
      }

      if (taskRes.length > 0) {
        taskRes.forEach((g) => {
          merged.push({
            id: `task-${g.id}`,
            title: g.taskTitle || "Tugas",
            score: g.grade || 0,
            type: "task",
            date: g.updatedAt || new Date().toISOString(),
            classId: g.classId
          });
        });
      }

      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setGrades(merged.slice(0, 5));
      setIsLoading(false);
    }
    fetchAllGrades();
  }, []);

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-[2rem]" />;

  if (grades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-muted/20 border-2 border-dashed border-neo-border text-center">
        <p className="font-bold text-muted-foreground text-sm uppercase">Belum ada nilai rilis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grades.map((item) => (
        <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border-4 border-neo-border bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_var(--neo-border)]">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)]",
            item.score >= 80 ? "bg-neo-accent" : "bg-zinc-100 dark:bg-zinc-800"
          )}>
            {item.type === "exam" ? (
              item.score >= 80 ? <Trophy className="h-6 w-6" /> : <Medal className="h-6 w-6" />
            ) : (
              <ClipboardCheck className={cn("h-6 w-6", item.score >= 80 ? "text-black" : "text-zinc-500 dark:text-zinc-300")} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {item.type === "exam" && (
                <Flash className="h-3 w-3 text-yellow-500" />
              )}
              <h4 className="font-black uppercase italic tracking-tighter truncate text-sm">{item.title}</h4>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              {item.type === "exam" ? (item.score >= 80 ? "GOKIL! " : "") + "Skor Ujian" : "Nilai Tugas"}
            </p>
          </div>
          <div className="text-2xl font-black italic tracking-tighter text-foreground">
            {item.score}
          </div>
        </div>
      ))}
      <Link href="/dashboard/siswa/stats" className="flex items-center justify-center gap-2 p-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
        LIHAT SEMUA NILAI <NavArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
