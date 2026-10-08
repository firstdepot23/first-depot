"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { ProductType } from "@repo/types";
import { deleteProducts } from "../../lib/productApi";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const ProductsTable = ({ products }: { products: ProductType[] }) => {
  const { getToken } = useAuth();
  const router = useRouter();

  const handleDeleteSelected = async (rows: ProductType[]) => {
    try {
      const token = await getToken();
      const result = await deleteProducts(
        rows.map((row) => row.id),
        token,
      );

      if (result.failed === 0) {
        toast.success(
          result.deleted === 1
            ? "Product deleted"
            : `${result.deleted} products deleted`,
        );
      } else if (result.deleted === 0) {
        toast.error(result.message ?? "Couldn't delete the selected products.");
      } else {
        toast.warning(
          `${result.deleted} deleted, ${result.failed} could not be deleted. ${result.message ?? ""}`.trim(),
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't delete the selected products.",
      );
    } finally {
      // Refresh either way: on a partial failure some products are gone.
      router.refresh();
    }
  };

  return (
    <DataTable
      columns={columns}
      data={products}
      onDeleteSelected={handleDeleteSelected}
      deleteLabel="Delete Product(s)"
      itemLabel="product"
    />
  );
};

export default ProductsTable;
