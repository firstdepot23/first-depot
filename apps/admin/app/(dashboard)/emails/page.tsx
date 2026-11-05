// Route: /emails  (the sidebar "Inbox" links here)
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { requireAdmin } from "../../lib/requireAdmin";
import { getMailbox, type Folder, type MailRow } from "../../lib/resendEmails";
import { cn } from "../../lib/utils";

export const dynamic = "force-dynamic";

const FOLDERS: { key: Folder; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "received", label: "Received" },
];

// Resend-style status pills.
const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-500/15 text-emerald-600",
  sent: "bg-sky-500/15 text-sky-600",
  received: "bg-violet-500/15 text-violet-600",
  opened: "bg-emerald-500/15 text-emerald-600",
  clicked: "bg-emerald-500/15 text-emerald-600",
  bounced: "bg-red-500/15 text-red-600",
  complained: "bg-red-500/15 text-red-600",
  failed: "bg-red-500/15 text-red-600",
  delivery_delayed: "bg-amber-500/15 text-amber-600",
  // quote statuses
  new: "bg-amber-500/15 text-amber-600",
  contacted: "bg-sky-500/15 text-sky-600",
  quoted: "bg-violet-500/15 text-violet-600",
  won: "bg-emerald-500/15 text-emerald-600",
  lost: "bg-zinc-500/15 text-zinc-500",
};

const StatusPill = ({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
      STATUS_STYLES[status] ?? "bg-zinc-500/15 text-zinc-500",
    )}
  >
    {status.replace(/_/g, " ")}
  </span>
);

const formatWhen = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Kampala",
      })
    : "-";

// "Acme <a@b.com>" -> "a@b.com" is noisy; show the name when there is one.
const shortAddress = (value: string) =>
  value.match(/^(.*?)\s*<.*>$/)?.[1]?.replace(/"/g, "") || value;

const counterpart = (row: MailRow) =>
  row.direction === "sent"
    ? row.to.map(shortAddress).join(", ")
    : shortAddress(row.from);

const EmailsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string }>;
}) => {
  await requireAdmin();

  const { folder: rawFolder, q = "" } = await searchParams;
  const folder: Folder =
    rawFolder === "sent" || rawFolder === "received" ? rawFolder : "all";

  const { rows, warnings } = await getMailbox();

  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (folder === "all" || r.direction === folder) &&
      (!needle ||
        `${r.subject} ${r.from} ${r.to.join(" ")} ${r.quoteReference ?? ""}`
          .toLowerCase()
          .includes(needle)),
  );

  const href = (f: Folder) => (f === "all" ? "/emails" : `/emails?folder=${f}`);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Emails</h1>

        <form className="flex gap-2" action="/emails">
          {folder !== "all" && (
            <input type="hidden" name="folder" value={folder} />
          )}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search subject, address or reference"
            className="w-72 rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </form>
      </div>

      <div className="flex gap-1 border-b">
        {FOLDERS.map((f) => (
          <Link
            key={f.key}
            href={href(f.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              folder === f.key
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 font-medium">From / To</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No emails found.
                </td>
              </tr>
            )}
            {visible.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 text-muted-foreground">
                  {row.kind === "quote" ? (
                    <FileText className="size-4" />
                  ) : row.direction === "sent" ? (
                    <ArrowUpRight className="size-4" />
                  ) : (
                    <ArrowDownLeft className="size-4" />
                  )}
                </td>
                <td className="max-w-56 truncate px-4 py-3">
                  <Link href={`/emails/${encodeURIComponent(row.id)}`}>
                    {counterpart(row)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="max-w-md truncate px-4 py-3">
                  <Link href={`/emails/${encodeURIComponent(row.id)}`}>
                    {row.subject}
                  </Link>
                  {row.quoteReference && row.kind !== "quote" && (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                      Quote
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                  {formatWhen(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmailsPage;
