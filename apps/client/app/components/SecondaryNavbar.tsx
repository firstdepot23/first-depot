"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parseSegment, type SegmentSlug } from "../data/segments";

type NavLink = { label: string; href: string; desc?: string };
type Brand = { label: string };
type NavColumn = { title: string; links: NavLink[] };
type Promo = { title: string; text: string; cta: string; href: string };

// hardware | grocery | fastfood | pharmacy (the same list the rest of the shop uses)
type SegmentId = SegmentSlug;
type Segment = {
  id: SegmentId;
  label: string;
  blurb: string; // one line under the name in the section list
  href: string; // "View all ..." link
  columns: NavColumn[];
  promo?: Promo;
  brands?: Brand[]; // "Shop by brand" search + chips (fast food)
};

type NavItem = {
  label: string;
  href?: string; // direct link (no dropdown)
  columns?: NavColumn[];
  promo?: Promo;
  segments?: Segment[]; // a dropdown with sections on the left (used by Shop)
};

// How many links each column shows before "More". Change this one number to
// show fewer or more.
const VISIBLE_LINKS = 3;

// ---------------------------------------------------------------- Shop sections
// `segment` is the shop section (hardware, grocery, fastfood, pharmacy) and `category` is
// the category slug inside it. Category slugs are placeholders: they must match
// the slugs of the categories you create in the admin for that section.

const HARDWARE_COLUMNS: NavColumn[] = [
  {
    title: "BuildWare",
    links: [
      {
        label: "BondWare",
        href: "/products?segment=hardware&category=cem",
        desc: "Cement and concrete",
      },
      {
        label: "TileWare",
        href: "/products?segment=hardware&category=tiles",
        desc: "Floors, walls, tiles & splashbacks",
      },
      {
        label: "WoodWare",
        href: "/products?segment=hardware&category=wood",
        desc: "Frames, boards, joinery, timber",
      },
      {
        label: "Roofing & ForgeWare",
        href: "/products?segment=hardware&category=metal",
        desc: "Sheets, tiles and fixings",
      },
      {
        label: "CoatWare",
        href: "/products?segment=hardware&category=paint",
        desc: "Paints and finishes",
      },
    ],
  },
  {
    title: "UtilWare",
    links: [
      {
        label: "Furniture & Fabric",
        href: "/products?segment=hardware&category=furniture",
        desc: "Indoor & outdoor",
      },
      {
        label: "Power tools",
        href: "/products?segment=hardware&category=tools",
        desc: "Drills, saws, grinders",
      },
      {
        label: "Hand tools",
        href: "/products?segment=hardware&category=tools",
        desc: "The everyday essentials",
      },
      {
        label: "Lighting & PowerWare",
        href: "/products?segment=hardware&category=electricals",
        desc: "Indoor and outdoor",
      },
      {
        label: "Plumbing & FlowWare",
        href: "/products?segment=hardware&category=plumbing",
        desc: "Pipes, valves, tanks",
      },
    ],
  },
  {
    title: "TechWare",
    links: [
      {
        label: "Home power gadgets",
        href: "/products?segment=hardware&search=power%20gadget",
        desc: "Drills, saws, grinders",
      },
      {
        label: "Electronics & smart home",
        href: "/products?segment=hardware&category=electricals",
        desc: "The everyday essentials",
      },
      {
        label: "Home appliances",
        href: "/products?segment=hardware&search=home%20appliance",
        desc: "essentials for your home",
      },
      {
        label: "Electrical",
        href: "/products?segment=hardware&category=electricals",
        desc: "Cables, switches, boards",
      },
    ],
  },
];

const GROCERY_COLUMNS: NavColumn[] = [
  {
    title: "Fresh food",
    links: [
      {
        label: "Fresh produce",
        href: "/products?segment=grocery&category=fresh-produce",
        desc: "Fruit and vegetables",
      },
      {
        label: "Dairy & eggs",
        href: "/products?segment=grocery&category=dairy-eggs",
        desc: "Milk, yoghurt, eggs",
      },
      {
        label: "Bakery",
        href: "/products?segment=grocery&category=bakery",
        desc: "Bread and baked goods",
      },
      {
        label: "Meat & fish",
        href: "/products?segment=grocery&category=meat-fish",
        desc: "Fresh and chilled",
      },
      {
        label: "Frozen foods",
        href: "/products?segment=grocery&category=frozen",
        desc: "Keep frozen on arrival",
      },
    ],
  },
  {
    title: "Pantry & drinks",
    links: [
      {
        label: "Rice, flour & grains",
        href: "/products?segment=grocery&category=pantry-staples",
        desc: "Everyday staples",
      },
      {
        label: "Cooking oil & spices",
        href: "/products?segment=grocery&category=cooking-essentials",
        desc: "For the kitchen",
      },
      {
        label: "Tea, coffee & milk",
        href: "/products?segment=grocery&category=tea-coffee",
        desc: "Hot drinks",
      },
      {
        label: "Water & juices",
        href: "/products?segment=grocery&category=beverages",
        desc: "Cold drinks",
      },
      {
        label: "Snacks & sweets",
        href: "/products?segment=grocery&category=snacks",
        desc: "Biscuits, crisps, treats",
      },
    ],
  },
  {
    title: "Home care",
    links: [
      {
        label: "Cleaning supplies",
        href: "/products?segment=grocery&category=cleaning",
        desc: "Surfaces and floors",
      },
      {
        label: "Laundry",
        href: "/products?segment=grocery&category=laundry",
        desc: "Soap and detergents",
      },
      {
        label: "Paper & tissue",
        href: "/products?segment=grocery&category=paper-tissue",
        desc: "Toilet and kitchen paper",
      },
      {
        label: "Baby food & nappies",
        href: "/products?segment=grocery&category=baby",
        desc: "For the little ones",
      },
    ],
  },
];

const FASTFOOD_COLUMNS: NavColumn[] = [
  {
    title: "Meals",
    links: [
      {
        label: "Burgers & sandwiches",
        href: "/products?segment=fastfood&category=burgers",
        desc: "Stacked and toasted",
      },
      {
        label: "Chicken",
        href: "/products?segment=fastfood&category=chicken",
        desc: "Fried, grilled and wings",
      },
      {
        label: "Pizza",
        href: "/products?segment=fastfood&category=pizza",
        desc: "Slices and whole pies",
      },
      {
        label: "Wraps & rolex",
        href: "/products?segment=fastfood&category=wraps-rolex",
        desc: "Hot, rolled and ready",
      },
      {
        label: "Combos & meal deals",
        href: "/products?segment=fastfood&category=combos",
        desc: "A meal and a drink",
      },
    ],
  },
  {
    title: "Sides & snacks",
    links: [
      {
        label: "Chips & fries",
        href: "/products?segment=fastfood&category=chips-fries",
        desc: "Hot and crispy",
      },
      {
        label: "Snacks & sides",
        href: "/products?segment=fastfood&category=sides-snacks",
        desc: "Samosas, bites and more",
      },
      {
        label: "Breakfast",
        href: "/products?segment=fastfood&category=breakfast",
        desc: "Start the day right",
      },
    ],
  },
  {
    title: "Drinks & treats",
    links: [
      {
        label: "Hot drinks",
        href: "/products?segment=fastfood&category=hot-drinks",
        desc: "Coffee and tea",
      },
      {
        label: "Cold drinks & juices",
        href: "/products?segment=fastfood&category=cold-drinks",
        desc: "Sodas, juices, water",
      },
      {
        label: "Milkshakes & smoothies",
        href: "/products?segment=fastfood&category=shakes-smoothies",
        desc: "Thick and cold",
      },
      {
        label: "Desserts & cakes",
        href: "/products?segment=fastfood&category=desserts",
        desc: "Something sweet",
      },
    ],
  },
];

// Brands shown under Fast Food. Each chip searches fast food for that name,
// e.g. /products?segment=fastfood&search=KFC. Add or remove brands here.
// NOTE: the search matches the product NAME or the NAME of its category, so a
// brand turns up products with the brand in their name ("KFC Zinger Burger")
// and every product filed under a category of that name (a "KFC" category).
const FASTFOOD_BRANDS: Brand[] = [
  { label: "Cafe Javas" },
  { label: "Pizza" },
  { label: "Caramel" },
  { label: "KFC" },
  { label: "Lato" },
];

const brandHref = (text: string) =>
  `/products?segment=fastfood&search=${encodeURIComponent(text.trim())}`;

const PHARMACY_COLUMNS: NavColumn[] = [
  {
    title: "Everyday health",
    links: [
      {
        label: "Pain relief",
        href: "/pharmacy?category=pain-relief",
        desc: "Over-the-counter",
      },
      {
        label: "Cold & flu",
        href: "/pharmacy?category=cold-flu",
        desc: "Cough and congestion",
      },
      {
        label: "Digestive health",
        href: "/pharmacy?category=digestive-health",
        desc: "Stomach comfort",
      },
      {
        label: "Allergy",
        href: "/pharmacy?category=allergy",
        desc: "Hay fever and itching",
      },
      {
        label: "Vitamins & supplements",
        href: "/pharmacy?category=vitamins-supplements",
        desc: "Daily wellness",
      },
    ],
  },
  {
    title: "First aid & care",
    links: [
      {
        label: "First aid",
        href: "/pharmacy?category=first-aid",
        desc: "Plasters, dressings, antiseptic",
      },
      {
        label: "Skin care",
        href: "/pharmacy?category=skin-care",
        desc: "Creams and lotions",
      },
      {
        label: "Oral care",
        href: "/pharmacy?category=oral-care",
        desc: "Brushes and toothpaste",
      },
      {
        label: "Hygiene",
        href: "/pharmacy?category=hygiene",
        desc: "Soaps and sanitisers",
      },
    ],
  },
  {
    title: "Mother & baby",
    links: [
      {
        label: "Baby care",
        href: "/pharmacy?category=baby-care",
        desc: "Nappy care and baby wash",
      },
      {
        label: "Feeding & nutrition",
        href: "/pharmacy?category=feeding-nutrition",
        desc: "Bottles and formula",
      },
      {
        label: "Mother care",
        href: "/pharmacy?category=mother-care",
        desc: "Before and after birth",
      },
    ],
  },
];

const SEGMENTS: Segment[] = [
  {
    id: "hardware",
    label: "Hardware",
    blurb: "Building, tools, plumbing & electricals",
    href: "/products?segment=hardware",
    columns: HARDWARE_COLUMNS,
    promo: {
      title: "Planning a project?",
      text: "Read our guides before you buy.",
      cta: "Read the blog",
      href: "/blog",
    },
  },
  {
    id: "grocery",
    label: "Grocery",
    blurb: "Food, drinks & household",
    href: "/products?segment=grocery",
    columns: GROCERY_COLUMNS,
    promo: {
      title: "Delivered to you",
      text: "See delivery times and fees for your town.",
      cta: "Delivery info",
      href: "/docs/help-center#delivery",
    },
  },
  {
    id: "fastfood",
    label: "Fast Food",
    blurb: "Hot meals, combos & drinks",
    href: "/products?segment=fastfood",
    columns: FASTFOOD_COLUMNS,
    brands: FASTFOOD_BRANDS,
    promo: {
      title: "Delivered to you",
      text: "See delivery times and fees for your town.",
      cta: "Delivery info",
      href: "/docs/help-center#delivery",
    },
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    blurb: "Health, wellness & care",
    href: "/pharmacy",
    columns: PHARMACY_COLUMNS,
    promo: {
      title: "Have a prescription?",
      text: "Upload a photo and our pharmacist will take it from there.",
      cta: "Upload prescription",
      href: "/pharmacy/upload",
    },
  },
];

const NAV: NavItem[] = [
  { label: "Shop", segments: SEGMENTS },

  {
    label: "Resources",
    columns: [
      {
        title: "Learn",
        links: [
          { label: "Blog", href: "/blog", desc: "Guides, ideas and news" },
          {
            label: "Select Colors",
            href: "/colors",
            desc: "Choose a Color with confidence",
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

const linksOf = (item: NavItem): NavLink[] => [
  ...(item.columns?.flatMap((c) => c.links) ?? []),
  ...(item.segments?.flatMap((s) => s.columns.flatMap((c) => c.links)) ?? []),
];

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

// One column of links: the first few, then a "More" button for the rest.
const ColumnLinks = ({
  col,
  expanded,
  onToggle,
  tabIndex,
  mobile = false,
}: {
  col: NavColumn;
  expanded: boolean;
  onToggle: () => void;
  tabIndex: number;
  mobile?: boolean;
}) => {
  const hidden = col.links.length - VISIBLE_LINKS;
  const links =
    expanded || hidden <= 0 ? col.links : col.links.slice(0, VISIBLE_LINKS);

  return (
    <>
      <ul className={mobile ? "mt-2 space-y-1" : "mt-4 space-y-4"}>
        {links.map((link) => (
          <li key={link.label}>
            {mobile ? (
              <Link
                href={link.href}
                tabIndex={tabIndex}
                className="block py-1.5 text-base text-green-700 hover:text-green-500"
              >
                {link.label}
              </Link>
            ) : (
              <Link
                href={link.href}
                tabIndex={tabIndex}
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
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          tabIndex={tabIndex}
          aria-expanded={expanded}
          onClick={onToggle}
          className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
            mobile ? "py-1" : ""
          }`}
        >
          {expanded ? "Show fewer" : `More (${hidden})`}
          <Chevron className={expanded ? "rotate-180" : ""} />
        </button>
      )}
    </>
  );
};

// "Shop by brand": a search box plus one chip per brand. Typing a brand that
// isn't in the list works too, it just searches fast food for that text.
const BrandStrip = ({
  brands,
  tabIndex,
  mobile = false,
  onSearch,
}: {
  brands: Brand[];
  tabIndex: number;
  mobile?: boolean;
  onSearch: (text: string) => void;
}) => {
  const [text, setText] = useState("");

  return (
    <div
      className={
        mobile
          ? "border-t border-gray-100 pt-4"
          : "mt-8 border-t border-gray-200 pt-6"
      }
    >
      <p
        className={
          mobile
            ? "text-sm font-medium text-gray-400"
            : "text-sm font-semibold text-gray-900"
        }
      >
        Shop by brand
      </p>

      <form
        role="search"
        className="mt-3 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSearch(text);
          setText("");
        }}
      >
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          tabIndex={tabIndex}
          placeholder="Search a brand, e.g. KFC"
          aria-label="Search fast food by brand"
          className="min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-green-600 focus-visible:ring-2 focus-visible:ring-green-600/30"
        />
        <button
          type="submit"
          tabIndex={tabIndex}
          className="shrink-0 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          Search
        </button>
      </form>

      <ul className="mt-3 flex flex-wrap gap-2">
        {brands.map((brand) => (
          <li key={brand.label}>
            <Link
              href={brandHref(brand.label)}
              tabIndex={tabIndex}
              className="inline-flex rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:border-green-600 hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              {brand.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SecondaryNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // After clicking a link the pointer is still over the bar; don't let that
  // hover pop the menu straight back open while the next page loads.
  const ignoreHover = useRef(false);

  const [open, setOpen] = useState<string | null>(null); // desktop dropdown
  const [segment, setSegment] = useState<SegmentId>("hardware"); // desktop: section shown in Shop
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [mobileSegment, setMobileSegment] = useState<SegmentId | null>(
    "hardware",
  );

  const closeAll = () => {
    setOpen(null);
    setMobileOpen(false);
    setMobileSection(null);
    setMobileSegment("hardware");
    setExpandedCols({});
  };

  const searchBrand = (text: string) => {
    const term = text.trim();
    if (!term) return;
    closeAll();
    router.push(brandHref(term));
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

  // Opening Shop while browsing a section (e.g. /products?segment=grocery)
  // starts on that section.
  const openMenu = (label: string) => {
    if (label === "Shop") {
      const fromUrl = parseSegment(
        new URLSearchParams(window.location.search).get("segment"),
      );
      if (fromUrl) setSegment(fromUrl);
      // The pharmacy has its own address instead of ?segment=...
      else if (window.location.pathname.startsWith("/pharmacy")) {
        setSegment("pharmacy");
      }
    }
    setOpen(label);
  };

  const toggleCol = (key: string) =>
    setExpandedCols((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (item: NavItem) => {
    if (item.href) return pathname.startsWith(item.href);
    return linksOf(item).some((l) => {
      const base = l.href.split("?")[0] ?? "/";
      return base !== "/" && pathname.startsWith(base);
    });
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

  const activeSegment = SEGMENTS.find((s) => s.id === segment) ?? SEGMENTS[0]!;

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
                        if (!ignoreHover.current) openMenu(item.label);
                      }}
                      onClick={() => {
                        ignoreHover.current = false;
                        openMenu(item.label);
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
            {NAV.filter((i) => i.columns || i.segments).map((item) => {
              const shown = open === item.label;
              const tab = shown ? 0 : -1;
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
                  {item.segments ? (
                    /* SHOP: sections on the left, the chosen section's columns on the right */
                    <div className="flex gap-10">
                      <div
                        role="tablist"
                        aria-orientation="vertical"
                        aria-label="Shop sections"
                        className="w-56 shrink-0 space-y-1 border-r border-gray-200 pr-6"
                      >
                        {item.segments.map((seg) => {
                          const on = seg.id === segment;
                          return (
                            <button
                              key={seg.id}
                              type="button"
                              role="tab"
                              aria-selected={on}
                              tabIndex={tab}
                              onMouseEnter={() => setSegment(seg.id)}
                              onFocus={() => setSegment(seg.id)}
                              onClick={() => setSegment(seg.id)}
                              className={`block w-full rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                                on
                                  ? "bg-green-50 ring-1 ring-green-200"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <span
                                className={`block text-sm font-semibold ${
                                  on ? "text-green-700" : "text-gray-900"
                                }`}
                              >
                                {seg.label}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {seg.blurb}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div role="tabpanel" className="min-w-0 flex-1">
                        <div
                          className="grid gap-x-10 gap-y-8"
                          style={{
                            gridTemplateColumns: `repeat(${
                              activeSegment.columns.length +
                              (activeSegment.promo ? 1 : 0)
                            }, minmax(0, 1fr))`,
                          }}
                        >
                          {activeSegment.columns.map((col) => {
                            const key = `${activeSegment.id}:${col.title}`;
                            return (
                              <div key={key}>
                                <p className="border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900">
                                  {col.title}
                                </p>
                                <ColumnLinks
                                  col={col}
                                  expanded={!!expandedCols[key]}
                                  onToggle={() => toggleCol(key)}
                                  tabIndex={tab}
                                />
                              </div>
                            );
                          })}

                          {activeSegment.promo && (
                            <Link
                              href={activeSegment.promo.href}
                              tabIndex={tab}
                              className="group flex flex-col justify-end rounded-xl bg-gradient-to-br from-emerald-800 via-green-600 to-lime-400 p-5 text-white"
                            >
                              <span className="text-lg font-semibold leading-snug">
                                {activeSegment.promo.title}
                              </span>
                              <span className="mt-1 text-sm text-white/90">
                                {activeSegment.promo.text}
                              </span>
                              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                                {activeSegment.promo.cta}
                                <Chevron className="-rotate-90 transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </Link>
                          )}
                        </div>

                        {activeSegment.brands && (
                          <BrandStrip
                            brands={activeSegment.brands}
                            tabIndex={tab}
                            onSearch={searchBrand}
                          />
                        )}

                        <Link
                          href={activeSegment.href}
                          tabIndex={tab}
                          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-green-700"
                        >
                          View all {activeSegment.label.toLowerCase()}
                          <Chevron className="-rotate-90" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="grid gap-x-10 gap-y-8"
                      style={{
                        gridTemplateColumns: `repeat(${
                          item.columns!.length + (item.promo ? 1 : 0)
                        }, minmax(0, 1fr))`,
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
                                  tabIndex={tab}
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
                          tabIndex={tab}
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
                  )}
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

                    {expanded && item.segments && (
                      /* SHOP on a phone: Hardware / Grocery / Fast Food / Pharmacy, one open at a time */
                      <div className="space-y-2 pb-5">
                        {item.segments.map((seg) => {
                          const segOpen = mobileSegment === seg.id;
                          return (
                            <div
                              key={seg.id}
                              className="rounded-xl border border-gray-100"
                            >
                              <button
                                type="button"
                                aria-expanded={segOpen}
                                onClick={() =>
                                  setMobileSegment(segOpen ? null : seg.id)
                                }
                                className="flex w-full items-center justify-between px-4 py-3 text-left"
                              >
                                <span>
                                  <span className="block text-sm font-semibold text-gray-900">
                                    {seg.label}
                                  </span>
                                  <span className="block text-xs text-gray-500">
                                    {seg.blurb}
                                  </span>
                                </span>
                                <Chevron
                                  className={`h-3.5 w-3.5 ${segOpen ? "rotate-180" : ""}`}
                                />
                              </button>

                              {segOpen && (
                                <div className="space-y-5 px-4 pb-4">
                                  {seg.columns.map((col) => {
                                    const key = `m:${seg.id}:${col.title}`;
                                    return (
                                      <div key={key}>
                                        <p className="text-sm font-medium text-gray-400">
                                          {col.title}
                                        </p>
                                        <ColumnLinks
                                          mobile
                                          col={col}
                                          expanded={!!expandedCols[key]}
                                          onToggle={() => toggleCol(key)}
                                          tabIndex={0}
                                        />
                                      </div>
                                    );
                                  })}
                                  {seg.brands && (
                                    <BrandStrip
                                      mobile
                                      brands={seg.brands}
                                      tabIndex={0}
                                      onSearch={searchBrand}
                                    />
                                  )}
                                  <Link
                                    href={seg.href}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-green-700"
                                  >
                                    View all {seg.label.toLowerCase()}
                                    <Chevron className="-rotate-90" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {expanded && item.columns && (
                      <div className="space-y-5 pb-5">
                        {item.columns.map((col) => (
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
