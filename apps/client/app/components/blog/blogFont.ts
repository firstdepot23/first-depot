import { Source_Serif_4 } from "next/font/google";
import type { CSSProperties } from "react";

/**
 * Same typeface as the /docs reader (Source Serif 4).
 * Exposed as --font-blog, which richText.tsx already reads first.
 */
export const blogFont = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-blog",
});

/** Apply to the wrapper of a blog page: sets the variable and the family. */
export const blogFontClass = blogFont.variable;
export const blogFontStyle: CSSProperties = {
  fontFamily: "var(--font-blog), Georgia, 'Times New Roman', serif",
};
