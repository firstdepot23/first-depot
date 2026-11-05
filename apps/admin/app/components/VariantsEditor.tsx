"use client";

import { X } from "lucide-react";
import { MAX_VARIANTS } from "@repo/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { normalizeLabel, PACK_PRESETS } from "../lib/productExtras";

// One pack of a grocery product. Money and stock are kept as numbers, the way
// the form schema wants them; 0 / empty shows as a blank box.
export type PackRow = {
  id?: number;
  label: string;
  price: number;
  costPrice?: number;
  stock?: number;
  barcode?: string;
};

const emptyPack = (label = ""): PackRow => ({
  label,
  price: 0,
  costPrice: undefined,
  stock: 0,
  barcode: undefined,
});

// "" -> undefined, otherwise the number (never NaN).
const optionalNumber = (value: string): number | undefined => {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const Labeled = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="space-y-1 text-xs font-medium">
    <span>{label}</span>
    {children}
  </label>
);

type Props = {
  value: PackRow[];
  onChange: (rows: PackRow[]) => void;
  // Messages from the form validation, already worded for the admin.
  issues?: string[];
};

// "Rice" sold as 500 g, 1 Kg and 25 Kg is one product with three packs, and
// every pack has its own price (and stock). The cheapest pack's price is what
// the products table shows as "From UGX ...".
const VariantsEditor = ({ value, onChange, issues = [] }: Props) => {
  const rows = value;
  const taken = new Set(rows.map((r) => normalizeLabel(r.label)));

  const update = (index: number, patch: Partial<PackRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const add = (label = "") => {
    if (rows.length >= MAX_VARIANTS) return;
    onChange([...rows, emptyPack(label)]);
  };

  const remove = (index: number) =>
    onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No pack sizes yet. Add one below, or tap a common size.
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.id ?? `new-${index}`}
          className="space-y-3 rounded-md border p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              Pack {index + 1}
              {row.label.trim() ? ` · ${row.label.trim()}` : ""}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`Remove pack ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Pack size *">
              <Input
                value={row.label}
                placeholder="e.g. 1 Kg"
                onChange={(e) => update(index, { label: e.target.value })}
              />
            </Labeled>
            <Labeled label="Selling price (UGX) *">
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                value={row.price ? row.price : ""}
                placeholder="Price for this pack"
                onChange={(e) =>
                  update(index, { price: optionalNumber(e.target.value) ?? 0 })
                }
              />
            </Labeled>
            <Labeled label="Cost price (UGX)">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={row.costPrice ?? ""}
                placeholder="Optional"
                onChange={(e) =>
                  update(index, { costPrice: optionalNumber(e.target.value) })
                }
              />
            </Labeled>
            <Labeled label="In stock">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={row.stock ?? ""}
                placeholder="0"
                onChange={(e) =>
                  update(index, { stock: optionalNumber(e.target.value) })
                }
              />
            </Labeled>
            <div className="col-span-2">
              <Labeled label="Barcode (optional)">
                <Input
                  value={row.barcode ?? ""}
                  placeholder="Each pack can have its own barcode"
                  onChange={(e) =>
                    update(index, { barcode: e.target.value || undefined })
                  }
                />
              </Labeled>
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={() => add()}>
          + Add pack size
        </Button>
        <span className="text-xs text-muted-foreground">or tap:</span>
        {PACK_PRESETS.filter(
          (preset) => !taken.has(normalizeLabel(preset)),
        ).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              // Fill an empty, unfinished row first instead of adding another.
              const blank = rows.findIndex((r) => !r.label.trim() && !r.price);
              if (blank >= 0) update(blank, { label: preset });
              else add(preset);
            }}
            className="rounded-full border px-3 py-1 text-xs hover:bg-accent"
          >
            {preset}
          </button>
        ))}
      </div>

      {issues.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive">
          {issues.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VariantsEditor;
