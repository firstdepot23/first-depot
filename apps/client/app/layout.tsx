import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { ClerkProvider } from "@clerk/nextjs";
import CartSync from "./components/CartSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIRST DEPOT",
  description: "Building comfort for your home",
};

// Makes phones render at their real width instead of a zoomed-out desktop page.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-dvh flex flex-col overflow-x-clip text-base">
          <CartSync />
          {/* w-full is essential: in a flex-col body, mx-auto makes this
              shrink to its content width instead of filling the screen. */}
          <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
            <Navbar />
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
