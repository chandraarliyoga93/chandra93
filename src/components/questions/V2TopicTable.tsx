"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Folder, Eye, MoreHoriz, Trash, EditPencil, Search, Plus } from "iconoir-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import { deleteTopicSupabase } from "@/actions/questions-supabase"
import { useModal } from "@/hooks/use-modal"
import { toast } from "sonner"
import { UpdateTopicDialog } from "./UpdateTopicDialog"
import { CreateQuestionDialog } from "./CreateQuestionDialog"
import { useQueryState } from "nuqs"

interface QuestionTopic {
  id: string;
  name: string;
  count: number;
}

interface V2TopicTableProps {
  topics: QuestionTopic[]
  totalPages: number
  currentPage: number
}

export function V2TopicTable({ topics, totalPages, currentPage }: V2TopicTableProps) {
  const { onOpen } = useModal();
  const [editingTopic, setEditingTopic] = React.useState<QuestionTopic | null>(null);
  const [search, setSearch] = useQueryState("search", {
    shallow: false,
    throttleMs: 500,
  });

  const columns = React.useMemo<ColumnDef<QuestionTopic>[]>(() => [
    {
      accessorKey: "name",
      header: "Nama Topik",
      cell: ({ row }) => (
        <Link 
          href={`/dashboard/guru/bank-soal/${row.original.id}`} 
          className="flex items-center gap-3 group/link"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover/link:bg-zinc-900 group-hover/link:text-white transition-all">
            <Folder className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight text-zinc-900 dark:text-zinc-100">{row.original.name}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1">Topik Pembelajaran</span>
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "count",
      header: "Jumlah Soal",
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-lg font-black text-[10px] px-2.5 bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          {row.original.count || 0} Soal
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const topic = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button 
              asChild 
              variant="ghost" 
              size="sm" 
              className="h-8 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2"
            >
              <Link href={`/dashboard/guru/bank-soal/${topic.id}`}>
                <Eye className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Buka</span>
              </Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                  <MoreHoriz className="size-4" aria-hidden="true" />
                  <span className="sr-only">Menu aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 dark:border-zinc-800">
                <DropdownMenuItem 
                  className="gap-2 font-medium cursor-pointer"
                  onClick={() => setEditingTopic(topic)}
                >
                  <EditPencil className="h-4 w-4" aria-hidden="true" />
                  Edit Nama Topik
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-900/10 font-bold gap-2 cursor-pointer"
                  onClick={() => onOpen("alert", {
                    title: "Hapus Topik?",
                    description: "Tindakan ini akan menghapus topik beserta SELURUH soal di dalamnya. Tindakan ini tidak dapat dibatalkan.",
                    confirmText: "Ya, Hapus Semua",
                    onConfirm: async () => {
                      try {
                        const result = await deleteTopicSupabase(topic.id);
                        if (result.success) {
                          toast.success("Berhasil!", { description: "Topik dan soal berhasil dihapus" });
                        } else {
                          toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus topik" });
                        }
                      } catch {
                        toast.error("Terjadi Kesalahan", { description: "Terjadi kesalahan sistem" });
                      }
                    }
                  })}
                >
                  <Trash className="size-4" aria-hidden="true" />
                  Hapus Topik
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [onOpen]);

  const table = useReactTable({
    data: topics,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="space-y-6">
      <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Cari topik..."
            defaultValue={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 transition-all"
          />
        </div>
        <CreateQuestionDialog 
          trigger={
            <Button className="gap-2 rounded-xl h-11 px-6 font-bold" variant="outline">
              <Plus className="w-4 h-4" />
              Tambah Topik
            </Button>
          }
        />
      </div>
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

      {editingTopic && (
        <UpdateTopicDialog
          topic={editingTopic}
          open={!!editingTopic}
          onOpenChange={(open) => !open && setEditingTopic(null)}
        />
      )}
    </div>
  )
}
