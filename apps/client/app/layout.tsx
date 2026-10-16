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

const DESCRIPTION =
  "First Depot Hardwares Limited is a home improvement company in Lira, Uganda. Paints, electricals, pumps and plumbing, tiles and building materials, delivered to where the work is happening.";

export const metadata: Metadata = {
  // Needed so relative image URLs become full URLs.
  metadataBase: new URL(SITE_URL),
  // What Google shows as the page title: "First Depot | Home Improvement Company".
  title: {
    default: "First Depot | Home Improvement Company",
    template: "%s | First Depot",
  },
  // What Google shows under the title in search results.
  description: DESCRIPTION,
  applicationName: "First Depot",
  keywords: [
    "First Depot",
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
  alternates: { canonical: "/" },
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
    title: "First Depot | Home Improvement Company",
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
    title: "First Depot | Home Improvement Company",
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
