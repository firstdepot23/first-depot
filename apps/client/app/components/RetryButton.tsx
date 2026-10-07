"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { startLoader, stopLoader } from "./NavigationProgress";

const RetryButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // router.refresh() keeps the same URL, so the loader can't tell when it is
  // finished on its own: follow the transition instead.
  useEffect(() => {
    if (isPending) startLoader();
    else stopLoader();
  }, [isPending]);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className="mt-1 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
    >
      {isPending ? "Retrying..." : "Try again"}
    </button>
  );
};

export default RetryButton;
