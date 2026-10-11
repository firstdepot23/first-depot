"use client";

import { useState } from "react";
import palette from "../data/color-palette";
import "./colors.css";

const barColors = [
  "#c8102e",
  "#e88018",
  "#d4a017",
  "#3a7d44",
  "#1a5a8a",
  "#6a3d8f",
];

export default function ColorsPage() {
  const [activeCategory, setActiveCategory] = useState(palette[0].id);
  const [copiedHex, setCopiedHex] = useState("");

  const activeGroup =
    palette.find((group) => group.id === activeCategory) ?? palette[0];

  async function copyHex(hex) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(""), 1400);
    } catch {
      setCopiedHex("");
    }
  }

  return (
    <div className="fd-colors">
      <header className="fd-colors-header">
        <div className="fd-colors-header-inner">
          <a className="fd-colors-logo" href="/" aria-label="FIRST-DEPOT home">
            FIRST-DEPOT<span>.</span>
          </a>
          <p className="fd-colors-tagline">
            Interior &amp; Exterior Colour Collection
          </p>
        </div>
      </header>

      <section className="fd-colors-hero">
        <div className="fd-colors-hero-inner">
          <p className="fd-colors-eyebrow">Find your perfect shade</p>
          <h1>
            The Complete
            <br />
            Colour Range
          </h1>
          <p className="fd-colors-intro">
            Explore colours for your next building or renovation project. Shades
            shown are indicative and may vary in actual application.
          </p>
          <div className="fd-colors-accent-bar" aria-hidden="true">
            {barColors.map((color) => (
              <span key={color} style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </section>

      <nav className="fd-colors-tabs" aria-label="Colour categories">
        <div className="fd-colors-tabs-inner" role="tablist">
          {palette.map((group) => (
            <button
              key={group.id}
              id={`tab-${group.id}`}
              className={`fd-colors-tab ${activeCategory === group.id ? "is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeCategory === group.id}
              aria-controls={`panel-${group.id}`}
              onClick={() => setActiveCategory(group.id)}
            >
              <span
                className="fd-colors-tab-dot"
                style={{ backgroundColor: group.dot }}
              />
              {group.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="fd-colors-main">
        <section
          className="fd-colors-section"
          id={`panel-${activeGroup.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeGroup.id}`}
        >
          <div className="fd-colors-section-header">
            <div>
              <p className="fd-colors-kicker">Explore the palette</p>
              <h2>{activeGroup.label}</h2>
            </div>
            <span className="fd-colors-count">
              {activeGroup.colors.length} colours
            </span>
          </div>

          <div className="fd-colors-grid">
            {activeGroup.colors.map((color) => (
              <button
                className="fd-colors-card"
                key={`${color.code}-${color.name}`}
                type="button"
                onClick={() => copyHex(color.hex)}
                title={`Copy ${color.hex}`}
                aria-label={`Copy HEX ${color.hex} for ${color.name}`}
              >
                <span
                  className="fd-colors-swatch"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="fd-colors-info">
                  <span className="fd-colors-code">{color.code}</span>
                  <span className="fd-colors-name">{color.name}</span>
                  <span className="fd-colors-hex">
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

        <aside className="fd-colors-disclaimer">
          <strong>Colour note</strong>
          <p>
            The shades displayed are indicative only. Actual paint colours may
            differ depending on the product, surface, lighting, and application.
            Test a sample before making your final selection.
          </p>
        </aside>
      </main>

      <footer className="fd-colors-footer">
        <div className="fd-colors-footer-inner">
          <p>Choose a colour. Bring your project to life.</p>
          <span className="fd-colors-pill">FIRST-DEPOT Colour Guide</span>
        </div>
      </footer>
    </div>
  );
}
