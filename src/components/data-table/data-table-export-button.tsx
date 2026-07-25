"use client";

import { type Table as TanstackTable } from "@tanstack/react-table";
import { Download } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { type ExportColumn } from "@/lib/excel";
import { type PDFTableColumn } from "@/lib/pdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableExportButtonProps<TData> {
  table: TanstackTable<TData>;
  fileName?: string;
  columns?: ExportColumn[];
  title?: string;
  subtitle?: string;
  className?: string;
  date?: string;
  teacherName?: string;
  type?: "attendance" | "gradebook";
  summary?: {
    present: number;
    excused: number;
    late: number;
    absent: number;
    total: number;
  };
}

export function DataTableExportButton<TData>({
  table,
  fileName = "export",
  columns,
  title,
  subtitle,
  className,
  date,
  teacherName,
  type,
  summary,
}: DataTableExportButtonProps<TData>) {
  const handleExportExcel = async () => {
    const { exportToExcel } = await import("@/lib/excel");
    // Get visible rows from the table
    const visibleRows = table.getFilteredRowModel().rows;

    if (visibleRows.length === 0) {
      console.warn("No data to export");
      return;
    }

    // Extract data from rows
    const data = visibleRows.map((row) => row.original);

    // Use provided columns or derive from table columns
    const exportColumns: ExportColumn[] = columns || table.getAllColumns().map((col) => ({
      key: col.id,
      header: typeof col.columnDef.header === "string" 
        ? col.columnDef.header 
        : col.id,
    }));

    // Export to Excel
    await exportToExcel(data as Record<string, unknown>[], exportColumns, {
      fileName,
      sheetName: fileName,
      title: title || fileName,
      subtitle,
      teacherName,
      className,
      includeDate: true,
    });
  };

  const handleExportPdf = async () => {
    const { exportToPdf } = await import("@/lib/pdf");
    // Get visible rows from the table
    const visibleRows = table.getFilteredRowModel().rows;

    if (visibleRows.length === 0) {
      console.warn("No data to export");
      return;
    }

    // Extract data from rows
    const data = visibleRows.map((row) => row.original);

    // Use provided columns or derive from table columns
    const pdfColumns: PDFTableColumn[] = table.getAllColumns().map((col) => {
      // Sample first row to determine if column is numeric
      const firstRowData = visibleRows[0]?.original;
      const sampleValue = (firstRowData as Record<string, unknown>)?.[col.id];
      const isNumeric = typeof sampleValue === "number";
      
      return {
        key: col.id,
        header: typeof col.columnDef.header === "string" 
          ? col.columnDef.header 
          : col.id,
        width: 120,
        isNumeric,
      };
    });

    // Export to PDF
    await exportToPdf(data as Record<string, unknown>[], pdfColumns, {
      fileName,
      title: title || fileName,
      subtitle,
      className,
      date,
      teacherName,
      type: type || "gradebook",
      summary,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <Download className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        {type && (
          <DropdownMenuItem onClick={handleExportPdf}>
            <Download className="mr-2 h-4 w-4" />
            PDF (.pdf)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
