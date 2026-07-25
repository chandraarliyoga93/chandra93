"use client";

import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHoriz, Trash, EditPencil, Notes } from "iconoir-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { deleteTask, Task } from "@/actions/tasks-supabase";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import { CreateTaskDialog } from "./CreateTaskDialog";

interface V2TasksTableProps {
  tasks: Task[];
  totalPages: number;
  currentPage: number;
}

export function V2TasksTable({ tasks, totalPages, currentPage }: V2TasksTableProps) {
  const { onOpen } = useModal();
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  const columns = React.useMemo<ColumnDef<Task>[]>(() => [
    {
      accessorKey: "title",
      header: "Judul Tugas",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <Notes className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight text-zinc-900 dark:text-zinc-100">
              {row.original.title}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              Tugas Kelas
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1 max-w-[300px]">
          {row.original.description || "Tidak ada deskripsi"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex justify-end gap-2">
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
                  onClick={() => setEditingTask(task)}
                >
                  <EditPencil className="h-4 w-4" aria-hidden="true" />
                  Edit Tugas
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-900/10 font-bold gap-2 cursor-pointer"
                  onClick={() => onOpen("alert", {
                    title: "Hapus Tugas?",
                    description: "Tindakan ini akan menghapus tugas beserta SELURUH nilai siswa terkait. Tindakan ini tidak dapat dibatalkan.",
                    confirmText: "Ya, Hapus",
                    onConfirm: async () => {
                      try {
                        const result = await deleteTask(task.id, task.classId);
                        if (result.success) {
                          toast.success("Tugas berhasil dihapus");
                        } else {
                          toast.error(result.error || "Gagal menghapus tugas");
                        }
                      } catch {
                        toast.error("Terjadi kesalahan sistem");
                      }
                    }
                  })}
                >
                  <Trash className="size-4" aria-hidden="true" />
                  Hapus Tugas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onOpen]);

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

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
                  Tidak ada tugas yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <DataPagination 
          totalPages={totalPages} 
          currentPage={currentPage} 
        />
      )}

      {editingTask && (
        <CreateTaskDialog
          classId={editingTask.classId}
          initialData={editingTask}
          open={!!editingTask}
          onOpenChange={(open: boolean) => !open && setEditingTask(null)}
        />
      )}
    </div>
  );
}
