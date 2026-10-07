import Link from "next/link";

const documentLinks = [
  { label: "Terms of Service", href: "/" },
  { label: "Privacy Policy", href: "/" },
  { label: "Return & Refund Policy", href: "/" },
];

// Seafoam palette taken from the Giggling Squid signage:
//   background  #c3e1d6  (sign mint)
//   ink         #1e4a3c  (deep umbrella green)
//   hover       #0b2e23  (near-black forest, darker than the ink so it never blends into the mint)
const Footer = () => {
  return (
    <footer className="relative z-10 mt-16 rounded-2xl bg-[#c3e1d6] py-8 text-[#1e4a3c]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {/* LINE 1: TAGLINE */}
        <p className="text-center font-serif text-sm tracking-[0.12em] sm:text-base">
          HOME IMPROVEMENT COMPANY.&nbsp;BUILDING COMFORT FOR YOUR HOME.
        </p>

        <div className="h-px w-full bg-[#1e4a3c]/20" />

        {/* LINE 2: COMPANY DOCS + COPYRIGHT */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {documentLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-medium underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:text-[#0b2e23] hover:decoration-[#0b2e23] focus-visible:text-[#0b2e23] focus-visible:decoration-[#0b2e23]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-sm text-[#1e4a3c]/80">
            © 2026{" "}
            <span className="font-serif font-semibold text-[#1e4a3c]">
              FIRST DEPOT
            </span>
            . All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
