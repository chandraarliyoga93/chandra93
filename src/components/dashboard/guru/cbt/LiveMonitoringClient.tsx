"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  Database, 
  Timer, 
  User, 
  WarningTriangle, 
  NavArrowLeft, 
  Refresh, 
  Shield, 
  InfoCircle, 
  ShieldAlert,
  Lock,
  Key
} from "iconoir-react";
import Link from "next/link";
import { toast } from "sonner";

import type { Exam, ExamAttempt } from "@/types/exam";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  resetExamAttemptSupabase, 
  forceFinishExamAttemptSupabase, 
  getExamResultsSupabase,
  deleteExamAttemptSupabase,
  toggleExamSubmitLockSupabase,
  toggleStudentSubmitEnableSupabase
} from "@/actions/exam-supabase";
import { useModal } from "@/hooks/use-modal";

type StatusFilter = "all" | "not_started" | "in_progress" | "completed" | "locked";

interface LiveMonitoringClientProps {
  exam: Exam;
  studentNames: Record<string, string>;
  initialAttempts: ExamAttempt[];
}

export function LiveMonitoringClient({ exam, studentNames, initialAttempts }: LiveMonitoringClientProps) {
  const [attempts, setAttempts] = useState<ExamAttempt[]>(initialAttempts);
  const [isSubmitLocked, setIsSubmitLocked] = useState(exam.isSubmitLocked);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const { onOpen } = useModal();

  const handleRefresh = useCallback((silent = false) => {
    const examId = exam?.id ?? (exam as { id?: string }).id;
    if (!examId) return;
    if (!silent) setRefreshing(true);
    getExamResultsSupabase(examId, { pageSize: 50 }).then((res) => {
      if (!silent) setRefreshing(false);
      if (res.success && Array.isArray(res.data)) {
        setAttempts(res.data as ExamAttempt[]);
        if (!silent) toast.success("Data diperbarui");
      } else {
        if (!silent) toast.error(res.error || "Gagal memuat ulang");
      }
    }).catch(() => {
      if (!silent) {
        setRefreshing(false);
        toast.error("Gagal memuat ulang");
      }
    });
  }, [exam]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh(true);
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
    }, [handleRefresh]);

    const assignedClasses = useMemo(() => {
      if (!exam.assignments) return [];
      return exam.assignments.map(a => ({
        id: a.classId,
        name: a.class?.name || "Kelas"
      }));
    }, [exam.assignments]);
  
    const rows = useMemo(() => {
    const byStudent = new Map<string, ExamAttempt>();

    attempts.forEach((attempt) => {
      const existing = byStudent.get(attempt.studentId);
      if (!existing) {
        byStudent.set(attempt.studentId, attempt);
        return;
      }

      // Prefer completed over others, then more recent submittedAt / startedAt
      const statusRank = (s: ExamAttempt["status"]) => {
        const lowerStatus = s?.toLowerCase();
        if (lowerStatus === "completed") return 3;
        if (lowerStatus === "auto_submitted") return 2;
        if (lowerStatus === "in_progress") return 1;
        if (lowerStatus === "locked") return 1;
        return 0;
      };

      const existingRank = statusRank(existing.status);
      const nextRank = statusRank(attempt.status);
      if (nextRank > existingRank) {
        byStudent.set(attempt.studentId, attempt);
        return;
      }

      const existingTime =
        (existing.submittedAt && new Date(existing.submittedAt).getTime()) ||
        (existing.startedAt && new Date(existing.startedAt).getTime()) ||
        0;
      const nextTime =
        (attempt.submittedAt && new Date(attempt.submittedAt).getTime()) ||
        (attempt.startedAt && new Date(attempt.startedAt).getTime()) ||
        0;

      if (nextTime > existingTime) {
        byStudent.set(attempt.studentId, attempt);
      }
    });

    return Array.from(byStudent.values()).sort((a, b) => {
      const aName = studentNames[a.studentId] || a.studentName || "Siswa";
      const bName = studentNames[b.studentId] || b.studentName || "Siswa";
      return aName.localeCompare(bName);
    });
  }, [attempts, studentNames]);

  const filteredRows = useMemo(() => {
    let result = rows;
    
    // Filter by Status
    if (statusFilter !== "all") {
      if (statusFilter === "not_started") {
        result = result.filter((row) => !row.status || row.status.toLowerCase() === "in_progress");
      } else if (statusFilter === "locked") {
        result = result.filter((row) => row.status?.toLowerCase() === "locked");
      } else if (statusFilter === "completed") {
        result = result.filter((row) => row.status?.toLowerCase() === "completed" || row.status?.toLowerCase() === "auto_submitted");
      } else {
        result = result.filter((row) => row.status?.toLowerCase() === statusFilter);
      }
    }

    // Filter by Class
    if (classFilter !== "all") {
      result = result.filter((row) => row.classId === classFilter);
    }

    return result;
  }, [rows, statusFilter, classFilter]);

  const stats = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let locked = 0;

    rows.forEach((row) => {
      const s = row.status?.toLowerCase();
      if (s === "locked") locked++;
      else if (s === "completed" || s === "auto_submitted") {
        completed++;
      } else if (s === "in_progress") {
        inProgress++;
      }
    });

    return { inProgress, completed, locked, total: rows.length };
  }, [rows]);

  const handleReset = (attempt: ExamAttempt) => {
    const examId = exam?.id ?? (exam as { id?: string }).id;
    if (!examId || !attempt?.id) {
      toast.error("Data tidak lengkap", { description: "ID ujian atau attempt tidak tersedia." });
      return;
    }

    startTransition(async () => {
      try {
        const result = await resetExamAttemptSupabase(examId, attempt.id!);
        if (result.success) {
          toast.success("Attempt dibuka kembali", {
            description: "Siswa bisa login dan ujian lagi (masuk dengan token, lalu Mulai). Berguna jika siswa keluar tidak sengaja.",
          });
          handleRefresh();
        } else {
          toast.error("Gagal mereset attempt", {
            description: result.error || "Terjadi kesalahan.",
          });
        }
      } catch (err) {
        console.error("Reset attempt error:", err);
        toast.error("Gagal mereset attempt", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan jaringan.",
        });
      }
    });
  };

  const handleForceFinish = (attempt: ExamAttempt) => {
    const examId = exam?.id ?? (exam as { id?: string }).id;
    if (!examId || !attempt?.id) {
      toast.error("Data tidak lengkap", { description: "ID ujian atau attempt tidak tersedia." });
      return;
    }

    startTransition(async () => {
      try {
        const result = await forceFinishExamAttemptSupabase(examId, attempt.id!);
        if (result.success) {
          toast.success("Attempt dipaksa selesai", {
            description: "Siswa tidak dapat melanjutkan mengerjakan ujian ini.",
          });
          handleRefresh();
        } else {
          toast.error("Gagal memaksa selesai attempt", {
            description: result.error || "Terjadi kesalahan.",
          });
        }
      } catch (err) {
        console.error("Force finish error:", err);
        toast.error("Gagal memaksa selesai", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan jaringan.",
        });
      }
    });
  };

  const handleDeleteAttempt = (attempt: ExamAttempt) => {
    const examId = exam?.id ?? (exam as { id?: string }).id;
    if (!examId || !attempt.id) return;

    const studentName = studentNames[attempt.studentId] || attempt.studentName || "Siswa";

    onOpen("alert", {
      title: "Hapus & Re-attempt?",
      description: `Tindakan ini akan menghapus permanen semua jawaban ${studentName} dan mengizinkan siswa untuk mulai ujian dari awal.`,
      confirmText: "Ya, Hapus & Izinkan Re-attempt",
      onConfirm: async () => {
        startTransition(async () => {
          try {
            const res = await deleteExamAttemptSupabase(examId, attempt.id!);
            if (res.success) {
              toast.success("Attempt dihapus", { description: "Siswa kini bisa mengerjakan ulang dari nol." });
              handleRefresh();
            } else {
              toast.error(res.error || "Gagal menghapus attempt");
            }
          } catch (err) {
            console.error("Delete attempt error:", err);
            toast.error("Terjadi kesalahan sistem");
          }
        });
      }
    });
  };

  const formatStatus = (status: ExamAttempt["status"]) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "in_progress":
        return "Sedang";
      case "completed":
        return "Selesai";
      case "auto_submitted":
        return "Otomatis";
      case "locked":
        return "Terkunci";
      default:
        return "Tidak diketahui";
    }
  };

  const statusVariant = (status: ExamAttempt["status"]) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "in_progress":
        return "outline" as const;
      case "completed":
      case "auto_submitted":
        return "default" as const;
      case "locked":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const formatLastActivity = (value?: string | Date | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date, { addSuffix: true, locale: idLocale });
  };

  const computeRemainingMinutes = (attempt: ExamAttempt) => {
    const durationMinutes = exam.duration ?? 0;
    const taken = attempt.timeTaken ?? 0;
    const remaining = durationMinutes - taken;
    return remaining > 0 ? remaining : 0;
  };

  const totalQuestions = useMemo(() => {
    // Priority 1: Exam questions from prop
    if (exam.questions && exam.questions.length > 0) {
      return exam.questions.length;
    }
    // Priority 2: Stored totalQuestions in attempts
    if (attempts.length > 0 && attempts[0].totalQuestions) {
      return attempts[0].totalQuestions;
    }
    return 0;
  }, [exam.questions, attempts]);

  const translateViolationType = (type: string) => {
    switch (type) {
      case "SWITCH_APP":
        return "Pindah Tab/Aplikasi";
      case "SCREENSHOT_DETECTION":
        return "Tangkapan Layar (Screenshot)";
      case "LAYOUT_VIOLATION":
        return "Split Screen/Floating Window";
      case "UI_LOCKDOWN":
        return "Salin/Tempel (Copy/Paste)";
      case "tab_switched":
        return "Pindah Tab/Keluar Jendela";
      case "fullscreen_exited":
        return "Keluar Layar Penuh";
      case "copy_detected":
        return "Mencoba Menyalin (Copy)";
      case "paste_detected":
        return "Mencoba Menempel (Paste)";
      case "unauthorized_access":
        return "Akses Tidak Sah";
      case "offline":
        return "Mode Offline Terdeteksi";
      case "token_expired":
        return "Token Kedaluwarsa";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
    }
  };

  const handleOpenLogViewer = (attempt: ExamAttempt) => {
    setSelectedAttempt(attempt);
    setIsLogViewerOpen(true);
  };

  const handleToggleMasterSubmitLock = () => {
    const examId = exam?.id ?? (exam as { id?: string }).id;
    if (!examId) return;

    const nextLocked = !isSubmitLocked;
    
    startTransition(async () => {
      try {
        const res = await toggleExamSubmitLockSupabase(examId, nextLocked);
        if (res.success) {
          setIsSubmitLocked(nextLocked);
          toast.success(nextLocked ? "Tombol Submit dikunci global" : "Tombol Submit dibuka global", {
            description: nextLocked 
              ? "Siswa tidak bisa submit kecuali diizinkan satu per satu." 
              : "Semua siswa kini bisa submit ujian."
          });
          handleRefresh(true);
        } else {
          toast.error(res.error || "Gagal mengubah status kunci");
        }
      } catch (err) {
        console.error("Toggle master lock error:", err);
        toast.error("Terjadi kesalahan sistem");
      }
    });
  };

  const handleToggleStudentSubmit = (attempt: ExamAttempt) => {
    if (!attempt.id) return;
    
    const nextEnabled = !attempt.isSubmitEnabled;
    const studentName = studentNames[attempt.studentId] || attempt.studentName || "Siswa";

    startTransition(async () => {
      try {
        const res = await toggleStudentSubmitEnableSupabase(attempt.id!, nextEnabled);
        if (res.success) {
          setAttempts(prev => prev.map(a => a.id === attempt.id ? { ...a, isSubmitEnabled: nextEnabled } : a));
          toast.success(nextEnabled ? `Izin Submit: ${studentName}` : `Blokir Submit: ${studentName}`, {
            description: nextEnabled 
              ? `${studentName} kini bisa klik tombol Selesai.` 
              : `${studentName} tidak bisa submit sementara.`
          });
          handleRefresh(true);
        } else {
          toast.error(res.error || "Gagal mengubah izin");
        }
      } catch (err) {
        console.error("Toggle student submit error:", err);
        toast.error("Terjadi kesalahan sistem");
      }
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/dashboard/guru/cbt">
              <NavArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Kembali ke CBT
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              Live Monitoring: {exam.title}
            </h1>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="rounded-md px-1.5 py-0 text-[9px] uppercase font-bold"
              >
                {exam.type}
              </Badge>
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-tighter flex items-center gap-1">
                <Timer className="w-3 h-3" /> {exam.duration}m
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Database className="w-3 h-3" /> Auto-refresh 30 detik (hemat kuota)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-stretch">
            <button
              onClick={() => setStatusFilter("in_progress")}
              className={cn(
                "px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border transition-all text-left shadow-sm min-w-[140px] flex flex-col justify-center",
                statusFilter === "in_progress" ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 dark:border-zinc-800"
              )}
            >
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                Aktif
              </span>
              <span className="text-2xl font-bold leading-none tabular-nums text-emerald-600">
                {stats.inProgress}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter("completed")}
              className={cn(
                "px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border transition-all text-left shadow-sm min-w-[140px] flex flex-col justify-center",
                statusFilter === "completed" ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 dark:border-zinc-800"
              )}
            >
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                Selesai
              </span>
              <span className="text-2xl font-bold leading-none tabular-nums text-sky-600">
                {stats.completed}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter("locked")}
              className={cn(
                "px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border transition-all text-left shadow-sm min-w-[140px] flex flex-col justify-center",
                statusFilter === "locked" ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 dark:border-zinc-800"
              )}
            >
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                Terkunci
              </span>
              <span className="text-2xl font-bold leading-none tabular-nums text-rose-600">
                {stats.locked}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border transition-all text-left shadow-sm min-w-[140px] flex flex-col justify-center",
                statusFilter === "all" ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 dark:border-zinc-800"
              )}
            >
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                Total Peserta
              </span>
              <span className="text-2xl font-bold leading-none tabular-nums text-zinc-900 dark:text-zinc-100">
                {stats.total}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all",
                isSubmitLocked ? "text-rose-600 border-rose-200 bg-rose-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
              )}
              onClick={handleToggleMasterSubmitLock}
              disabled={isPending}
            >
              {isSubmitLocked ? <Lock className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              {isSubmitLocked ? "Buka Kunci Semua" : "Kunci Semua"}
            </Button>

            <Button
              variant="outline"

              size="sm"
              className="rounded-full text-[10px] uppercase tracking-widest flex items-center gap-1"
              disabled={refreshing}
              onClick={() => handleRefresh(false)}
            >
              <Refresh className={cn("w-3 h-3", refreshing && "animate-spin")} />
              {refreshing ? "Memuat…" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2">Filter Kelas:</span>
          <Badge
            variant={classFilter === "all" ? "default" : "outline"}
            className="cursor-pointer rounded-full px-3 py-1 text-[10px] uppercase font-bold"
            onClick={() => setClassFilter("all")}
          >
            Semua Kelas
          </Badge>
          {assignedClasses.map((cls) => (
            <Badge
              key={cls.id}
              variant={classFilter === cls.id ? "default" : "outline"}
              className="cursor-pointer rounded-full px-3 py-1 text-[10px] uppercase font-bold"
              onClick={() => setClassFilter(cls.id)}
            >
              {cls.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 h-12">
            <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
              <TableHead className="pl-8 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">
                Siswa
              </TableHead>
              <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">
                Status
              </TableHead>
              <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">
                Submit
              </TableHead>
              <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">
                Progres
              </TableHead>
              <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">
                Pelanggaran
              </TableHead>
              <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">
                Aktivitas Terakhir
              </TableHead>
              <TableHead className="font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">
                Sisa Waktu
              </TableHead>
              <TableHead className="pr-8 font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refreshing && filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                      <Database className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
                    </div>
                    <p className="text-zinc-400 font-medium italic">
                      Memuat data live monitoring...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                      <User className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
                    </div>
                    <p className="text-zinc-400 font-medium italic">
                      Belum ada attempt siswa untuk ujian ini.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const name = studentNames[row.studentId] || row.studentName || "Siswa";
                const answered = row.answeredCount ?? 0;
                const total = totalQuestions || row.totalQuestions || 0;
                const isCompleted = row.status?.toLowerCase() === "completed" || row.status?.toLowerCase() === "auto_submitted";
                const progressPct = isCompleted 
                  ? 100 
                  : (total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0);
                
                const remainingMinutes = computeRemainingMinutes(row);

                const status = row.status?.toLowerCase();
                const canReset =
                  status === "locked" ||
                  status === "completed" ||
                  status === "auto_submitted";
                const canForceFinish =
                  status === "in_progress" || status === "locked";

                return (
                  <TableRow
                    key={row.id}
                    className="group border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                          {name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={statusVariant(row.status)}
                        className={cn(
                          "rounded-md px-2 font-bold text-[10px] uppercase",
                          row.status?.toLowerCase() === "locked" && "bg-rose-100 text-rose-700",
                          row.status?.toLowerCase() === "in_progress" &&
                            "bg-amber-50 text-amber-700 border-amber-200",
                          (row.status?.toLowerCase() === "completed" ||
                            row.status?.toLowerCase() === "auto_submitted") &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                        )}
                      >
                        {formatStatus(row.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {isCompleted ? (
                        <div className="flex justify-center">
                          <Key className="w-4 h-4 text-zinc-300" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8 rounded-xl transition-all",
                                    (!isSubmitLocked || row.isSubmitEnabled) 
                                      ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                                      : "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  )}
                                  onClick={() => handleToggleStudentSubmit(row)}
                                  disabled={isPending || !isSubmitLocked}
                                >
                                  {(!isSubmitLocked || row.isSubmitEnabled) ? (
                                    <Key className="w-4 h-4" />
                                  ) : (
                                    <Lock className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!isSubmitLocked ? "Submit terbuka secara global" : (row.isSubmitEnabled ? "Klik untuk kunci submit siswa" : "Klik untuk izinkan submit siswa")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "text-xs font-bold tabular-nums",
                          isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"
                        )}>
                          {isCompleted ? total : answered} / {total}
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isCompleted || progressPct >= 75
                                ? "bg-emerald-500"
                                : progressPct >= 40
                                  ? "bg-amber-500"
                                  : "bg-zinc-400",
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Badge
                          variant={row.violations > 0 ? "destructive" : "outline"}
                          className={cn(
                            "rounded-md px-2 font-bold text-[10px] flex items-center gap-1 justify-center transition-all",
                            row.violations === 1 && "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
                            row.violations > 1 && "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100",
                            row.violations === 0 && "opacity-40"
                          )}
                        >
                          {row.violations > 1 ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : row.violations === 1 ? (
                            <WarningTriangle className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          {row.violations}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
                            row.violations > 0 && "text-zinc-600 dark:text-zinc-300"
                          )}
                          onClick={() => handleOpenLogViewer(row)}
                        >
                          <InfoCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {row.lastActivityAt
                          ? formatLastActivity(row.lastActivityAt)
                          : row.submittedAt
                            ? formatLastActivity(row.submittedAt)
                            : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                        {remainingMinutes}m
                      </span>
                    </TableCell>
                    <TableCell className="pr-8">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="xs"
                                className="rounded-full text-[9px] uppercase tracking-widest"
                                disabled={!canReset || isPending}
                                onClick={() => handleReset(row)}
                              >
                                Reset
                              </Button>
                            </TooltipTrigger>
                            {canReset && (
                              <TooltipContent>
                                Buka attempt lagi — siswa bisa login dan ujian lagi (misal keluar tidak sengaja)
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>

                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-full text-[9px] uppercase tracking-widest text-rose-600 border-rose-300 hover:bg-rose-50"
                          disabled={!canForceFinish || isPending}
                          onClick={() => handleForceFinish(row)}
                        >
                          Paksa Selesai
                        </Button>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="xs"
                                className="rounded-full text-[9px] uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50"
                                disabled={isPending}
                                onClick={() => handleDeleteAttempt(row)}
                              >
                                Re-attempt
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Hapus attempt & Izinkan mengulang dari awal
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-[10px] text-zinc-400 text-right font-medium uppercase tracking-widest">
        Data diperbarui otomatis setiap 30 detik. Klik Refresh untuk update instan.
      </p>

      {/* Log Viewer Modal */}
      <Dialog open={isLogViewerOpen} onOpenChange={setIsLogViewerOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 rounded-3xl">
          <DialogHeader className="px-8 pt-8 pb-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Log Pelanggaran Anti-Cheat
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-zinc-500">
                  {selectedAttempt ? (studentNames[selectedAttempt.studentId] || selectedAttempt.studentName || "Siswa") : "Siswa"}
                </DialogDescription>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            {!selectedAttempt?.violationLogs || selectedAttempt.violationLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                    Aman!
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    Tidak ditemukan catatan pelanggaran pada attempt ini.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedAttempt.violationLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 group"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        idx === 0 ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600" : "bg-amber-100 dark:bg-amber-950/50 text-amber-600"
                      )}>
                        {idx === 0 ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <WarningTriangle className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none group-hover:text-rose-600 transition-colors">
                          {translateViolationType(log.type)}
                        </h4>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest tabular-nums">
                          {log.at ? format(new Date(log.at), "HH:mm:ss", { locale: idLocale }) : "—"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed break-words">
                        {log.detail || "Tidak ada detail tambahan."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-8 py-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex justify-end">
            <Button
              variant="outline"
              className="rounded-full px-8 font-bold text-xs uppercase tracking-widest"
              onClick={() => setIsLogViewerOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

