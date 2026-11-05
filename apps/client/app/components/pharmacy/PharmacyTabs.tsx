"use client";

import { ClipboardList, FileUp, Pill } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// The pharmacy's own strip under the site navigation: where you are inside
// the pharmacy, and the one thing most visitors come for (upload).
const TABS = [
  { href: "/pharmacy", label: "Shop", Icon: Pill, exact: true },
  {
    href: "/pharmacy/prescriptions",
    label: "My prescriptions",
    Icon: ClipboardList,
    exact: false,
  },
];

const PharmacyTabs = () => {
  const pathname = usePathname();
  const uploading = pathname.startsWith("/pharmacy/upload");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 py-3">
      <nav aria-label="Pharmacy" className="flex items-center gap-1">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {!uploading && (
        <Link
          href="/pharmacy/upload"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          <FileUp className="h-4 w-4" />
          Upload prescription
        </Link>
      )}
    </div>
  );
};

export default PharmacyTabs;
