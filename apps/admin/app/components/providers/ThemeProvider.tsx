"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes renders an inline <script> to set the theme class on <html>
// before hydration, preventing a flash of the wrong theme. React 19.2+
// flags any <script> a component renders during client rendering, but
// this one only needs to run during SSR, where it works correctly. This
// is a known false-positive (next-themes is effectively unmaintained):
// https://github.com/pacocoursey/next-themes/issues/385
//
// In development React prints "Encountered a script tag...". In a production
// build the same message is minified to "Minified React error #441", so the
// filter must match both forms or the error still floods the browser console.
// This runs in every environment on purpose.
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args
      .map((arg) =>
        typeof arg === "string" ? arg : arg instanceof Error ? arg.message : "",
      )
      .join(" ");

    if (
      message.includes("Encountered a script tag") ||
      message.includes("Minified React error #441") ||
      message.includes("react.dev/errors/441")
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
