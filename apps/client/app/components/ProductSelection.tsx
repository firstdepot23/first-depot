"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Holds the chosen size + color for the product page so the gallery and the
 * options panel stay in sync instantly. Previously every click pushed a new URL
 * and re-fetched the whole product from the server; now the choice is local
 * state and the URL is only updated quietly (so a copied link still opens on
 * the same size/color).
 */

type Selection = {
  size: string;
  color: string;
  setSize: (size: string) => void;
  setColor: (color: string) => void;
};

const SelectionContext = createContext<Selection | null>(null);

export const useProductSelection = () => {
  const value = useContext(SelectionContext);
  if (!value) {
    throw new Error(
      "useProductSelection must be used inside <ProductSelectionProvider>",
    );
  }
  return value;
};

const syncUrl = (key: "size" | "color", value: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
};

export const ProductSelectionProvider = ({
  initialSize,
  initialColor,
  children,
}: {
  initialSize: string;
  initialColor: string;
  children: ReactNode;
}) => {
  const [size, setSizeState] = useState(initialSize);
  const [color, setColorState] = useState(initialColor);

  const setSize = useCallback((value: string) => {
    setSizeState(value);
    syncUrl("size", value);
  }, []);

  const setColor = useCallback((value: string) => {
    setColorState(value);
    syncUrl("color", value);
  }, []);

  const value = useMemo(
    () => ({ size, color, setSize, setColor }),
    [size, color, setSize, setColor],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};
