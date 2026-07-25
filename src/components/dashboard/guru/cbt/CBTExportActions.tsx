"use client";

import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Page,
  NavArrowDown
} from "iconoir-react";
import { Loader2 } from "lucide-react";
import { exportToPdf } from "@/lib/pdf";
import { exportCBTToExcel } from "@/lib/export-cbt";
import { Exam, ExamAttempt } from "@/types/exam";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

interface CBTExportActionsProps {
  exam: Exam;
  results: ExamAttempt[];
}

export function CBTExportActions({ exam, results }: CBTExportActionsProps) {
  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null);
  const classNameById = new Map(
    (exam.assignments || []).map((assignment) => [assignment.classId, assignment.class?.name || "Tanpa Kelas"])
  );

  const handleExportPdf = async () => {
    if (!results || results.length === 0) {
      toast.error("Tidak ada data hasil ujian untuk diekspor");
      return;
    }

    setIsExporting("pdf");
    const toastId = toast.loading("Menyiapkan PDF...");
    
    try {
      const columns = [
        { key: "name", header: "Nama Siswa", width: 150 },
        { key: "score", header: "Skor", width: 80, isNumeric: true },
        { key: "timeTaken", header: "Durasi (m)", width: 80, isNumeric: true },
        { key: "violations", header: "Pelanggaran", width: 100, isNumeric: true },
        { key: "submittedAt", header: "Waktu Selesai", width: 150 }
      ];

      const data = [...results]
        .map((res) => ({
          className: (res.classId ? classNameById.get(res.classId) : undefined) || "Tanpa Kelas",
          name: res.studentName || "Siswa",
          score: res.score ?? 0,
          timeTaken: res.timeTaken ?? 0,
          violations: res.violations ?? 0,
          submittedAt:
            res.submittedAt && res.submittedAt !== "-"
              ? format(new Date(res.submittedAt), "dd MMM yyyy, HH:mm", { locale: idLocale })
              : "-",
        }))
        .sort((a, b) => {
          const classDiff = a.className.localeCompare(b.className);
          if (classDiff !== 0) return classDiff;
          return a.name.localeCompare(b.name);
        });

      const examTitle = exam?.title || "Ujian";
      
      await exportToPdf(data, columns, {
        fileName: `Hasil_${examTitle.replace(/\s+/g, '_')}`,
        title: "Laporan Hasil Ujian",
        subtitle: examTitle,
        type: "gradebook",
        date: format(new Date(), "dd MMMM yyyy", { locale: idLocale }),
        groupByKey: "className",
        groupLabel: "Kelas",
      });

      toast.success("PDF berhasil diunduh", { id: toastId });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal mengekspor PDF: ${errorMessage}`, { id: toastId });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting("excel");
    const toastId = toast.loading("Menyiapkan Excel...");

    try {
      const enrichedResults = results.map((res) => ({
        ...res,
        className: (res.classId ? classNameById.get(res.classId) : undefined) || "Tanpa Kelas",
      }));
      await exportCBTToExcel(exam, enrichedResults);
      toast.success("Excel berhasil diunduh", { id: toastId });
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast.error("Gagal mengekspor Excel", { id: toastId });
    } finally {
      setIsExporting(null);
    }
  };

  const isLoading = isExporting !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="rounded-xl font-bold gap-2 min-w-[160px] justify-between"
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isLoading ? "Mengekspor..." : "Download Hasil"}
          </span>
          <NavArrowDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
        <DropdownMenuItem 
          onClick={handleExportPdf}
          className="gap-2 cursor-pointer py-2.5"
          disabled={isLoading}
        >
          <Page className="w-4 h-4 text-red-500" />
          <span>Export PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportExcel}
          className="gap-2 cursor-pointer py-2.5"
          disabled={isLoading}
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
