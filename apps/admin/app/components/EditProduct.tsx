"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { ProductType } from "@repo/types";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import ProductForm from "./ProductForm";
import {
  categorySlugOf,
  cleanProductValues,
  updateProduct,
  type ProductFormValues,
} from "../lib/productApi";

const EditProduct = ({
  product,
  onSaved,
}: {
  product: ProductType;
  onSaved: () => void;
}) => {
  const { getToken } = useAuth();
  const router = useRouter();

  const defaultValues: ProductFormValues = {
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    categorySlug: categorySlugOf(product),
    sizes: [...product.sizes],
    colors: [...product.colors],
    images: { ...((product.images ?? {}) as Record<string, string>) },
    // Older products have no extra photos yet.
    gallery: { ...((product.gallery ?? {}) as Record<string, string[]>) },
  };

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      await updateProduct(
        product.id,
        cleanProductValues(values),
        await getToken(),
      );
    },
    onSuccess: () => {
      toast.success("Product updated");
      onSaved();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <SheetContent>
      <ScrollArea className="h-screen">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>
            Change the details below, then save.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-10">
          <ProductForm
            defaultValues={defaultValues}
            onSubmit={(values) => mutation.mutate(values)}
            isPending={mutation.isPending}
            submitLabel="Save changes"
          />
        </div>
      </ScrollArea>
    </SheetContent>
  );
};

export default EditProduct;
