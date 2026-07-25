"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Exam } from "@/types/exam"
import { ClassData } from "@/actions/classes-supabase"
import { getGuruExamsSupabase } from "@/actions/exam-supabase"
import { Timer, Key, Trophy, Search, Filter } from "iconoir-react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ExamActions } from "./ExamActions"
import { useQueryStates } from "nuqs"
import { examSearchParams } from "@/lib/parsers"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import { DataTableExportButton } from "@/components/data-table/data-table-export-button"
import { Button } from "@/components/ui/button"

interface V2ExamTableProps {
  data: Exam[]
  classes: ClassData[]
  pageCount: number
  totalCount: number
  nextCursor?: string
  hasMore?: boolean
}

export function V2ExamTable({ data, classes, pageCount, totalCount, nextCursor: initialNextCursor, hasMore: initialHasMore }: V2ExamTableProps) {
  const [isPending, startTransition] = React.useTransition()
  const [allData, setAllData] = React.useState(data)
  const [nextCursor, setNextCursor] = React.useState(initialNextCursor)
  const [hasMore, setHasMore] = React.useState(initialHasMore ?? false)

  React.useEffect(() => {
    setAllData(data)
    setNextCursor(initialNextCursor)
    setHasMore(initialHasMore ?? false)
  }, [data, initialNextCursor, initialHasMore])

  const [params, setParams] = useQueryStates(examSearchParams, {
    shallow: false,
    startTransition,
  })

  // Local state for immediate search input feedback
  const [searchValue, setSearchValue] = React.useState(params.search || "")

  // Sync local search value when URL params change (e.g. on clear or back button)
  React.useEffect(() => {
    setSearchValue(params.search || "")
  }, [params.search])

  const columns: ColumnDef<Exam>[] = [
    {
      accessorKey: "title",
      header: "Ujian / Kuis",
      cell: ({ row }) => {
        const exam = row.original
        return (
          <div className="flex flex-col gap-1 min-w-[200px] py-2">
            <Link href={`/dashboard/guru/cbt/${exam.id}`}>
              <span className="font-bold text-zinc-950 dark:text-zinc-50 tracking-tight uppercase group-hover:text-primary transition-colors cursor-pointer text-sm sm:text-base">
                {exam.title}
              </span>
            </Link>
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[9px] uppercase font-bold border-zinc-200 dark:border-zinc-800 text-zinc-500">
                 {exam.type}
               </Badge>
               <span className="text-[10px] text-zinc-400 font-medium">
                 Created {format(new Date(exam.createdAt), "dd MMM yyyy", { locale: idLocale })}
               </span>
            </div>
          </div>
        )
      },
    },
    {
      id: "assignments",
      header: "Penugasan",
      cell: ({ row }) => {
        const exam = row.original
        const count = exam.assignments?.length || 0
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
              {count > 0 ? `${count} Kelas` : "Belum Ditugaskan"}
            </span>
            {count > 0 && (
              <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">
                {exam.assignments?.map(a => a.class?.name).join(", ")}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "details",
      header: () => <div className="text-center">Detail</div>,
      cell: ({ row }) => {
        const exam = row.original
        return (
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
               <Timer className="w-3.5 h-3.5 text-zinc-400 mb-1" />
               <span className="text-[10px] font-black">{exam.duration}m</span>
            </div>
            {exam.token && (
              <div className="flex flex-col items-center">
                 <Key className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                 <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">{exam.token}</span>
              </div>
            )}
            <div className="flex flex-col items-center">
               <Trophy className="w-3.5 h-3.5 text-zinc-400 mb-1" />
               <span className="text-[10px] font-black">{exam.rewards?.xp || 0} XP</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="text-center">
            <Badge 
              variant={status === "published" ? "default" : "outline"}
              className={cn(
                "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest",
                status === "published" 
                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border-zinc-200"
              )}
            >
              {status}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => (
        <div className="text-right pr-2">
          <ExamActions exam={row.original} classes={classes} />
        </div>
      ),
    },
  ]

  const effectiveTotal = allData.length
  const effectivePageCount = Math.max(1, Math.ceil(effectiveTotal / (params.pageSize || 10)))

  const table = useReactTable({
    data: allData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: effectivePageCount,
  })

  const [loadingMore, setLoadingMore] = React.useState(false)
  const loadMore = React.useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await getGuruExamsSupabase({ cursor: nextCursor, pageSize: 30 })
      if (res.success && Array.isArray(res.data)) {
        setAllData((prev) => [...prev, ...(res.data ?? [])])
        setNextCursor((res as any).nextCursor)
        setHasMore((res as any).hasMore ?? false)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [nextCursor, loadingMore])

  // Debounce search update to URL
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (params.search || "")) {
        startTransition(() => {
          void setParams({ search: searchValue || null, page: 1 })
        })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchValue, params.search, setParams])

  return (
    <div className={cn("space-y-6 transition-opacity duration-200", isPending && "opacity-50 pointer-events-none")}>
      {/* Toolbar - Same as Journals/Standard */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px] sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Cari ujian atau token..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
            />
          </div>
          
          <Select 
            value={params.type || "all"} 
            onValueChange={(val) => {
              startTransition(() => {
                void setParams({ type: val === "all" ? null : val, page: 1 })
              })
            }}
          >
            <SelectTrigger className="w-[120px] h-10 rounded-xl font-bold text-[10px] uppercase tracking-tighter">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3" />
                <SelectValue placeholder="Tipe" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={params.status || "all"} 
            onValueChange={(val) => {
              startTransition(() => {
                void setParams({ status: val === "all" ? null : val, page: 1 })
              })
            }}
          >
            <SelectTrigger className="w-[120px] h-10 rounded-xl font-bold text-[10px] uppercase tracking-tighter">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">
            Total: {effectiveTotal}
          </span>
          <DataTableExportButton 
            table={table} 
            fileName="daftar-ujian-cbt"
            title="Daftar Ujian CBT"
            subtitle="Seluruh data pelaksanaan ujian dan kuis"
          />
        </div>
      </div>

      {/* Table Container - Same spacing as Journals */}
      <div className="overflow-hidden bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50">
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

      {/* Pagination - Matching the Journals Page style */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <DataPagination
          totalPages={effectivePageCount}
          currentPage={params.page || 1}
        />
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-xl"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : (
              "Muat lebih banyak"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
