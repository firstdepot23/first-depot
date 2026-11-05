"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchMyPrescriptions,
  fetchPrescriptionImage,
  STATUS_INFO,
  type PrescriptionSummary,
} from "../../lib/pharmacyApi";

const TONE = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-sky-50 text-sky-800",
  amber: "bg-amber-50 text-amber-800",
  green: "bg-green-50 text-green-800",
  red: "bg-red-50 text-red-800",
} as const;

// The photos are private, so each one is fetched with the customer's token
// and shown from a temporary local URL (released when it leaves the screen).
const Thumb = ({
  id,
  index,
  token,
}: {
  id: string;
  index: number;
  token: string;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    fetchPrescriptionImage(token, id, index)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, index, token]);

  if (failed) {
    return (
      <span className="flex aspect-square w-16 items-center justify-center rounded-lg bg-gray-100 text-center text-[10px] text-gray-400">
        Not available
      </span>
    );
  }
  if (!url) {
    return (
      <span className="aspect-square w-16 animate-pulse rounded-lg bg-gray-100" />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      aria-label={`Open photo ${index + 1}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Prescription photo ${index + 1}`}
        className="aspect-square w-16 rounded-lg object-cover ring-1 ring-gray-200"
      />
    </a>
  );
};

const MyPrescriptions = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { openSignIn } = useClerk();

  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<PrescriptionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const t = await getToken();
        if (!t) throw new Error("Please sign in again.");
        const list = await fetchMyPrescriptions(t);
        if (cancelled) return;
        setToken(t);
        setItems(list);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't load your prescriptions.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, reloadKey]);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200 p-6">
        <p className="text-sm text-gray-600">
          Sign in to see your prescriptions and how they&rsquo;re progressing.
        </p>
        <button
          type="button"
          onClick={() => openSignIn()}
          className="cursor-pointer rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-6"
      >
        <p className="text-sm text-gray-700">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="cursor-pointer rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!items || !token) {
    return (
      <p className="py-8 text-sm text-gray-500">
        Loading your prescriptions... This can take a few seconds if the server
        is waking up.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <p className="text-sm text-gray-600">
          You haven&rsquo;t uploaded a prescription yet.
        </p>
        <Link
          href="/pharmacy/upload"
          className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Upload a prescription
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((rx) => {
        const info = STATUS_INFO[rx.status];
        return (
          <li key={rx.id} className="rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-gray-900">
                  {rx.reference}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  For {rx.patientName} &middot;{" "}
                  {new Date(rx.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${TONE[info.tone]}`}
              >
                {info.label}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-600">{info.help}</p>

            {rx.pharmacistNote && (
              <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-800 [overflow-wrap:anywhere]">
                <span className="font-medium">Pharmacist&rsquo;s note: </span>
                {rx.pharmacistNote}
              </p>
            )}

            {rx.requestedProducts.length > 0 && (
              <p className="mt-3 text-xs text-gray-500 [overflow-wrap:anywhere]">
                Requested: {rx.requestedProducts.map((p) => p.name).join(", ")}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: rx.imageCount }, (_, i) => (
                <Thumb key={i} id={rx.id} index={i} token={token} />
              ))}
            </div>

            {rx.status === "NEEDS_INFO" && (
              <Link
                href="/pharmacy/upload"
                className="mt-4 inline-flex text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
              >
                Upload a clearer photo
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default MyPrescriptions;
