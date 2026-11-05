"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import {
  BulkProductItemSchema,
  MAX_BULK_ITEMS,
  SEGMENT_LABELS,
  type BulkProductItem,
  type CategoryType,
} from "@repo/types";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import { uploadToCloudinary } from "../lib/cloudinary";
import {
  createProductsBulk,
  type BulkProductsPayload,
} from "../lib/productApi";
import { bulkGroupKey, normalizeLabel } from "../lib/productExtras";

type BulkSegment = "GROCERY" | "PHARMACY";

// Everything is kept as the text the person typed and only converted when
// they submit, like the items table on the quote page.
type Row = {
  id: number;
  name: string;
  categorySlug: string;
  size: string;
  quantity: string;
  costPrice: string;
  price: string;
  batchNumber: string;
  expiryDate: string;
  // "More details" panel
  manufacturingDate: string;
  barcode: string;
  description: string;
  image: string;
  // Pharmacy only
  formulation: string;
  dosageStrength: string;
  activeIngredient: string;
  manufacturer: string;
  registrationNumber: string;
  storageConditions: string;
  prescriptionRequired: boolean;
};

const INITIAL_ROWS = 5;

let rowCounter = 0;
const newRow = (categorySlug = ""): Row => ({
  id: ++rowCounter,
  name: "",
  categorySlug,
  size: "",
  quantity: "",
  costPrice: "",
  price: "",
  batchNumber: "",
  expiryDate: "",
  manufacturingDate: "",
  barcode: "",
  description: "",
  image: "",
  formulation: "",
  dosageStrength: "",
  activeIngredient: "",
  manufacturer: "",
  registrationNumber: "",
  storageConditions: "",
  prescriptionRequired: false,
});

// A row nobody has typed into (the category may have been pre-filled).
const isBlank = (r: Row) =>
  !r.name.trim() &&
  !r.size.trim() &&
  !r.quantity.trim() &&
  !r.costPrice.trim() &&
  !r.price.trim() &&
  !r.batchNumber.trim() &&
  !r.barcode.trim();

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const txt = (s: string) => (s.trim() === "" ? undefined : s.trim());

const toItem = (r: Row, pharmacy: boolean) => ({
  name: r.name,
  categorySlug: r.categorySlug,
  size: r.size,
  quantity: num(r.quantity),
  price: num(r.price),
  costPrice: num(r.costPrice),
  description: txt(r.description),
  barcode: txt(r.barcode),
  batchNumber: txt(r.batchNumber),
  manufacturingDate: txt(r.manufacturingDate),
  expiryDate: txt(r.expiryDate),
  image: txt(r.image),
  ...(pharmacy
    ? {
        formulation: txt(r.formulation),
        dosageStrength: txt(r.dosageStrength),
        activeIngredient: txt(r.activeIngredient),
        manufacturer: txt(r.manufacturer),
        registrationNumber: txt(r.registrationNumber),
        storageConditions: txt(r.storageConditions),
        prescriptionRequired: r.prescriptionRequired,
      }
    : {}),
});

// Same rules the service applies, so mistakes show up on the row before
// anything is sent. Returns the cleaned item (when valid) and the messages.
const check = (r: Row, pharmacy: boolean) => {
  const result = BulkProductItemSchema.safeParse(toItem(r, pharmacy));
  const messages: string[] = result.success
    ? []
    : [...new Set(result.error.issues.map((issue) => issue.message))];

  if (pharmacy) {
    if (!r.batchNumber.trim()) {
      messages.push("Batch number is required for pharmacy products");
    }
    if (!r.expiryDate.trim()) {
      messages.push("Expiry date is required for pharmacy products");
    }
  }
  return { item: result.success ? result.data : undefined, messages };
};

const fetchCategories = async (
  segment: BulkSegment,
): Promise<CategoryType[]> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/categories?segment=${segment}`,
  );
  if (!res.ok) throw new Error("Failed to fetch categories!");
  return res.json();
};

const money = (value: number) => `UGX ${value.toLocaleString()}`;

// Native <select> styled like <Input>, so a row stays one compact line.
const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

// #, item, category, size/unit, qty, cost, selling price, batch, expiry,
// line total, actions.
const GRID =
  "grid grid-cols-[2rem_minmax(11rem,2fr)_minmax(9rem,1.2fr)_minmax(8rem,1fr)_5rem_7rem_7rem_minmax(7rem,1fr)_9rem_7rem_4rem] items-center gap-2";

const Labeled = ({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) => (
  <label className={cn("space-y-1 text-xs font-medium", className)}>
    <span>{label}</span>
    {children}
  </label>
);

const BulkAddProducts = ({ segment }: { segment: BulkSegment }) => {
  const isPharmacy = segment === "PHARMACY";
  const label = SEGMENT_LABELS[segment];
  const { getToken } = useAuth();
  const router = useRouter();

  const [supplier, setSupplier] = useState("");
  const [supplierMissing, setSupplierMissing] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState("");
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => newRow()),
  );
  const [problems, setProblems] = useState<Record<number, string[]>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const { data: categories, error: categoriesError } = useQuery({
    queryKey: ["categories", segment],
    queryFn: () => fetchCategories(segment),
  });

  const anyUploading = Object.values(uploading).some(Boolean);

  const clearProblem = (id: number) =>
    setProblems((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const update = <K extends keyof Row>(id: number, key: K, value: Row[K]) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)),
    );
    clearProblem(id);
  };

  // Rows that don't have a category yet pick up the chosen default.
  const chooseDefaultCategory = (slug: string) => {
    setDefaultCategory(slug);
    setRows((prev) =>
      prev.map((r) => (r.categorySlug ? r : { ...r, categorySlug: slug })),
    );
  };

  const addRow = () => {
    if (rows.length >= MAX_BULK_ITEMS) {
      toast.error(`One entry can have up to ${MAX_BULK_ITEMS} products.`);
      return;
    }
    setRows((prev) => [...prev, newRow(defaultCategory)]);
  };

  const removeRow = (id: number) => {
    setRows((prev) =>
      prev.length <= 1
        ? [newRow(defaultCategory)]
        : prev.filter((r) => r.id !== id),
    );
    clearProblem(id);
  };

  const uploadPhoto = async (id: number, file: File) => {
    setUploading((prev) => ({ ...prev, [id]: true }));
    try {
      update(id, "image", await uploadToCloudinary(file));
    } catch (error) {
      console.error(error);
      toast.error("Upload failed!");
    } finally {
      setUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // One product per line: name, size, qty, cost price, selling price.
  // Tab-separated (pasted straight from a spreadsheet) or comma-separated.
  const importPasted = () => {
    const digits = (s: string) => s.replace(/[^\d.]/g, "");
    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: Row[] = [];
    lines.forEach((line, index) => {
      const cells = (
        line.includes("\t") ? line.split("\t") : line.split(",")
      ).map((c) => c.trim());
      // Skip a header row ("Item, Size, Qty ...").
      if (index === 0 && /^(item|name|product)/i.test(cells[0] ?? "")) return;

      const [name = "", size = "", qty = "", cost = "", price = ""] = cells;
      if (!name) return;
      parsed.push({
        ...newRow(defaultCategory),
        name,
        size,
        quantity: digits(qty),
        costPrice: digits(cost),
        price: digits(price),
      });
    });

    if (parsed.length === 0) {
      toast.error(
        "Nothing to import. Use one product per line: name, size, qty, cost price, selling price.",
      );
      return;
    }

    const kept = rows.filter((r) => !isBlank(r));
    const merged = [...kept, ...parsed];
    if (merged.length > MAX_BULK_ITEMS) {
      toast.info(`Only the first ${MAX_BULK_ITEMS} lines were kept.`);
    }
    setRows(merged.slice(0, MAX_BULK_ITEMS));
    setProblems({});
    setPasteText("");
    setPasteOpen(false);
    toast.success(
      `${parsed.length} line${parsed.length === 1 ? "" : "s"} added. Check each category${isPharmacy ? ", batch and expiry date" : ""}.`,
    );
  };

  // Grocery lines with the same name and category are one product sold in
  // several packs. Count how many lines share each product.
  const linesPerProduct = useMemo(() => {
    const counts = new Map<string, number>();
    if (isPharmacy) return counts;
    for (const r of rows) {
      if (isBlank(r)) continue;
      const key = bulkGroupKey(r.name, r.categorySlug);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [rows, isPharmacy]);

  const totals = useMemo(() => {
    let lines = 0;
    let unitCount = 0;
    let cost = 0;
    for (const r of rows) {
      if (isBlank(r)) continue;
      lines += 1;
      const qty = Number(r.quantity);
      const unitCost = Number(r.costPrice);
      if (Number.isFinite(qty) && qty > 0) unitCount += qty;
      if (qty > 0 && unitCost > 0) cost += qty * unitCost;
    }
    return { lines, unitCount, cost };
  }, [rows]);

  const resetAll = () => {
    setSupplier("");
    setSupplierMissing(false);
    setRows(
      Array.from({ length: INITIAL_ROWS }, () => newRow(defaultCategory)),
    );
    setProblems({});
    setExpanded({});
  };

  const mutation = useMutation({
    mutationFn: async (payload: BulkProductsPayload) => {
      await createProductsBulk(payload, await getToken());
    },
    onSuccess: (_data, payload) => {
      // Pack lines of the same grocery product are saved as ONE product.
      const count = isPharmacy
        ? payload.items.length
        : new Set(
            payload.items.map((item) =>
              bulkGroupKey(item.name, item.categorySlug),
            ),
          ).size;
      toast.success(
        `${count} ${label.toLowerCase()} product${count === 1 ? "" : "s"} added`,
      );
      resetAll();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submit = () => {
    if (!supplier.trim()) {
      setSupplierMissing(true);
      toast.error("Enter the supplier first.");
      return;
    }

    const filled = rows.filter((r) => !isBlank(r));
    if (filled.length === 0) {
      toast.error("Add at least one product.");
      return;
    }

    const found: Record<number, string[]> = {};
    const items: BulkProductItem[] = [];
    const barcodes = new Map<string, number>();

    for (const r of filled) {
      const { item, messages } = check(r, isPharmacy);

      const barcode = r.barcode.trim();
      if (barcode) {
        const first = barcodes.get(barcode);
        if (first !== undefined) {
          messages.push(`Barcode "${barcode}" is already used on row ${first}`);
        } else {
          barcodes.set(barcode, rows.indexOf(r) + 1);
        }
      }

      if (messages.length > 0 || !item) found[r.id] = messages;
      else items.push(item);
    }

    // Same product on two lines with the same pack size: one of them is a mistake.
    if (!isPharmacy) {
      const seenPacks = new Map<string, number>();
      for (const r of filled) {
        const product = bulkGroupKey(r.name, r.categorySlug);
        const size = normalizeLabel(r.size);
        if (!product || !size) continue;
        const packKey = `${product}|${size}`;
        const first = seenPacks.get(packKey);
        if (first !== undefined) {
          found[r.id] = [
            ...(found[r.id] ?? []),
            `"${r.name.trim()}" already has a ${r.size.trim()} pack on row ${first}`,
          ];
        } else {
          seenPacks.set(packKey, rows.indexOf(r) + 1);
        }
      }
    }

    setProblems(found);
    const bad = Object.keys(found).length;
    if (bad > 0) {
      toast.error(
        `${bad} line${bad === 1 ? " needs" : "s need"} attention — see the red rows.`,
      );
      return;
    }

    mutation.mutate({ segment, supplier: supplier.trim(), items });
  };

  return (
    <div className="space-y-8">
      {/* 1. Supplier */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">1. Supplier</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Labeled label="Supplier *">
            <Input
              value={supplier}
              placeholder="Who delivered this stock?"
              aria-invalid={supplierMissing && !supplier.trim()}
              onChange={(e) => {
                setSupplier(e.target.value);
                setSupplierMissing(false);
              }}
            />
          </Labeled>
          <Labeled label="Category for new lines (optional)">
            <select
              className={SELECT_CLASS}
              value={defaultCategory}
              onChange={(e) => chooseDefaultCategory(e.target.value)}
            >
              <option value="">Pick per line</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Labeled>
        </div>
        {categoriesError && (
          <p className="text-sm text-destructive">
            Couldn&apos;t load categories. Close this panel and try again.
          </p>
        )}
        {categories && categories.length === 0 && (
          <p className="text-sm text-destructive">
            There are no {label.toLowerCase()} categories yet. Add one from the
            sidebar first, then come back.
          </p>
        )}
      </section>

      {/* 2. Items, laid out like the bill of quantities on the quote page */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            2. Items delivered (bill of quantities)
          </h3>
          <p className="text-sm text-muted-foreground">
            One line per product. Quantity is how many units the supplier
            brought; it becomes the product&apos;s stock. Cost price is what you
            paid, selling price is what customers pay.
            {!isPharmacy && (
              <>
                {" "}
                <span className="font-medium text-foreground">
                  Sold in more than one pack size (500 g, 1 Kg, 25 Kg)?
                </span>{" "}
                Add one line per pack with the same name and category, and enter
                each pack&apos;s own price. They are saved as one product.
              </>
            )}
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1180px] space-y-1">
            <div
              className={cn(
                GRID,
                "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              )}
            >
              <span>#</span>
              <span>Item</span>
              <span>Category</span>
              <span>Size / unit</span>
              <span>Qty</span>
              <span>Cost (UGX)</span>
              <span>Sell (UGX)</span>
              <span>Batch no.{isPharmacy ? " *" : ""}</span>
              <span>Expiry{isPharmacy ? " *" : ""}</span>
              <span className="text-right">Total cost</span>
              <span />
            </div>

            {rows.map((r, index) => {
              const rowProblems = problems[r.id];
              const open = !!expanded[r.id];
              const qty = Number(r.quantity);
              const unitCost = Number(r.costPrice);
              const lineTotal = qty > 0 && unitCost > 0 ? qty * unitCost : 0;
              const n = index + 1;

              return (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-md",
                    rowProblems &&
                      "bg-red-50 ring-1 ring-red-300 dark:bg-red-950/20 dark:ring-red-900",
                  )}
                >
                  <div className={cn(GRID, "py-1")}>
                    <span className="pl-1 text-sm text-muted-foreground">
                      {n}
                    </span>
                    <Input
                      className="h-9"
                      value={r.name}
                      placeholder="Product name"
                      aria-label={`Product name, row ${n}`}
                      onChange={(e) => update(r.id, "name", e.target.value)}
                    />
                    <select
                      className={SELECT_CLASS}
                      value={r.categorySlug}
                      aria-label={`Category, row ${n}`}
                      onChange={(e) =>
                        update(r.id, "categorySlug", e.target.value)
                      }
                    >
                      <option value="">Category</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      className="h-9"
                      value={r.size}
                      placeholder={isPharmacy ? "e.g. 30 Tablets" : "e.g. 1 Kg"}
                      aria-label={`Size or unit, row ${n}`}
                      onChange={(e) => update(r.id, "size", e.target.value)}
                    />
                    <Input
                      className="h-9"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={r.quantity}
                      placeholder="Qty"
                      aria-label={`Quantity supplied, row ${n}`}
                      onChange={(e) => update(r.id, "quantity", e.target.value)}
                    />
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={r.costPrice}
                      placeholder="Optional"
                      aria-label={`Cost price, row ${n}`}
                      onChange={(e) =>
                        update(r.id, "costPrice", e.target.value)
                      }
                    />
                    <Input
                      className="h-9"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={r.price}
                      placeholder="Price"
                      aria-label={`Selling price, row ${n}`}
                      onChange={(e) => update(r.id, "price", e.target.value)}
                    />
                    <Input
                      className="h-9"
                      value={r.batchNumber}
                      placeholder="Batch"
                      aria-label={`Batch number, row ${n}`}
                      onChange={(e) =>
                        update(r.id, "batchNumber", e.target.value)
                      }
                    />
                    <Input
                      className="h-9"
                      type="date"
                      value={r.expiryDate}
                      aria-label={`Expiry date, row ${n}`}
                      onChange={(e) =>
                        update(r.id, "expiryDate", e.target.value)
                      }
                    />
                    <span className="text-right text-sm tabular-nums">
                      {lineTotal > 0 ? lineTotal.toLocaleString() : "—"}
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [r.id]: !open }))
                        }
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={`${open ? "Hide" : "Show"} more details, row ${n}`}
                        aria-expanded={open}
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={`Remove row ${n}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="mx-8 mb-3 grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-4">
                      <Labeled label="Manufacturing date">
                        <Input
                          className="h-9"
                          type="date"
                          value={r.manufacturingDate}
                          onChange={(e) =>
                            update(r.id, "manufacturingDate", e.target.value)
                          }
                        />
                      </Labeled>
                      <Labeled label="Barcode">
                        <Input
                          className="h-9"
                          value={r.barcode}
                          placeholder="Optional, must be unique"
                          onChange={(e) =>
                            update(r.id, "barcode", e.target.value)
                          }
                        />
                      </Labeled>
                      <Labeled
                        label="Description (optional)"
                        className="md:col-span-2"
                      >
                        <Input
                          className="h-9"
                          value={r.description}
                          placeholder="Shown on the product page"
                          onChange={(e) =>
                            update(r.id, "description", e.target.value)
                          }
                        />
                      </Labeled>

                      {isPharmacy && (
                        <>
                          <Labeled label="Formulation">
                            <Input
                              className="h-9"
                              value={r.formulation}
                              placeholder="Tablet, syrup..."
                              onChange={(e) =>
                                update(r.id, "formulation", e.target.value)
                              }
                            />
                          </Labeled>
                          <Labeled label="Dosage strength">
                            <Input
                              className="h-9"
                              value={r.dosageStrength}
                              placeholder="e.g. 500mg"
                              onChange={(e) =>
                                update(r.id, "dosageStrength", e.target.value)
                              }
                            />
                          </Labeled>
                          <Labeled label="Active ingredient">
                            <Input
                              className="h-9"
                              value={r.activeIngredient}
                              onChange={(e) =>
                                update(r.id, "activeIngredient", e.target.value)
                              }
                            />
                          </Labeled>
                          <Labeled label="Manufacturer">
                            <Input
                              className="h-9"
                              value={r.manufacturer}
                              onChange={(e) =>
                                update(r.id, "manufacturer", e.target.value)
                              }
                            />
                          </Labeled>
                          <Labeled label="Drug registration no. (NDA)">
                            <Input
                              className="h-9"
                              value={r.registrationNumber}
                              onChange={(e) =>
                                update(
                                  r.id,
                                  "registrationNumber",
                                  e.target.value,
                                )
                              }
                            />
                          </Labeled>
                          <Labeled
                            label="Storage conditions"
                            className="md:col-span-2"
                          >
                            <Input
                              className="h-9"
                              value={r.storageConditions}
                              placeholder="e.g. Store below 25°C, away from light"
                              onChange={(e) =>
                                update(
                                  r.id,
                                  "storageConditions",
                                  e.target.value,
                                )
                              }
                            />
                          </Labeled>
                          <label className="flex items-center gap-2 text-xs font-medium">
                            <Checkbox
                              checked={r.prescriptionRequired}
                              onCheckedChange={(value) =>
                                update(
                                  r.id,
                                  "prescriptionRequired",
                                  value === true,
                                )
                              }
                            />
                            Prescription required
                          </label>
                        </>
                      )}

                      <div className="col-span-2 space-y-1 md:col-span-4">
                        <p className="text-xs font-medium">Photo (optional)</p>
                        <div className="flex items-center gap-3">
                          {r.image && (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border">
                              <Image
                                src={r.image}
                                alt={`${r.name || "Product"} photo`}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <Input
                            className="max-w-xs"
                            type="file"
                            accept="image/*"
                            disabled={uploading[r.id]}
                            onChange={(e) => {
                              const input = e.currentTarget;
                              const file = input.files?.[0];
                              input.value = "";
                              if (file) void uploadPhoto(r.id, file);
                            }}
                          />
                          {uploading[r.id] && (
                            <span className="text-sm text-muted-foreground">
                              Uploading...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const key = bulkGroupKey(r.name, r.categorySlug);
                    const packs = key ? (linesPerProduct.get(key) ?? 0) : 0;
                    return packs > 1 ? (
                      <p className="px-10 pb-1 text-xs text-muted-foreground">
                        One product, {packs} pack sizes: &ldquo;{r.name.trim()}
                        &rdquo; is saved once, and each size keeps its own price
                        and stock.
                      </p>
                    ) : null;
                  })()}

                  {rowProblems && rowProblems.length > 0 && (
                    <ul className="list-disc px-10 pb-2 text-xs text-red-600 dark:text-red-400">
                      {rowProblems.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button type="button" onClick={addRow}>
              + Add item
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasteOpen((prev) => !prev)}
            >
              Paste a list
            </Button>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">
              {totals.lines} {totals.lines === 1 ? "line" : "lines"} ·{" "}
              {totals.unitCount.toLocaleString()} units ·{" "}
            </span>
            <span className="font-medium">
              Total cost {totals.cost > 0 ? money(totals.cost) : "—"}
            </span>
          </div>
        </div>

        {pasteOpen && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm text-muted-foreground">
              One product per line: name, size, qty, cost price, selling price.
              Paste straight from a spreadsheet, or separate with commas.
            </p>
            <Textarea
              rows={6}
              value={pasteText}
              placeholder={
                isPharmacy
                  ? "Amoxicillin 500mg, 20 Capsules, 40, 8000, 12000"
                  : "Rice, 1 Kg, 50, 3000, 4500"
              }
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={importPasted}>
                Add these lines
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPasteOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {isPharmacy
            ? `Each line becomes one ${label.toLowerCase()} product with its quantity as stock.`
            : `Each line becomes one pack with its quantity as stock; lines with the same name and category share one product.`}{" "}
          Nothing is saved unless every line is valid.
        </p>
      </section>

      <Button
        type="button"
        onClick={submit}
        disabled={mutation.isPending || anyUploading}
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending
          ? "Adding..."
          : anyUploading
            ? "Uploading photos..."
            : `Add ${label} products`}
      </Button>
    </div>
  );
};

export default BulkAddProducts;
