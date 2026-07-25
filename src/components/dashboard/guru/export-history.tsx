"use client";

import * as React from "react";
import { Download, Clock, CheckCircle, XCircle, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportJob } from "@/types/export";

interface ExportHistoryProps {
  history: ExportJob[];
  isLoading?: boolean;
  onDownload?: (job: ExportJob) => void;
}

export function ExportHistory({ history, isLoading = false, onDownload }: ExportHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Belum ada riwayat ekspor</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Riwayat ekspor dokumen Anda akan muncul di sini setelah Anda membuat ekspor pertama kali.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Riwayat Ekspor</h2>
          <Badge variant="secondary">{history.length} item</Badge>
        </div>
      </div>

      <div className="border rounded-lg bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Format</TableHead>
              <TableHead>Nama File</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px]">Tipe</TableHead>
              <TableHead className="w-[180px]">Tanggal</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((job) => (
              <TableRow key={job.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {job.type === "XLSX" ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100 dark:bg-green-900/30">
                        <FileSpreadsheet className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-red-100 dark:bg-red-900/30">
                        <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{job.filename}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {job.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {job.createdAt && (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(job.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {job.status === "complete" && job.url && onDownload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(job)}
                      title="Unduh ulang"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    complete: {
      icon: CheckCircle,
      label: "Selesai",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    },
    pending: {
      icon: Clock,
      label: "Menunggu",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
    },
    failed: {
      icon: XCircle,
      label: "Gagal",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
    },
  };

  const { icon: Icon, className, label } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <Icon className="h-3 w-3" />
      <span>{label || status}</span>
    </Badge>
  );
}
