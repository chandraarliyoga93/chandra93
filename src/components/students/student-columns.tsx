"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { Student } from "@/types/student";
import { User } from "lucide-react";

export const studentColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Nama" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`} />
            <AvatarFallback>{initials || <User className="h-4 w-4" />}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "studentId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="NIS" />
    ),
    cell: ({ row }) => <span className="text-muted-foreground font-mono">{row.getValue("studentId")}</span>,
  },
  {
    accessorKey: "className",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Kelas" />
    ),
    cell: ({ row }) => <Badge variant="outline">{row.getValue("className") as string}</Badge>,
  },
  {
    accessorKey: "attendanceSummary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Kehadiran" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("attendanceSummary") as string;
      const variant = status === "Hadir" ? "default" : "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "lastGradeSnapshot",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Nilai" />
    ),
    cell: ({ row }) => {
      const grade = row.getValue("lastGradeSnapshot") as string | number;
      return <span className="font-semibold text-primary">{grade}</span>;
    },
  },
];
