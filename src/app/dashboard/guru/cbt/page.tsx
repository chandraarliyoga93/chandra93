import { Suspense } from "react";
import { getGuruExamsSupabase, getCBTStatsSupabase } from "@/actions/exam-supabase";
import { getGuruClassesSupabase as getGuruClasses } from "@/actions/classes-supabase";
import { CreateExamDialog } from "@/components/dashboard/guru/cbt/CreateExamDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Database, 
  Timer,
  Trophy
} from "iconoir-react";
import { V2ExamTable } from "@/components/dashboard/guru/cbt/V2ExamTable";
import { examSearchParamsCache } from "@/lib/parsers";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GuruCBTPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = examSearchParamsCache.parse(params);
  
  const page = parsed.page;
  const pageSize = parsed.pageSize;
  const search = parsed.search;
  const type = parsed.type || undefined;
  const status = parsed.status || undefined;

  const [examsResult, classesResult, statsResult] = await Promise.all([
    getGuruExamsSupabase({ page, pageSize, search, type, status }),
    getGuruClasses({ pageSize: 100 }), // Get many classes for the dropdown
    getCBTStatsSupabase(),
  ]);

  const exams = (examsResult.success ? examsResult.data : []) || [];
  const classes = classesResult.data || [];
  const stats = (statsResult.success ? statsResult.data : { totalExams: 0, activeSessions: 0, totalParticipants: 0 }) || { totalExams: 0, activeSessions: 0, totalParticipants: 0 };

  if (!examsResult.success) {
    console.error("Exams fetch error:", examsResult.error);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight uppercase">
            CBT Management
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Kelola ujian, kuis, dan sistem keamanan Computer Based Test.
          </p>
          {!examsResult.success && (
            <p className="text-rose-500 text-xs font-bold mt-2 uppercase tracking-tighter">
              ⚠️ {examsResult.error}
            </p>
          )}
        </div>
        <CreateExamDialog classes={classes} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <Database className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Exams</p>
          <p className="text-3xl font-bold tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-50">{stats.totalExams}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <Timer className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Sessions</p>
          <p className="text-3xl font-bold tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-50">{stats.activeSessions}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Participants</p>
          <p className="text-3xl font-bold tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-50">{stats.totalParticipants}</p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-[2rem]" />}>
        <V2ExamTable
          data={exams}
          classes={classes}
          pageCount={(examsResult as any).totalPages ?? Math.ceil(((examsResult as any).totalCount ?? exams.length) / (parsed.pageSize || 10))}
          totalCount={(examsResult as any).totalCount ?? exams.length}
          nextCursor={(examsResult as any).nextCursor}
          hasMore={(examsResult as any).hasMore ?? false}
        />
      </Suspense>
    </div>
  );
}
