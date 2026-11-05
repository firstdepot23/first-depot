"use client";

import { useState } from "react";
import palette, { type ColorGroup } from "../data/color-palette";

const barColors: string[] = [
  "#c8102e",
  "#e88018",
  "#d4a017",
  "#3a7d44",
  "#1a5a8a",
  "#6a3d8f",
];

const firstGroup: ColorGroup = (() => {
  const group = palette[0];
  if (!group) throw new Error("Colour palette is empty");
  return group;
})();

const serif = "font-['Playfair_Display',serif]";

export default function ColorsPage() {
  const [activeCategory, setActiveCategory] = useState<string>(firstGroup.id);
  const [copiedHex, setCopiedHex] = useState<string>("");

  const activeGroup =
    palette.find((group) => group.id === activeCategory) ?? firstGroup;

  async function copyHex(hex: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(""), 1400);
    } catch {
      setCopiedHex("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-['DM_Sans',sans-serif] text-[#1a1a18] [&_*]:box-border">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/[0.09] bg-white px-8 max-[600px]:px-4">
        <div className="mx-auto flex min-h-[68px] max-w-[1200px] items-center justify-between gap-4 max-[600px]:min-h-[60px]">
          <a
            className={`${serif} text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1a1a18] no-underline`}
            href="/"
            aria-label="FIRST-DEPOT home"
          >
            FIRST DEPOT<span className="text-[#c3e1d6]">.</span>
          </a>
          <p className="text-[.72rem] font-medium uppercase tracking-[.1em] text-[#6b6b66] max-[600px]:hidden">
            Interior &amp; Exterior Colour Collection
          </p>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#c3e1d6] px-8 pb-[2.7rem] pt-[3.4rem] text-[#1e4a3c] max-[600px]:px-4 max-[600px]:pb-8 max-[600px]:pt-[2.4rem]">
        <div className="mx-auto max-w-[1200px]">
          <p className="mb-[.7rem] text-[.7rem] font-bold uppercase tracking-[.15em] text-[#c8102e]">
            Find your perfect shade
          </p>
          <h1
            className={`${serif} mb-[.8rem] text-[clamp(2.2rem,5vw,3.6rem)] font-normal leading-[1.1] tracking-[-0.035em]`}
          >
            The Complete
            <br />
            Colour Range
          </h1>
          <p className="max-w-[510px] text-[.92rem] leading-[1.7] text-blue/[.68]">
            Explore colours for your next building or renovation project. Shades
            shown are indicative and may vary in actual application.
          </p>
          <div
            className="mt-[1.6rem] flex h-1 max-w-[320px] gap-1"
            aria-hidden="true"
          >
            {barColors.map((color) => (
              <span
                key={color}
                className="flex-1 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category tabs */}
      <nav
        className="sticky top-[68px] z-10 overflow-x-auto border-b border-black/[0.09] bg-white [scrollbar-width:none] max-[600px]:top-[60px] [&::-webkit-scrollbar]:hidden"
        aria-label="Colour categories"
      >
        <div
          className="mx-auto flex w-max min-w-full max-w-[1200px]"
          role="tablist"
        >
          {palette.map((group) => {
            const isActive = activeCategory === group.id;
            return (
              <button
                key={group.id}
                id={`tab-${group.id}`}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-[9px] border-0 border-b-2 bg-transparent px-[1.15rem] py-[1.1rem] text-[.77rem] font-semibold uppercase tracking-[.045em] transition-colors duration-[180ms] hover:text-[#1a1a18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#c3e1d6] max-[600px]:px-[.9rem] max-[600px]:py-4 max-[600px]:text-[.7rem] ${
                  isActive
                    ? "border-b-[#8cc0ad] text-[#1a1a18]"
                    : "border-b-transparent text-[#9a9a94]"
                }`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${group.id}`}
                onClick={() => setActiveCategory(group.id)}
              >
                <span
                  className="h-[10px] w-[10px] shrink-0 rounded-full"
                  style={{ backgroundColor: group.dot }}
                />
                {group.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-[1200px] px-8 pb-0 pt-[2.4rem] max-[600px]:px-4 max-[600px]:pt-[1.6rem]">
        <section
          id={`panel-${activeGroup.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeGroup.id}`}
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.09] pb-[1.2rem]">
            <div>
              <p className="mb-[.35rem] text-[.7rem] font-bold uppercase tracking-[.15em] text-[#6b6b66]">
                Explore the palette
              </p>
              <h2
                className={`${serif} text-[1.75rem] font-normal tracking-[-0.02em] max-[600px]:text-[1.45rem]`}
              >
                {activeGroup.label}
              </h2>
            </div>
            <span className="pb-[.2rem] text-[.75rem] uppercase tracking-[.07em] text-[#6b6b66]">
              {activeGroup.colors.length} colours
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 max-[600px]:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] max-[600px]:gap-3 max-[380px]:grid-cols-2">
            {activeGroup.colors.map((color) => (
              <button
                className="flex cursor-pointer flex-col overflow-hidden rounded-[10px] border border-black/[0.09] bg-white p-0 text-left shadow-[0_1px_3px_rgba(0,0,0,.045)] transition-all duration-[180ms] ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#c8102e]"
                key={`${color.code}-${color.name}`}
                type="button"
                onClick={() => copyHex(color.hex)}
                title={`Copy ${color.hex}`}
                aria-label={`Copy HEX ${color.hex} for ${color.name}`}
              >
                <span
                  className="block aspect-[4/3] w-full"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="flex flex-col items-start gap-1 px-[.8rem] pb-[.8rem] pt-3">
                  <span className="text-[.67rem] tracking-[.06em] text-[#9a9a94]">
                    {color.code}
                  </span>
                  <span className="text-[.78rem] font-semibold uppercase leading-[1.4] tracking-[.025em] text-[#1a1a18]">
                    {color.name}
                  </span>
                  <span className="mt-[.2rem] text-[.7rem] text-[#6b6b66]">
                    {copiedHex === color.hex ? "Copied!" : color.hex}
                    <span aria-hidden="true">
                      {copiedHex === color.hex ? " ✓" : " ↗"}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="mt-[2.8rem] flex gap-[.8rem] rounded-[9px] border border-black/[0.09] bg-white px-5 py-[1.15rem] max-[600px]:flex-col max-[600px]:gap-[.4rem]">
          <strong className="shrink-0 text-[.76rem]">Colour note</strong>
          <p className="text-[.76rem] leading-[1.65] text-[#6b6b66]">
            The shades displayed are indicative only. Actual paint colours may
            differ depending on the product, surface, lighting, and application.
            Test a sample before making your final selection.
          </p>
        </aside>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-black/[0.09] px-8 py-6 max-[600px]:px-4 max-[600px]:py-5">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-[.8rem]">
          <p className="text-[.78rem] text-[#6b6b66]">
            Choose a colour. Bring your project to life.
          </p>
          <span className="rounded-[30px] bg-[#c3e1d6] px-[.5rem] py-[.35rem] text-[.67rem] font-semibold uppercase tracking-[.06em] text-[#1e4a3c]">
            FIRST DEPOT HARDWARES - Colour Guide
          </span>
        </div>
      </footer>
    </div>
  );
}
