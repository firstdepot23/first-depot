// Route: /emails/[id]
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import {
  QuoteStatuses,
  setQuoteStatus,
  type QuoteStatus,
} from "@repo/quote-db";
import { requireAdmin } from "../../../lib/requireAdmin";
import { getMailDetail } from "../../../lib/resendEmails";
import QuotePdfButton from "../../../components/QuotePdfButton";

export const dynamic = "force-dynamic";

const CURRENCY = "UGX";
const money = (n: number | null) =>
  n === null ? "-" : `${CURRENCY} ${n.toLocaleString("en-US")}`;

const EmailDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await requireAdmin();
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  let mail;
  try {
    mail = await getMailDetail(id);
  } catch (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 p-4">
        <Link href="/emails" className="text-sm underline">
          Back to emails
        </Link>
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
          Could not load this email: {(error as Error).message}
        </p>
      </div>
    );
  }
  if (!mail) notFound();

  const quote = mail.quote;

  async function updateStatus(formData: FormData) {
    "use server";
    await requireAdmin();
    const reference = String(formData.get("reference") ?? "");
    const status = String(formData.get("status") ?? "") as QuoteStatus;
    if (!reference || !QuoteStatuses.includes(status)) return;
    await setQuoteStatus(reference, status);
    revalidatePath("/", "layout"); // refreshes the sidebar Inbox count too
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <Link
        href="/emails"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Emails
      </Link>

      <div className="space-y-3 rounded-lg border p-5">
        <h1 className="text-xl font-semibold">{mail.subject}</h1>
        <dl className="grid grid-cols-[80px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-foreground">From</dt>
          <dd>{mail.from}</dd>
          <dt className="text-muted-foreground">To</dt>
          <dd>{mail.to.join(", ")}</dd>
          <dt className="text-muted-foreground">Date</dt>
          <dd>
            {mail.createdAt
              ? new Date(mail.createdAt).toLocaleString("en-GB", {
                  dateStyle: "long",
                  timeStyle: "short",
                  timeZone: "Africa/Kampala",
                })
              : "-"}
          </dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize">{mail.status.replace(/_/g, " ")}</dd>
        </dl>
      </div>

      {quote && (
        <div className="space-y-4 rounded-lg border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Quote {quote.reference}</h2>
              <p className="text-sm text-muted-foreground">
                {quote.customer.name}
                {quote.customer.company
                  ? ` · ${quote.customer.company}`
                  : ""} · {quote.customer.phone}
              </p>
            </div>
            <QuotePdfButton quote={quote} />
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quote.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-right">
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </td>
                  <td className="py-2 text-right">{money(item.unitPrice)}</td>
                  <td className="py-2 text-right">{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold">
                <td className="py-2" colSpan={3}>
                  Subtotal
                </td>
                <td className="py-2 text-right">{money(quote.subtotal)}</td>
              </tr>
            </tfoot>
          </table>

          {quote.notes && (
            <p className="rounded-md bg-muted p-3 text-sm">{quote.notes}</p>
          )}

          <form
            action={updateStatus}
            className="flex items-center gap-2 text-sm"
          >
            <input type="hidden" name="reference" value={quote.reference} />
            <label htmlFor="status" className="text-muted-foreground">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={quote.status}
              className="rounded-md border bg-transparent px-2 py-1.5 capitalize"
            >
              {QuoteStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border px-3 py-1.5 hover:bg-muted"
            >
              Save
            </button>
          </form>
        </div>
      )}

      {mail.kind === "email" && (
        <div className="overflow-hidden rounded-lg border">
          {mail.html ? (
            // Sandboxed with no permissions: scripts and forms in the email
            // can't run.
            <iframe
              title="Email body"
              sandbox=""
              srcDoc={mail.html}
              className="h-[600px] w-full bg-white"
            />
          ) : mail.text ? (
            <pre className="whitespace-pre-wrap p-5 text-sm">{mail.text}</pre>
          ) : (
            <p className="p-5 text-sm text-muted-foreground">
              This email has no content to show.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailDetailPage;
