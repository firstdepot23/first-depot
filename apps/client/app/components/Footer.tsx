import Link from "next/link";

const documentLinks = [
  { label: "Terms of Service", href: "/" },
  { label: "Privacy Policy", href: "/" },
  { label: "Return & Refund Policy", href: "/" },
];

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
        {/* LINE 1: TAGLINE */}
        <p className="text-xs text-gray-500 text-center tracking-wide">
          HOME IMPROVEMENT COMPANY. &nbsp;&nbsp;&nbsp; BUILDING COMFORT FOR YOUR
          HOME.
        </p>

        {/* LINE 2: COMPANY DOCS + COPYRIGHT */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            {documentLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-green-500 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            © 2026{" "}
            <span className="font-semibold text-gray-700">FIRST DEPOT</span>.
            All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
