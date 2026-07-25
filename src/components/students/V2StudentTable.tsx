"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DataTable } from "@/components/data-table/data-table"
import { Student } from "@/types/student"
import { DataTableExportButton } from "@/components/data-table/data-table-export-button"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { GraduationCap, Calendar, GraphUp, Eye, Coins } from "iconoir-react"
import { cn } from "@/lib/utils"

import { useQueryStates } from "nuqs"
import { studentSearchParams } from "@/lib/parsers"

interface V2StudentTableProps {
  data: Student[]
  pageCount: number
  totalCount: number
}

export function V2StudentTable({ data, pageCount, totalCount }: V2StudentTableProps) {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [searchParams, setSearchParams] = useQueryStates(studentSearchParams, {
    shallow: false,
  })

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Nama Siswa" />
      ),
      cell: ({ row }) => {
        const student = row.original
        return (
          <div 
            className="flex items-center gap-3 cursor-pointer group/name"
            onClick={() => {
              setSelectedStudent(student)
              setIsSheetOpen(true)
            }}
          >
            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 transition-transform group-hover/name:scale-105">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} />
              <AvatarFallback className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover/name:text-zinc-600 dark:group-hover/name:text-zinc-400 transition-colors">
                {student.name}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {student.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "studentId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="NIS" />
      ),
      cell: ({ row }) => (
        <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          {row.getValue("studentId")}
        </code>
      ),
    },
    {
      accessorKey: "className",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Kelas" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-zinc-400" />
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            {row.getValue("className") || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "xp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="XP" />
      ),
      cell: ({ row }) => (
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {row.original.xp.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "guruCoin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Koin" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <Coins className="w-3 h-3 text-yellow-600" />
          </div>
          <span className="font-black text-zinc-900 dark:text-zinc-100">
            {row.original.guruCoin.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "attendanceSummary",
      header: "Kehadiran",
      cell: ({ row }) => {
        const status = row.getValue("attendanceSummary") as string
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "rounded-full px-3 py-0.5 font-medium border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
              status === "Hadir" && "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            )}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "lastGradeSnapshot",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Nilai" />
      ),
      cell: ({ row }) => {
        const grade = row.getValue("lastGradeSnapshot") as number | string
        const gradeNum = typeof grade === "string" ? parseFloat(grade) : grade
        return (
          <div className="flex items-center gap-2">
            <GraphUp className={cn(
              "h-4 w-4",
              gradeNum >= 80 ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
            )} />
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {gradeNum}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const student = row.original
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            onClick={() => {
              setSelectedStudent(student)
              setIsSheetOpen(true)
            }}
          >
            <Eye className="h-4 w-4 text-zinc-500" />
            <span className="sr-only">Lihat Profil</span>
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(table.getState().pagination) : updater;
      void setSearchParams({ page: next.pageIndex + 1, pageSize: next.pageSize });
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(table.getState().sorting) : updater;
      if (next.length > 0) {
        void setSearchParams({ 
          sortBy: next[0].id, 
          sortOrder: next[0].desc ? "desc" : "asc",
          page: 1 // Reset to page 1 on sort
        });
      } else {
        void setSearchParams({ sortBy: "name", sortOrder: "asc", page: 1 });
      }
    },
    state: {
      pagination: {
        pageIndex: (searchParams.page || 1) - 1,
        pageSize: searchParams.pageSize || 10,
      },
      sorting: [
        {
          id: searchParams.sortBy || "name",
          desc: searchParams.sortOrder === "desc",
        },
      ],
    },
  })

  return (
    <>
      <DataTable
        table={table}
        onRowClick={(student) => {
          setSelectedStudent(student)
          setIsSheetOpen(true)
        }}
      >
        <div className="flex items-center justify-end mb-4">
          <DataTableExportButton 
            table={table} 
            fileName="daftar-siswa"
            title="Daftar Siswa"
            subtitle="Seluruh data siswa terdaftar"
          />
        </div>
      </DataTable>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md border-l-zinc-200 dark:border-l-zinc-800">
          {selectedStudent && (
            <div className="flex flex-col gap-8 py-4">
              <SheetHeader className="text-left space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-zinc-200 dark:border-zinc-800">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.id}`} />
                    <AvatarFallback className="text-xl">
                      {selectedStudent.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <SheetTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {selectedStudent.name}
                    </SheetTitle>
                    <SheetDescription className="text-zinc-500 dark:text-zinc-400">
                      {selectedStudent.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-950/50 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">NIS</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedStudent.studentId}</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-950/50 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Kelas</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedStudent.className || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-950/50 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Level</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">Lvl {selectedStudent.level}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-950/50 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">XP</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedStudent.xp.toLocaleString()} pts</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 px-1">Ringkasan Akademik</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                        <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Presensi</span>
                    </div>
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                      {selectedStudent.attendanceSummary}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                        <GraphUp className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Rata-rata Nilai</span>
                    </div>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedStudent.lastGradeSnapshot}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex gap-3">
                <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => setIsSheetOpen(false)}>
                  Tutup
                </Button>
                <Button className="flex-1 rounded-2xl h-12 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all">
                  Edit Profil
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
