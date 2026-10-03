"use client";
import {
  ShoppingBasket,
  Layers,
  Grid3x3,
  Lamp,
  GlassWater,
  Paintbrush,
  Hammer,
  TreePine,
  Sofa,
  Shirt,
  Droplets,
  HardHat,
  Wrench,
  Zap,
  Briefcase,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categories } from "../data/categoryData";

const VISIBLE_COUNT = 6;

// Every category gets its own icon - no repeats.
const categoryIcons: Record<string, LucideIcon> = {
  all: ShoppingBasket,
  cem: Layers, // BondWare - bonding/layering materials
  tiles: Grid3x3, // TileWare - tile grid pattern
  homeaccessories: Lamp, // Home Accessories - decor
  glass: GlassWater, // ClearWare - glassware
  paint: Paintbrush, // CoatWare - paint/coatings
  metal: Hammer, // ForgeWare - metalwork
  wood: TreePine, // WoodWare - timber
  furniture: Sofa, // FurnitureWare
  fabric: Shirt, // FabricWare - textiles
  plumbing: Droplets, // FlowWare - water/plumbing
  safety: HardHat, // SafetyWare
  tools: Wrench, // ToolWare
  electricals: Zap, // PowerWare - electricity
  office: Briefcase, // OfficeWare
};

const Categories = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const selectedCategory = searchParams.get("category");

  const visibleCategories = categories.slice(0, VISIBLE_COUNT);
  const hiddenCategories = categories.slice(VISIBLE_COUNT);
  const selectedHiddenCategory = hiddenCategories.find(
    (c) => c.slug === selectedCategory,
  );

  // Close the "More" dropdown when clicking outside it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /*const handleChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", value || "all");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setMoreOpen(false);
  }; */

  const handleChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setMoreOpen(false);
  };

  return (
    // Outer row is NOT a scroll container, so it can't clip the "More"
    // dropdown. Only the inner list (below) scrolls horizontally.
    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg mb-4 text-sm">
      {/* Scrollable category list */}
      <div className="flex items-center gap-2 overflow-x-auto min-w-0">
        {visibleCategories.map((category) => {
          const Icon = categoryIcons[category.slug] ?? ShoppingBasket;
          return (
            <div
              className={`flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-md ${
                category.slug === selectedCategory
                  ? "bg-white"
                  : "text-gray-500"
              }`}
              key={category.slug}
              onClick={() => handleChange(category.slug)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {category.name}
            </div>
          );
        })}
      </div>

      {/* MORE - outside the scroll container, so its dropdown isn't clipped */}
      {hiddenCategories.length > 0 && (
        <div className="relative shrink-0" ref={moreRef}>
          <div
            className={`flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-md ${
              selectedHiddenCategory ? "bg-white" : "text-gray-500"
            }`}
            onClick={() => setMoreOpen((prev) => !prev)}
          >
            <span>
              {selectedHiddenCategory ? selectedHiddenCategory.name : "More"}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0" />
          </div>

          {moreOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {hiddenCategories.map((category) => {
                const Icon = categoryIcons[category.slug] ?? ShoppingBasket;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => handleChange(category.slug)}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 whitespace-nowrap ${
                      category.slug === selectedCategory
                        ? "font-medium text-black"
                        : "text-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Categories;
