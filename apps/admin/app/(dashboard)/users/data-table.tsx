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
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { User } from "@clerk/nextjs/server";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const safeData = data ?? [];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

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

  const { getToken } = useAuth();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_AUTH_SERVICE_URL is not set");
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Could not verify your session");
      }

      const selectedRows = table.getSelectedRowModel().rows;

      // The requests are awaited and checked. Before, Promise.all() was not
      // awaited or returned, so "deleted successfully" showed immediately,
      // before any request finished, and failures (403, 500) were ignored.
      const results = await Promise.all(
        selectedRows.map(async (row) => {
          const userId = (row.original as User).id;
          const res = await fetch(`${baseUrl}/users/${userId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          return res.ok;
        }),
      );

      const failed = results.filter((ok) => !ok).length;
      if (failed > 0) {
        throw new Error(
          `${failed} of ${results.length} user(s) could not be deleted`,
        );
      }
    },
    onSuccess: () => {
      toast.success("User(s) deleted successfully");
      setRowSelection({});
    },
    onError: (error) => {
      toast.error(error.message);
    },
    // Refresh either way: on a partial failure some users may be gone.
    onSettled: () => {
      router.refresh();
    },
  });

  return (
    <div className="rounded-md border">
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 text-sm rounded-md m-4 cursor-pointer"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            {mutation.isPending ? "Deleting" : "Delete User(s)"}
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
