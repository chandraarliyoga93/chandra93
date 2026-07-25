"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type ExportFormat = "xlsx" | "pdf";

export interface ExportPreviewData {
  columns: { key: string; header: string }[];
  previewRows: Record<string, unknown>[];
  totalCount: number;
  defaultFileName: string;
  title?: string;
  subtitle?: string;
  supportsPdf?: boolean;
}

interface ExportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportPreviewData | null;
  onConfirm: (format: ExportFormat, fileName: string) => void;
  isExporting?: boolean;
}

export function ExportPreviewModal({
  open,
  onOpenChange,
  data,
  onConfirm,
  isExporting = false,
}: ExportPreviewModalProps) {
  const [format, setFormat] = React.useState<ExportFormat>("xlsx");
  const [fileName, setFileName] = React.useState("");

  React.useEffect(() => {
    if (data) {
      setFileName(data.defaultFileName || "export");
    }
  }, [data]);

  const handleConfirm = () => {
    if (data) {
      onConfirm(format, fileName);
    }
  };

  if (!data) return null;

  const canExportPdf = data.supportsPdf !== false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="w-5 h-5 text-primary" />
            Konfirmasi Ekspor
          </DialogTitle>
          <DialogDescription>
            Tinjau data dan pilih format ekspor yang diinginkan
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-sm font-medium">
                Nama File
              </Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Masukkan nama file"
                disabled={isExporting}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Data</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                <Badge variant="secondary" className="mr-2">
                  {data.totalCount}
                </Badge>
                <span className="text-sm text-muted-foreground">baris data</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Format Ekspor</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="grid grid-cols-2 gap-3"
              disabled={isExporting}
            >
              <div
                className={cn(
                  "relative flex items-center space-x-3 rounded-lg border p-4 transition-all cursor-pointer",
                  format === "xlsx"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="xlsx" id="xlsx" className="sr-only" />
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    format === "xlsx" ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"
                  )}
                >
                  <FileSpreadsheet
                    className={cn(
                      "h-5 w-5",
                      format === "xlsx" ? "text-green-600" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="xlsx" className="cursor-pointer">
                    <span className="font-medium block">Excel (.xlsx)</span>
                    <span className="text-xs text-muted-foreground">
                      Spreadsheet dengan format rapi
                    </span>
                  </Label>
                </div>
                {format === "xlsx" && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-green-500 text-white text-xs">Pilihan</Badge>
                  </div>
                )}
              </div>

              {canExportPdf && (
                <div
                  className={cn(
                    "relative flex items-center space-x-3 rounded-lg border p-4 transition-all cursor-pointer",
                    format === "pdf"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      format === "pdf" ? "bg-red-100 dark:bg-red-900/40" : "bg-muted"
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-5 w-5",
                        format === "pdf" ? "text-red-600" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="pdf" className="cursor-pointer">
                      <span className="font-medium block">PDF (.pdf)</span>
                      <span className="text-xs text-muted-foreground">
                        Dokumen siap cetak
                      </span>
                    </Label>
                  </div>
                  {format === "pdf" && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-red-500 text-white text-xs">Pilihan</Badge>
                    </div>
                  )}
                </div>
              )}
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex-1 min-h-0 flex flex-col">
            <Label className="text-sm font-medium mb-2">Pratinjau Data</Label>
            <div className="flex-1 border rounded-lg overflow-hidden bg-background">
              <ScrollArea className="h-[200px]">
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {data.columns.slice(0, 5).map((col) => (
                          <th
                            key={col.key}
                            className="text-left p-2 font-medium text-muted-foreground"
                          >
                            {col.header}
                          </th>
                        ))}
                        {data.columns.length > 5 && (
                          <th className="text-left p-2 text-muted-foreground">
                            +{data.columns.length - 5} kolom
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.previewRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          {data.columns.slice(0, 5).map((col) => (
                            <td key={col.key} className="p-2 truncate max-w-[150px]">
                              {String(row[col.key] ?? "-")}
                            </td>
                          ))}
                          {data.columns.length > 5 && (
                            <td className="p-2 text-muted-foreground">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.previewRows.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Tidak ada data untuk ditampilkan
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Menampilkan {Math.min(data.previewRows.length, 10)} dari {data.totalCount} baris
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isExporting || !fileName.trim()}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Memproses...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Unduh {format === "xlsx" ? "Excel" : "PDF"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
