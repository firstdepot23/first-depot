import { Fragment, type ReactNode } from "react";

/*
 * Tiny inline-formatting language for blog paragraphs. The body stays a
 * string[] in MongoDB, so no schema change is needed.
 *
 *   **bold**   *italic*   __underline__   ^^CAPS^^
 *
 * Use <RichText text={paragraph} /> on the storefront too (copy this file
 * or move it into a shared package).
 */

export const FORMATS = {
  bold: { open: "**", close: "**" },
  italic: { open: "*", close: "*" },
  underline: { open: "__", close: "__" },
  caps: { open: "^^", close: "^^" },
} as const;

export type FormatName = keyof typeof FORMATS;

// Order matters: "**" must be tried before "*".
const MARKERS: { open: string; tag: FormatName }[] = [
  { open: "**", tag: "bold" },
  { open: "__", tag: "underline" },
  { open: "^^", tag: "caps" },
  { open: "*", tag: "italic" },
];

const wrap = (tag: FormatName, children: ReactNode, key: number) => {
  switch (tag) {
    case "bold":
      return <strong key={key}>{children}</strong>;
    case "italic":
      return <em key={key}>{children}</em>;
    case "underline":
      return (
        <span key={key} className="underline underline-offset-4">
          {children}
        </span>
      );
    case "caps":
      return (
        <span key={key} className="uppercase tracking-wide">
          {children}
        </span>
      );
  }
};

const parse = (text: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let i = 0;
  let buffer = "";
  let key = 0;

  while (i < text.length) {
    const marker = MARKERS.find((m) => text.startsWith(m.open, i));
    if (marker) {
      const start = i + marker.open.length;
      const end = text.indexOf(marker.open, start);
      // Only format when there is a closing marker and some content inside.
      if (end > start) {
        if (buffer) (out.push(buffer), (buffer = ""));
        out.push(wrap(marker.tag, parse(text.slice(start, end)), key++));
        i = end + marker.open.length;
        continue;
      }
    }
    buffer += text[i];
    i++;
  }
  if (buffer) out.push(buffer);
  return out.map((node, idx) => <Fragment key={idx}>{node}</Fragment>);
};

// The distinctive reading font. Load "Newsreader" (or any serif you like)
// in your layout with next/font and expose it as --font-blog.
export const blogFontFamily =
  'var(--font-blog), "Newsreader", "Source Serif 4", Georgia, "Times New Roman", serif';

export const RichText = ({ text }: { text: string }) => <>{parse(text)}</>;

/** Renders a whole post body (one array entry per paragraph). */
export const RichBody = ({
  paragraphs,
  className = "",
}: {
  paragraphs: string[];
  className?: string;
}) => (
  <div
    className={`space-y-6 text-[1.15rem] leading-[1.85] ${className}`}
    style={{ fontFamily: blogFontFamily }}
  >
    {paragraphs.map((p, i) => (
      <p key={i}>
        <RichText text={p} />
      </p>
    ))}
  </div>
);

/** Wraps the current selection in a textarea with the format's markers. */
export const applyFormat = (
  textarea: HTMLTextAreaElement,
  value: string,
  format: FormatName,
): { value: string; selStart: number; selEnd: number } => {
  const { open, close } = FORMATS[format];
  const { selectionStart: s, selectionEnd: e } = textarea;
  const selected = value.slice(s, e);

  // Already wrapped right around the selection? Toggle it off.
  const before = value.slice(Math.max(0, s - open.length), s);
  const after = value.slice(e, e + close.length);
  if (selected && before === open && after === close) {
    return {
      value:
        value.slice(0, s - open.length) +
        selected +
        value.slice(e + close.length),
      selStart: s - open.length,
      selEnd: e - open.length,
    };
  }

  return {
    value: value.slice(0, s) + open + selected + close + value.slice(e),
    selStart: s + open.length,
    selEnd: e + open.length,
  };
};
