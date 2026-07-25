"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ClassData, deleteClassSupabase as deleteClass } from "@/actions/classes-supabase"
import { Group, Key, MoreHoriz, EditPencil, Trash } from "iconoir-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/use-modal"
import { toast } from "sonner"
import { UpdateClassDialog } from "./UpdateClassDialog"

interface V2ClassesTableProps {
  data: ClassData[]
  totalPages: number
  currentPage: number
}

export function V2ClassesTable({ data, totalPages, currentPage }: V2ClassesTableProps) {
  const { onOpen } = useModal();
  const [editingClass, setEditingClass] = React.useState<ClassData | null>(null);

  const columns = React.useMemo<ColumnDef<ClassData>[]>(() => [
    {
      accessorKey: "name",
      header: "Nama Kelas",
      cell: ({ row }) => {
        const cls = row.original
        return (
          <Link
            href={`/dashboard/guru/classes/${cls.id}`}
            className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            {cls.name}
          </Link>
        )
      },
    },
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-zinc-400" aria-hidden="true" />
          <code className="relative rounded bg-zinc-100 px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            {row.getValue("code")}
          </code>
        </div>
      ),
    },
    {
      accessorKey: "studentCount",
      header: "Jumlah Siswa",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Group className="w-4 h-4 text-zinc-400" aria-hidden="true" />
          <span className="text-zinc-600 dark:text-zinc-400">
            {row.getValue("studentCount")} Siswa
          </span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal Dibuat",
      cell: ({ row }) => {
        const dateString = row.getValue("createdAt") as string
        return (
          <span className="text-zinc-500 dark:text-zinc-500 text-sm">
            {format(new Date(dateString), "dd MMMM yyyy", { locale: id })}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                  <MoreHoriz className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Menu aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 dark:border-zinc-800">
                <DropdownMenuItem 
                  className="gap-2 font-medium cursor-pointer"
                  onClick={() => setEditingClass(cls)}
                >
                  <EditPencil className="h-4 w-4" aria-hidden="true" />
                  Edit Kelas
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10 cursor-pointer"
                  onClick={() => onOpen("alert", {
                    title: "Hapus Kelas?",
                    description: "Tindakan ini tidak dapat dibatalkan. Seluruh data siswa dan materi di kelas ini akan tetap ada namun hubungan kelas akan dihapus.",
                    confirmText: "Ya, Hapus",
                    onConfirm: async () => {
                      try {
                        const result = await deleteClass(cls.id);
                        if (result.success) {
                          toast.success("Berhasil!", { description: "Kelas berhasil dihapus" });
                        } else {
                          toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus kelas" });
                        }
                      } catch {
                        toast.error("Terjadi Kesalahan", { description: "Terjadi kesalahan sistem" });
                      }
                    }
                  })}
                >
                  <Trash className="h-4 w-4" aria-hidden="true" />
                  Hapus Kelas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [onOpen]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="space-y-6">
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent h-14">
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
                <TableCell colSpan={columns.length} className="h-32 text-center text-zinc-500 dark:text-zinc-400 italic">
                  Belum ada data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <DataPagination 
        totalPages={totalPages} 
        currentPage={currentPage} 
      />

      {editingClass && (
        <UpdateClassDialog
          classData={editingClass}
          open={!!editingClass}
          onOpenChange={(open) => !open && setEditingClass(null)}
        />
      )}
    </div>
  )
}
