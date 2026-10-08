"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ProductType } from "@repo/types";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Sheet } from "../../components/ui/sheet";
import { useConfirm } from "../../components/ConfirmDialog";
import EditProduct from "../../components/EditProduct";
import { categorySlugOf, deleteProduct } from "../../lib/productApi";
import type { DataTableFeatures } from "./data-table";

const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL;

const RowActions = ({ product }: { product: ProductType }) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm, dialog } = useConfirm();

  const onDelete = async () => {
    const confirmed = await confirm({
      title: "Delete this product?",
      message: (
        <>
          You are about to permanently delete{" "}
          <span className="font-medium text-foreground">{product.name}</span>.
          This cannot be undone.
        </>
      ),
      confirmLabel: "Yes, delete",
      cancelLabel: "No",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteProduct(product.id, await getToken());
      toast.success("Product deleted");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete the product.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {dialog}
      {/* modal={false}: opening a Sheet from a modal dropdown can leave the
          page unclickable after the Sheet closes. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={deleting}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            Edit product
          </DropdownMenuItem>
          {clientUrl && (
            <DropdownMenuItem asChild>
              <Link
                href={`${clientUrl}/products/${product.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on site
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(product.id.toString())}
          >
            Copy product ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        {/* Mounted only while open, so the form always starts from the
            product's current saved values. */}
        {editOpen && (
          <EditProduct product={product} onSaved={() => setEditOpen(false)} />
        )}
      </Sheet>
    </>
  );
};

export const columns: ColumnDef<DataTableFeatures, ProductType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => {
      const product = row.original;
      const images = (product.images ?? {}) as Record<string, string>;
      const src = images[product.colors[0] ?? ""] ?? Object.values(images)[0];

      return src ? (
        <div className="relative h-9 w-9">
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="36px"
            className="rounded-full object-cover"
          />
        </div>
      ) : (
        <div className="h-9 w-9 rounded-full bg-muted" />
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => categorySlugOf(row.original) || "-",
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => `UGX ${row.original.price.toLocaleString()}`,
  },
  {
    accessorKey: "shortDescription",
    header: "Description",
  },
  {
    id: "actions",
    cell: ({ row }) => <RowActions product={row.original} />,
  },
];
