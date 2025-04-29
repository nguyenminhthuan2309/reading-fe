"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowSelectionChange?: (selectedRowIds: string[]) => void
  pageSize?: number
  pageCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  manualPagination?: boolean
  selectedItemsComponent?: React.ReactNode
  renderSelectedItemsView?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode
  selectedItemsHeight?: number
  hideSearchInput?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowSelectionChange,
  pageSize = 5,
  pageCount: controlledPageCount,
  currentPage: controlledCurrentPage,
  onPageChange,
  manualPagination = false,
  selectedItemsComponent,
  renderSelectedItemsView,
  selectedItemsHeight = 56, // Default height for the selected items area
  hideSearchInput = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: !manualPagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination,
    pageCount: manualPagination ? controlledPageCount : undefined,
    initialState: {
      pagination: {
        pageSize,
        pageIndex: (controlledCurrentPage || 1) - 1,
      },
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination: manualPagination ? {
        pageIndex: (controlledCurrentPage || 1) - 1,
        pageSize,
      } : undefined,
    },
  })

  // Call the onRowSelectionChange callback when row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRowIds = Object.keys(rowSelection)
      onRowSelectionChange(selectedRowIds)
    }
  }, [rowSelection, onRowSelectionChange])

  // Handle page change with controlled pagination
  const handlePageChange = (newPage: number) => {
    if (manualPagination && onPageChange) {
      onPageChange(newPage)
    }
  }

  // Get selected rows data
  const selectedRows = React.useMemo(() => {
    return table.getSelectedRowModel().rows.map((row) => row.original as TData)
  }, [table.getSelectedRowModel().rows])

  // Clear selection
  const clearSelection = () => {
    table.resetRowSelection()
  }

  return (
    <div>
      {!hideSearchInput && (
        <div className="flex items-center py-4">
          <Input
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Selected items area - always present but with zero height when empty */}
      <div 
        className="mb-4 transition-all duration-200 ease-in-out overflow-hidden"
        style={{ 
          height: selectedRows.length > 0 ? 'auto' : 0,
          opacity: selectedRows.length > 0 ? 1 : 0
        }}
      >
        {renderSelectedItemsView && renderSelectedItemsView(selectedRows, clearSelection)}
        {selectedItemsComponent && selectedItemsComponent}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {manualPagination 
            ? `Showing ${data.length === 0 ? 0 : ((controlledCurrentPage || 1) - 1) * pageSize + 1} to ${Math.min(
                (controlledCurrentPage || 1) * pageSize,
                (controlledPageCount || 1) * pageSize
              )} of ${(controlledPageCount || 1) * pageSize} records`
            : `Showing ${table.getFilteredRowModel().rows.length === 0 
                ? 0 
                : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to ${Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )} of ${table.getFilteredRowModel().rows.length} records`
          }
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (manualPagination) {
                handlePageChange(1)
              } else {
                table.setPageIndex(0)
              }
            }}
            disabled={manualPagination ? (controlledCurrentPage || 1) <= 1 : !table.getCanPreviousPage()}
            title="First Page"
            className="cursor-pointer"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (manualPagination) {
                handlePageChange(Math.max(1, (controlledCurrentPage || 1) - 1))
              } else {
                table.previousPage()
              }
            }}
            disabled={manualPagination ? (controlledCurrentPage || 1) <= 1 : !table.getCanPreviousPage()}
            title="Previous Page"
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {manualPagination
              ? Array.from({length: Math.min(5, controlledPageCount || 1)}, (_, i) => {
                  // Show a sliding window of page numbers
                  const currentPage = controlledCurrentPage || 1
                  const totalPages = controlledPageCount || 1
                  let startPage = Math.max(1, currentPage - 2)
                  const endPage = Math.min(totalPages, startPage + 4)
                  startPage = Math.max(1, endPage - 4)
                  return startPage + i <= endPage ? startPage + i : null
                })
                .filter(Boolean)
                .map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === (controlledCurrentPage || 1) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber as number)}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    {pageNumber}
                  </Button>
                ))
              : Array.from({length: table.getPageCount()}, (_, i) => i + 1).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === table.getState().pagination.pageIndex + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(pageNumber - 1)}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    {pageNumber}
                  </Button>
                ))
            }
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (manualPagination) {
                handlePageChange(Math.min((controlledPageCount || 1), (controlledCurrentPage || 1) + 1))
              } else {
                table.nextPage()
              }
            }}
            disabled={manualPagination 
              ? (controlledCurrentPage || 1) >= (controlledPageCount || 1) 
              : !table.getCanNextPage()
            }
            title="Next Page"
            className="cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (manualPagination) {
                handlePageChange(controlledPageCount || 1)
              } else {
                table.setPageIndex(table.getPageCount() - 1)
              }
            }}
            disabled={manualPagination 
              ? (controlledCurrentPage || 1) >= (controlledPageCount || 1) 
              : !table.getCanNextPage()
            }
            title="Last Page"
            className="cursor-pointer"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 