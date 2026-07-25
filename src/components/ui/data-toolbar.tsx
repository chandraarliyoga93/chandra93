"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SortUp, SortDown } from "iconoir-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SortOption {
  label: string;
  value: string;
}

interface DataToolbarProps {
  searchPlaceholder?: string;
  sortOptions?: SortOption[];
  className?: string;
}

export function DataToolbar({
  searchPlaceholder = "Cari…",
  sortOptions = [
    { label: "Terbaru", value: "createdAt:desc" },
    { label: "Terlama", value: "createdAt:asc" },
  ],
  className,
}: DataToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("q") || "");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentQ = params.get("q") || "";
      
      if (search === currentQ) return;

      if (search) {
        params.set("q", search);
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // Reset to page 1 on search
      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, pathname, router, searchParams]);

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split(":");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.set("order", order);
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentSort = `${searchParams.get("sort") || "createdAt"}:${
    searchParams.get("order") || "desc"
  }`;

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder={searchPlaceholder}
          aria-label="Cari data"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 border-2 focus-visible:ring-primary/20 transition-colors hover:border-primary/50"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px] h-10 border-2 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              {searchParams.get("order") === "asc" ? (
                <SortUp className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <SortDown className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
              <SelectValue placeholder="Urutkan" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
