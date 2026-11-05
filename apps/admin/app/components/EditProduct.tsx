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

// Dates come back from the API as full ISO strings; <input type="date">
// wants YYYY-MM-DD.
const dateInput = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const text = value instanceof Date ? value.toISOString() : String(value);
  return text.slice(0, 10);
};

// Grocery products saved before pack sizes existed have one price and a list of
// sizes. Show each size as a pack at that price so the admin can set the real
// prices; the existing stock is put on the first pack.
const packsOf = (product: ProductType): ProductFormValues["variants"] => {
  if (product.segment !== "GROCERY") return undefined;

  if (product.variants && product.variants.length > 0) {
    return product.variants.map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price,
      costPrice: v.costPrice ?? undefined,
      stock: v.stock,
      barcode: v.barcode ?? undefined,
    }));
  }

  const labels = product.sizes.length > 0 ? product.sizes : [""];
  return labels.map((label, index) => ({
    label,
    price: product.price,
    costPrice: index === 0 ? (product.costPrice ?? undefined) : undefined,
    stock: index === 0 ? (product.stock ?? 0) : 0,
    barcode: index === 0 ? (product.barcode ?? undefined) : undefined,
  }));
};

const optionGroupsOf = (
  product: ProductType,
): ProductFormValues["optionGroups"] =>
  product.segment !== "FASTFOOD"
    ? undefined
    : (product.optionGroups ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        selection: g.selection,
        required: g.required,
        options: g.options.map((o) => ({
          id: o.id,
          name: o.name,
          extraPrice: o.extraPrice,
          available: o.available,
        })),
      }));

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
    segment: product.segment,
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

    // Shared commerce / inventory (null in the database -> undefined here).
    stock: product.stock ?? undefined,
    costPrice: product.costPrice ?? undefined,
    wholesalePrice: product.wholesalePrice ?? undefined,
    supplier: product.supplier ?? undefined,
    barcode: product.barcode ?? undefined,

    // Perishable tracking (grocery + pharmacy).
    batchNumber: product.batchNumber ?? undefined,
    manufacturingDate: dateInput(product.manufacturingDate),
    expiryDate: dateInput(product.expiryDate),

    // Grocery: one entry per pack size, each with its own price.
    variants: packsOf(product),
    // Fast food: accompaniments, drinks and add-ons.
    optionGroups: optionGroupsOf(product),

    // Pharmacy only.
    formulation: product.formulation ?? undefined,
    dosageStrength: product.dosageStrength ?? undefined,
    activeIngredient: product.activeIngredient ?? undefined,
    manufacturer: product.manufacturer ?? undefined,
    prescriptionRequired: product.prescriptionRequired ?? false,
    storageConditions: product.storageConditions ?? undefined,
    registrationNumber: product.registrationNumber ?? undefined,
  };

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      // Pack sizes and accompaniments are sent as they are; cleanProductValues
      // only tidies the plain fields.
      const payload = {
        ...cleanProductValues(values),
        variants: values.variants,
        optionGroups: values.optionGroups,
      };
      await updateProduct(product.id, payload, await getToken());
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
    <SheetContent
      className={
        product.segment === "GROCERY" || product.segment === "FASTFOOD"
          ? "w-full sm:max-w-xl"
          : undefined
      }
    >
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
