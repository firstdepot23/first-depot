"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { social } from "../_data/company";
import { SocialIcon } from "./SocialIcons";

const STORAGE_KEY = "fd-docs-theme";

// Full-screen reader. It sits above the storefront's own navbar/footer so the
// documents read as a calm, distraction-free page whatever the root layout
// renders around it. The theme is local to the reader and independent of any
// site-wide dark mode.
export function DocsShell({
  brand,
  fontClassName,
  overlay,
  children,
}: {
  brand: string;
  fontClassName: string;
  /** Rendered inside the reader but outside the document column (loaders etc). */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const [dark, setDark] = useState(false);

  // Restore the saved choice after hydration (reading localStorage during
  // render would make server and client HTML differ).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "dark") setDark(true);
    } catch {
      /* storage blocked: stay on the default theme */
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`fd-docs ${fontClassName}`}
      data-theme={dark ? "dark" : "light"}
    >
      <div className="fd-docs-col">
        <header className="fd-docs-header">
          <Link href="/docs" className="fd-docs-brand">
            {brand}
          </Link>
        </header>
        {children}
      </div>

      {/* Floating bar: social links + dark mode switch */}
      <div
        className="fd-docs-dock"
        role="group"
        aria-label="Social links and display settings"
      >
        {social.map((s) => (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${brand} on ${s.label}`}
            title={s.label}
          >
            <SocialIcon id={s.id} />
          </a>
        ))}

        <span className="fd-docs-dock-sep" aria-hidden="true" />

        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label="Dark mode"
          title="Dark mode"
          className="fd-docs-switch"
          onClick={toggle}
        />
      </div>

      {overlay}
    </div>
  );
}
