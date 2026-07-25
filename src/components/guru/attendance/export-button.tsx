"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { AttendancePDFDocument } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Page } from "iconoir-react";
import { createExportJob } from "@/actions/export-supabase";

interface AttendanceExportButtonProps {
  data: any[];
  attendance: Record<string, string>;
  date: string;
  className: string;
}

export function AttendanceExportButton({ data, attendance, date, className }: AttendanceExportButtonProps) {
  const filename = `Presensi_${className.replace(/\s+/g, '_')}_${date}.pdf`;

  const handleDownload = async () => {
    try {
      await createExportJob({ type: "PDF", filename });
    } catch (error) {
      console.error("Failed to log export job", error);
    }
  };

  const pdfColumns = [
    { key: "name", header: "Nama Siswa", width: "50%" },
    { key: "status", header: "Status", width: "50%", isStatus: true }
  ];

  const pdfData = data.map(student => ({
    name: student.name,
    status: attendance[student.uid] || "-"
  }));

  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount = Object.values(attendance).filter(s => s === "absent").length;
  const excusedCount = Object.values(attendance).filter(s => s === "excused" || s === "sakit").length;
  const lateCount = Object.values(attendance).filter(s => s === "late").length;

  return (
    <PDFDownloadLink
      document={
        <AttendancePDFDocument 
          header={{
            title: "Laporan Presensi Siswa",
            subtitle: "Presensi Harian",
            className: className,
            date: date
          }}
          columns={pdfColumns}
          data={pdfData}
          summary={{
            present: presentCount,
            absent: absentCount,
            excused: excusedCount,
            late: lateCount,
            total: data.length
          }}
        />
      }
      fileName={filename}
    >
      {({ loading }) => (
        <Button 
          variant="outline" 
          size="sm" 
          disabled={loading} 
          className="gap-2"
          onClick={handleDownload}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          ) : (
            <Page className="w-4 h-4" />
          )}
          {loading ? "Menyiapkan..." : "Export PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
