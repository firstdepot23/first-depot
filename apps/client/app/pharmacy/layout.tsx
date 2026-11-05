import type { ReactNode } from "react";
import PharmacyComingSoon from "../components/pharmacy/PharmacyComingSoon";
import PharmacyTabs from "../components/pharmacy/PharmacyTabs";
import { PHARMACY_COMING_SOON } from "../lib/pharmacyLaunch";

// Incase the pharmacy soon is removed. switch to this
export default function PharmacyLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <PharmacyTabs />
      {children}
    </div>
  );

  // The pharmacy is its own section of the shop: its own strip of navigation
  // under the site menu, shared by the shop, upload and prescriptions pages.
  /*export default function PharmacyLayout({ children }: { children: ReactNode }) {
  const pharmacy = (
    <>
      <PharmacyTabs />
      {children}
    </>
  );

  // Open: exactly the layout as it was.
  if (!PHARMACY_COMING_SOON) {
    return <div>{pharmacy}</div>;
  }

  // Coming soon: the real pharmacy stays in place underneath, blurred and
  // switched off (no clicks, no keyboard focus, hidden from screen readers),
  // and the window sits on top. The site menu and footer stay usable.
  // Set PHARMACY_COMING_SOON to false in app/lib/pharmacyLaunch.ts to open up.
  return (
    <div className="relative isolate overflow-hidden rounded-3xl">
      <div
        aria-hidden="true"
        inert
        className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-50 blur-md"
      >
        {pharmacy}
      </div>
      <PharmacyComingSoon />
    </div>
  ); */
}
