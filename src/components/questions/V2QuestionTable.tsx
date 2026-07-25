"use client";

import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MediaImage, 
  EditPencil as Edit, 
  Trash, 
  Copy
} from "iconoir-react";
import { MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Question, deleteQuestionSupabase } from "@/actions/questions-supabase";
import { QuestionType } from "@/types/exam";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useQueryStates } from "nuqs";
import { questionSearchParams } from "@/lib/parsers";
import { DataPagination } from "@/components/ui/data-pagination";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MathRenderer } from "@/components/ui/math-renderer";
import { formatAnswerForDisplay } from "@/lib/format-answer";
import { useModal } from "@/hooks/use-modal";
import { CreateQuestionDialog } from "./CreateQuestionDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface V2QuestionTableProps {
  data: Question[];
  pageCount: number;
  totalCount: number;
}

const labelMap: Record<QuestionType, string> = {
  pg: "Pilihan Ganda",
  pg_kompleks: "PG Kompleks",
  bs: "Benar/Salah",
  menjodohkan: "Menjodohkan",
  mengurutkan: "Mengurutkan",
  essay: "Essay",
  matrix: "Matriks",
  short_answer: "Isian Singkat",
};

const variantMap: Record<QuestionType, "default" | "secondary" | "outline" | "destructive"> = {
  pg: "default",
  pg_kompleks: "secondary",
  bs: "outline",
  menjodohkan: "secondary",
  mengurutkan: "secondary",
  essay: "outline",
  matrix: "secondary",
  short_answer: "outline",
};

export function V2QuestionTable({ data, pageCount, totalCount }: V2QuestionTableProps) {
  const [isPending, startTransition] = React.useTransition();
  const { onOpen } = useModal();
  const [params, setParams] = useQueryStates(questionSearchParams, {
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

  const handleCopy = (question: Question) => {
    let text = `${question.text}\n\n`;
    if (question.type === 'pg' || question.type === 'pg_kompleks') {
      question.options?.forEach((opt, i) => {
        text += `${String.fromCharCode(65 + i)}. ${opt.text}\n`;
      });
    } else if (question.type === 'bs') {
      text += "A. Benar\nB. Salah\n";
    }
    navigator.clipboard.writeText(text);
    toast.success("Teks soal disalin");
  };

  const onDelete = (question: Question) => {
    onOpen("alert", {
      title: "Hapus pertanyaan?",
      description: "Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Hapus",
      onConfirm: async () => {
        const result = await deleteQuestionSupabase(question.id);
        if (result.success) {
          toast.success("Pertanyaan dihapus");
        } else {
          toast.error(result.error || "Gagal menghapus");
        }
      }
    });
  };

  const columns: ColumnDef<Question>[] = [
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Tipe" />
      ),
      cell: ({ row }) => (
        <Badge variant={variantMap[row.original.type] || "default"}>
          {labelMap[row.original.type] || row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "text",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Pertanyaan" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 py-2 max-w-[400px]">
          <div className="flex items-center gap-2">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
              <MathRenderer text={row.original.text} />
            </div>
            {row.original.imageUrl && (
              <MediaImage className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            )}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">
            Dibuat {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: idLocale })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "answer",
      header: "Kunci Jawaban",
      cell: ({ row }) => {
        const q = row.original;
        const display = formatAnswerForDisplay(q);
        return (
          <div className="max-w-[200px] truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300" title={display}>
            {q.type === "bs" ? (
              <Badge variant={q.answer ? "default" : "destructive"} className="h-5 text-[9px] px-1.5">
                {display}
              </Badge>
            ) : (
              <span className="line-clamp-2">{display}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-8">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex justify-end items-center gap-2 pr-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <MoreHorizontal className="w-4 h-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Opsi Soal</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCopy(row.original)} className="gap-2 text-xs font-bold cursor-pointer">
                <Copy className="w-4 h-4" /> Salin Teks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <CreateQuestionDialog 
                initialData={row.original}
                trigger={
                  <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs font-bold outline-none transition-colors hover:bg-accent hover:text-accent-foreground gap-2">
                    <Edit className="w-4 h-4" /> Edit Soal
                  </div>
                }
              />
              <DropdownMenuItem 
                className="text-destructive gap-2 text-xs font-bold cursor-pointer"
                onClick={() => onDelete(row.original)}
              >
                <Trash className="w-4 h-4" /> Hapus Soal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(table.getState().sorting) : updater;
      if (next.length > 0) {
        startTransition(() => {
          void setParams({ 
            sortBy: next[0].id, 
            sortOrder: next[0].desc ? "desc" : "asc",
            page: 1 
          });
        });
      }
    },
    state: {
      sorting: [
        {
          id: params.sortBy || "createdAt",
          desc: params.sortOrder === "desc",
        },
      ],
    },
  });

  return (
    <div className={cn("space-y-6 transition-opacity duration-200", isPending && "opacity-50 pointer-events-none")}>
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px] sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Cari teks pertanyaan..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
            />
          </div>
          
          <Select 
            value={params.type || "all"} 
            onValueChange={(val) => {
              startTransition(() => {
                void setParams({ type: val === "all" ? null : val, page: 1 });
              });
            }}
          >
            <SelectTrigger className="w-[150px] h-10 rounded-xl font-bold text-[10px] uppercase tracking-tighter">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3" />
                <SelectValue placeholder="Semua Tipe" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {Object.entries(labelMap).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">
            Total: {totalCount} Soal
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent h-14">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-500 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-widest pl-8 p-0">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group border-b border-zinc-100 dark:border-zinc-900 last:border-0 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="pl-8 py-4 p-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-zinc-500 dark:text-zinc-400 italic">
                  Tidak ada soal ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <DataPagination 
          totalPages={pageCount} 
          currentPage={params.page || 1} 
        />
      </div>
    </div>
  );
}
