"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import useCartStore from "../stores/storeCart";

const ShoppingCartIcon = () => {
  // No loading gate needed anymore: the cart has no localStorage
  // hydration step to wait for (hasHydrated no longer exists on the
  // store - it was renamed isLoaded and now only means "the signed-in
  // user's server cart has been fetched"). The icon is always visible;
  // it just shows 0 until someone's signed in and their cart has loaded.
  const cart = useCartStore((state) => state.cart);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Link href="/cart" className="relative">
      <ShoppingCart className="w-4 h-4 text-gray-600" />
      <span className="absolute -top-3 -right-3 bg-amber-400 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium">
        {itemCount}
      </span>
    </Link>
  );
};

export default ShoppingCartIcon;
