import Link from "next/link";

// Tiny inline-markup renderer so the content files can stay plain strings
// (no dangerouslySetInnerHTML): **bold**, *italic*, `code`, [text](href).
const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (!part) return null;

        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }

        const link = LINK.exec(part);
        if (link) {
          const [, label, href] = link as unknown as [string, string, string];
          if (href.startsWith("/")) {
            return (
              <Link key={i} href={href}>
                {label}
              </Link>
            );
          }
          const external = href.startsWith("http");
          return (
            <a
              key={i}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {label}
            </a>
          );
        }

        return part;
      })}
    </>
  );
}
