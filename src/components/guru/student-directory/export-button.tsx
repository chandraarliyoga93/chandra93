"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Student } from "@/types/student";
import { exportToExcel } from "@/lib/excel";
import { createExportJob, updateExportStatus } from "@/actions/export-supabase";
import { toast } from "sonner";

interface StudentExportButtonProps {
  students: Student[];
}

export function StudentExportButton({ students }: StudentExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (students.length === 0) {
      toast.error("Tidak ada data siswa untuk diekspor");
      return;
    }

    setIsExporting(true);
    const filename = `daftar-siswa-${new Date().toISOString().split("T")[0]}`;

    try {
      // 1. Create export job (log starting)
      const job: any = await createExportJob({ type: "XLSX", filename: `${filename}.xlsx` });

      const columns = [
        { key: "studentId", header: "ID Siswa", width: 15 },
        { key: "name", header: "Nama Lengkap", width: 35 },
        { key: "email", header: "Email", width: 35 },
        { key: "className", header: "Kelas", width: 15 },
        { key: "status", header: "Status", width: 15 },
      ];

      const data = students.map(s => ({
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        className: s.className || "-",
        status: s.attendanceSummary || "-"
      }));

      const exportOptions = {
        fileName: filename,
        title: "Daftar Direktori Siswa",
        sheetName: "Siswa",
        includeDate: true
      };

      if (job.success && job.id) {
        await exportToExcel(data, columns, exportOptions);
        await updateExportStatus(job.id, "complete");
        toast.success("Data siswa berhasil diekspor");
      } else {
        await exportToExcel(data, columns, exportOptions);
        toast.success("Data siswa berhasil diekspor");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data siswa");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span>Ekspor Excel</span>
    </Button>
  );
}
