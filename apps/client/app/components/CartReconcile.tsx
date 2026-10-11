"use client";

import { useEffect } from "react";
import useCartStore from "../stores/storeCart";

// Dropped into the Orders page: arriving there right after paying is the
// moment to make sure the paid items are out of the cart.
const CartReconcile = () => {
  const requestReconcile = useCartStore((state) => state.requestReconcile);

  useEffect(() => {
    requestReconcile();
  }, [requestReconcile]);

  return null;
};

export default CartReconcile;
