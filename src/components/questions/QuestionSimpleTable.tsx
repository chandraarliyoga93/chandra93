"use client";

import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Xmark, Filter, NavArrowDown, NavArrowUp, MediaImage } from "iconoir-react";
import { MoreHorizontal, Edit, Trash, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionType } from "@/types/exam";
import { deleteQuestionSupabase, Question } from "@/actions/questions-supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DataPagination } from "@/components/ui/data-pagination";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/hooks/use-modal";
import { CreateQuestionDialog } from "./CreateQuestionDialog";
import { MathRenderer } from "@/components/ui/math-renderer";
import { formatAnswerForDisplay } from "@/lib/format-answer";

interface QuestionSimpleTableProps {
  data: Question[];
}

type SortKey = "text" | "type" | "createdAt";
type SortOrder = "asc" | "desc";

export function QuestionSimpleTable({ data }: QuestionSimpleTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { onOpen } = useModal();

  // 1. Filter
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [data, searchQuery, typeFilter]);

  // 2. Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (sortKey === "createdAt") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // 3. Paginate
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleCopy = (question: Question) => {
    let text = `${question.text}\n\n`;
    
    if (question.type === 'pg' || question.type === 'pg_kompleks') {
      question.options?.forEach((opt, i) => {
        text += `${String.fromCharCode(65 + i)}. ${opt.text}\n`;
      });
    } else if (question.type === 'bs') {
      text += "A. Benar\nB. Salah\n";
    } else if (question.type === 'menjodohkan') {
      question.pairs?.forEach((pair) => {
        text += `- ${pair.left} = [....]\n`;
      });
    } else if (question.type === 'matrix') {
      text += "Rows:\n";
      question.rows?.forEach((row) => {
        text += `- ${row.text}\n`;
      });
      text += "Columns:\n";
      question.columns?.forEach((col) => {
        text += `- ${col.text}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    toast.success("Berhasil!", { description: "Teks soal disalin" });
  };

  const onDelete = (question: Question) => {
    onOpen("alert", {
      title: "Hapus pertanyaan?",
      description: "Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Hapus",
      onConfirm: async () => {
        const result = await deleteQuestionSupabase(question.id);
        if (result.success) {
          toast.success("Berhasil!", { description: "Pertanyaan dihapus" });
        } else {
          toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus" });
        }
      }
    });
  };

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari teks soal..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <Xmark className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="h-10 px-3 flex items-center gap-2 border-dashed">
            <Filter className="w-3 h-3" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-wider"
            >
              <option value="all">Semua Jenis</option>
              <option value="pg">Pilihan Ganda</option>
              <option value="pg_kompleks">PG Kompleks</option>
              <option value="bs">Benar/Salah</option>
              <option value="menjodohkan">Menjodohkan</option>
              <option value="mengurutkan">Mengurutkan</option>
              <option value="essay">Essay</option>
              <option value="matrix">Matriks</option>
              <option value="matrix">Matriks</option>
            </select>
          </Badge>
        </div>
      </div>

      {/* Table */}
      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-xs uppercase tracking-wider h-12"
                onClick={() => toggleSort("type")}
              >
                Jenis {sortKey === "type" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-xs uppercase tracking-wider h-12"
                onClick={() => toggleSort("text")}
              >
                Pertanyaan {sortKey === "text" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider h-12">Jawaban</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider h-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Belum ada data
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((question) => (
                <TableRow key={question.id} className="group transition-colors">
                  <TableCell>
                    <Badge variant={variantMap[question.type] || "default"}>
                      {labelMap[question.type] || question.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] md:max-w-[500px]">
                    <div className="flex items-center gap-2">
                      <div className="font-medium line-clamp-2" title={question.text}>
                        <MathRenderer text={question.text} />
                      </div>
                      {question.imageUrl && (
                        <MediaImage className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      )}
                    </div>
                    {question.options && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {question.options.length} Opsi Jawaban
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={formatAnswerForDisplay(question)}>
                      {question.type === 'bs' ? (
                        <Badge variant={question.answer ? "default" : "destructive"} className="h-5 text-[10px]">
                          {formatAnswerForDisplay(question)}
                        </Badge>
                      ) : (
                        <span className="line-clamp-2">{formatAnswerForDisplay(question)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCopy(question)} className="gap-2">
                          <Copy className="w-4 h-4" /> Salin Teks
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        <CreateQuestionDialog 
                          initialData={question}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground gap-2">
                              <Edit className="w-4 h-4" /> Edit
                            </div>
                          }
                        />

                        <DropdownMenuItem 
                          className="text-destructive gap-2"
                          onClick={() => onDelete(question)}
                        >
                          <Trash className="w-4 h-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground font-medium">
            Menampilkan {paginatedData.length} dari {filteredData.length} pertanyaan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="h-8"
            >
              Sebelumnya
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="h-8"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
