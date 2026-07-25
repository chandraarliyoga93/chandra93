"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Send, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { FileUploader } from "@/components/admin/import/FileUploader";
import { ValidationSummary } from "@/components/admin/import/ValidationSummary";
import { ImportPreviewTable } from "@/components/admin/import/ImportPreviewTable";
import { ImportActionButtons } from "@/components/admin/import/ImportActionButtons";

import { type ParsedStudentRecord } from "@/lib/student-import";
import { importStudentsAction } from "@/actions/admin-student";

export default function ImportClient() {
  const router = useRouter();
  const [data, setData] = React.useState<ParsedStudentRecord[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const hasData = data.length > 0;
  const hasErrors = data.some((item) => item.status !== "VALID");

  const handleDataLoaded = (loadedData: ParsedStudentRecord[]) => {
    setData(loadedData);
  };

  const handleClear = () => {
    setData([]);
  };

  const handleProcess = async () => {
    if (hasErrors || !hasData) {
      toast.error("Ada data yang bermasalah. Perbaiki sebelum memproses.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Sedang mengimpor data siswa...");

    try {
      // Filter only valid records and map to the format expected by the server action
      const validStudents = data
        .filter((item) => item.status === "VALID")
        .map((item) => ({
          username: item.username,
          name: item.name,
          email: item.email || undefined,
        }));

      const result = await importStudentsAction(validStudents);

      if (result.success) {
        toast.success(
          `Berhasil mengimpor ${result.summary?.imported} siswa baru dan memperbarui ${result.summary?.updated} data siswa.`,
          { id: toastId }
        );
        router.push("/dashboard/guru/admin");
      } else {
        toast.error(result.error || "Gagal mengimpor data siswa", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("IMPORT_CLIENT_ERROR:", error);
      toast.error("Terjadi kesalahan sistem saat mengimpor data", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Impor Siswa</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Daftarkan siswa secara massal dengan mengunggah file Excel (.xlsx).
          </p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/guru/admin")}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Pendaftaran Manual
          </Button>
        </div>
      </div>

      <Separator />

      {/* Step 1: File Upload */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </div>
          <h2 className="text-lg font-semibold">Unggah File</h2>
        </div>
        <FileUploader
          onDataLoaded={handleDataLoaded}
          onClear={handleClear}
          isLoading={isProcessing}
        />
      </div>

      {/* Step 2: Validation & Preview (Only if data exists) */}
      {hasData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Separator />
          
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </div>
            <h2 className="text-lg font-semibold">Validasi & Pratinjau</h2>
          </div>

          <ValidationSummary data={data} />
          
          <ImportPreviewTable data={data} />

          <ImportActionButtons
            onProcess={handleProcess}
            onClear={handleClear}
            hasErrors={hasErrors}
            isProcessing={isProcessing}
            hasData={hasData}
          />
        </div>
      )}
    </div>
  );
}
