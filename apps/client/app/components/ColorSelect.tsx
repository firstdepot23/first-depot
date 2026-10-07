"use client";

import { allColors } from "@repo/types";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// Colors are stored as names (e.g. "Jet Black"), not CSS-valid values,
// so swatches need to look up the actual hex to render as a background.
const getColorHex = (colorName: string) =>
  allColors.find((c) => c.name === colorName)?.hex ?? "#cccccc";

/**
 * Single-select searchable color picker - the storefront equivalent of
 * the admin's multi-select color picker in AddProduct.tsx. A trigger
 * button shows the current swatch + name; clicking it opens a panel with
 * a search box and the product's available colors as dot+name pills, so
 * the color is always identifiable by name, not just a small dot.
 */
const ColorSelect = ({
  colors,
  value,
  onChange,
  size = "md",
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  size?: "sm" | "md";
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredColors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return colors;
    return colors.filter((c) => c.toLowerCase().includes(term));
  }, [colors, search]);

  const triggerPadding =
    size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";

  return (
    <div
      className={`relative min-w-0 max-w-full ${open ? "w-full sm:w-auto" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex max-w-full items-center gap-1.5 rounded-md ring-1 ring-gray-200 bg-white hover:ring-gray-300 transition-colors ${triggerPadding}`}
        aria-expanded={open}
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0"
          style={{ backgroundColor: getColorHex(value) }}
        />
        <span className="truncate max-w-[7rem]">{value}</span>
        <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="z-20 mt-1.5 w-full rounded-md border border-gray-200 bg-white p-2.5 shadow-lg sm:absolute sm:left-0 sm:w-64">
          {/* Only worth a search box once there's actually something to
              search through - a 2-3 color product doesn't need one. */}
          {colors.length > 6 && (
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search colors..."
                className="w-full rounded-md border border-gray-200 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            {filteredColors.length === 0 ? (
              <p className="text-xs text-gray-400 px-1 py-2">
                No colors match &quot;{search}&quot;.
              </p>
            ) : (
              filteredColors.map((color) => {
                const isSelected = value === color;
                return (
                  <button
                    type="button"
                    key={color}
                    onClick={() => {
                      onChange(color);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? "border-gray-800 bg-gray-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                    {color}
                    {isSelected && <Check className="w-3 h-3 text-gray-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSelect;
