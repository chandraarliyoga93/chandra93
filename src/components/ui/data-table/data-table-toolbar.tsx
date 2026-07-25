"use client"

import { Table } from "@tanstack/react-table"
import { Xmark } from "iconoir-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/ui/data-table/data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  /**
   * The column key to filter by default (e.g., "title", "email", "name").
   * This allows the toolbar to be generic for different data types.
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
  /**
   * Optional extra actions to display in the toolbar.
   */
  actions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  filterColumnKey,
  facetedFilters,
  actions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const filterColumn = filterColumnKey ? table.getColumn(filterColumnKey) : undefined

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterColumn && (
          <Input
            placeholder={`Filter by ${filterColumnKey}...`}
            value={(filterColumn.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              filterColumn.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {facetedFilters?.map((filter) => {
          const column = table.getColumn(filter.columnKey)
          if (!column) return null
          return (
            <DataTableFacetedFilter
              key={filter.columnKey}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          )
        })}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Xmark className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {actions}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
