import {
  CartItemsType,
  CartStoreActionsType,
  CartStoreStateType,
} from "@repo/types";
import { create } from "zustand";

type CartItem = CartItemsType[number];

const isSameVariant = (
  a: Pick<CartItem, "id" | "selectedSize" | "selectedColor">,
  b: Pick<CartItem, "id" | "selectedSize" | "selectedColor">,
) =>
  a.id === b.id &&
  a.selectedSize === b.selectedSize &&
  a.selectedColor === b.selectedColor;

// No persist middleware here - the cart lives only in MongoDB once
// someone is signed in, and signing in is required to add anything to
// it (see ProductCard / ProductInteraction). Nothing is ever written to
// localStorage, so there's no stale local snapshot left behind to
// accidentally re-merge or double-count on a later reload - which was
// the whole bug class the previous localStorage + merge-on-login
// version ran into.
const useCartStore = create<CartStoreStateType & CartStoreActionsType>()(
  (set) => ({
    cart: [],
    isLoaded: false,
    loadError: null,
    reloadKey: 0,
    addToCart: (product) =>
      set((state) => {
        const existingIndex = state.cart.findIndex((p) =>
          isSameVariant(p, product),
        );

        if (existingIndex !== -1) {
          return {
            cart: state.cart.map((p, i) =>
              i === existingIndex
                ? { ...p, quantity: p.quantity + (product.quantity || 1) }
                : p,
            ),
          };
        }

        return {
          cart: [
            ...state.cart,
            {
              ...product,
              quantity: product.quantity || 1,
              selectedSize: product.selectedSize,
              selectedColor: product.selectedColor,
            },
          ],
        };
      }),
    // Sets the exact quantity of one cart line. A quantity of 0 or less
    // removes the line from the cart.
    updateQuantity: (product, quantity) =>
      set((state) => ({
        cart:
          quantity <= 0
            ? state.cart.filter((p) => !isSameVariant(p, product))
            : state.cart.map((p) =>
                isSameVariant(p, product) ? { ...p, quantity } : p,
              ),
      })),
    removeFromCart: (product) =>
      set((state) => ({
        cart: state.cart.filter((p) => !isSameVariant(p, product)),
      })),
    // Used by CartSync to load the cart from the server on sign-in.
    // Fetching the same server cart twice and replacing with it twice
    // is naturally a no-op, which is why this needs no merge math.
    replaceCart: (items) =>
      set({ cart: items, isLoaded: true, loadError: null }),
    clearCart: () => set({ cart: [], isLoaded: true, loadError: null }),
    setLoadError: (message) => set({ loadError: message }),
    requestReload: () =>
      set((state) => ({ loadError: null, reloadKey: state.reloadKey + 1 })),
  }),
);

/**
 * True once the signed-in user's cart has been loaded from the server
 * (or cleared on sign-out). Use this to avoid showing "empty cart" for
 * an instant while the first server fetch is still in flight.
 */
export const useCartLoaded = () => useCartStore((state) => state.isLoaded);

/** How many of this exact product + size + color are already in the cart. */
export const useCartItemQuantity = (
  id: CartItem["id"],
  selectedSize: string,
  selectedColor: string,
) =>
  useCartStore(
    (state) =>
      state.cart.find((p) =>
        isSameVariant(p, { id, selectedSize, selectedColor }),
      )?.quantity ?? 0,
  );

export default useCartStore;