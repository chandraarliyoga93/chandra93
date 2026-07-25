"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Check, InfoCircle, WarningTriangle, Xmark } from "iconoir-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AttendanceStatus } from "@/actions/attendance-supabase"

export interface AttendanceStudent {
  id: string
  name: string
  email: string
  photo?: string
}

export const attendanceColumns: ColumnDef<AttendanceStudent>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader<AttendanceStudent, unknown> column={column} title="Siswa" />
    ),
    cell: ({ row }) => {
      const student = row.original
      const name = student.name
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={student.photo ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`} />
            <AvatarFallback className="text-[10px]">{initials || <User className="h-4 w-4" />}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm truncate">{name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ID: {student.id.substring(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader<AttendanceStudent, unknown> column={column} title="Status Presensi" className="justify-center" />
    ),
    cell: ({ row, table }) => {
      const studentId = row.original.id
      // @ts-expect-error - meta is not typed in TanStack Table by default without declaration merging
      const { attendance, onStatusChange, isWeekend } = table.options.meta || {}
      const status = attendance?.[studentId]

      const statuses: { value: AttendanceStatus; label: string; icon: React.ElementType; color: string; hoverColor: string; short: string }[] = [
        { value: "present", label: "Hadir", icon: Check, color: "bg-emerald-600 text-white", hoverColor: "hover:bg-emerald-700", short: "H" },
        { value: "sick", label: "Sakit", icon: InfoCircle, color: "bg-amber-600 text-white", hoverColor: "hover:bg-amber-700", short: "S" },
        { value: "excused", label: "Izin", icon: InfoCircle, color: "bg-sky-600 text-white", hoverColor: "hover:bg-sky-700", short: "I" },
        { value: "late", label: "Terlambat", icon: WarningTriangle, color: "bg-orange-600 text-white", hoverColor: "hover:bg-orange-700", short: "T" },
        { value: "absent", label: "Alpha", icon: Xmark, color: "bg-rose-600 text-white", hoverColor: "hover:bg-rose-700", short: "A" },
      ]

      return (
        <div className="flex items-center justify-center gap-1">
          {statuses.map((s) => {
            const isActive = status === s.value
            return (
              <Button
                key={s.value}
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all border-2",
                  isActive 
                    ? cn(s.color, s.hoverColor, "border-transparent shadow-md scale-110 z-10") 
                    : "text-muted-foreground bg-background hover:text-foreground border-muted"
                )}
                onClick={() => onStatusChange?.(studentId, isActive ? undefined : s.value)}
                disabled={isWeekend}
                title={s.label}
              >
                <span className={cn("text-[10px] font-black transition-colors", isActive ? "text-white" : "")}>{s.short}</span>
              </Button>
            )
          })}
        </div>
      )
    },
  },
]
