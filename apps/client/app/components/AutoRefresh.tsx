"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Re-runs the server-rendered Orders page every few seconds while a payment
// is still inside its 5 minute session, so it flips to "Completed" without
// the customer reloading.
//
// `maxMs` is how long to keep going: the time left in the longest-running
// payment session, plus a little extra, so the LAST refresh lands just after
// the session ends and the page can show it as not completed. After that the
// timer stops for good (and the page stops rendering this component anyway).
const AutoRefresh = ({
  intervalMs = 5000,
  maxMs,
}: {
  intervalMs?: number;
  maxMs: number;
}) => {
  const router = useRouter();

  // Read ONCE when the timer starts. The page re-renders on every refresh
  // with a smaller `maxMs`, and that must not restart the timer.
  const maxMsRef = useRef(maxMs);

  useEffect(() => {
    const startedAt = Date.now();

    const timer = setInterval(() => {
      router.refresh();
      if (Date.now() - startedAt >= maxMsRef.current) clearInterval(timer);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
};

export default AutoRefresh;
