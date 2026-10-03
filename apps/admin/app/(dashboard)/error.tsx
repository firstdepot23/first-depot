"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center"
    >
      <h2 className="text-lg font-medium">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load this page. This is usually caused by a poor
        internet connection or a service that is temporarily unavailable.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
