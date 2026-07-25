import { getAuthUser } from "@/lib/auth-server";
import { getGlobalStudentGradesSupabase } from "@/actions/grades-supabase";
import { getMyExamAttemptsSupabase } from "@/actions/exam-supabase";
import { getEnrolledClassesSupabase } from "@/actions/enrollment-supabase";
import { redirect } from "next/navigation";
import { Trophy, Medal, ClipboardCheck, Flash, ArrowLeft, StatsUpSquare } from "iconoir-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface GradeItem {
  id: string;
  title: string;
  score: number;
  type: "task" | "exam";
  date: string;
  className?: string;
  feedback?: string;
}

export default async function SiswaStatsPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "Siswa") {
    redirect("/");
  }

  const [taskGrades, examAttempts, classes] = await Promise.all([
    getGlobalStudentGradesSupabase(),
    getMyExamAttemptsSupabase(),
    getEnrolledClassesSupabase()
  ]);

  const classMap = new Map((classes || []).map((c) => [c.id, c.name]));

  const merged: GradeItem[] = [];

  if (examAttempts.success && examAttempts.data) {
    examAttempts.data.forEach((att) => {
      merged.push({
        id: `exam-${att.id}`,
        title: att.exam?.title || "Ujian",
        score: att.score || 0,
        type: "exam",
        date: att.submittedAt ? new Date(att.submittedAt).toISOString() : new Date().toISOString(),
        className: "Ujian"
      });
    });
  }

  if (taskGrades.length > 0) {
    taskGrades.forEach((g) => {
      merged.push({
        id: `task-${g.id}`,
        title: g.taskTitle || "Tugas",
        score: g.grade || 0,
        type: "task",
        date: g.updatedAt || new Date().toISOString(),
        className: classMap.get(g.classId) || "Tugas",
        feedback: g.feedback
      });
    });
  }

  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalGrades = merged.length;
  const averageScore = totalGrades > 0 
    ? merged.reduce((acc, curr) => acc + curr.score, 0) / totalGrades 
    : 0;
  const highestScore = totalGrades > 0 ? Math.max(...merged.map(g => g.score)) : 0;
  const examCount = merged.filter(g => g.type === "exam").length;
  const taskCount = merged.filter(g => g.type === "task").length;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-neo-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
            <StatsUpSquare className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Semua Nilai</h1>
        </div>
        <Link 
          href="/dashboard/siswa"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 font-black uppercase italic text-sm border-2 border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-4 border-neo-border bg-yellow-400 p-4 shadow-[6px_6px_0px_0px_var(--neo-border)] text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-black">Total Nilai</p>
          <p className="text-3xl font-black italic text-black">{totalGrades}</p>
        </div>
        <div className="border-4 border-neo-border bg-cyan-400 p-4 shadow-[6px_6px_0px_0px_var(--neo-border)] text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-black">Rata-Rata</p>
          <p className="text-3xl font-black italic text-black">{averageScore.toFixed(1)}</p>
        </div>
        <div className="border-4 border-neo-border bg-pink-400 p-4 shadow-[6px_6px_0px_0px_var(--neo-border)] text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-black">Tertinggi</p>
          <p className="text-3xl font-black italic text-black">{highestScore}</p>
        </div>
        <div className="border-4 border-neo-border bg-green-400 p-4 shadow-[6px_6px_0px_0px_var(--neo-border)] text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-black">Ujian / Tugas</p>
          <p className="text-3xl font-black italic text-black">{examCount}/{taskCount}</p>
        </div>
      </div>

      {/* Grades List */}
      {merged.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
          <div className="bg-white border-4 border-neo-border p-6 rounded-3xl mb-6 shadow-[4px_4px_0px_0px_var(--neo-border)]">
            <StatsUpSquare className="w-12 h-12 text-zinc-300" />
          </div>
          <h3 className="text-xl font-black italic uppercase">Belum Ada Nilai</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-2 font-bold text-sm">
            Nilai tugas dan ujian akan muncul di sini setelah guru memberikan penilaian.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {merged.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border-4 border-neo-border bg-white shadow-[4px_4px_0px_0px_var(--neo-border)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--neo-border)] transition-all">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl border-2 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)]",
                item.score >= 80 ? "bg-neo-accent" : item.score >= 60 ? "bg-yellow-400" : "bg-red-400"
              )}>
                {item.type === "exam" ? (
                  item.score >= 80 ? <Trophy className="h-7 w-7 text-black" /> : <Medal className="h-7 w-7 text-black" />
                ) : (
                  <ClipboardCheck className="h-7 w-7 text-black" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.type === "exam" && (
                    <Flash className="h-3 w-3 text-yellow-500" />
                  )}
                  <h4 className="font-black uppercase italic tracking-tighter truncate">{item.title}</h4>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase">
                  <span>{item.className}</span>
                  <span>•</span>
                  <span>{format(new Date(item.date), "dd MMM yyyy", { locale: idLocale })}</span>
                  {item.feedback && (
                    <>
                      <span>•</span>
                      <span className="italic">&ldquo;{item.feedback}&rdquo;</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-3xl font-black italic tracking-tighter">
                {item.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
