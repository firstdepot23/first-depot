import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SecondaryNavbar from "./components/SecondaryNavbar";
import { ToastContainer } from "react-toastify";
import { ClerkProvider } from "@clerk/nextjs";
import CartSync from "./components/CartSync";
import NavigationProgress from "./components/NavigationProgress";
import { Suspense } from "react";
import JsonLd from "./components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://first-depot.com";

// The page title shown in the browser tab, in Chrome's address-bar
// suggestions for people who have visited, and as the headline of the search
// result. Keep it under ~60 characters so Google doesn't cut it off.
const SITE_TITLE = "First Depot";

// Shown under the title in search results (Google shows about 155 characters).
const DESCRIPTION =
  "First Depot Hardwares Limited is a Ugandan hardware and home improvement company. We supply paints, pumps and plumbing, tiles, home essentials, accessories and building materials to homeowners, builders and businesses.";

export const metadata: Metadata = {
  // Needed so relative image URLs become full URLs.
  metadataBase: new URL(SITE_URL),
  // Pages that set their own title become "<their title> | First Depot".
  // The homepage (and any page without a title) uses SITE_TITLE.
  title: {
    default: SITE_TITLE,
    template: "%s | First Depot",
  },
  // What Google shows under the title in search results.
  description: DESCRIPTION,
  applicationName: "First Depot",
  // Google ignores this tag; it is kept only for other search engines.
  keywords: [
    "First Depot",
    "FirstDepot",
    "First Depot Uganda",
    "First Depot Lira",
    "hardware and home improvement company",
    "home improvement company",
    "hardware store Lira",
    "hardware Uganda",
    "building materials Uganda",
    "paints",
    "tiles",
    "electricals",
    "plumbing",
  ],
  authors: [{ name: "First Depot Hardwares Limited", url: SITE_URL }],
  creator: "First Depot Hardwares Limited",
  publisher: "First Depot Hardwares Limited",
  category: "Home improvement",
  // NO `alternates.canonical` here on purpose. Set in the root layout it is
  // inherited by EVERY page that doesn't set its own, so every product and
  // docs page would tell Google "I am a copy of the homepage" and drop out of
  // search. Each page sets its own (see app/page.tsx).
  // Points to public/site.webmanifest (home-screen icons for Android / installed web app)
  manifest: "/site.webmanifest",
  // Tab icon and the logo Google shows beside your result.
  // Google wants a square icon whose size is a multiple of 48px (48, 96, 144...).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#1e4a3c" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "First Depot",
    locale: "en_UG",
    url: SITE_URL,
    title: SITE_TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/icons/og-image-2x.png",
        width: 2400,
        height: 1260,
        alt: "First Depot logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: DESCRIPTION,
    images: ["/icons/og-image-2x.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: true, email: true, address: true },
};

// Makes phones render at their real width instead of a zoomed-out desktop page.
// themeColor lives here (not in metadata) in current Next.js versions.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c3e1d6",
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-dvh flex flex-col overflow-x-clip text-base">
          <JsonLd />
          <CartSync />
          {/* useSearchParams inside needs a Suspense boundary */}
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {/* w-full is essential: in a flex-col body, mx-auto makes this
              shrink to its content width instead of filling the screen. */}
          <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
            <Navbar />
            <SecondaryNavbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ToastContainer
            position="bottom-center"
            className="!w-full sm:!w-[320px] !p-3 sm:!p-0"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
