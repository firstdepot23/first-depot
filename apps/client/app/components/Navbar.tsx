import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import ShoppingCartIcon from "./ShoppingCartIcon";
import { Show, SignInButton } from "@clerk/nextjs";
import ProfileButton from "./ProfileButton";
import { Suspense } from "react";

const Navbar = () => {
  return (
    // `relative` + fixed height: the expanded search layer fills this exactly.
    <nav className="relative flex h-14 w-full items-center gap-2 border-b border-gray-200">
      {/* LEFT - logo */}
      <Link href="/" className="flex shrink-0 items-center" aria-label="Home">
        <Image
          src="/logo.png"
          alt="FIRST-DEPOT"
          width={46}
          height={46}
          className="h-8 w-8 md:h-10 md:w-10"
        />
      </Link>

      {/* BRAND NAME
          - phones: sits right next to the logo (a centered name would collide
            with the icons on a narrow screen)
          - sm and up: pinned to the exact center of the navbar */}
      <Link
        href="/"
        className="min-w-0 truncate whitespace-nowrap text-sm font-bold uppercase tracking-[0.18em] text-gray-900 sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:text-base md:text-lg"
      >
        First <span className="font-light">Depot</span>
      </Link>

      {/* RIGHT - every item sits in an equal 40px tap area, evenly spaced */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <Suspense fallback={<div className="h-10 w-10" aria-hidden="true" />}>
          <SearchBar />
        </Suspense>

        <div className="flex h-10 w-10 items-center justify-center">
          <ShoppingCartIcon />
        </div>

        <Show when="signed-out">
          <SignInButton>
            <button
              type="button"
              className="whitespace-nowrap rounded-full bg-black px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:px-5"
            >
              Sign in
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <div className="flex h-10 w-10 items-center justify-center">
            <ProfileButton />
          </div>
        </Show>
      </div>
    </nav>
  );
};

export default Navbar;
