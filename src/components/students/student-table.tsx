"use client";

import * as React from "react";
import { useQueryStates } from "nuqs";
import { studentSearchParams } from "@/lib/parsers";
import { studentColumns } from "./student-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableExportButton } from "@/components/data-table/data-table-export-button";
import { exportToExcel, type ExportColumn } from "@/lib/excel";
import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Student } from "@/types/student";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, User, Mail, Hash, School, GraduationCap, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentTableProps {
  data: Student[];
  pageCount: number;
  totalCount: number;
}

export function StudentTable({ data, pageCount, totalCount }: StudentTableProps) {
  const [params, setParams] = useQueryStates(studentSearchParams, {
    shallow: true,
    throttleMs: 300,
  });

  const pagination: PaginationState = React.useMemo(() => ({
    pageIndex: params.page - 1,
    pageSize: params.pageSize,
  }), [params.page, params.pageSize]);

  const table = useReactTable({
    data,
    columns: studentColumns,
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      void setParams({ page: next.pageIndex + 1, pageSize: next.pageSize });
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  const selectedStudent = data.find((s) => s.id === params.selected);

  const clearFilters = () => {
    void setParams({ search: "", page: 1, sortBy: "name", sortOrder: "asc" });
  };

  // Define export columns for student data
  const studentExportColumns: ExportColumn[] = [
    { key: "name", header: "Nama", width: 25 },
    { key: "studentId", header: "NIS", width: 15 },
    { key: "className", header: "Kelas", width: 15 },
    { key: "email", header: "Email", width: 30 },
    { key: "attendanceSummary", header: "Kehadiran", width: 15 },
    { key: "lastGradeSnapshot", header: "Nilai", width: 12 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama siswa..."
            value={params.search}
            onChange={(e) => void setParams({ search: e.target.value, page: 1 })}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {params.search && (
            <Button variant="ghost" onClick={clearFilters} size="sm">
              <X className="mr-2 h-4 w-4" />
              Bersihkan Filter
            </Button>
          )}
          <DataTableExportButton
            table={table}
            fileName="data-siswa"
            columns={studentExportColumns}
          />
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{totalCount}</span> siswa
          </div>
        </div>
      </div>

      <DataTable 
        table={table} 
        onRowClick={(student) => void setParams({ selected: student.id })}
      />

      <Sheet 
        open={!!params.selected} 
        onOpenChange={(open) => !open && void setParams({ selected: null })}
      >
        <SheetContent className="sm:max-w-md border-l-2">
          <SheetHeader className="space-y-4">
            <SheetTitle className="text-2xl font-bold">Profil Siswa</SheetTitle>
            <SheetDescription>
              Detail administrasi dan akademik siswa.
            </SheetDescription>
          </SheetHeader>
          
          {selectedStudent ? (
            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedStudent.name)}`} />
                  <AvatarFallback className="text-xl">
                    {selectedStudent.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">{selectedStudent.name}</h3>
                  <Badge variant="secondary" className="font-medium">{selectedStudent.className}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6">
                <div className="grid grid-cols-[24px_1fr] items-start gap-4">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Nomor Induk Siswa (NIS)</p>
                    <p className="font-mono">{selectedStudent.studentId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-[24px_1fr] items-start gap-4">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-[24px_1fr] items-start gap-4">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Nilai Rata-rata Saat Ini</p>
                    <p className="text-2xl font-black text-primary">{selectedStudent.lastGradeSnapshot}</p>
                  </div>
                </div>

                <div className="grid grid-cols-[24px_1fr] items-start gap-4">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status Kehadiran</p>
                    <Badge className="w-fit">{selectedStudent.attendanceSummary}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-[24px_1fr] items-start gap-4">
                  <School className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Level & XP</p>
                    <p className="font-medium">Level {selectedStudent.level} <span className="text-muted-foreground font-normal ml-2">({selectedStudent.xp} XP)</span></p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button className="w-full" variant="outline" onClick={() => void setParams({ selected: null })}>
                  Tutup
                </Button>
              </div>
            </div>
          ) : params.selected ? (
            <div className="mt-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Data siswa tidak ditemukan atau sedang dimuat...</p>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
