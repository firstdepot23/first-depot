import mongoose from "mongoose";

let isConnected = false;

export const connectOrderDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in env file!");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
    throw error;
  }
};
