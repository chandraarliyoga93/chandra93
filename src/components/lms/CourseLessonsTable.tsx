"use client";

import * as React from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface LmsLessonTableModule {
  id: string;
  title: string;
  order: number;
  lessons: Array<{
    id: string;
    title: string;
    content: string | null;
    order?: number;
  }>;
}

export type LmsLessonRow = {
  id: string;
  displayOrder: number;
  moduleTitle: string;
  lessonTitle: string;
  hasContent: boolean;
};

function flattenLessons(modules: LmsLessonTableModule[]): LmsLessonRow[] {
  const sortedMods = [...modules].sort((a, b) => a.order - b.order);
  const rows: LmsLessonRow[] = [];
  let displayOrder = 0;
  for (const mod of sortedMods) {
    const lessons = [...mod.lessons].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    for (const lesson of lessons) {
      displayOrder += 1;
      const c = lesson.content?.trim() ?? "";
      rows.push({
        id: lesson.id,
        displayOrder,
        moduleTitle: mod.title,
        lessonTitle: lesson.title,
        hasContent: c.length > 0,
      });
    }
  }
  return rows;
}

export interface CourseLessonsTableProps {
  modules: LmsLessonTableModule[];
  onOpenLesson: (lessonId: string) => void;
}

export function CourseLessonsTable({
  modules,
  onOpenLesson,
}: CourseLessonsTableProps) {
  const data = React.useMemo(() => flattenLessons(modules), [modules]);

  const columns = React.useMemo<ColumnDef<LmsLessonRow>[]>(
    () => [
      {
        accessorKey: "displayOrder",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="No." />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.displayOrder}
          </span>
        ),
        size: 56,
      },
      {
        accessorKey: "moduleTitle",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Modul" />
        ),
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate font-medium">
            {row.original.moduleTitle}
          </span>
        ),
      },
      {
        accessorKey: "lessonTitle",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Judul materi" />
        ),
        cell: ({ row }) => (
          <span className="truncate">{row.original.lessonTitle}</span>
        ),
      },
      {
        accessorKey: "hasContent",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Konten" />
        ),
        cell: ({ row }) =>
          row.original.hasContent ? (
            <Badge variant="default" className="font-normal">
              Ada isi
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Kosong
            </Badge>
          ),
        sortingFn: "basic",
      },
      {
        id: "actions",
        header: () => <span className="text-muted-foreground">Aksi</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLesson(row.original.id);
            }}
          >
            Edit konten
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [onOpenLesson],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: "displayOrder", desc: false }],
    },
  });

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        Belum ada materi. Buat modul lalu tambah materi dari panel{" "}
        <span className="font-medium text-foreground">Kurikulum</span> di kiri.
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      onRowClick={(row) => onOpenLesson(row.id)}
      className="gap-3"
    />
  );
}
