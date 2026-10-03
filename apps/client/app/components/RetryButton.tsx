"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const RetryButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className="mt-1 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-60"
    >
      {isPending ? "Retrying..." : "Try again"}
    </button>
  );
};

export default RetryButton;
