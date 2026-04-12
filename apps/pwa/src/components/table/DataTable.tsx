"use client";

import type { ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo } from "react";
import { Paginator } from "@/app/operator/components/Paginator";
import { ColumnSettings } from "@/app/operator/accounts/components/ColumnSettings";
import type { ColumnConfig } from "@/app/operator/accounts/components/ColumnSettings";
import { Button } from "@/components/form/Button";
import { RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/Table";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  loading?: boolean;
  error?: string | null;
  /** Renders on the left side of the toolbar row (search, filters, export, etc.). Refresh / 列设置 stay on the right. */
  toolbarLeft?: ReactNode;
  /** Skeleton body rows while `loading` (default 8). */
  skeletonRows?: number;
  // 分页配置
  pagination?: {
    enabled: boolean;
    pageSize?: number;
  };
  // 列设置配置
  columnSettings?: {
    enabled: boolean;
    storageKey?: string;
    defaultColumns?: ColumnConfig[];
  };
  // 排序配置
  sorting?: {
    enabled: boolean;
  };
  // 空数据提示
  emptyMessage?: string;
  // 自定义行样式
  getRowClassName?: (row: TData) => string;
  // 刷新按钮配置
  refreshButton?: {
    onClick: () => void;
    loading?: boolean;
  };
}

export const DataTable = <TData,>({
  data,
  columns,
  loading = false,
  error = null,
  toolbarLeft,
  skeletonRows = 8,
  pagination = { enabled: true, pageSize: 10 },
  columnSettings,
  sorting = { enabled: true },
  emptyMessage = "暂无数据",
  getRowClassName,
  refreshButton,
}: DataTableProps<TData>) => {
  // Destructure with safe defaults to avoid repetitive optional chaining
  const { enabled: paginationEnabled = true, pageSize: initialPageSize = 10 } = pagination || {};
  const { enabled: columnsEnabled = false, defaultColumns } = columnSettings || {};
  const { enabled: sortingEnabled = true } = sorting || {};

  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Helper: Generate column configs from current columns
  const generatedConfigs = useMemo(() => {
    return columns.map((col) => {
      const accessorKey =
        "accessorKey" in col && typeof col.accessorKey === "string"
          ? col.accessorKey
          : undefined;
      const colId = (col.id as string | undefined) || accessorKey || "";
      const header =
        typeof col.header === "string"
          ? col.header
          : col.header
          ? String(col.header)
          : colId;
      return {
        key: colId,
        label: header,
        visible: true,
      };
    });
  }, [columns]);

  // Initialize or update column configs
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => 
    (columnsEnabled && defaultColumns && defaultColumns.length > 0) ? defaultColumns : []
  );

  // Sync column configs when columns change, if strictly necessary and not overridden
  useEffect(() => {
    if (columnsEnabled && (!defaultColumns || defaultColumns.length === 0) && columnConfigs.length === 0 && generatedConfigs.length > 0) {
      setColumnConfigs(generatedConfigs);
    }
  }, [columnsEnabled, defaultColumns, columnConfigs.length, generatedConfigs]);

  // Sync visibility with configs
  useEffect(() => {
    if (columnsEnabled && columnConfigs.length > 0) {
      const visibility: VisibilityState = {};
      columnConfigs.forEach((config) => {
        visibility[config.key] = config.visible;
      });
      setColumnVisibility(visibility);
    }
  }, [columnConfigs, columnsEnabled]);

  // Filter columns based on visibility settings
  const tableColumns = useMemo(() => {
    if (columnsEnabled && columnConfigs.length > 0) {
      const configMap = new Map(columnConfigs.map((config) => [config.key, config]));
      return columns.filter((col) => {
        const accessorKey = "accessorKey" in col && typeof col.accessorKey === "string" ? col.accessorKey : undefined;
        const colId = (col.id as string | undefined) || accessorKey || "";
        const config = configMap.get(colId);
        return config ? config.visible !== false : true;
      });
    }
    return columns;
  }, [columns, columnConfigs, columnsEnabled]);

  // Note: @tanstack/react-table's useReactTable hook is compatible with React hooks,
  // but ESLint's react-hooks plugin may flag it due to its internal implementation.
  // This is a known false positive - the hook is safe to use.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: paginationEnabled ? getPaginationRowModel() : undefined,
    getSortedRowModel: sortingEnabled ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPaginationState,
    state: {
      sorting: sortingState,
      columnFilters,
      columnVisibility,
      pagination: paginationState,
    },
    manualPagination: false,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / initialPageSize);
  const currentPage = paginationState.pageIndex + 1;
  const showSkeleton = loading;
  const colCount = Math.max(tableColumns.length, 1);
  const showToolbarRow =
    Boolean(toolbarLeft) || columnsEnabled || Boolean(refreshButton);

  return (
    <div className="space-y-4">
      {showToolbarRow && (
        <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2">
          {toolbarLeft ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbarLeft}</div>
          ) : null}
          {(refreshButton || columnsEnabled) && (
            <div
              className={`flex shrink-0 flex-wrap items-center gap-2 ${
                toolbarLeft ? "" : "ml-auto"
              }`}
            >
              {refreshButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshButton.onClick}
                  disabled={refreshButton.loading || loading}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshButton.loading || loading ? "animate-spin" : ""}`}
                  />
                  刷新
                </Button>
              )}
              {columnsEnabled && (
                <ColumnSettings
                  columns={columnConfigs}
                  onColumnsChange={setColumnConfigs}
                />
              )}
            </div>
          )}
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-muted/30 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          sortingEnabled && header.column.getCanSort()
                            ? "cursor-pointer select-none hover:text-foreground"
                            : ""
                        }`}
                        onClick={
                          sortingEnabled && header.column.getCanSort()
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sortingEnabled &&
                          header.column.getCanSort() &&
                          (() => {
                            const sorted = header.column.getIsSorted();
                            if (sorted === false) return null;
                            return (
                              <span className="text-muted-foreground">
                                {sorted === "asc" ? " ↑" : sorted === "desc" ? " ↓" : " ↕"}
                              </span>
                            );
                          })()}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: colCount }).map((__, j) => (
                    <TableCell key={j} className="px-6 py-4">
                      <Skeleton className="h-4 w-full max-w-[12rem]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowData = row.original;
                const rowClassName = getRowClassName ? getRowClassName(rowData) : "";
                return (
                  <TableRow key={row.id} className={rowClassName}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {paginationEnabled &&
        !showSkeleton &&
        data.length > 0 &&
        totalPages > 1 &&
        table.getPageCount() > 1 && (
          <Paginator
            currentPage={currentPage}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            itemsPerPage={initialPageSize}
            totalItems={data.length}
          />
        )}
      </div>
    </div>
  );
};

// 导出列设置组件供外部使用
export { ColumnSettings };
export type { ColumnConfig };
