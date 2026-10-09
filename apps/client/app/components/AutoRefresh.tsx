"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-runs the server-rendered Orders page every few seconds while a payment
// is still PENDING, so it flips to "Completed" without the customer reloading.
// The page stops rendering this component once nothing is pending, which
// cancels the timer. It also gives up after ~3 minutes.
const AutoRefresh = ({
  intervalMs = 5000,
  maxAttempts = 36,
}: {
  intervalMs?: number;
  maxAttempts?: number;
}) => {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      router.refresh();
      if (attempts >= maxAttempts) clearInterval(timer);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs, maxAttempts]);

  return null;
};

export default AutoRefresh;
