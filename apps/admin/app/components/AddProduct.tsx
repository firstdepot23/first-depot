"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { SEGMENT_LABELS, type Segment } from "@repo/types";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import ProductForm from "./ProductForm";
import BulkAddProducts from "./BulkAddProducts";
import {
  cleanProductValues,
  createProduct,
  type ProductFormValues,
} from "../lib/productApi";

const defaultsFor = (segment: "HARDWARE" | "FASTFOOD"): ProductFormValues => ({
  segment,
  name: "",
  shortDescription: "",
  description: "",
  price: 0,
  categorySlug: "",
  sizes: [],
  colors: [],
  images: {},
  gallery: {},
  ...(segment === "FASTFOOD" ? { optionGroups: [] } : {}),
});

// Hardware is sold by color and fast food is a menu item with its own
// accompaniments, so both are still added one product at a time with the same
// form EditProduct uses (cover + extra photos work the same way).
const SingleProductContent = ({
  segment,
}: {
  segment: "HARDWARE" | "FASTFOOD";
}) => {
  const { getToken } = useAuth();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      // Pack sizes and accompaniments are sent as they are; cleanProductValues
      // only tidies the plain fields.
      const payload = {
        ...cleanProductValues(values),
        optionGroups: values.optionGroups,
      };
      await createProduct(payload, await getToken());
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <SheetContent
      className={segment === "FASTFOOD" ? "w-full sm:max-w-xl" : undefined}
    >
      <ScrollArea className="h-screen">
        <SheetHeader>
          <SheetTitle>Add {SEGMENT_LABELS[segment]} Product</SheetTitle>
          <SheetDescription>
            Fill in the details below, then submit.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-10">
          <ProductForm
            defaultValues={defaultsFor(segment)}
            onSubmit={(values) => mutation.mutate(values)}
            isPending={mutation.isPending}
            submitLabel="Submit"
          />
        </div>
      </ScrollArea>
    </SheetContent>
  );
};

// Grocery and pharmacy arrive from suppliers in batches, so they're entered
// as a table: one supplier, many products, each with the quantity supplied.
const BulkContent = ({ segment }: { segment: "GROCERY" | "PHARMACY" }) => (
  <SheetContent className="w-full sm:max-w-6xl">
    <ScrollArea className="h-screen">
      <SheetHeader>
        <SheetTitle>Add {SEGMENT_LABELS[segment]} Products</SheetTitle>
        <SheetDescription>
          Enter a supplier delivery: one supplier, as many products as they
          brought, and the quantity of each.
          {segment === "GROCERY" &&
            " Sold in several pack sizes? Add one line per pack with the same name, each with its own price."}
        </SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-10">
        <BulkAddProducts segment={segment} />
      </div>
    </ScrollArea>
  </SheetContent>
);

const AddProduct = ({ segment }: { segment: Segment }) =>
  segment === "HARDWARE" || segment === "FASTFOOD" ? (
    <SingleProductContent segment={segment} />
  ) : (
    <BulkContent segment={segment} />
  );

export default AddProduct;
