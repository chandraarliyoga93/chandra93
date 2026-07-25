"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import {
  NavArrowLeft, NavArrowRight, FastArrowLeft, FastArrowRight } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataPaginationProps {
  totalPages: number;
  currentPage: number;
  className?: string;
}

export function DataPagination({
  totalPages,
  currentPage,
  className,
}: DataPaginationProps) {
  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="flex-1 text-sm text-muted-foreground">
        Halaman <span className="font-bold text-foreground">{currentPage}</span> dari{" "}
        <span className="font-bold text-foreground">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex rounded-xl border-2 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => setPage(1)}
            disabled={currentPage <= 1}
          >
            <span className="sr-only">Halaman pertama</span>
            <FastArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-2 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <span className="sr-only">Halaman sebelumnya</span>
            <NavArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center px-2">
            <span className="text-sm font-black tracking-tighter">
              {currentPage}
            </span>
          </div>

          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-2 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <span className="sr-only">Halaman selanjutnya</span>
            <NavArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex rounded-xl border-2 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => setPage(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <span className="sr-only">Halaman terakhir</span>
            <FastArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
