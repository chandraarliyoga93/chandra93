"use client";

import * as React from "react";
import { Upload, FileSpreadsheet, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { downloadStudentImportTemplate, parseStudentExcel, type ParsedStudentRecord } from "@/lib/student-import";
import { toast } from "sonner";

interface FileUploaderProps {
  onDataLoaded: (data: ParsedStudentRecord[]) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function FileUploader({ onDataLoaded, onClear, isLoading }: FileUploaderProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Format file tidak valid. Gunakan file .xlsx atau .xls");
      return;
    }

    setFile(selectedFile);
    try {
      const data = await parseStudentExcel(selectedFile);
      onDataLoaded(data);
      toast.success(`Berhasil membaca ${data.length} data siswa`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membaca file");
      setFile(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileChange(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "relative overflow-hidden border-2 border-dashed transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted",
          file ? "border-solid bg-muted/30" : "hover:border-primary/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-10">
          {!file ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Unggah File Siswa</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Tarik dan lepas file .xlsx Anda di sini, atau klik untuk memilih file
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Pilih File
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                  <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={onFileSelect}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          Pastikan format file sesuai dengan template yang disediakan.
        </p>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs text-primary"
          onClick={downloadStudentImportTemplate}
        >
          <Download className="mr-1 h-3 w-3" />
          Unduh Template (.xlsx)
        </Button>
      </div>
    </div>
  );
}
