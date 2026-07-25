"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { Journal, deleteJournalSupabase as deleteJournal } from "@/actions/journals-supabase"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Book,
  Journal as JournalIcon,
  Activity,
  MoreHoriz,
  EditPencil,
  Trash
} from "iconoir-react"
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
import { UpdateJournalDialog } from "./UpdateJournalDialog"

interface V2JournalTableProps {
  data: Journal[]
  totalPages: number
  currentPage: number
  classes: { id: string; name: string }[]
}

const moodMap: Record<string, string> = {
  "😊": "Senang",
  "😐": "Biasa",
  "😔": "Sedih",
  "😠": "Kesal",
  "😴": "Mengantuk",
}

export function V2JournalTable({ data, totalPages, currentPage, classes }: V2JournalTableProps) {
  const { onOpen } = useModal();
  const [editingJournal, setEditingJournal] = React.useState<Journal | null>(null);

  const columns = React.useMemo<ColumnDef<Journal>[]>(() => [
    {
      accessorKey: "date",
      header: "Tanggal",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"))
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span className="font-medium">{format(date, "dd MMM yyyy", { locale: id })}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "className",
      header: "Kelas",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Book className="h-4 w-4 text-zinc-400" aria-hidden="true" />
          <span className="text-zinc-600 dark:text-zinc-300">{row.getValue("className")}</span>
        </div>
      ),
    },
    {
      accessorKey: "topic",
      header: "Topik",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <JournalIcon className="h-4 w-4 text-zinc-400" aria-hidden="true" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.getValue("topic")}</span>
        </div>
      ),
    },
    {
      accessorKey: "activities",
      header: "Aktivitas",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[300px]">
          <Activity className="h-4 w-4 text-zinc-400 shrink-0" aria-hidden="true" />
          <span className="text-sm text-zinc-500 truncate dark:text-zinc-400">
            {row.getValue("activities")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "mood",
      header: "Mood",
      cell: ({ row }) => {
        const mood = row.getValue("mood") as string
        return (
          <Badge variant="outline" className="bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 gap-1.5 font-normal">
            <span className="text-base leading-none">{mood}</span>
            <span className="text-xs">{moodMap[mood] || "Biasa"}</span>
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const journal = row.original;
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
                  onClick={() => setEditingJournal(journal)}
                >
                  <EditPencil className="h-4 w-4" aria-hidden="true" />
                  Edit Jurnal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10 cursor-pointer"
                  onClick={() => onOpen("alert", {
                    title: "Hapus Jurnal?",
                    description: "Tindakan ini tidak dapat dibatalkan. Jurnal ini akan dihapus secara permanen.",
                    confirmText: "Ya, Hapus",
                    onConfirm: async () => {
                      try {
                        const result = await deleteJournal(journal.id);
                        if (result.success) {
                          toast.success("Berhasil!", { description: "Jurnal berhasil dihapus" });
                        } else {
                          toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus jurnal" });
                        }
                      } catch {
                        toast.error("Terjadi Kesalahan", { description: "Terjadi kesalahan sistem" });
                      }
                    }
                  })}
                >
                  <Trash className="h-4 w-4" aria-hidden="true" />
                  Hapus Jurnal
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

      {editingJournal && (
        <UpdateJournalDialog
          journal={editingJournal}
          classes={classes}
          open={!!editingJournal}
          onOpenChange={(open) => !open && setEditingJournal(null)}
        />
      )}
    </div>
  )
}
