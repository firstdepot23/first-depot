import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";
// Adjust this path if NavigationProgress lives somewhere else in your app.
import NavProgress from "./_components/NavProgress";
import { DocsShell } from "./_components/DocsShell";
import { company } from "./_data/company";
import "./docs.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fd-docs-font",
});

export const metadata: Metadata = {
  title: {
    default: `Documents | ${company.legalName}`,
    template: `%s | ${company.name}`,
  },
  description: `Policies, help and product information from ${company.legalName}.`,
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsShell
      brand={company.name}
      fontClassName={serif.variable}
      // The reader covers the whole screen, so it needs its own loading
      // feedback: the storefront's copy would be hidden behind it. This one
      // sits on the top edge of the screen (anchorId={null}) because the
      // storefront's sub-navbar is covered too. useSearchParams() inside it
      // needs a Suspense boundary.
      overlay={
        <Suspense fallback={null}>
          <NavProgress anchorId={null} />
        </Suspense>
      }
    >
      {children}
    </DocsShell>
  );
}
