import type { QuotePlain } from "@repo/quote-db";
import { QUOTE_TYPE_INFO } from "./schema";
import { formatMoney } from "./format";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type Q = Pick<
  QuotePlain,
  | "reference"
  | "type"
  | "customer"
  | "neededBy"
  | "items"
  | "subtotal"
  | "unpricedItems"
  | "notes"
>;

const itemsText = (q: Q) =>
  q.items.length === 0
    ? "(no items listed)"
    : q.items
        .map(
          (i, n) =>
            `${n + 1}. ${i.name}${i.unit ? ` [${i.unit}]` : ""}  x ${i.quantity}  @ ${formatMoney(i.unitPrice)}  = ${formatMoney(i.lineTotal)}  (${i.source === "catalog" ? `catalogue #${i.productId}` : "customer's own item"})`,
        )
        .join("\n");

const itemsHtml = (q: Q) =>
  q.items.length === 0
    ? "<p><em>No items listed.</em></p>"
    : `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">
<tr style="background:#f3f4f6;text-align:left"><th>#</th><th>Item</th><th>Unit</th><th align="right">Qty</th><th align="right">Unit price</th><th align="right">Total</th></tr>
${q.items
  .map(
    (i, n) =>
      `<tr style="border-top:1px solid #e5e7eb"><td>${n + 1}</td><td>${esc(i.name)}<br><small style="color:#6b7280">${i.source === "catalog" ? `Catalogue #${i.productId}` : "Customer's own item"}</small></td><td>${esc(i.unit)}</td><td align="right">${i.quantity}</td><td align="right">${esc(formatMoney(i.unitPrice))}</td><td align="right">${esc(formatMoney(i.lineTotal))}</td></tr>`,
  )
  .join("\n")}
<tr style="border-top:2px solid #111827"><td colspan="5" align="right"><strong>Subtotal${q.unpricedItems ? ` (${q.unpricedItems} item${q.unpricedItems === 1 ? "" : "s"} without a price)` : ""}</strong></td><td align="right"><strong>${esc(formatMoney(q.subtotal))}</strong></td></tr>
</table>`;

/** Email to the First Depot team. Reply goes straight to the customer. */
export const staffEmail = (q: Q) => {
  const c = q.customer;
  const kind = QUOTE_TYPE_INFO[q.type].label;
  const subject = `[${kind}] ${q.reference}: ${c.name} (${q.items.length} item${q.items.length === 1 ? "" : "s"}, ${formatMoney(q.subtotal)})`;

  const text = `New ${kind.toLowerCase()} ${q.reference}

Name: ${c.name}
Email: ${c.email}
Phone: ${c.phone}
Company: ${c.company || "-"}
Location: ${c.location || "-"}
Needed by: ${q.neededBy || "-"}

ITEMS
${itemsText(q)}

Subtotal: ${formatMoney(q.subtotal)}${q.unpricedItems ? ` (${q.unpricedItems} without a price)` : ""}

NOTES
${q.notes || "-"}

Reply to this email to answer the customer directly.`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:680px">
<h2 style="margin:0 0 4px">New ${esc(kind.toLowerCase())}: ${esc(q.reference)}</h2>
<p style="margin:0 0 16px;color:#6b7280">Reply to this email to answer the customer directly.</p>
<table cellpadding="4" style="font-size:14px">
<tr><td><strong>Name</strong></td><td>${esc(c.name)}</td></tr>
<tr><td><strong>Email</strong></td><td><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></td></tr>
<tr><td><strong>Phone</strong></td><td>${esc(c.phone)}</td></tr>
<tr><td><strong>Company</strong></td><td>${esc(c.company || "-")}</td></tr>
<tr><td><strong>Location</strong></td><td>${esc(c.location || "-")}</td></tr>
<tr><td><strong>Needed by</strong></td><td>${esc(q.neededBy || "-")}</td></tr>
</table>
<h3>Items</h3>
${itemsHtml(q)}
<h3>Notes</h3>
<p style="white-space:pre-wrap">${esc(q.notes || "-")}</p>
</div>`;

  return { subject, text, html };
};

/** Confirmation to the customer. */
export const customerEmail = (q: Q) => {
  const kind = QUOTE_TYPE_INFO[q.type].label;
  const subject = `We received your ${kind.toLowerCase()} (${q.reference})`;
  const text = `Hello ${q.customer.name},

Thank you for contacting First Depot. We received your ${kind.toLowerCase()} and our team will get back to you shortly.

Reference: ${q.reference}

${itemsText(q)}
Subtotal: ${formatMoney(q.subtotal)}${q.unpricedItems ? ` (${q.unpricedItems} item(s) will be priced by our team)` : ""}

Prices shown are indicative. We confirm availability and the final total before anything is charged.

To send photos or drawings, just reply to this email.

First Depot`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:680px">
<p>Hello ${esc(q.customer.name)},</p>
<p>Thank you for contacting First Depot. We received your ${esc(kind.toLowerCase())} and our team will get back to you shortly.</p>
<p><strong>Reference: ${esc(q.reference)}</strong></p>
${itemsHtml(q)}
<p style="color:#6b7280;font-size:13px">Prices shown are indicative. We confirm availability and the final total before anything is charged.<br>To send photos or drawings, just reply to this email.</p>
<p>First Depot</p>
</div>`;
  return { subject, text, html };
};
