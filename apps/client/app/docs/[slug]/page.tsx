import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Blocks } from "../_components/Blocks";
import { CloseLink } from "../_components/CloseLink";
import { Contents } from "../_components/Contents";
import { Address } from "../_components/Address";
import { docs, getDoc } from "../_data";

type Props = { params: Promise<{ slug: string }> };

// Only the slugs in _data exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.subtitle ?? doc.blurb };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const index = docs.findIndex((d) => d.slug === doc.slug);
  const prev = index > 0 ? docs[index - 1] : undefined;
  const next = index < docs.length - 1 ? docs[index + 1] : undefined;

  const heading = (i: number, title: string) =>
    doc.numbered ? `${i + 1}. ${title}` : title;

  return (
    <>
      <CloseLink href="/docs" label="Back to all documents" />
      <Contents
        items={doc.sections.map((s, i) => ({
          id: s.id,
          label: heading(i, s.title),
        }))}
      />

      <article className="fd-docs-article">
        <h1 className="fd-docs-title">{doc.title}</h1>
        {doc.subtitle && <p className="fd-docs-subtitle">{doc.subtitle}</p>}
        <p className="fd-docs-date">{doc.updated}</p>

        {doc.intro && <Blocks blocks={doc.intro} />}

        {doc.sections.map((section, i) => (
          <section key={section.id}>
            <h2 id={section.id}>{heading(i, section.title)}</h2>
            <Blocks blocks={section.blocks} />
          </section>
        ))}
      </article>

      <nav className="fd-docs-pager" aria-label="More documents">
        {prev ? (
          <Link href={`/docs/${prev.slug}`}>
            <small>Previous</small>
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/docs/${next.slug}`} className="is-next">
            <small>Next</small>
            {next.title}
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <Address />
    </>
  );
}
