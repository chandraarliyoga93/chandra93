"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExamAttemptDetailDialog } from "@/components/dashboard/guru/cbt/ExamAttemptDetailDialog";
import { getExamResultsSupabase, deleteExamAttemptSupabase } from "@/actions/exam-supabase";
import type { Exam, ExamAttempt } from "@/types/exam";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";

const PAGE_SIZE = 200;

interface ExamResultsTableClientProps {
  exam: Exam;
  initialResults: ExamAttempt[];
  initialNextCursor: string | undefined;
  initialHasMore: boolean;
}

export function ExamResultsTableClient({
  exam,
  initialResults,
  initialNextCursor,
  initialHasMore,
}: ExamResultsTableClientProps) {
  const [results, setResults] = useState<ExamAttempt[]>(initialResults);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [classFilter, setClassFilter] = useState<string>("all");
  const { onOpen } = useModal();

  const assignedClasses = useMemo(() => {
    const rows = (exam.assignments || []).map((a) => ({
      id: a.classId,
      name: a.class?.name || "Kelas",
    }));
    const seen = new Set<string>();
    return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  }, [exam.assignments]);

  const filteredResults = useMemo(() => {
    if (classFilter === "all") return results;
    return results.filter((r) => r.classId === classFilter);
  }, [results, classFilter]);

  const handleRefresh = async () => {
    const examId = exam?.id;
    if (!examId) return;
    const res = await getExamResultsSupabase(examId, { pageSize: PAGE_SIZE });
    if (res.success && Array.isArray(res.data)) {
      setResults(res.data);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore ?? false);
    }
  };

  const handleDeleteAttempt = (attempt: ExamAttempt) => {
    const examId = exam?.id;
    if (!examId || !attempt.id) return;

    onOpen("alert", {
      title: "Hapus Hasil Ujian?",
      description: `Tindakan ini akan menghapus hasil ujian ${attempt.studentName}. Siswa akan diizinkan untuk mengerjakan ulang ujian ini dari awal.`,
      confirmText: "Ya, Hapus & Izinkan Re-attempt",
      onConfirm: async () => {
        try {
          const res = await deleteExamAttemptSupabase(examId, attempt.id!);
          if (res.success) {
            toast.success("Attempt dihapus", { description: "Siswa kini bisa mengerjakan ulang." });
            handleRefresh();
          } else {
            toast.error(res.error || "Gagal menghapus attempt");
          }
        } catch (err) {
          toast.error("Terjadi kesalahan sistem");
        }
      }
    });
  };

  const loadMore = () => {
    const examId = exam?.id;
    const cursor = nextCursor;
    if (!examId || !cursor || isPending) return;
    startTransition(async () => {
      const res = await getExamResultsSupabase(examId, { pageSize: PAGE_SIZE, cursor });
      if (res.success && Array.isArray(res.data)) {
        setResults((prev) => [...prev, ...(res.data ?? [])]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore ?? false);
      }
    });
  };

  return (
    <Card className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {assignedClasses.length > 0 && (
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={classFilter === "all" ? "default" : "outline"}
              className="rounded-full text-[10px] font-bold uppercase tracking-widest"
              onClick={() => setClassFilter("all")}
            >
              Semua
            </Button>
            {assignedClasses.map((cls) => (
              <Button
                key={cls.id}
                type="button"
                size="sm"
                variant={classFilter === cls.id ? "default" : "outline"}
                className="rounded-full text-[10px] font-bold uppercase tracking-widest"
                onClick={() => setClassFilter(cls.id)}
                title={cls.name}
              >
                {cls.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 h-12">
          <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
            <TableHead className="pl-8 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">Siswa</TableHead>
            <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">Skor</TableHead>
            <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">Durasi</TableHead>
            <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">Pelanggaran</TableHead>
            <TableHead className="pr-8 font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-right">Waktu Selesai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredResults.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    <User className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
                  </div>
                  <p className="text-zinc-400 font-medium italic">
                    {classFilter === "all"
                      ? "Belum ada siswa yang mengerjakan."
                      : "Belum ada hasil untuk kelas ini."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredResults.map((res) => (
              <TableRow key={res.id} className="group border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                <TableCell className="pl-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                      {res.studentName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {res.studentName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className={cn(
                    "inline-flex items-center justify-center px-3 py-1 rounded-lg border font-bold text-sm",
                    res.score >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    res.score >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {res.score}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {res.timeTaken}m
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={res.violations > 0 ? "destructive" : "outline"} className="rounded-md px-2 font-bold text-[10px]">
                    {res.violations}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-xs font-medium text-zinc-400">
                      {format(new Date(res.submittedAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                    </span>
                    <ExamAttemptDetailDialog exam={exam} attempt={res} />
                    <Button 
                      variant="outline" 
                      size="xs" 
                      className="rounded-full text-[9px] uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => handleDeleteAttempt(res)}
                      title="Hapus hasil & Izinkan mengulang dari awal"
                    >
                      Re-attempt
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {hasMore && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={isPending}
            className="rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : (
              "Muat lebih banyak"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
