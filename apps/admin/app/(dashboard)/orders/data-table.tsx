"use client";

import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { DataTablePagination } from "../../components/TablePagination";
import { useState, type MouseEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";

// Declared once at module scope so every table built with DataTable shares
// the same feature set (and the same TFeatures type). Import DataTableFeatures
// wherever a ColumnDef or Table<> needs to reference these features.
// columnVisibilityFeature is required for row.getVisibleCells() below - it's
// feature-gated in v9, not part of the core row model.
export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableFeatures = typeof dataTableFeatures;

interface DataTableProps<TData extends RowData, TValue> {
  columns: ColumnDef<DataTableFeatures, TData, TValue>[];
  data: TData[];
  // Called when a row is clicked (but not its checkbox, links or menus).
  onRowClick?: (row: TData) => void;
  // Needed for deleting: the stable id of a row (rows are otherwise keyed by
  // position, which changes when the list is filtered).
  getRowId?: (row: TData) => string;
  // When set, selecting rows shows a delete button with a confirm step.
  onDeleteSelected?: (
    ids: string[],
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  onRowClick,
  getRowId,
  onDeleteSelected,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Only rows that are visible right now count, so filtering the list can
  // never delete orders you can't see.
  const selectedIds = getRowId
    ? data.map(getRowId).filter((id) => rowSelection[id])
    : [];

  const handleDelete = async () => {
    if (!onDeleteSelected || selectedIds.length === 0) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await onDeleteSelected(selectedIds);
    setDeleting(false);
    if (result.ok) {
      setRowSelection({});
      setConfirming(false);
    } else {
      setDeleteError(result.error);
    }
  };

  // useTable's `columns` option is typed as ColumnDef<TFeatures, TData,
  // unknown>[]. Because DataTable is generic over a per-column TValue, TS
  // can't prove ColumnDef<..., TValue>[] is assignable to that (the footer
  // render-prop callback makes TValue contravariant), even though at runtime
  // it's exactly the same array. Explicit generics + a narrowing cast route
  // around the inference dead-end; see github.com/TanStack/table/discussions/6535.
  const table = useTable<DataTableFeatures, TData>({
    features: dataTableFeatures,
    data,
    ...(getRowId && { getRowId: (row: TData) => getRowId(row) }),
    columns: columns as unknown as ColumnDef<
      DataTableFeatures,
      TData,
      unknown
    >[],
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      setConfirming(false);
      setDeleteError(null);
    },
  });

  const handleRowClick = (event: MouseEvent, original: TData) => {
    if (!onRowClick) return;
    // Let checkboxes, links and the actions menu do their own thing.
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "a, button, input, [role=checkbox], [role=menu], [role=menuitem]",
      )
    ) {
      return;
    }
    onRowClick(original);
  };

  return (
    <div className="rounded-md border">
      {onDeleteSelected && selectedIds.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-end gap-2 p-4"
          role="region"
          aria-label="Selected orders"
        >
          {deleteError && (
            <p role="alert" className="mr-auto text-sm text-red-600">
              {deleteError}
            </p>
          )}
          {confirming ? (
            <>
              <span className="text-sm">
                Delete {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "order" : "orders"}? This can&apos;t
                be undone.
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </Button>
            </>
          ) : (
            <button
              className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 text-sm rounded-md cursor-pointer"
              onClick={() => {
                setDeleteError(null);
                setConfirming(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "order" : "orders"}
            </button>
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
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
                data-state={row.getIsSelected() && "selected"}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={(event) => handleRowClick(event, row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
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
      <DataTablePagination table={table} />
    </div>
  );
}
