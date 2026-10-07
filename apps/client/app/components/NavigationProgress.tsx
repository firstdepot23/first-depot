"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Site-wide loading feedback.
 *
 *  1. A thin green line that sits on the bottom edge of the sticky sub-navbar
 *     (#site-subnav) and creeps forward like Safari's address-bar progress,
 *     then snaps to 100% and fades when the new page is ready.
 *  2. If loading drags on past OVERLAY_DELAY, a centered logo card covers the
 *     screen so the site never looks frozen. Fast navigations never show it,
 *     so there is no flicker.
 *
 * It starts on its own for in-site link clicks and browser back/forward, and
 * finishes when the URL changes. For anything else (router.push from code,
 * router.refresh, a slow button action) call startLoader() / stopLoader().
 */

const START = "app:loader-start";
const DONE = "app:loader-done";

export const startLoader = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START));
};
export const stopLoader = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DONE));
};

const OVERLAY_DELAY = 700; // ms of loading before the logo card appears
const MAX_DURATION = 30000; // safety net: never stay stuck on screen

// "?a=b%20c" and "?a=b+c" are the same URL; compare them in one form.
const normalize = (path: string, search: string) => {
  const s = new URLSearchParams(search).toString();
  return s ? `${path}?${s}` : path;
};

type Timer = ReturnType<typeof setTimeout> | null;

const NavigationProgress = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = normalize(pathname, searchParams.toString());
  const currentRef = useRef(current);

  const [progress, setProgress] = useState(0);
  const [barVisible, setBarVisible] = useState(false);
  const [barTop, setBarTop] = useState(0);
  const [overlay, setOverlay] = useState<"hidden" | "visible" | "leaving">(
    "hidden",
  );

  const activeRef = useRef(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayTimer = useRef<Timer>(null);
  const maxTimer = useRef<Timer>(null);
  const fadeTimer = useRef<Timer>(null);
  const leaveTimer = useRef<Timer>(null);

  const clearTimers = () => {
    if (trickleRef.current) clearInterval(trickleRef.current);
    [overlayTimer, maxTimer, fadeTimer, leaveTimer].forEach((t) => {
      if (t.current) clearTimeout(t.current);
      t.current = null;
    });
  };

  // Sit exactly on the bottom edge of the (sticky) sub-navbar, wherever the
  // page is scrolled to. Falls back to the very top of the screen.
  const placeBar = useCallback(() => {
    const el = document.getElementById("site-subnav");
    setBarTop(
      el ? Math.max(0, Math.round(el.getBoundingClientRect().bottom - 3)) : 0,
    );
  }, []);

  const done = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;

    if (trickleRef.current) clearInterval(trickleRef.current);
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    if (maxTimer.current) clearTimeout(maxTimer.current);

    setProgress(100);
    fadeTimer.current = setTimeout(() => {
      setBarVisible(false);
      setProgress(0);
    }, 350);

    setOverlay((o) => (o === "visible" ? "leaving" : "hidden"));
    leaveTimer.current = setTimeout(() => setOverlay("hidden"), 250);
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    clearTimers();

    placeBar();
    setBarVisible(true);
    setOverlay("hidden");
    setProgress(8);

    // Quick at first, slower as it nears 92%: it never "finishes" by itself.
    trickleRef.current = setInterval(() => {
      setProgress((p) =>
        p >= 92 ? p : p + Math.max(0.4, (92 - p) * 0.08 + Math.random()),
      );
    }, 250);

    overlayTimer.current = setTimeout(
      () => setOverlay("visible"),
      OVERLAY_DELAY,
    );
    maxTimer.current = setTimeout(done, MAX_DURATION);
  }, [done, placeBar]);

  // The new URL has rendered: finish.
  useEffect(() => {
    currentRef.current = current;
    done();
  }, [current, done]);

  // What starts it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link || !link.href) return;
      if (link.target && link.target !== "_self") return;
      if (
        link.hasAttribute("download") ||
        link.hasAttribute("data-no-loader")
      ) {
        return;
      }

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or just a #hash): nothing will change, so nothing to wait for.
      const target = normalize(url.pathname, url.search);
      const here = normalize(window.location.pathname, window.location.search);
      if (target === here) return;
      start();
    };

    const onPopState = () => {
      const next = normalize(window.location.pathname, window.location.search);
      if (next !== currentRef.current) start();
    };

    window.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    window.addEventListener(START, start);
    window.addEventListener(DONE, done);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(START, start);
      window.removeEventListener(DONE, done);
      clearTimers();
    };
  }, [start, done]);

  // Keep the line glued to the sub-navbar while the page scrolls or resizes.
  useEffect(() => {
    if (!barVisible) return;
    window.addEventListener("scroll", placeBar, { passive: true });
    window.addEventListener("resize", placeBar);
    return () => {
      window.removeEventListener("scroll", placeBar);
      window.removeEventListener("resize", placeBar);
    };
  }, [barVisible, placeBar]);

  return (
    <>
      {/* PROGRESS LINE */}
      <div
        aria-hidden="true"
        style={{ top: barTop }}
        className={`pointer-events-none fixed inset-x-0 z-[60] h-[3px] transition-opacity duration-300 ${
          barVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          style={{ transform: `scaleX(${progress / 100})` }}
          className="h-full origin-left rounded-r-full bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 shadow-[0_0_10px_rgba(34,197,94,0.7)] transition-transform duration-300 ease-out motion-reduce:transition-none"
        />
      </div>

      {/* LOGO CARD: only for loads that take a while */}
      {overlay !== "hidden" && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-white/75 backdrop-blur-md transition-opacity duration-200 starting:opacity-0 ${
            overlay === "leaving" ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-white px-12 py-9 shadow-2xl shadow-gray-900/10 ring-1 ring-gray-200">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-green-100 border-t-green-600 motion-reduce:animate-none" />
              {/* Dummy logo: swap /logo.png for your final mark */}
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                priority
                className="h-11 w-11 animate-pulse motion-reduce:animate-none"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-900">
                First <span className="font-light">Depot</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">Loading, one moment…</p>
            </div>
          </div>
        </div>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {barVisible ? "Loading" : ""}
      </span>
    </>
  );
};

export default NavigationProgress;
