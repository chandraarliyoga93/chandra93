"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  type Table as TanstackTable,
  type TableMeta,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar"
import { useDataTable } from "@/hooks/use-data-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /**
   * External table instance for lifting state.
   */
  table?: TanstackTable<TData>
  /**
   * Custom table meta.
   */
  meta?: TableMeta<TData>
  /**
   * Optional key to use for the default text filter in the toolbar.
   */
  filterColumnKey?: string
  /**
   * Optional faceted filters to display in the toolbar.
   */
  facetedFilters?: {
    columnKey: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  if (props.table) {
    return <DataTableContent {...props} table={props.table} />
  }

  return <DataTableWithInternalState {...props} />
}

function DataTableWithInternalState<TData, TValue>({
  columns,
  data,
  meta,
  ...props
}: DataTableProps<TData, TValue>) {
  const { table } = useDataTable({
    data,
    columns,
    pageCount: -1,
    meta,
  })

  return <DataTableContent {...props} columns={columns} data={data} table={table} />
}

interface DataTableContentProps<TData, TValue> extends DataTableProps<TData, TValue> {
  table: TanstackTable<TData>
}

function DataTableContent<TData, TValue>({
  columns,
  table,
  filterColumnKey,
  facetedFilters,
}: DataTableContentProps<TData, TValue>) {
  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        filterColumnKey={filterColumnKey} 
        facetedFilters={facetedFilters}
      />
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
