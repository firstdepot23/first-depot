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
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useConfirm } from "../../components/ConfirmDialog";

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
  // This table is shared (products, blog posts), so bulk delete is opt-in:
  // the delete button only appears when a handler is passed. The handler is
  // responsible for its own toasts / refresh; the table clears the selection
  // afterwards.
  onDeleteSelected?: (rows: TData[]) => Promise<void>;
  deleteLabel?: string;
  // Singular noun used in the confirmation, e.g. "product" or "post".
  itemLabel?: string;
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  onDeleteSelected,
  deleteLabel = "Delete selected",
  itemLabel = "item",
}: DataTableProps<TData, TValue>) {
  const safeData = data ?? [];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [deleting, setDeleting] = useState(false);
  const { confirm, dialog } = useConfirm();

  // Selection is keyed by row position. When the data changes (after a
  // delete or edit refreshes the page) positions shift, so a stale selection
  // would point at the wrong rows. Always start clean on new data.
  useEffect(() => {
    setRowSelection((prev) => (Object.keys(prev).length > 0 ? {} : prev));
  }, [data]);

  // useTable's `columns` option is typed as ColumnDef<TFeatures, TData,
  // unknown>[]. Because DataTable is generic over a per-column TValue, TS
  // can't prove ColumnDef<..., TValue>[] is assignable to that (the footer
  // render-prop callback makes TValue contravariant), even though at runtime
  // it's exactly the same array. Explicit generics + a narrowing cast route
  // around the inference dead-end; see github.com/TanStack/table/discussions/6535.
  const table = useTable<DataTableFeatures, TData>({
    features: dataTableFeatures,
    data: safeData,
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
    onRowSelectionChange: setRowSelection,
  });

  const selectedCount = Object.keys(rowSelection).length;

  const handleDeleteSelected = async () => {
    if (!onDeleteSelected || deleting) return;

    const rows = table.getSelectedRowModel().rows.map((row) => row.original);
    if (rows.length === 0) return;

    const noun = rows.length === 1 ? itemLabel : `${itemLabel}s`;
    const confirmed = await confirm({
      title: `Delete ${rows.length} ${noun}?`,
      message: `You are about to permanently delete ${
        rows.length === 1
          ? `the selected ${noun}`
          : `${rows.length} selected ${noun}`
      }. This cannot be undone.`,
      confirmLabel: "Yes, delete",
      cancelLabel: "No",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDeleteSelected(rows);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setDeleting(false);
      setRowSelection({});
    }
  };

  return (
    <div className="rounded-md border">
      {dialog}
      {onDeleteSelected && selectedCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="m-4 flex cursor-pointer items-center gap-2 rounded-md bg-red-500 px-2 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : `${deleteLabel} (${selectedCount})`}
          </button>
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
