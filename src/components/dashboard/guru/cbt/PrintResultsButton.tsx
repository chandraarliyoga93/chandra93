"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportToPdf } from "@/lib/pdf";
import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PrintResultsButtonProps {
  exam: any;
  results: any[];
}

export function PrintResultsButton({ exam, results }: PrintResultsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const columns = [
        { key: "name", header: "Nama Siswa", width: 150 },
        { key: "score", header: "Skor", width: 80, isNumeric: true },
        { key: "timeTaken", header: "Durasi (m)", width: 80, isNumeric: true },
        { key: "violations", header: "Pelanggaran", width: 100, isNumeric: true },
        { key: "submittedAt", header: "Waktu Selesai", width: 150 }
      ];

      const data = results.map(res => ({
        name: res.studentName || "Siswa",
        score: res.score ?? 0,
        timeTaken: res.timeTaken ?? 0,
        violations: res.violations ?? 0,
        submittedAt: res.submittedAt && res.submittedAt !== "-" 
          ? format(new Date(res.submittedAt), "dd MMM yyyy, HH:mm", { locale: idLocale })
          : "-"
      }));

      const examTitle = exam?.title || "Ujian";

      await exportToPdf(data, columns, {
        fileName: `Hasil_${examTitle.replace(/\s+/g, '_')}`,
        title: "Laporan Hasil Ujian",
        subtitle: examTitle,
        type: "gradebook",
        date: format(new Date(), "dd MMMM yyyy", { locale: idLocale })
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="rounded-xl font-bold gap-2 hidden md:flex"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isExporting ? "Mengekspor..." : "Export PDF"}
    </Button>
  );
}
