import { Cart } from "@repo/cart-db";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
/**
 * Cart documents only store { productId, selectedSize, selectedColor,
 * quantity } - never price/name/images. This fetches the current product
 * for each line from product-service and merges it with the stored
 * quantity/size/color, so the response shape matches what the client's
 * CartItemType already expects (full product + quantity + selections).
 *
 * A line whose product was deleted since it was added just comes back
 * null and gets filtered out, instead of corrupting the whole response.
 */
const hydrateCartItems = async (items) => {
    if (!PRODUCT_SERVICE_URL) {
        throw new Error("PRODUCT_SERVICE_URL is not set");
    }
    const hydrated = await Promise.all(items.map(async (item) => {
        try {
            const res = await fetch(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
            if (!res.ok)
                return null;
            const product = await res.json();
            return {
                ...product,
                quantity: item.quantity,
                selectedSize: item.selectedSize,
                selectedColor: item.selectedColor,
            };
        }
        catch (error) {
            console.error(`Failed to hydrate product ${item.productId}:`, error);
            return null;
        }
    }));
    return hydrated.filter((item) => item !== null);
};
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.userId });
        const items = cart ? await hydrateCartItems(cart.items) : [];
        return res.status(200).json({ items });
    }
    catch (error) {
        console.error("getCart failed:", error);
        return res.status(500).json({ message: "Failed to fetch cart" });
    }
};
// Replaces the whole cart for this user in one write. The client always
// sends its complete current cart (after the login merge, or after any
// add/remove/quantity change), so "replace" is simpler and safer here
// than trying to diff individual lines against a request body.
export const saveCart = async (req, res) => {
    try {
        const body = req.body;
        if (!Array.isArray(body.items)) {
            return res.status(400).json({ message: "items must be an array" });
        }
        const normalized = body.items
            .filter((i) => i &&
            typeof i.id === "number" &&
            typeof i.quantity === "number" &&
            i.quantity > 0 &&
            typeof i.selectedSize === "string" &&
            typeof i.selectedColor === "string")
            .map((i) => ({
            productId: i.id,
            selectedSize: i.selectedSize,
            selectedColor: i.selectedColor,
            quantity: i.quantity,
        }));
        const cart = await Cart.findOneAndUpdate({ userId: req.userId }, { items: normalized }, { upsert: true, new: true });
        return res.status(200).json({ items: await hydrateCartItems(cart.items) });
    }
    catch (error) {
        console.error("saveCart failed:", error);
        return res.status(500).json({ message: "Failed to save cart" });
    }
};
export const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate({ userId: req.userId }, { items: [] }, { upsert: true });
        return res.status(200).json({ items: [] });
    }
    catch (error) {
        console.error("clearCart failed:", error);
        return res.status(500).json({ message: "Failed to clear cart" });
    }
};
