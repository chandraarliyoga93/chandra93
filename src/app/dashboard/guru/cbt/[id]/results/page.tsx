import { getExamResultsSupabase, getExamFullInfoSupabase, getExamAttemptsCountSupabase } from "@/actions/exam-supabase";
import { NavArrowLeft, Timer, WarningTriangle } from "iconoir-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CBTExportActions } from "@/components/dashboard/guru/cbt/CBTExportActions";
import { ExamResultsTableClient } from "@/components/dashboard/guru/cbt/ExamResultsTableClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

// Results should feel complete by default; keep pagination as a fallback.
const RESULTS_PAGE_SIZE = 200;

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let resultsRes: any = { success: false, data: [] };
  let infoRes: any = { success: false, data: null };
  let countRes: any = { success: false, count: 0 };

  try {
    const [rRes, iRes, cRes] = await Promise.all([
      getExamResultsSupabase(id, { pageSize: RESULTS_PAGE_SIZE }),
      getExamFullInfoSupabase(id),
      getExamAttemptsCountSupabase(id),
    ]);
    resultsRes = rRes;
    infoRes = iRes;
    countRes = cRes;
  } catch (error) {
    console.warn("Database failed during build:", error);
  }

  if (!infoRes.success || !infoRes.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <WarningTriangle className="w-12 h-12 text-rose-500" />
        <h3 className="text-xl font-bold uppercase">Ujian Tidak Ditemukan</h3>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard/guru/cbt">Kembali ke CBT</Link>
        </Button>
      </div>
    );
  }

  const results = (resultsRes.success ? resultsRes.data : []) || [];
  const exam = infoRes.data;
  const totalCount = countRes.success ? countRes.count : 0;
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / results.length)
      : 0;

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link href="/dashboard/guru/cbt">
                <NavArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Kembali ke CBT</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none mb-2">
                Hasil: {exam.title}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[9px] uppercase font-bold">
                  {exam.type}
                </Badge>
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-tighter flex items-center gap-1">
                  <Timer className="w-3 h-3" /> {exam.duration}m
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
               <CBTExportActions exam={exam} results={results} />

               <div className="px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Total Peserta</span>
                  <span className="text-2xl font-bold leading-none tabular-nums text-zinc-900 dark:text-zinc-100">{totalCount}</span>
               </div>

               <div className="px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-zinc-400">Rata-rata (dimuat)</span>
                  <span className={cn(
                    "text-2xl font-bold leading-none tabular-nums",
                    averageScore >= 75 ? "text-emerald-600" : averageScore >= 50 ? "text-yellow-600" : "text-rose-600"
                  )}>
                    {averageScore}
                  </span>
               </div>
            </div>
          </div>
        </div>

        <ExamResultsTableClient
          exam={exam}
          initialResults={results}
          initialNextCursor={resultsRes.success && "nextCursor" in resultsRes ? resultsRes.nextCursor : undefined}
          initialHasMore={resultsRes.success && "hasMore" in resultsRes ? (resultsRes.hasMore ?? false) : false}
        />
      </div>
    </div>
  );
}