"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable } from "@/components/data-table/data-table"

interface Student {
  id: string
  name: string
  email: string
  level: number
  xp: number
  joinedAt: string
}

interface V2ClassStudentTableProps {
  students: Student[]
}

export function V2ClassStudentTable({ students }: V2ClassStudentTableProps) {
  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "name",
      header: "Student Name",
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="flex items-center gap-4 px-2">
            <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`} />
              <AvatarFallback className="text-xs font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{student.name}</span>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">{student.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "id",
      header: "Student ID",
      cell: ({ row }) => <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-tighter">{row.original.id}</span>,
    },
    {
      accessorKey: "xp",
      header: "XP Points",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-black text-zinc-950 dark:text-zinc-50 tracking-tight">{row.original.xp.toLocaleString()}</span>
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">XP</span>
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => (
        <div className="h-7 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
          <span className="font-bold text-xs text-zinc-950 dark:text-zinc-50">Lvl {row.original.level}</span>
        </div>
      ),
    }
  ]

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <DataTable table={table} />
  )
}
