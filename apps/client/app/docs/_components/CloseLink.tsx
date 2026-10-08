import Link from "next/link";

export function CloseLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="fd-docs-close" aria-label={label} title={label}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M3.5 3.5l13 13M16.5 3.5l-13 13" />
      </svg>
    </Link>
  );
}
