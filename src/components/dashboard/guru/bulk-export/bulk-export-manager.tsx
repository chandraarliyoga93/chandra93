"use client";

import { useState, useEffect } from "react";
import {
  generateExportSummary,
} from "@/lib/bulk-export";
import {
  exportBulkDataToExcel,
} from "@/lib/client-export";
import {
  type BulkExportData,
  type ExportSummary,
} from "@/types/bulk-export";
import { getBulkExportDataSupabase } from "@/actions/bulk-export-supabase";
import { getGuruClassesSupabase, type ClassData } from "@/actions/classes-supabase";
import { createExportJobSupabase } from "@/actions/export-supabase";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";

interface BulkExportManagerProps {
  onExportComplete?: () => void;
}

export function BulkExportManager({ onExportComplete }: BulkExportManagerProps) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [term, setTerm] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "pdf">("xlsx");
  const [isLoading, setIsLoading] = useState(false);
  const [exportData, setExportData] = useState<BulkExportData | null>(null);
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const result = await getGuruClassesSupabase({ pageSize: 100 });
      setClasses(result.data || []);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedClassId || !term) return;
    
    setIsLoading(true);
    try {
      const result = await getBulkExportDataSupabase({ classId: selectedClassId, term });
      if (!result.success || !result.data) {
        console.error("Error loading export data:", result.error || "Unknown error");
        return;
      }
      setExportData(result.data);
      setSummary(generateExportSummary(result.data));
    } catch (error) {
      console.error("Error loading export data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportData) return;
    
    setIsLoading(true);
    try {
      // Log the export action
      const safeClassName = exportData.classInfo.name.replace(/[^a-zA-Z0-9]/g, "_");
      await createExportJobSupabase({
        type: exportFormat.toUpperCase() as "PDF" | "XLSX",
        filename: `Bulk_Export_${safeClassName}_${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`
      });

      // Perform the export
      if (exportFormat === "xlsx") {
        await exportBulkDataToExcel(exportData);
      } else {
        // For PDF, we'll use a simple download approach
        // The actual PDF generation would be implemented similarly to Excel
        await exportBulkDataToExcel(exportData); // Fallback to Excel for now
      }

      onExportComplete?.();
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Export Bulk</CardTitle>
          <CardDescription>
            Pilih kelas dan term untuk mengexport semua data siswa, kehadiran, dan nilai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Class Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kelas</label>
              <Select 
                value={selectedClassId} 
                onValueChange={setSelectedClassId}
                disabled={isLoadingClasses}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.studentCount} siswa)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Term Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih term..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025-Ganjil">2024/2025 Ganjil</SelectItem>
                  <SelectItem value="2024/2025-Genap">2024/2025 Genap</SelectItem>
                  <SelectItem value="2025/2026-Ganjil">2025/2026 Ganjil</SelectItem>
                  <SelectItem value="2025/2026-Genap">2025/2026 Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select 
                value={exportFormat} 
                onValueChange={(v) => setExportFormat(v as "xlsx" | "pdf")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview Button */}
          <Button 
            onClick={handlePreview}
            disabled={!selectedClassId || !term || isLoading}
            variant="outline"
          >
            {isLoading && !exportData ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : (
              "Preview Data"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Summary Card */}
      {summary && exportData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data: {exportData.classInfo.name}</CardTitle>
            <CardDescription>
              Term: {exportData.classInfo.term} | Tanggal Export: {format(new Date(), "dd/MM/yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.studentCount}</div>
                <div className="text-sm text-blue-800">Total Siswa</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{summary.attendanceDays}</div>
                <div className="text-sm text-orange-800">Hari Kehadiran</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.assignmentCount}</div>
                <div className="text-sm text-green-800">Total Tugas/Nilai</div>
              </div>
            </div>

            {/* Export Button */}
            <Button 
              onClick={handleExport}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengexport...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export ke {exportFormat === "xlsx" ? "Excel" : "PDF"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoadingClasses && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
