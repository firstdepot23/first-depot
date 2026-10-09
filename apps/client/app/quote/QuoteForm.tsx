"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { COMMON_UNITS, CURRENCY, PHOTO_CONTACT } from "./_config";
import { submitQuoteAction } from "./actions";
import { formatMoney, lineTotal } from "./format";
import {
  QUOTE_TYPES,
  QUOTE_TYPE_INFO,
  issuesToErrors,
  quoteRequestSchema,
  type CatalogProduct,
  type QuoteFieldErrors,
  type QuoteKind,
} from "./schema";

type Row = {
  key: string;
  productId: number | null;
  name: string;
  unit: string;
  quantity: string;
  unitPrice: string; // custom rows only
  price: number | null; // catalogue price
  sizes: string[];
};

let seq = 0;
const newRow = (over: Partial<Row> = {}): Row => ({
  key: `r${++seq}`,
  productId: null,
  name: "",
  unit: "",
  quantity: "1",
  unitPrice: "",
  price: null,
  sizes: [],
  ...over,
});

const fromProduct = (p: CatalogProduct, over: Partial<Row> = {}): Row =>
  newRow({
    productId: p.id,
    name: p.name,
    price: p.price,
    sizes: p.sizes,
    unit: p.sizes.length === 1 ? (p.sizes[0] ?? "") : "",
    ...over,
  });

const num = (s: string) => {
  const n = Number(s.replace(/,/g, "").trim());
  return s.trim() === "" || Number.isNaN(n) ? NaN : n;
};

const rowPrice = (r: Row) =>
  r.productId != null
    ? r.price
    : Number.isNaN(num(r.unitPrice))
      ? null
      : num(r.unitPrice);

/** One item per line; columns separated by a tab (Excel) or ";":
 *  description, quantity, unit, unit price */
const parsePasted = (text: string, catalog: CatalogProduct[]): Row[] => {
  const byName = new Map(catalog.map((p) => [p.name.toLowerCase(), p]));
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: Row[] = [];
  lines.forEach((line, idx) => {
    const sep = line.includes("\t") ? "\t" : ";";
    const [name = "", q = "", unit = "", price = ""] = line
      .split(sep)
      .map((p) => p.trim());
    if (!name) return;
    const qty = num(q);
    // First line with a non-numeric quantity is a header row.
    if (idx === 0 && q && Number.isNaN(qty)) return;
    const quantity = Number.isNaN(qty) || qty <= 0 ? "1" : String(qty);
    const hit = byName.get(name.toLowerCase());
    if (hit) rows.push(fromProduct(hit, { quantity, unit: unit || fromProduct(hit).unit }));
    else rows.push(newRow({ name, quantity, unit, unitPrice: price.replace(/[^\d.]/g, "") }));
  });
  return rows;
};

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-2 focus:outline-offset-0 focus:outline-green-600/30 disabled:bg-gray-50 disabled:text-gray-500";

const Field = ({
  label,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-sm font-medium text-gray-900">{label}</span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    {error && (
      <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
        {error}
      </span>
    )}
  </label>
);

/* ------------------------------ item name box ------------------------------ */

const ItemName = ({
  row,
  catalog,
  onText,
  onPick,
  invalid,
}: {
  row: Row;
  catalog: CatalogProduct[];
  onText: (t: string) => void;
  onPick: (p: CatalogProduct) => void;
  invalid: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = row.name.trim().toLowerCase();
    if (row.productId != null || q.length < 2) return [];
    const words = q.split(/\s+/);
    return catalog
      .filter((p) => {
        const hay = `${p.name} ${p.shortDescription} ${p.category}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 8);
  }, [row.name, row.productId, catalog]);

  const show = open && matches.length > 0;

  return (
    <div className="relative">
      <input
        value={row.name}
        onChange={(e) => {
          onText(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const p = matches[active];
            if (p) {
              onPick(p);
              setOpen(false);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={show}
        aria-autocomplete="list"
        aria-invalid={invalid}
        placeholder={
          catalog.length ? "Search our catalogue or type your own item" : "Type the item"
        }
        className={`${inputCls} ${invalid ? "border-red-500" : ""}`}
        maxLength={200}
      />
      {row.productId != null && (
        <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          In our catalogue
        </span>
      )}
      {row.productId == null && row.name.trim().length >= 2 && (
        <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          Your own item
        </span>
      )}
      {show && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl shadow-gray-900/10"
        >
          {matches.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input's blur doesn't close the list first
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(p);
                setOpen(false);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-green-50" : ""}`}
            >
              <span className="block font-medium text-gray-900">{p.name}</span>
              <span className="block text-xs text-gray-500">
                {formatMoney(p.price)}
                {p.shortDescription ? ` · ${p.shortDescription}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* --------------------------------- the form -------------------------------- */

type Done = { reference: string; emailed: boolean; email: string };

const QuoteForm = ({ catalog }: { catalog: CatalogProduct[] }) => {
  const [type, setType] = useState<QuoteKind>("quote");
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    location: "",
    neededBy: "",
  });
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [errors, setErrors] = useState<QuoteFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done) doneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [done]);

  // Editing a field clears its error straight away instead of leaving it
  // on screen until the next submit.
  const clearErr = (match: (k: string) => boolean) => {
    setFormError("");
    setErrors((e) => {
      const keys = Object.keys(e).filter(match);
      if (keys.length === 0) return e;
      const next = { ...e };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  };
  const setC = (k: keyof typeof contact) => (e: { target: { value: string } }) => {
    setContact((c) => ({ ...c, [k]: e.target.value }));
    clearErr((x) => x === k);
  };
  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    clearErr((x) => x.startsWith("items"));
  };

  const filled = rows.filter((r) => r.name.trim());
  const subtotal = filled.reduce((s, r) => {
    const qty = num(r.quantity);
    return s + (lineTotal(Number.isNaN(qty) ? 0 : qty, rowPrice(r)) ?? 0);
  }, 0);
  const unpriced = filled.filter((r) => rowPrice(r) == null).length;

  const reset = () => {
    setType("quote");
    setContact({ name: "", email: "", phone: "", company: "", location: "", neededBy: "" });
    setRows([newRow()]);
    setNotes("");
    setErrors({});
    setFormError("");
    setDone(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError("");

    const payload = {
      type,
      ...contact,
      items: filled.map((r) => ({
        productId: r.productId,
        name: r.name,
        unit: r.unit,
        quantity: num(r.quantity),
        unitPrice: rowPrice(r),
      })),
      notes,
      website,
    };

    const parsed = quoteRequestSchema.safeParse(payload);
    const local: QuoteFieldErrors = parsed.success ? {} : issuesToErrors(parsed.error.issues);
    // Catalogue items that come in sizes need one chosen.
    filled.forEach((r, i) => {
      if (r.productId != null && r.sizes.length > 1 && !r.unit) {
        local[`items.${i}.unit`] ??= "Choose a size";
      }
    });
    if (Object.keys(local).length > 0) {
      setErrors(local);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const res = await submitQuoteAction(payload);
      if (res.ok) {
        setDone({ reference: res.reference, emailed: res.emailed, email: contact.email });
      } else {
        setFormError(res.message);
        if (res.fieldErrors) setErrors(res.fieldErrors);
      }
    } catch {
      setFormError("Something went wrong. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div ref={doneRef} className="mx-auto mt-10 max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl shadow-gray-900/5">
        <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3L13 4.5" /></svg>
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Request received</h2>
        <p className="mt-2 text-gray-600">
          Your reference is{" "}
          <span className="font-mono font-semibold text-gray-900">{done.reference}</span>. Please keep it.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          {done.emailed
            ? `We sent a confirmation to ${done.email} and our team will reply shortly.`
            : "Our team will reply to the email address you gave us shortly."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700">
            Send another request
          </button>
          <Link href="/products" className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-10 space-y-10">
      {/* 1. TYPE */}
      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-gray-900">1. What would you like to do?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUOTE_TYPES.map((t) => (
            <label
              key={t}
              className="cursor-pointer rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 has-[:checked]:border-green-600 has-[:checked]:bg-green-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-green-600"
            >
              <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
              <span className="block font-semibold text-gray-900">{QUOTE_TYPE_INFO[t].label}</span>
              <span className="mt-1 block text-sm text-gray-500">{QUOTE_TYPE_INFO[t].blurb}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. CONTACT */}
      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-gray-900">2. Your details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}>
            <input value={contact.name} onChange={setC("name")} autoComplete="name" className={inputCls} maxLength={100} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input type="email" value={contact.email} onChange={setC("email")} autoComplete="email" className={inputCls} maxLength={200} />
          </Field>
          <Field label="Phone / WhatsApp" error={errors.phone}>
            <input type="tel" value={contact.phone} onChange={setC("phone")} autoComplete="tel" className={inputCls} maxLength={30} />
          </Field>
          <Field label="Company (optional)" error={errors.company}>
            <input value={contact.company} onChange={setC("company")} autoComplete="organization" className={inputCls} maxLength={120} />
          </Field>
          <Field label="Delivery location / project site (optional)" error={errors.location}>
            <input value={contact.location} onChange={setC("location")} className={inputCls} maxLength={200} />
          </Field>
          <Field label="Needed by (optional)" error={errors.neededBy}>
            <input type="date" value={contact.neededBy} onChange={setC("neededBy")} min={new Date().toISOString().slice(0, 10)} className={inputCls} />
          </Field>
        </div>
        {/* Honeypot: hidden from people and screen readers */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
      </fieldset>

      {/* 3. ITEMS */}
      <fieldset>
        <legend className="mb-1 text-lg font-semibold text-gray-900">3. Items (bill of quantities)</legend>
        <p className="mb-4 text-sm text-gray-500">
          Search our catalogue and the price fills in. If we don&apos;t stock it, type the item and add
          your own price if you have one.
        </p>

        <div className="hidden gap-3 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid md:grid-cols-[2rem_minmax(0,1fr)_9rem_6rem_9rem_7rem_2rem]">
          <span>#</span><span>Item</span><span>Size / unit</span><span>Qty</span><span>Unit price</span><span className="text-right">Total</span><span />
        </div>

        <ul className="space-y-3">
          {rows.map((r, idx) => {
            const fi = filled.findIndex((f) => f.key === r.key);
            const err = (f: string) => (fi >= 0 ? errors[`items.${fi}.${f}`] : undefined);
            const qty = num(r.quantity);
            const total = lineTotal(Number.isNaN(qty) ? 0 : qty, rowPrice(r));
            return (
              <li key={r.key} className="rounded-xl border border-gray-200 p-3 md:grid md:grid-cols-[2rem_minmax(0,1fr)_9rem_6rem_9rem_7rem_2rem] md:items-start md:gap-3 md:border-0 md:p-0">
                <span className="hidden pt-2 text-sm text-gray-500 md:block">{idx + 1}</span>

                <div className="mb-3 md:mb-0">
                  <span className="mb-1 block text-xs font-medium text-gray-500 md:sr-only">Item {idx + 1}</span>
                  <ItemName
                    row={r}
                    catalog={catalog}
                    invalid={!!err("name")}
                    onText={(t) => updateRow(r.key, { name: t, productId: null, price: null, sizes: [], unit: r.productId != null ? "" : r.unit })}
                    onPick={(p) => updateRow(r.key, { name: p.name, productId: p.id, price: p.price, sizes: p.sizes, unit: p.sizes.length === 1 ? (p.sizes[0] ?? "") : "", unitPrice: "" })}
                  />
                  {err("name") && <span role="alert" className="mt-1 block text-xs font-medium text-red-600">{err("name")}</span>}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-3 md:contents">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-gray-500 md:sr-only">Size / unit</span>
                    {r.sizes.length > 1 ? (
                      <select value={r.unit} onChange={(e) => updateRow(r.key, { unit: e.target.value })} className={`${inputCls} ${err("unit") ? "border-red-500" : ""}`} aria-label="Size">
                        <option value="">Choose size…</option>
                        {r.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <>
                        <input value={r.unit} onChange={(e) => updateRow(r.key, { unit: e.target.value })} list="fd-quote-units" placeholder="e.g. Bags" className={inputCls} maxLength={40} aria-label="Unit" />
                      </>
                    )}
                    {err("unit") && <span role="alert" className="mt-1 block text-xs font-medium text-red-600">{err("unit")}</span>}
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-gray-500 md:sr-only">Qty</span>
                    <input value={r.quantity} onChange={(e) => updateRow(r.key, { quantity: e.target.value })} inputMode="decimal" className={`${inputCls} ${err("quantity") ? "border-red-500" : ""}`} aria-label="Quantity" />
                    {err("quantity") && <span role="alert" className="mt-1 block text-xs font-medium text-red-600">{err("quantity")}</span>}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-3 md:contents">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-gray-500 md:sr-only">Unit price ({CURRENCY})</span>
                    {r.productId != null ? (
                      <input value={formatMoney(r.price)} disabled className={inputCls} aria-label="Catalogue price" />
                    ) : (
                      <input value={r.unitPrice} onChange={(e) => updateRow(r.key, { unitPrice: e.target.value })} inputMode="decimal" placeholder="Optional" className={`${inputCls} ${err("unitPrice") ? "border-red-500" : ""}`} aria-label={`Your price per unit (${CURRENCY})`} />
                    )}
                  </div>
                  <div className="pt-2 text-right text-sm font-medium text-gray-900 md:pt-2">
                    <span className="mb-1 block text-xs font-medium text-gray-500 md:sr-only">Total</span>
                    {formatMoney(total)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setRows((rs) => (rs.length === 1 ? [newRow()] : rs.filter((x) => x.key !== r.key))); clearErr((x) => x.startsWith("items")); }}
                  aria-label={`Remove item ${idx + 1}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
                </button>
              </li>
            );
          })}
        </ul>
        <datalist id="fd-quote-units">{COMMON_UNITS.map((u) => <option key={u} value={u} />)}</datalist>

        {errors.items && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{errors.items}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => { setRows((rs) => [...rs, newRow()]); clearErr((x) => x.startsWith("items")); }} className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
            + Add item
          </button>
          <button type="button" onClick={() => setPasteOpen((o) => !o)} aria-expanded={pasteOpen} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
            Paste a BOQ
          </button>
          <p className="ml-auto text-sm text-gray-600">
            Subtotal <strong className="text-gray-900">{formatMoney(filled.length ? subtotal : null)}</strong>
            {unpriced > 0 && <span className="text-gray-500"> · {unpriced} without a price</span>}
          </p>
        </div>

        {pasteOpen && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Paste rows from Excel or Google Sheets. One item per line:{" "}
              <strong>description, quantity, unit, unit price</strong> (only the description is required).
              Separate columns with a tab, or a semicolon (;) if you type it.
            </p>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} placeholder={"Cement 50kg\t20\tBags\t38000\nRoofing nails\t5\tKilograms"} className={`${inputCls} mt-3 font-mono`} />
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const added = parsePasted(pasteText, catalog).slice(0, 100);
                  if (added.length === 0) return;
                  setRows((rs) => [...rs.filter((r) => r.name.trim()), ...added].slice(0, 100));
                  clearErr((x) => x.startsWith("items") || x === "notes");
                  setPasteText("");
                  setPasteOpen(false);
                }}
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Add these rows
              </button>
              <button type="button" onClick={() => setPasteOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Catalogue prices are indicative and re-checked when we receive your request. We confirm availability and the final total before anything is charged.
        </p>
      </fieldset>

      {/* 4. NOTES */}
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">4. Project details or written quote</h2>
        <Field label="Anything else we should know? (optional if your table is filled in)" error={errors.notes}>
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); clearErr((x) => x === "notes"); }} rows={6} maxLength={5000} placeholder="Describe the project, quantities, specifications, delivery timing…" className={inputCls} />
        </Field>
      </div>

      {/* PHOTOS */}
      <aside className="rounded-xl border border-green-200 bg-green-50 p-5">
        <h2 className="font-semibold text-gray-900">Have photos, drawings or plans?</h2>
        <p className="mt-1 text-sm text-gray-700">
          We can&apos;t take attachments on this page. Send them to{" "}
          <a className="font-semibold text-green-700 underline" href={`mailto:${PHOTO_CONTACT.email}`}>{PHOTO_CONTACT.email}</a>{" "}
          and mention your reference number, or message us on:
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {PHOTO_CONTACT.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-green-200 hover:bg-green-100">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* SUBMIT */}
      <div>
        {formError && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>
        )}
        <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-green-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Sending…" : `Send ${QUOTE_TYPE_INFO[type].label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
};

export default QuoteForm;
