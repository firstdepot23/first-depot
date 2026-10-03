"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes renders an inline <script> to set the theme class on <html>
// before hydration, preventing a flash of the wrong theme. React 19.2+
// flags any <script> a component renders during client rendering — but
// this one only needs to run during SSR, where it works correctly. This
// is a known false-positive warning (next-themes is effectively
// unmaintained): https://github.com/pacocoursey/next-themes/issues/385
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
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
