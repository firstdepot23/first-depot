"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { photosForColor, type ProductType } from "@repo/types";
import { useProductSelection } from "./ProductSelection";

/**
 * Photos for the selected color: the cover first, then the extra photos the
 * admin added (see photosForColor). Switching color swaps in that color's set
 * and starts again from its cover. Tap the big photo to open the viewer.
 */

const Thumbs = ({
  photos,
  active,
  onSelect,
  name,
  className,
}: {
  photos: string[];
  active: number;
  onSelect: (index: number) => void;
  name: string;
  className: string;
}) => (
  <ul className={className}>
    {photos.map((src, i) => (
      <li key={`${src}-${i}`}>
        <button
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Show photo ${i + 1} of ${photos.length}`}
          aria-current={i === active}
          className={`relative block aspect-square w-full overflow-hidden rounded-xl bg-green-50 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
            i === active
              ? "ring-2 ring-green-600"
              : "ring-1 ring-gray-200 hover:ring-gray-400"
          }`}
        >
          <Image
            src={src}
            alt={`${name} thumbnail ${i + 1}`}
            fill
            sizes="96px"
            className="object-contain p-1.5"
          />
        </button>
      </li>
    ))}
  </ul>
);

const Lightbox = ({
  name,
  color,
  photos,
  active,
  onSelect,
  onClose,
}: {
  name: string;
  color: string;
  photos: string[];
  active: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onSelect(active - 1);
      if (e.key === "ArrowRight") onSelect(active + 1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [active, onClose, onSelect]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-full w-full max-w-5xl flex-col gap-5 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl md:flex-row md:gap-8 md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          autoFocus
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow ring-1 ring-gray-200 transition-colors hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-green-50 md:w-3/5">
          <Image
            src={photos[active]!}
            alt={`${name}, ${color}, photo ${active + 1} of ${photos.length}`}
            fill
            sizes="(min-width: 768px) 600px, 100vw"
            className="object-contain p-4"
          />
        </div>

        <div className="min-w-0 flex-1 md:pt-8">
          <h2 className="line-clamp-4 text-lg font-semibold leading-snug text-gray-900 [overflow-wrap:anywhere]">
            {name}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Color: <span className="text-gray-900">{color}</span>
          </p>
          <Thumbs
            photos={photos}
            active={active}
            onSelect={onSelect}
            name={name}
            className="mt-5 grid grid-cols-4 gap-2"
          />
        </div>
      </div>
    </div>
  );
};

const GalleryView = ({
  name,
  color,
  photos,
}: {
  name: string;
  color: string;
  photos: string[];
}) => {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const count = photos.length;

  // Wraps around at both ends (also handles -1 from the left arrow key).
  const go = useCallback(
    (i: number) => setActive(((i % count) + count) % count),
    [count],
  );
  const close = useCallback(() => setOpen(false), []);

  if (count === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-green-50 text-sm text-gray-500 ring-1 ring-green-900/5">
        No photo for this color yet
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge photo"
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-green-50 shadow-xl shadow-gray-900/10 ring-1 ring-green-900/5"
        >
          <Image
            src={photos[active]!}
            alt={`${name}, ${color}, photo ${active + 1} of ${count}`}
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none sm:p-10"
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow ring-1 ring-gray-200">
            <Maximize2 className="h-3.5 w-3.5" />
            Enlarge
          </span>
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow ring-1 ring-gray-200 transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow ring-1 ring-gray-200 transition-colors hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow ring-1 ring-gray-200">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Wraps onto new lines: never scrolls sideways on a phone */}
      {count > 1 && (
        <Thumbs
          photos={photos}
          active={active}
          onSelect={go}
          name={name}
          className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-5"
        />
      )}

      {open && (
        <Lightbox
          name={name}
          color={color}
          photos={photos}
          active={active}
          onSelect={go}
          onClose={close}
        />
      )}
    </div>
  );
};

const ProductGallery = ({ product }: { product: ProductType }) => {
  const { color } = useProductSelection();
  const photos = useMemo(
    () => photosForColor(product, color),
    [product, color],
  );

  // key={color}: picking another color starts fresh on that color's cover.
  return (
    <GalleryView
      key={color}
      name={product.name}
      color={color}
      photos={photos}
    />
  );
};

export default ProductGallery;
