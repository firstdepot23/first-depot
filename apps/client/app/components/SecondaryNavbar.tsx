"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = { label: string; href: string; desc?: string };
type NavColumn = { title: string; links: NavLink[] };
type Promo = { title: string; text: string; cta: string; href: string };
type NavItem = {
  label: string;
  href?: string; // direct link (no dropdown)
  columns?: NavColumn[];
  promo?: Promo;
};

// Category slugs are placeholders: point them at the values your ProductList expects.
const NAV: NavItem[] = [
  {
    label: "Shop",
    columns: [
      {
        title: "BuildWare",
        links: [
          {
            label: "BondWare",
            href: "/products?category=cem",
            desc: "Cement and concrete",
          },
          {
            label: "TileWare",
            href: "/products?category=tiles",
            desc: "Floors, walls, tiles & splashbacks",
          },
          {
            label: "WoodWare",
            href: "/products?category=wood",
            desc: "Frames, boards, joinery, timber",
          },
          {
            label: "Roofing & ForgeWare",
            href: "/products?category=metal",
            desc: "Sheets, tiles and fixings",
          },
          {
            label: "CoatWare",
            href: "/products?category=paint",
            desc: "Paints and finishes",
          },
        ],
      },
      {
        title: "UtilWare",
        links: [
          {
            label: "Furniture & Fabric",
            href: "/products?category=furniture",
            desc: "Indoor & outdoor",
          },
          {
            label: "Power tools",
            href: "/products?category=tools",
            desc: "Drills, saws, grinders",
          },
          {
            label: "Hand tools",
            href: "/products?category=tools",
            desc: "The everyday essentials",
          },
          {
            label: "Lighting & PowerWare",
            href: "/products?category=electricals",
            desc: "Indoor and outdoor",
          },
          {
            label: "Plumbing & FlowWare",
            href: "/products?category=plumbing",
            desc: "Pipes, valves, tanks",
          },
        ],
      },
      {
        title: "TechWare",
        links: [
          {
            label: "Home power gadgets",
            href: "/products?search=power%20gadget",
            desc: "Drills, saws, grinders",
          },
          {
            label: "Electronics & smart home",
            href: "/products?category=electricals",
            desc: "The everyday essentials",
          },
          {
            label: "Home appliances",
            href: "/products?search=home%20appliance",
            desc: "essentials for your home",
          },
          {
            label: "Electrical",
            href: "/products?category=electricals",
            desc: "Cables, switches, boards",
          },
        ],
      },
    ],
    promo: {
      title: "Planning a project?",
      text: "Read our guides before you buy.",
      cta: "Read the blog",
      href: "/blog",
    },
  },
  {
    label: "Projects",
    columns: [
      {
        title: "By room",
        links: [
          { label: "Kitchen", href: "/blog?category=kitchen-bath" },
          { label: "Bathroom", href: "/blog?category=kitchen-bath" },
          { label: "Living room", href: "/blog?category=furniture" },
          { label: "Outdoor & garden", href: "/blog?category=outdoor" },
        ],
      },
      {
        title: "By project",
        links: [
          { label: "New build", href: "/blog?category=Guides" },
          { label: "Renovation", href: "/blog?category=Projects" },
          { label: "Painting", href: "/blog?category=Product" },
          { label: "Roofing", href: "/blog?category=Industry" },
        ],
      },
    ],
  },
  {
    label: "Resources",
    columns: [
      {
        title: "Learn",
        links: [
          { label: "Blog", href: "/blog", desc: "Guides, ideas and news" },
          {
            label: "Buying guides",
            href: "/blog?category=Guides",
            desc: "Choose with confidence",
          },
        ],
      },
      {
        title: "Help",
        links: [
          {
            label: "Support",
            href: "/docs/contacts",
            desc: "Talk to our team",
          },
          {
            label: "Important documents",
            href: "/docs",
            desc: "Terms, privacy and refunds",
          },
        ],
      },
    ],
  },
  { label: "Blog", href: "/blog" },
];

const CTA = { label: "Get a quote", href: "/quote" };

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    className={`h-3 w-3 transition-transform duration-200 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6l5 5 5-5" />
  </svg>
);

const SecondaryNavbar = () => {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // After clicking a link the pointer is still over the bar; don't let that
  // hover pop the menu straight back open while the next page loads.
  const ignoreHover = useRef(false);

  const [open, setOpen] = useState<string | null>(null); // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  const closeAll = () => {
    setOpen(null);
    setMobileOpen(false);
    setMobileSection(null);
  };

  // Close on navigation
  useEffect(() => {
    closeAll();
  }, [pathname]);

  // Close on Escape / outside press
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", closeAll);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", closeAll);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 150);
  };
  const onLeave = () => {
    ignoreHover.current = false;
    scheduleClose();
  };

  const isActive = (item: NavItem) => {
    if (item.href) return pathname.startsWith(item.href);
    return !!item.columns?.some((c) =>
      c.links.some((l) => {
        const base = l.href.split("?")[0] ?? "/";
        return base !== "/" && pathname.startsWith(base);
      }),
    );
  };

  const overlayVisible = open !== null || mobileOpen;

  const triggerClass = (item: NavItem) => {
    const expanded = open === item.label;
    return `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
      expanded
        ? "bg-gray-100 text-gray-900"
        : isActive(item)
          ? "text-green-700"
          : "text-gray-500 hover:text-gray-900"
    }`;
  };

  return (
    <>
      {/* Blurred backdrop while a menu is open */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-white/50 backdrop-blur-sm transition-opacity duration-200 ${
          overlayVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        ref={rootRef}
        id="site-subnav"
        onClick={(e) => {
          // Close the moment a link is clicked, not when the next page has
          // finished loading (which can take a while, or never happen for
          // links that only change the query string, like /?category=paints).
          if ((e.target as Element).closest("a")) {
            ignoreHover.current = true;
            cancelClose();
            closeAll();
          }
        }}
        className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur"
      >
        <nav aria-label="Explore" className="relative">
          {/* DESKTOP BAR */}
          <div
            className="hidden h-12 items-center justify-between md:flex"
            onMouseEnter={cancelClose}
            onMouseLeave={onLeave}
          >
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={triggerClass(item)}
                      aria-current={
                        pathname.startsWith(item.href) ? "page" : undefined
                      }
                      onMouseEnter={() => setOpen(null)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={triggerClass(item)}
                      aria-expanded={open === item.label}
                      aria-haspopup="true"
                      onMouseEnter={() => {
                        if (!ignoreHover.current) setOpen(item.label);
                      }}
                      onClick={() => {
                        ignoreHover.current = false;
                        setOpen(item.label);
                      }}
                    >
                      {item.label}
                      <Chevron
                        className={open === item.label ? "rotate-180" : ""}
                      />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <Link
              href={CTA.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              {CTA.label}
            </Link>
          </div>

          {/* DESKTOP PANELS: all rendered, cross-faded */}
          <div
            className="hidden md:block"
            onMouseEnter={cancelClose}
            onMouseLeave={onLeave}
          >
            {NAV.filter((i) => i.columns).map((item) => {
              const shown = open === item.label;
              const cols = item.columns!.length + (item.promo ? 1 : 0);
              return (
                <div
                  key={item.label}
                  aria-hidden={!shown}
                  className={`absolute inset-x-0 top-full rounded-b-2xl border border-t-0 border-gray-200 bg-white p-8 shadow-xl shadow-gray-900/10 transition duration-200 ${
                    shown
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0"
                  }`}
                >
                  <div
                    className="grid gap-x-10 gap-y-8"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {item.columns!.map((col) => (
                      <div key={col.title}>
                        <p className="border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900">
                          {col.title}
                        </p>
                        <ul className="mt-4 space-y-4">
                          {col.links.map((link) => (
                            <li key={link.label}>
                              <Link
                                href={link.href}
                                tabIndex={shown ? 0 : -1}
                                className="group block"
                              >
                                <span className="block text-sm font-semibold text-green-700 group-hover:text-green-500">
                                  {link.label}
                                </span>
                                {link.desc && (
                                  <span className="block text-sm text-gray-500">
                                    {link.desc}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {item.promo && (
                      <Link
                        href={item.promo.href}
                        tabIndex={shown ? 0 : -1}
                        className="group flex flex-col justify-end rounded-xl bg-gradient-to-br from-emerald-800 via-green-600 to-lime-400 p-5 text-white"
                      >
                        <span className="text-lg font-semibold leading-snug">
                          {item.promo.title}
                        </span>
                        <span className="mt-1 text-sm text-white/90">
                          {item.promo.text}
                        </span>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                          {item.promo.cta}
                          <Chevron className="-rotate-90 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MOBILE BAR */}
          <div className="flex h-12 items-center justify-between md:hidden">
            <span className="text-sm font-medium text-gray-900">
              {pathname.startsWith("/blog") ? "Blog" : "Explore"}
            </span>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-explore-menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              {mobileOpen ? (
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
                </svg>
              )}
            </button>
          </div>

          {/* MOBILE PANEL */}
          <div
            id="mobile-explore-menu"
            className={`absolute inset-x-0 top-full overflow-y-auto rounded-b-2xl border border-t-0 border-gray-200 bg-white shadow-xl shadow-gray-900/10 transition duration-200 md:hidden ${
              mobileOpen
                ? "visible max-h-[calc(100dvh-7rem)] translate-y-0 opacity-100"
                : "invisible max-h-0 -translate-y-1 opacity-0"
            }`}
          >
            <ul className="divide-y divide-gray-100 px-4">
              {NAV.map((item) => {
                if (item.href) {
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between py-4 text-base font-semibold text-gray-900"
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }
                const expanded = mobileSection === item.label;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setMobileSection(expanded ? null : item.label)
                      }
                      className="flex w-full items-center justify-between py-4 text-base font-semibold text-gray-900"
                    >
                      {item.label}
                      <Chevron
                        className={`h-3.5 w-3.5 ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    {expanded && (
                      <div className="space-y-5 pb-5">
                        {item.columns!.map((col) => (
                          <div key={col.title}>
                            <p className="text-sm font-medium text-gray-400">
                              {col.title}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {col.links.map((link) => (
                                <li key={link.label}>
                                  <Link
                                    href={link.href}
                                    className="block py-1.5 text-base text-green-700 hover:text-green-500"
                                  >
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="p-4">
              <Link
                href={CTA.href}
                className="flex w-full items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                {CTA.label}
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default SecondaryNavbar;
