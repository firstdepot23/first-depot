// Shape of the documents, plus tiny helpers so the content files stay readable.
//
// Inside any text string you can use:
//   **bold**   *italic*   `code`   [link text](/docs/privacy-policy)
//   External links (https://, mailto:, tel:) work too.

export type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "note"; text: string };

export type DocSection = {
  /** Used for the #anchor and the Contents highlight. Keep it unique per page. */
  id: string;
  title: string;
  blocks: Block[];
};

export type DocGroup = "Policies" | "Company" | "Help and safety" | "Build and shop";

export type DocPage = {
  slug: string;
  title: string;
  subtitle?: string;
  /** Short phrase shown in brackets next to the link on the /docs index. */
  blurb: string;
  group: DocGroup;
  /** Shown under the title, e.g. "October 2026". */
  updated: string;
  /** Number the section headings and the Contents list (good for legal text). */
  numbered?: boolean;
  /** Paragraphs shown before the first section heading. */
  intro?: Block[];
  sections: DocSection[];
};

export const p = (text: string): Block => ({ type: "p", text });
export const h3 = (text: string): Block => ({ type: "h3", text });
export const ul = (...items: string[]): Block => ({ type: "ul", items });
export const ol = (...items: string[]): Block => ({ type: "ol", items });
export const code = (source: string): Block => ({ type: "code", code: source.trim() });
export const note = (text: string): Block => ({ type: "note", text });
export const table = (head: string[], ...rows: string[][]): Block => ({
  type: "table",
  head,
  rows,
});
