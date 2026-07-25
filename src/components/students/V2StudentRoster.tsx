"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Check, Xmark, EditPencil, UserXmark, NavArrowRight, Coins } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataPagination } from "@/components/ui/data-pagination";
import { useState, useTransition, useMemo } from "react";
import { updateStudentName } from "@/actions/users-supabase";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal";
import { removeStudentFromClassSupabase as removeStudentFromClass } from "@/actions/enrollment-supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { FloatingRewardBar } from "./FloatingRewardBar";
import { RewardActions } from "./RewardActions";
import { MobileStudentCard } from "./MobileStudentCard";
import { DownloadCardsButton } from "./DownloadCardsButton";
import { useQueryStates } from "nuqs";
import { studentSearchParams } from "@/lib/parsers";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { 
  getCoreRowModel, 
  useReactTable, 
  ColumnDef, 
  flexRender 
} from "@tanstack/react-table";

interface Student {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  joinedAt: string;
  studentId?: string; // NIS
  photo?: string;
  alias?: string;
  guruCoin: number;
  password?: string;
}

interface V2StudentRosterProps {
  students: Student[];
  classId: string;
  isGlobal?: boolean;
  totalPages?: number;
  currentPage?: number;
}

export function V2StudentRoster({ 
  students, 
  classId, 
  isGlobal = false,
  totalPages,
  currentPage,
}: V2StudentRosterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isPending, startTransition] = useTransition();
  const { onOpen } = useModal();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [searchParams, setSearchParams] = useQueryStates(studentSearchParams, {
    shallow: false,
    startTransition,
  });

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setTempName(student.name);
  };

  const handleCancel = () => {
    setEditingId(null);
    setTempName("");
  };

  const handleSave = (studentId: string) => {
    if (!tempName.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    if (tempName.length < 3) {
      toast.error("Nama minimal 3 karakter");
      return;
    }

    startTransition(async () => {
      const result = await updateStudentName(studentId, tempName);
      if (result.success) {
        toast.success("Nama siswa diperbarui");
        setEditingId(null);
      } else {
        toast.error(result.error || "Gagal memperbarui nama");
      }
    });
  };

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="pl-8 py-4">
          <Checkbox 
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                setSelectedIds(students.map(s => s.id));
              } else {
                setSelectedIds([]);
              }
            }}
            aria-label="Pilih semua siswa"
            className="rounded-md border-zinc-300"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="pl-8 py-4">
          <Checkbox 
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              const id = row.original.id;
              setSelectedIds(prev => 
                value ? [...prev, id] : prev.filter(i => i !== id)
              );
            }}
            aria-label={`Pilih ${row.original.name}`}
            className="rounded-md border-zinc-300"
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Nama Siswa" />
      ),
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-4 py-2">
            <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <AvatarImage src={student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`} />
              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                {student.name ? student.name.substring(0, 2).toUpperCase() : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              {editingId === student.id ? (
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="h-9 max-w-[240px] rounded-xl text-sm font-bold border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                    autoFocus
                    disabled={isPending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(student.id);
                      if (e.key === "Escape") handleCancel();
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 rounded-lg"
                      onClick={() => handleSave(student.id)}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-600 rounded-lg"
                      onClick={handleCancel}
                      disabled={isPending}
                    >
                      <Xmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/name max-w-full">
                   <span 
                     className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 truncate hover:text-primary transition-colors cursor-pointer"
                     onClick={() => handleStartEdit(student)}
                   >
                     {student.name}
                   </span>
                   {student.alias && (
                     <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md font-mono font-bold">
                       @{student.alias}
                     </span>
                   )}
                   <button
                    className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity rounded-lg inline-flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                    onClick={() => handleStartEdit(student)}
                  >
                    <EditPencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest truncate">{student.email}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "level",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Level" className="justify-center" />
      ),
      cell: ({ row }) => (
        <div className="h-7 w-12 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
          <span className="font-bold text-[10px] text-zinc-950 dark:text-zinc-50 uppercase tracking-tighter">Lvl {row.original.level}</span>
        </div>
      )
    },
    {
      accessorKey: "xp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="XP Points" className="justify-center" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col items-center">
          <span className="font-black text-sm text-zinc-950 dark:text-zinc-50 tracking-tighter">{row.original.xp.toLocaleString()}</span>
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Points</span>
        </div>
      )
    },
    {
      accessorKey: "guruCoin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Koin" className="justify-center" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Coins className="w-3 h-3 text-yellow-600" />
            <span className="font-black text-sm text-zinc-950 dark:text-zinc-50 tracking-tighter">
              {(row.original.guruCoin || 0).toLocaleString()}
            </span>
          </div>
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">G-Coins</span>
        </div>
      )
    },
    {
      accessorKey: "joinedAt",
      id: "joinedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Joined Date" />
      ),
      cell: ({ row }) => (
        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
          {format(new Date(row.original.joinedAt), "dd MMM yyyy", { locale: idLocale })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-8">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end items-center gap-2 pr-8">
          <RewardActions studentId={row.original.id} studentName={row.original.name} />
          
          <DownloadCardsButton 
            students={[{
              name: row.original.name,
              studentId: row.original.studentId || row.original.email.split('@')[0],
              password: row.original.password
            }]}
            size="icon"
            variant="ghost"
            label=""
            className="h-9 w-9 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-colors"
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <NavArrowRight className="w-4 h-4" />
          </Button>
          {!isGlobal && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-rose-500/50 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
              onClick={() => onOpen("alert", {
                title: "Keluarkan Siswa?",
                description: `Apakah Anda yakin ingin mengeluarkan ${row.original.name} dari kelas ini?`,
                confirmText: "Ya, Keluarkan",
                onConfirm: async () => {
                  try {
                    const result = await removeStudentFromClass(classId, row.original.id);
                    if (result.success) {
                      toast.success(`Berhasil mengeluarkan ${row.original.name}`);
                    } else {
                      toast.error(result.error || "Gagal");
                    }
                  } catch (error) {
                    toast.error("Kesalahan sistem");
                  }
                }
              })}
            >
              <UserXmark className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [editingId, tempName, isPending, isGlobal, classId, onOpen, students, handleSave]);

  const table = useReactTable({
    data: students,
    columns: columns.filter(col => {
      if (isGlobal && col.id === 'joinedAt') return false;
      return true;
    }),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(table.getState().pagination) : updater;
      startTransition(() => {
        void setSearchParams({ 
          page: next.pageIndex + 1, 
          pageSize: next.pageSize 
        });
      });
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(table.getState().sorting) : updater;
      if (next.length > 0) {
        startTransition(() => {
          void setSearchParams({ 
            sortBy: next[0].id, 
            sortOrder: next[0].desc ? "desc" : "asc",
            page: 1 
          });
        });
      }
    },
    state: {
      pagination: {
        pageIndex: (searchParams.page || 1) - 1,
        pageSize: searchParams.pageSize || 10,
      },
      sorting: [
        {
          id: searchParams.sortBy || "name",
          desc: searchParams.sortOrder === "desc",
        },
      ],
      rowSelection: Object.fromEntries(selectedIds.map(id => [students.findIndex(s => s.id === id), true])),
    },
  });

  return (
    <div className="space-y-6">
      {/* Desktop View */}
      <div className="hidden md:block overflow-hidden bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-100 dark:border-zinc-900 shadow-xl">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-zinc-200/50 dark:border-zinc-800/50 h-14">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="p-0">
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
                    <TableCell key={cell.id} className="p-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-zinc-500 font-medium italic">
                  Tidak ada data siswa.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {students.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium italic bg-white dark:bg-zinc-950">
            Tidak ada data siswa.
          </div>
        ) : (
          students.map((student) => (
            <MobileStudentCard
              key={student.id}
              student={student}
              isSelected={selectedIds.includes(student.id)}
              onSelect={(id) => {
                setSelectedIds(prev => 
                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
              }}
              actions={
                <DownloadCardsButton 
                  students={[{
                    name: student.name,
                    studentId: student.studentId || student.email.split('@')[0],
                    password: student.password
                  }]}
                  size="icon"
                  variant="ghost"
                  label=""
                  className="h-9 w-9 text-zinc-400"
                />
              }
            />
          ))
        )}
      </div>

      {(totalPages && currentPage) ? (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <DataPagination 
            totalPages={totalPages} 
            currentPage={currentPage} 
          />
        </div>
      ) : null}

      <FloatingRewardBar 
        selectedIds={selectedIds}
        students={students.map(s => ({
          id: s.id,
          name: s.name,
          studentId: s.studentId || s.email.split('@')[0],
          password: s.password
        }))}
        onClear={() => setSelectedIds([])}
      />
    </div>
  );
}
