"use client";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cross,
  FileUp,
  HeartPulse,
  type LucideIcon,
  Package,
  Pill,
  Stethoscope,
  Thermometer,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// The slides.
//
// Each slide is drawn here (a gradient with icons), so the window works with
// no image files at all. To use a real photo instead, add `photo` to a slide:
//   photo: { src: "/pharmacy/shelf.jpg", alt: "Shelves of health products" }
// A file in /public/pharmacy works as is; so do photos from the hosts already
// allowed in next.config.ts (images.pexels.com, res.cloudinary.com).
// A slide with a photo shows the photo; the title and text stay on top of it.
// ---------------------------------------------------------------------------
type Slide = {
  title: string;
  text: string;
  Icon: LucideIcon;
  chips: [LucideIcon, LucideIcon];
  // Full class names (not built from pieces) so Tailwind can see them.
  gradient: string;
  photo?: { src: string; alt: string };
};

const SLIDES: Slide[] = [
  {
    title: "Prescriptions, made simple",
    text: "Upload a photo of your prescription and our pharmacist will prepare your order.",
    Icon: FileUp,
    chips: [ClipboardList, Pill],
    gradient: "from-green-500 via-green-600 to-emerald-800",
  },
  {
    title: "Everyday health and wellness",
    text: "Vitamins, first aid, personal care and the everyday products your family needs.",
    Icon: Pill,
    chips: [Thermometer, Cross],
    gradient: "from-emerald-400 via-teal-600 to-teal-800",
  },
  {
    title: "Care you can count on",
    text: "Advice and orders handled by a pharmacist, not just picked off a shelf.",
    Icon: Stethoscope,
    chips: [HeartPulse, Cross],
    gradient: "from-lime-500 via-green-600 to-green-800",
  },
  {
    title: "Pickup or delivery",
    text: "Collect from our station, or have your order delivered, like the rest of the shop.",
    Icon: Package,
    chips: [Truck, Pill],
    gradient: "from-teal-500 via-emerald-600 to-green-800",
  },
];

const AUTOPLAY_MS = 4500;

// Reads the visitor's "reduce motion" setting. Those visitors get no
// auto-advancing slides (they can still use the arrows and dots).
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeToMotion = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

const SlideArt = ({ slide, priority }: { slide: Slide; priority: boolean }) => {
  const { Icon, chips } = slide;
  const [ChipA, ChipB] = chips;

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${slide.gradient}`}
    >
      {slide.photo ? (
        <Image
          src={slide.photo.src}
          alt={slide.photo.alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority={priority}
          className="object-cover"
        />
      ) : (
        <>
          {/* soft shapes */}
          <span className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <span className="absolute -bottom-24 -right-12 h-80 w-80 rounded-full bg-white/10" />
          <span className="absolute right-10 top-10 h-24 w-24 rounded-full border-2 border-white/20" />
          <span className="absolute bottom-24 left-8 h-10 w-10 rounded-full bg-white/15" />

          {/* the main icon on a card */}
          <div className="absolute inset-x-0 top-[18%] flex justify-center">
            <div className="grid h-28 w-28 place-items-center rounded-3xl bg-white shadow-2xl shadow-black/20 sm:h-36 sm:w-36">
              <Icon
                aria-hidden="true"
                className="h-14 w-14 text-green-600 sm:h-[4.5rem] sm:w-[4.5rem]"
                strokeWidth={1.6}
              />
            </div>
          </div>

          {/* two small floating icons */}
          <div className="absolute left-[14%] top-[14%] grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <ChipA aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <div className="absolute right-[14%] top-[44%] grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <ChipB aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
        </>
      )}

      {/* the caption, on a dark fade so it is readable on any slide or photo */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent px-5 pb-12 pt-16 text-white">
        <p className="text-lg font-semibold leading-snug sm:text-xl">
          {slide.title}
        </p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/90">
          {slide.text}
        </p>
      </div>
    </div>
  );
};

const Carousel = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    prefersReducedMotion,
    () => false,
  );

  const playing = !paused && !reducedMotion;
  const count = SLIDES.length;

  // Moves on every few seconds. Changing the slide by hand restarts the
  // countdown (because `index` is a dependency).
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [playing, index, count]);

  const go = (to: number) => setIndex((to + count) % count);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="What is coming to the pharmacy"
      className="relative aspect-[4/3] w-full overflow-hidden bg-green-700 lg:aspect-auto lg:min-h-[26rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(index - 1);
        if (event.key === "ArrowRight") go(index + 1);
      }}
    >
      {/* While it moves by itself, don't read every change out loud. */}
      <div aria-live={playing ? "off" : "polite"} className="absolute inset-0">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <SlideArt slide={slide} priority={i === 0} />
          </div>
        ))}
      </div>

      {/* arrows */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40 focus-visible:outline-2 focus-visible:outline-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40 focus-visible:outline-2 focus-visible:outline-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* dots */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}: ${slide.title}`}
            aria-current={i === index}
            className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// The window itself. It is rendered by app/pharmacy/layout.tsx on top of the
// pharmacy pages while PHARMACY_COMING_SOON is true.
const PharmacyComingSoon = () => (
  <div className="relative z-10 flex min-h-[30rem] items-center justify-center bg-white/60 p-4 sm:p-8 lg:p-12">
    <section
      aria-labelledby="pharmacy-coming-soon-title"
      className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-gray-900/10 ring-1 ring-gray-900/10 lg:grid-cols-2"
    >
      <Carousel />

      <div className="flex flex-col justify-center p-6 sm:p-10">
        <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
          Pharmacy
        </p>
        <h1
          id="pharmacy-coming-soon-title"
          className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl"
        >
          Coming soon
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600">
          We&rsquo;re getting our pharmacy ready. Soon you&rsquo;ll be able to
          shop everyday health and wellness products, or upload your
          prescription and let our pharmacist prepare your order.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          The rest of the shop is open as usual.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full bg-green-600 px-6 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Back to the shop
          </Link>
          <Link
            href="/docs/contacts"
            className="inline-flex h-11 items-center rounded-full border border-gray-300 bg-white px-6 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default PharmacyComingSoon;
