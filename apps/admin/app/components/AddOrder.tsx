"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "./ui/button";
import { createOrder } from "../(dashboard)/orders/action";
import {
  DELIVERY_METHODS,
  PAYMENT_STATUSES,
  SHIPPING_STATUSES,
  formatMoney,
  shippingLabel,
  titleCase,
} from "../(dashboard)/orders/order-types";

// The store, used to pre-fill pickup orders (same address as the letterhead).
const STORE_ADDRESS = "Plot 00, Ojwina Road - Wigweng, Barogole";
const STORE_CITY = "Lira City";

const PAYMENT_METHODS = [
  "Cash",
  "MTN Mobile Money",
  "Airtel Money",
  "Visa",
  "MasterCard",
];

// Mirrors the Order schema in @repo/order-db. The order service works out the
// subtotal, total, merchant reference and legacy `status` itself.
const formSchema = z
  .object({
    userId: z.string().trim().min(1, { message: "Customer ID is required" }),
    email: z.string().trim().email({ message: "Enter a valid email" }),
    shipping: z.object({
      name: z.string().trim().min(1, { message: "Name is required" }),
      email: z
        .string()
        .trim()
        .email({ message: "Enter a valid email" })
        .or(z.literal("")),
      phone: z.string().trim().min(1, { message: "Phone is required" }),
      address: z.string().trim().min(1, { message: "Address is required" }),
      city: z.string().trim().min(1, { message: "City is required" }),
    }),
    deliveryMethod: z.enum(DELIVERY_METHODS),
    deliveryCity: z.string().trim().optional(),
    deliveryFee: z.number().min(0),
    products: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(1, { message: "Product name is required" }),
          quantity: z.number().int().min(1, { message: "At least 1" }),
          price: z.number().min(1, { message: "Enter a price" }),
        }),
      )
      .min(1, { message: "Add at least one product" }),
    paymentStatus: z.enum(PAYMENT_STATUSES),
    paymentMethod: z.string().trim().optional(),
    shippingStatus: z.enum(SHIPPING_STATUSES),
  })
  .superRefine((values, ctx) => {
    if (values.deliveryMethod === "delivery" && !values.deliveryCity) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryCity"],
        message: "Delivery city is required",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const emptyProduct = { name: "", quantity: 1, price: 0 };

const defaultValues: FormValues = {
  userId: "",
  email: "",
  shipping: { name: "", email: "", phone: "", address: "", city: "" },
  deliveryMethod: "pickup",
  deliveryCity: "",
  deliveryFee: 0,
  products: [emptyProduct],
  paymentStatus: "COMPLETED",
  paymentMethod: "Cash",
  shippingStatus: "processing",
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="border-b pb-1 text-sm font-semibold">{children}</h3>
);

type Props = {
  // Called after the order is saved, so the parent can close the sheet.
  onCreated?: () => void;
};

const AddOrder = ({ onCreated }: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const method = form.watch("deliveryMethod");
  const products = form.watch("products");
  const fee = form.watch("deliveryFee");
  const subtotal = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
    0,
  );
  const total = subtotal + (method === "delivery" ? fee || 0 : 0);

  const textField = (
    name: FieldPath<FormValues>,
    label: string,
    options: {
      placeholder?: string;
      description?: string;
      type?: string;
      list?: string;
      onValueChange?: (value: string) => void;
    } = {},
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={(field.value as string | undefined) ?? ""}
              onChange={(event) => {
                options.onValueChange?.(event.target.value);
                field.onChange(event);
              }}
              type={options.type}
              list={options.list}
              placeholder={options.placeholder}
            />
          </FormControl>
          {options.description && (
            <FormDescription>{options.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // Recommended fill: the shipping email follows the account email until the
  // admin types a different one.
  const followAccountEmail = (next: string) => {
    const previous = form.getValues("email");
    const current = form.getValues("shipping.email");
    if (!current || current === previous) {
      form.setValue("shipping.email", next);
    }
  };

  // Recommended fill: pickup orders default to the store's address. Switching
  // back clears it again if the admin hasn't changed it.
  const changeMethod = (next: (typeof DELIVERY_METHODS)[number]) => {
    const address = form.getValues("shipping.address");
    const city = form.getValues("shipping.city");
    if (next === "pickup") {
      if (!address) form.setValue("shipping.address", STORE_ADDRESS);
      if (!city) form.setValue("shipping.city", STORE_CITY);
      form.setValue("deliveryFee", 0);
    } else {
      if (address === STORE_ADDRESS) form.setValue("shipping.address", "");
      if (city === STORE_CITY) form.setValue("shipping.city", "");
    }
    form.setValue("deliveryMethod", next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    const result = await createOrder({
      userId: values.userId,
      email: values.email,
      shipping: values.shipping,
      deliveryMethod: values.deliveryMethod,
      deliveryCity:
        values.deliveryMethod === "delivery"
          ? values.deliveryCity?.toLowerCase()
          : undefined,
      deliveryFee:
        values.deliveryMethod === "delivery" ? values.deliveryFee : 0,
      products: values.products,
      paymentStatus: values.paymentStatus,
      paymentMethod: values.paymentMethod || undefined,
      shippingStatus: values.shippingStatus,
    });

    if (!result.ok) {
      form.setError("root", { message: result.error });
      return;
    }

    form.reset(defaultValues);
    onCreated?.();
  };

  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle>Add order</SheetTitle>
        <SheetDescription>
          For phone or walk-in sales. The total is worked out from the products
          and delivery fee.
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 px-4 pb-6"
          noValidate
        >
          <section className="space-y-3">
            <SectionTitle>Customer</SectionTitle>
            {textField("userId", "Customer ID", {
              placeholder: "user_...",
              description:
                "The Clerk user ID. It is in the customer's page address.",
            })}
            {textField("email", "Account email", {
              type: "email",
              onValueChange: followAccountEmail,
            })}
          </section>

          <section className="space-y-3">
            <SectionTitle>Delivery</SectionTitle>
            <FormField
              control={form.control}
              name="deliveryMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      changeMethod(value as (typeof DELIVERY_METHODS)[number])
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DELIVERY_METHODS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {titleCase(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {textField("shipping.name", "Recipient name")}
            <div className="grid gap-3 sm:grid-cols-2">
              {textField("shipping.phone", "Phone", { type: "tel" })}
              {textField("shipping.email", "Recipient email", {
                type: "email",
              })}
            </div>
            {textField(
              "shipping.address",
              method === "pickup" ? "Pickup address" : "Address",
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {textField("shipping.city", "City")}
              {method === "delivery" &&
                textField("deliveryCity", "Delivery city", {
                  placeholder: "e.g. gulu",
                  description: "The city used to price delivery.",
                })}
            </div>
            {method === "delivery" && (
              <FormField
                control={form.control}
                name="deliveryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery fee (UGX)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        value={field.value || ""}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value || 0))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle>Products</SectionTitle>
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_5rem_8rem_auto] items-start gap-2"
              >
                <FormField
                  control={form.control}
                  name={`products.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Product</FormLabel>}
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Roofing sheet, 3 m"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`products.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Qty</FormLabel>}
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value || 0))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`products.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Unit price</FormLabel>}
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder="0"
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value || 0))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={index === 0 ? "mt-6" : undefined}
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label={`Remove product ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {form.formState.errors.products?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.products.message}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyProduct)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Button>

            <dl className="grid grid-cols-[1fr_auto] gap-y-1 rounded-md bg-muted p-3 text-sm">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="text-right tabular-nums">
                {formatMoney(subtotal)}
              </dd>
              {method === "delivery" && (
                <>
                  <dt className="text-muted-foreground">Delivery fee</dt>
                  <dd className="text-right tabular-nums">
                    {formatMoney(fee || 0)}
                  </dd>
                </>
              )}
              <dt className="font-semibold">Total</dt>
              <dd className="text-right font-semibold tabular-nums">
                {formatMoney(total)}
              </dd>
            </dl>
          </section>

          <section className="space-y-3">
            <SectionTitle>Payment and shipping</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {titleCase(value.toLowerCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {textField("paymentMethod", "Payment method", {
                list: "payment-methods",
              })}
              <datalist id="payment-methods">
                {PAYMENT_METHODS.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <FormField
              control={form.control}
              name="shippingStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SHIPPING_STATUSES.filter(
                        (value) => method === "delivery" || value !== "shipped",
                      ).map((value) => (
                        <SelectItem key={value} value={value}>
                          {shippingLabel(value, method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can change this later from the order page.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {form.formState.errors.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving order..." : "Save order"}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
};

export default AddOrder;
