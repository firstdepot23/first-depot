"use client";

import { Minus, Plus } from "lucide-react";

const QuantityStepper = ({
  quantity,
  onIncrease,
  onDecrease,
  disableDecrease = false,
  size = "md",
}: {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disableDecrease?: boolean;
  size?: "sm" | "md";
}) => {
  const box = size === "sm" ? "w-7 h-7" : "w-8 h-8";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDecrease}
        disabled={disableDecrease}
        className={`${box} rounded-md flex items-center justify-center transition-all duration-200 ${
          disableDecrease
            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
            : "bg-gray-800 text-white hover:bg-gray-900 cursor-pointer"
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span
        className="min-w-5 text-center text-sm font-medium"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onIncrease}
        className={`${box} rounded-md bg-gray-800 text-white hover:bg-gray-900 flex items-center justify-center transition-all duration-200 cursor-pointer`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default QuantityStepper;
