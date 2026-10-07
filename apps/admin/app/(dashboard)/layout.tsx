import AppSidebar from "../components/AppSidebar";
import Navbar from "../components/Navbar";
import QueryProvider from "../components/providers/QueryProvider";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { SidebarProvider } from "../components/ui/sidebar";
import { cookies } from "next/headers";
import { ToastContainer } from "react-toastify";
import { requireAdmin } from "../lib/requireAdmin";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Every page in this route group is admin-only.
  await requireAdmin();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <QueryProvider>
      <div className="flex">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <main className="w-full">
              <Navbar />
              <div className="px-4">{children}</div>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </div>
      <ToastContainer position="bottom-right" />
    </QueryProvider>
  );
}
