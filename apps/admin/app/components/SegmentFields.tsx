"use client";

import type { UseFormReturn } from "react-hook-form";
import type { Segment } from "@repo/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import type { ProductFormValues } from "../lib/productApi";

type TextName =
  | "supplier"
  | "barcode"
  | "batchNumber"
  | "manufacturingDate"
  | "expiryDate"
  | "formulation"
  | "dosageStrength"
  | "activeIngredient"
  | "manufacturer"
  | "storageConditions"
  | "registrationNumber";

type NumberName = "stock" | "costPrice" | "wholesalePrice";

type Form = UseFormReturn<ProductFormValues>;

const TextField = ({
  form,
  name,
  label,
  description,
  type = "text",
  required,
}: {
  form: Form;
  name: TextName;
  label: string;
  description?: string;
  type?: "text" | "date";
  required?: boolean;
}) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required ? " *" : ""}
        </FormLabel>
        <FormControl>
          <Input type={type} {...field} value={field.value ?? ""} />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

const NumberField = ({
  form,
  name,
  label,
  description,
}: {
  form: Form;
  name: NumberName;
  label: string;
  description?: string;
}) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            type="number"
            {...field}
            value={field.value ?? ""}
            onChange={(e) =>
              field.onChange(
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

// The extra fields grocery and pharmacy products have on top of the shared
// ones (name, price, category, sizes, photos). Hardware doesn't use them.
const SegmentFields = ({ form, segment }: { form: Form; segment: Segment }) => {
  const isPharmacy = segment === "PHARMACY";
  // Grocery is sold in packs, and each pack has its own stock, cost price and
  // barcode (set in the "Pack sizes & prices" section), so they are not
  // repeated here.
  const isGrocery = segment === "GROCERY";

  return (
    <>
      {isGrocery ? (
        <p className="text-sm text-muted-foreground">
          Stock, cost price and barcode are entered for each pack size above.
        </p>
      ) : (
        <NumberField
          form={form}
          name="stock"
          label="Stock on hand"
          description="Units currently in stock."
        />
      )}
      <TextField
        form={form}
        name="supplier"
        label="Supplier"
        description="Who you buy this from."
      />
      {!isGrocery && (
        <NumberField form={form} name="costPrice" label="Cost price (UGX)" />
      )}
      <NumberField
        form={form}
        name="wholesalePrice"
        label="Wholesale price (UGX)"
      />
      {!isGrocery && (
        <TextField
          form={form}
          name="barcode"
          label="Barcode"
          description="Must be unique. Leave empty if there isn't one."
        />
      )}
      <TextField
        form={form}
        name="batchNumber"
        label="Batch number"
        required={isPharmacy}
      />
      <TextField
        form={form}
        name="manufacturingDate"
        label="Manufacturing date"
        type="date"
      />
      <TextField
        form={form}
        name="expiryDate"
        label="Expiry date"
        type="date"
        required={isPharmacy}
      />

      {isPharmacy && (
        <>
          <TextField
            form={form}
            name="formulation"
            label="Formulation"
            description="Tablet, syrup, capsule, injection, cream..."
          />
          <TextField
            form={form}
            name="dosageStrength"
            label="Dosage strength"
            description="e.g. 500mg, 5mg/ml"
          />
          <TextField
            form={form}
            name="activeIngredient"
            label="Active ingredient"
          />
          <TextField form={form} name="manufacturer" label="Manufacturer" />
          <TextField
            form={form}
            name="registrationNumber"
            label="Drug registration number"
            description="National Drug Authority registration number."
          />
          <TextField
            form={form}
            name="storageConditions"
            label="Storage conditions"
            description="e.g. Store below 25°C, away from light"
          />
          <FormField
            control={form.control}
            name="prescriptionRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  Prescription required
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
};

export default SegmentFields;
