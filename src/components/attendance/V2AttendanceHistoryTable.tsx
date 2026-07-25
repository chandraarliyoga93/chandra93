"use client";

import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import AttendanceDetailSheet from "@/components/attendance/AttendanceDetailSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataPagination } from "@/components/ui/data-pagination";
import { useQueryStates } from "nuqs";
import { attendanceHistorySearchParams } from "@/lib/parsers";
import { AttendanceExportDialog } from "./AttendanceExportDialog";

interface V2AttendanceHistoryTableProps {
  data: any[];
  totalPages: number;
  classId: string;
  className: string;
}

export function V2AttendanceHistoryTable({ 
  data, 
  totalPages, 
  classId, 
  className,
}: V2AttendanceHistoryTableProps) {
  const [isPending, startTransition] = React.useTransition();
  const [params] = useQueryStates(attendanceHistorySearchParams, {
    shallow: false,
    startTransition,
  });

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "date",
      header: "Tanggal",
      cell: ({ row }) => (
        <div className="font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {format(new Date(row.getValue("date")), "dd MMM yyyy", { locale: idLocale })}
        </div>
      ),
    },
    {
      accessorKey: "presentCount",
      header: "Hadir",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-black text-zinc-900 dark:text-zinc-50">{row.original.presentCount}</span>
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">/ {row.original.totalStudents} Siswa</span>
        </div>
      ),
    },
    {
      accessorKey: "attendancePercentage",
      header: "Persentase Kehadiran",
      cell: ({ row }) => {
        const percentage = row.getValue("attendancePercentage") as number;
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden w-32">
              <div 
                className={cn(
                  "h-full transition-all duration-700",
                  percentage >= 85 ? "bg-zinc-900 dark:bg-zinc-100" : 
                  percentage >= 70 ? "bg-zinc-500" : "bg-zinc-300"
                )} 
                style={{ width: `${percentage}%` }} 
              />
            </div>
            <span className="font-bold text-xs tabular-nums w-8 text-zinc-600 dark:text-zinc-400">{percentage}%</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-2">
          <button
            onClick={() => {
              setSelectedDate(row.original.date);
              setIsSheetOpen(true);
            }}
            className="inline-flex h-8 items-center justify-center rounded-lg px-4 border border-zinc-200 bg-white text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            Detail
          </button>
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className={cn("space-y-6 transition-opacity duration-200", isPending && "opacity-50 pointer-events-none")}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Data Riwayat</h3>
          <p className="text-xs text-zinc-500 font-medium">Lihat dan kelola riwayat presensi siswa</p>
        </div>
        <AttendanceExportDialog classId={classId} className={className} />
      </div>

      <div className="rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xl">
        <div className="relative overflow-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent h-14">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-zinc-500 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-widest pl-8">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group border-b border-zinc-100 dark:border-zinc-900 last:border-0 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="pl-8 py-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-zinc-500 dark:text-zinc-400 italic font-medium">
                    Belum ada riwayat presensi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <DataPagination 
          totalPages={totalPages} 
          currentPage={params.page || 1} 
        />
      </div>

      <AttendanceDetailSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        classId={classId}
        date={selectedDate || ""}
      />
    </div>
  );
}
