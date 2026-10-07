import mongoose from "mongoose";

let connecting: Promise<unknown> | null = null;

// Safe to call before every query: it reuses the live connection, and
// concurrent callers share one in-flight connect (Next.js can fire several
// server components at once, and hot reloads reset module state).
export const connectBlogDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in env file!");
  }

  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGODB_URI).catch((error) => {
      connecting = null; // allow a retry on the next call
      console.error(error);
      throw error;
    });
  }
  await connecting;
};