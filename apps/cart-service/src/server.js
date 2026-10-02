import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { connectCartDb } from "@repo/cart-db";
import cartRouter from "./routes/cart.route";
const app = express();
app.use(cors());
app.use(express.json());
// Populates req.auth for every request so requireAuth can read it.
app.use(clerkMiddleware());
app.use("/cart", cartRouter);
const PORT = process.env.PORT || 8004;
connectCartDb()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`cart-service listening on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("Failed to connect to cart-db:", error);
    process.exit(1);
});
