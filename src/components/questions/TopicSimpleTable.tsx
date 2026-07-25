"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Xmark, BookStack, ArrowRight } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Topic {
  id: string;
  name: string;
  count: number;
}

interface TopicSimpleTableProps {
  topics: Topic[];
}

export function TopicSimpleTable({ topics }: TopicSimpleTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Filter
  const filteredData = useMemo(() => {
    return topics.filter((topic) =>
      topic.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [topics, searchQuery]);

  // 2. Paginate
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  if (topics.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 px-4 text-center border shadow-sm rounded-3xl">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BookStack className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Belum Ada Topik</h3>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">
            Yuk, mulai bangun Bank Soal Anda dengan membuat topik pertama.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari topik soal..."
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Xmark className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="border shadow-sm overflow-hidden rounded-2xl">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-xs uppercase tracking-wider h-12">Nama Topik</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider h-12 text-center">Jumlah Soal</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider h-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  Topik tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((topic) => (
                <TableRow key={topic.id} className="group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <BookStack className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">{topic.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-bold">
                      {topic.count} SOAL
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/guru/questions/${topic.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2 font-bold text-xs rounded-xl">
                        Lihat Detail
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
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
            Menampilkan {paginatedData.length} dari {filteredData.length} topik
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="h-8 rounded-xl"
            >
              Sebelumnya
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 text-xs rounded-xl"
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
              className="h-8 rounded-xl"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
