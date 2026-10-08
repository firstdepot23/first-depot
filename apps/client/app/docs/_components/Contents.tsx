"use client";

import { useEffect, useRef, useState } from "react";

export type ContentsItem = { id: string; label: string };

// Fixed "Contents" list on wide screens, a collapsible one on narrow screens.
// The entry for the section you are reading turns dark as you scroll.
export function Contents({ items }: { items: ContentsItem[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState("");

  useEffect(() => {
    // The reader scrolls inside .fd-docs, not the window.
    const scroller = navRef.current?.closest<HTMLElement>(".fd-docs");
    if (!scroller) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom =
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;
      let current = "";
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) current = id;
        else break;
      }
      if (atBottom && scroller.scrollTop > 0) {
        current = items[items.length - 1]?.id ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  // On short screens a long list scrolls, so keep the active entry in view.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const link = nav.querySelector<HTMLElement>("a.is-active");
    if (!link) {
      nav.scrollTop = 0; // back at the top of the page: show the title again
      return;
    }
    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    if (top < nav.scrollTop || bottom > nav.scrollTop + nav.clientHeight) {
      nav.scrollTop = Math.max(0, top - nav.clientHeight / 2);
    }
  }, [active]);

  const go = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  const links = items.map(({ id, label }) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={(e) => go(e, id)}
      aria-current={active === id ? "location" : undefined}
      className={active === id ? "is-active" : undefined}
    >
      {label}
    </a>
  ));

  return (
    <>
      <nav ref={navRef} className="fd-docs-toc" aria-label="Contents">
        <p className="fd-docs-toc-title">Contents</p>
        {links}
      </nav>
      <details className="fd-docs-toc-inline">
        <summary>Contents</summary>
        <nav aria-label="Contents (mobile)">{links}</nav>
      </details>
    </>
  );
}
