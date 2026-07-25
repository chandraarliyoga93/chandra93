import { Suspense } from "react";
import { getExamFullInfoSupabase } from "@/actions/exam-supabase";
import { getGuruClassesSupabase } from "@/actions/classes-supabase";
import PageContainer from "@/components/layout/PageContainer";
import { AssignmentManager } from "@/components/cbt/AssignmentManager";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { 
  Timer, 
  Key, 
  Trophy, 
  Book,
  ArrowLeft
} from "iconoir-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { id } = await params;

  const [examResult, classesResult] = await Promise.all([
    getExamFullInfoSupabase(id),
    getGuruClassesSupabase({ pageSize: 100 }),
  ]);

  if (!examResult.success || !examResult.data) {
    notFound();
  }

  const exam = examResult.data;
  const assignments = (exam as any).assignments || [];
  const classes = classesResult.data || [];

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          <Link 
            href="/dashboard/guru/cbt" 
            className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors uppercase tracking-widest group w-fit"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Daftar Ujian
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 dark:bg-zinc-950/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px] uppercase font-black border-zinc-200 dark:border-zinc-800 text-zinc-500 tracking-widest bg-zinc-50/50 dark:bg-zinc-950/50">
                  {exam.type}
                </Badge>
                <Badge 
                  variant={exam.status === "published" ? "default" : "outline"}
                  className={cn(
                    "rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest",
                    exam.status === "published" 
                      ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border-zinc-200"
                  )}
                >
                  Template {exam.status}
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-zinc-950 dark:text-zinc-50 tracking-tighter uppercase leading-none">
                {exam.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Durasi</span>
                    <span className="text-sm font-black">{exam.duration} Menit</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                    <Book className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Soal</span>
                    <span className="text-sm font-black">{exam.questions?.length || 0} Soal</span>
                  </div>
                </div>

                {exam.token && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                      <Key className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Token Default</span>
                      <span className="text-sm font-mono font-bold uppercase">{exam.token}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reward</span>
                    <span className="text-sm font-black text-emerald-600">{(exam.rewards as any)?.xp || 0} XP</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative flex flex-col gap-3 min-w-[200px]">
               <Button variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11" asChild>
                  <Link href={`/dashboard/guru/cbt/${exam.id}/monitoring`}>
                     Live Monitoring
                  </Link>
               </Button>
               <Button variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11" asChild>
                  <Link href={`/dashboard/guru/cbt/${exam.id}/results`}>
                     Hasil Ujian
                  </Link>
               </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-[2.5rem]" />}>
            <AssignmentManager 
              examId={exam.id!}
              assignments={assignments}
              availableClasses={classes}
            />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
