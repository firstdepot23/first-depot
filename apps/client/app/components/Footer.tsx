import Image from "next/image";
import Link from "next/link";

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.5V8.5l6.3 3.5-6.3 3.5z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.6 5.82c-1-.9-1.6-2.2-1.6-3.6h-3.3v13.9c0 1.6-1.3 2.9-2.9 2.9s-2.9-1.3-2.9-2.9 1.3-2.9 2.9-2.9c.3 0 .6 0 .9.1v-3.3c-.3 0-.6-.1-.9-.1-3.4 0-6.1 2.7-6.1 6.1s2.7 6.1 6.1 6.1 6.1-2.7 6.1-6.1V9.1c1.3.9 2.9 1.5 4.6 1.5V7.3c-1.1 0-2.1-.4-2.9-1.1z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.3 3H21l-6.7 7.6L22 21h-6.6l-5.2-6.6L4.2 21H1.5l7.2-8.2L1 3h6.7l4.7 6.1L18.3 3zm-1.2 16.2h1.5L7 4.7H5.4l11.7 14.5z" />
  </svg>
);

const documentLinks = [
  { label: "Terms of Service", href: "/" },
  { label: "Privacy Policy", href: "/" },
  { label: "Return & Refund Policy", href: "/" },
];

const paymentMethods = [
  "Visa",
  "Mastercard",
  "MTN Mobile Money",
  "Airtel Money",
];

const Footer = () => {
  return (
    <footer className="mt-16 bg-gray-800 rounded-lg text-gray-400 text-sm">
      <p className="px-8 pt-8 text-xs text-gray-400 text-center">
        HOME IMPROVEMENT COMPANY. {"       "} BUILDING COMFORT FOR YOUR HOME
      </p>

      <div className="flex flex-col gap-8 p-8 md:flex-row md:items-start md:justify-between">
        {/* BRAND */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="FIRST DEPOT" width={32} height={32} />
          <span className="text-base font-medium tracking-wider text-white">
            FIRST DEPOT
          </span>
        </Link>

        {/* DOCUMENTS */}
        <div className="flex flex-col gap-2">
          <p className="text-white font-medium">Documents</p>
          {documentLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* FOLLOW + PAYMENT METHODS */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-white font-medium">Follow Us</p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="hover:text-white transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="hover:text-white transition-colors"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="hover:text-white transition-colors"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-white font-medium">Payment Methods</p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="px-2 py-1 rounded border border-gray-600 text-xs"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-gray-700 px-8 py-4 text-center text-xs">
        © 2026 FIRST DEPOT. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
