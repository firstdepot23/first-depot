"use client";

import type { ProductType } from "@repo/types";
import { unitPrice } from "../lib/productChoices";
import { useProductSelection } from "./ProductSelection";

/**
 * The big price on the product page. It follows what the shopper picked: the
 * price of the selected pack, plus the extra price of any chosen accompaniment.
 */
const ProductPrice = ({ product }: { product: ProductType }) => {
  const { size, choices } = useProductSelection();
  const price = unitPrice(product, size, choices);

  return (
    <p className="mt-4 text-gray-900">
      <span className="mr-1.5 text-sm font-medium text-gray-500">UGX</span>
      <span className="text-3xl font-semibold tracking-tight">
        {price.toLocaleString()}
      </span>
    </p>
  );
};

export default ProductPrice;
