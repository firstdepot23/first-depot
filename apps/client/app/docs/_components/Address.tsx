import { SHOW_ADDRESS } from "../_data";
import { company, inc } from "../_data/company";

// `of="inc"` (the docs homepage) shows First Depot, Inc.'s mailing address.
// The default shows the Uganda showroom, for the store's own pages.
export function Address({ of = "store" }: { of?: "inc" | "store" }) {
  if (!SHOW_ADDRESS) return <div className="fd-docs-end" />;

  if (of === "inc") {
    return (
      <footer className="fd-docs-foot">
        {inc.legalName}, {inc.jurisdiction}. <br />
        {inc.mailingAddress}
      </footer>
    );
  }

  return (
    <footer className="fd-docs-foot">
      Visit us: {company.address} <br />
      {company.postaladdress}, Uganda
    </footer>
  );
}
