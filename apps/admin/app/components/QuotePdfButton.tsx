"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Download, FileSignature, Printer, Share2, X } from "lucide-react";
import { toast } from "react-toastify";
import type { QuoteView } from "../lib/resendEmails";
import { displayNameOf } from "../lib/userDisplay";
import SignaturePad, { typedSignaturePng } from "./SignaturePad";
import type { PdfSigner, PdfTerms } from "./QuotePdfDocument";

type Mode = "draw" | "type" | "none";
type Action = "download" | "print" | "share";

const STORAGE_KEY = "fd-quote-signer";

type Saved = { name: string; title: string; signature: string | null };

const loadSaved = (): Saved | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};

const saveSaved = (value: Saved | null) => {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private window): signing still works.
  }
};

// The PDF library is only loaded when it is needed, so it never slows the page.
const buildPdf = async (
  quote: QuoteView,
  signer: PdfSigner,
  terms: PdfTerms,
): Promise<Blob> => {
  const [{ pdf }, { QuotePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./QuotePdfDocument"),
  ]);
  return pdf(
    <QuotePdfDocument
      quote={quote}
      signer={signer}
      terms={terms}
      origin={window.location.origin}
    />,
  ).toBlob();
};

const QuotePdfButton = ({ quote }: { quote: QuoteView }) => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("draw");
  const [drawn, setDrawn] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [remember, setRemember] = useState(true);
  // Optional lines for the summary table; blank ones are left out of the PDF.
  const [terms, setTerms] = useState<PdfTerms>({
    validUntil: "",
    payment: "",
    delivery: "",
  });

  const fileName = `${quote.reference}.pdf`;

  // Fill in the form from this device's saved details, else from the account.
  useEffect(() => {
    if (!open) return;
    const stored = loadSaved();
    setSaved(stored);
    setName((n) => n || stored?.name || (user ? displayNameOf(user) : ""));
    setTitle((t) => t || stored?.title || "");
    if (stored?.signature) setDrawn((d) => d ?? stored.signature);
  }, [open, user]);

  const makeSigner = (): PdfSigner | null => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Please enter the name of the person signing.");
      return null;
    }
    let signature: string | null = null;
    if (mode === "draw") {
      if (!drawn) {
        toast.error("Draw your signature, or choose another option.");
        return null;
      }
      signature = drawn;
    } else if (mode === "type") {
      signature = typedSignaturePng(cleanName);
    }
    return { name: cleanName, title: title.trim(), signature };
  };

  const run = async (action: Action) => {
    const signer = makeSigner();
    if (!signer) return;

    // Open the print tab now, while the click is still fresh, or the browser
    // blocks it as a pop-up once the PDF has been built.
    const printTab = action === "print" ? window.open("", "_blank") : null;

    setBusy(action);
    try {
      const blob = await buildPdf(quote, signer, terms);

      if (remember) {
        saveSaved({
          name: signer.name,
          title: signer.title,
          signature:
            mode === "draw" ? signer.signature : (saved?.signature ?? null),
        });
      } else {
        saveSaved(null);
      }

      const url = URL.createObjectURL(blob);
      const download = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
      };

      if (action === "print") {
        if (printTab) printTab.location.href = url;
        else download(); // pop-ups blocked: fall back to a download
      } else if (action === "share") {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: quote.reference });
        } else {
          download(); // most desktop browsers cannot share files
        }
      } else {
        download();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      printTab?.close();
      // Closing the share sheet is not an error.
      if ((error as Error).name !== "AbortError") {
        console.error("PDF failed:", error);
        toast.error("Couldn't create the PDF. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  const btn =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${btn} bg-foreground text-background hover:opacity-90`}
      >
        <FileSignature className="size-4" />
        Sign &amp; create PDF
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sign and create PDF"
        >
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-lg border bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sign &amp; create PDF</h2>
                <p className="text-sm text-muted-foreground">
                  {quote.reference} · the company stamps are added
                  automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name Surname"
                  className="w-full rounded-md border bg-transparent px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Title (optional)</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sales Manager"
                  className="w-full rounded-md border bg-transparent px-3 py-2"
                />
              </label>
            </div>

            {quote.type === "quote" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Optional terms for the summary table (leave blank to omit)
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["validUntil", "Valid until", "26 October 2026"],
                      [
                        "payment",
                        "Payment",
                        "70% deposit, balance on delivery",
                      ],
                      ["delivery", "Delivery", "Within 3 days of the deposit"],
                    ] as [keyof PdfTerms, string, string][]
                  ).map(([key, label, placeholder]) => (
                    <label key={key} className="space-y-1 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <input
                        value={terms[key]}
                        onChange={(e) =>
                          setTerms((t) => ({ ...t, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        className="w-full rounded-md border bg-transparent px-3 py-2"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-1 rounded-md bg-muted p-1 text-sm">
                {(
                  [
                    ["draw", "Draw signature"],
                    ["type", "Type my name"],
                    ["none", "Sign by hand"],
                  ] as [Mode, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`flex-1 rounded px-2 py-1.5 ${
                      mode === key
                        ? "bg-background font-medium shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === "draw" && (
                <SignaturePad onChange={setDrawn} initial={drawn} />
              )}
              {mode === "type" && (
                <div className="flex h-36 items-center rounded-md border border-dashed bg-white px-4">
                  <span
                    className="text-4xl text-blue-900"
                    style={{
                      fontFamily:
                        '"Segoe Script","Brush Script MT","Snell Roundhand",cursive',
                      fontStyle: "italic",
                    }}
                  >
                    {name || "Your name"}
                  </span>
                </div>
              )}
              {mode === "none" && (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Space is left above your name so you can sign the printed copy
                  with a pen.
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember my name, title and drawn signature on this device
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => run("download")}
                disabled={busy !== null}
                className={`${btn} bg-foreground text-background hover:opacity-90`}
              >
                <Download className="size-4" />
                {busy === "download" ? "Creating..." : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => run("print")}
                disabled={busy !== null}
                className={`${btn} border hover:bg-muted`}
              >
                <Printer className="size-4" />
                {busy === "print" ? "Opening..." : "Print"}
              </button>
              <button
                type="button"
                onClick={() => run("share")}
                disabled={busy !== null}
                className={`${btn} border hover:bg-muted`}
              >
                <Share2 className="size-4" />
                {busy === "share" ? "Preparing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuotePdfButton;
