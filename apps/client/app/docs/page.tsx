import Link from "next/link";
import { CloseLink } from "./_components/CloseLink";
import { Address } from "./_components/Address";
import { inc } from "./_data/company";
import { docs, groupOrder } from "./_data";

export default function DocsIndexPage() {
  return (
    <>
      <CloseLink href="/" label="Back to the store" />

      <div className="fd-docs-intro">
        <p>
          Welcome to {inc.legalName}, {inc.description} and the parent of the
          First Depot group. Here you will find our policies, how to get help,
          and what our businesses stock.
        </p>
        <p>
          {inc.tagline}. To see the shops and products we run, visit{" "}
          <Link href="/docs/businesses">Our Businesses</Link>. If you can not
          find what you are looking for,{" "}
          <Link href="/docs/contacts">get in touch</Link>.
        </p>
      </div>

      {groupOrder.map((group) => {
        const items = docs.filter((d) => d.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group}>
            <h3 className="fd-docs-group">{group}</h3>
            <ul className="fd-docs-index">
              {items.map((d) => (
                <li key={d.slug}>
                  <Link href={`/docs/${d.slug}`}>{d.title}</Link>{" "}
                  <span>({d.blurb})</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <Address of="inc" />
    </>
  );
}