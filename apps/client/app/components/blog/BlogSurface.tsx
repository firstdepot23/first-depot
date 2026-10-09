"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import "./blogTheme.css";

type Theme = "white" | "mint";
const STORAGE_KEY = "fd-blog-theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(
  null,
);

/**
 * Wraps a blog post. White is the default (and what the server renders);
 * a saved "mint" choice is applied right after hydration.
 */
export const BlogSurface = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  const [theme, setTheme] = useState<Theme>("white");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "mint") setTheme("mint");
    } catch {
      /* storage blocked: stay white */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "mint" ? "white" : "mint";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className={`fd-blog-surface ${className}`} data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

/** Put this in the top corner of the post page, inside <BlogSurface>. */
export const BlogThemeSwitch = ({ className = "" }: { className?: string }) => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;
  const mint = ctx.theme === "mint";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={mint}
      aria-label="Mint page colour"
      title={mint ? "Switch to white" : "Switch to mint green"}
      onClick={ctx.toggle}
      className={`fd-blog-switch ${className}`}
    >
      <span>Mint</span>
      <span className="fd-blog-switch__track" aria-hidden="true">
        <span className="fd-blog-switch__thumb" />
      </span>
    </button>
  );
};
