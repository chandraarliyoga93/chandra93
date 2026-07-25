"use client";

import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Page, Plus, Search } from "iconoir-react";
import { MoreHorizontal, Trash, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePassageSupabase as deletePassage } from "@/actions/passages-supabase";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import { CreatePassageDialog } from "./CreatePassageDialog";
import { Passage } from "@/types/exam";
import { MathRenderer } from "@/components/ui/math-renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useQueryStates } from "nuqs";
import { passageSearchParams } from "@/lib/parsers";
import { DataPagination } from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PassageTableProps {
  passages: Passage[];
  totalPages: number;
  totalCount: number;
}

export function PassageTable({ passages, totalPages, totalCount }: PassageTableProps) {
  const [isPending, startTransition] = React.useTransition();
  const { onOpen } = useModal();
  const [editingPassage, setEditingPassage] = React.useState<Passage | null>(null);
  
  const [params, setParams] = useQueryStates(passageSearchParams, {
    shallow: false,
    startTransition,
  });

  const [searchValue, setSearchValue] = React.useState(params.search || "");

  React.useEffect(() => {
    setSearchValue(params.search || "");
  }, [params.search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (params.search || "")) {
        startTransition(() => {
          void setParams({ search: searchValue || null, page: 1 });
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, params.search, setParams]);

  const columns = React.useMemo<ColumnDef<Passage>[]>(() => [
    {
      accessorKey: "title",
      header: "Judul Bacaan",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-all">
            <Page className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight text-zinc-900 dark:text-zinc-100">
              {row.original.title}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "content",
      header: "Konten",
      cell: ({ row }) => (
        <div className="max-w-[300px] lg:max-w-[500px]">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2">
            <MathRenderer text={row.original.content} />
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Dibuat Pada",
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500 font-medium">
          {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: idLocale })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-8">Aksi</div>,
      cell: ({ row }) => {
        const passage = row.original;
        return (
          <div className="flex justify-end pr-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                  <span className="sr-only">Menu aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 dark:border-zinc-800">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Opsi Bacaan</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="gap-2 font-medium cursor-pointer"
                  onClick={() => setEditingPassage(passage)}
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                  Edit Bacaan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-900/10 font-bold gap-2 cursor-pointer"
                  onClick={() => onOpen("alert", {
                    title: "Hapus Bacaan?",
                    description: "Tindakan ini akan menghapus bacaan ini secara permanen. Soal yang menggunakan bacaan ini mungkin tidak akan menampilkan teks bacaan lagi.",
                    confirmText: "Ya, Hapus",
                    onConfirm: async () => {
                      try {
                        const result = await deletePassage(passage.id);
                        if (result.success) {
                          toast.success("Berhasil dihapus");
                        } else {
                          toast.error("Gagal menghapus", { description: result.error });
                        }
                      } catch {
                        toast.error("Terjadi kesalahan sistem");
                      }
                    }
                  })}
                >
                  <Trash className="size-4" aria-hidden="true" />
                  Hapus Bacaan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onOpen]);

  const table = useReactTable({
    data: passages,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className={cn("space-y-6 transition-opacity duration-200", isPending && "opacity-50 pointer-events-none")}>
      <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Cari bacaan..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 transition-all"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Total: {totalCount} Bacaan
          </span>
          <CreatePassageDialog 
            trigger={
              <Button className="gap-2 rounded-xl h-11 px-6 font-bold">
                <Plus className="w-4 h-4" />
                Tambah Bacaan
              </Button>
            }
          />
        </div>
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
                  Belum ada data bacaan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <DataPagination 
          totalPages={totalPages} 
          currentPage={params.page || 1} 
        />
      </div>

      {editingPassage && (
        <CreatePassageDialog
          initialData={editingPassage}
          open={!!editingPassage}
          onOpenChange={(open) => !open && setEditingPassage(null)}
          onSuccess={() => setEditingPassage(null)}
        />
      )}
    </div>
  );
}
