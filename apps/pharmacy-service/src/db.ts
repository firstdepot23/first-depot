import mongoose from "mongoose";
// Importing the models here registers them, so their indexes can be built
// below before the service starts taking requests.
import { Prescription, PrescriptionImage } from "./models/prescription";

let connected = false;

export const connectDb = async () => {
  if (connected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(uri, {
    // Its own database, so prescriptions (health data) never sit next to the
    // orders or carts. The same MongoDB cluster is fine.
    dbName: process.env.MONGODB_DB_NAME || "pharmacy",
    // Fail in 15 seconds with a clear error instead of hanging for 30.
    serverSelectionTimeoutMS: 15_000,
  });

  // Wait for the indexes to exist. The unique index on `reference` is what
  // makes a clash detectable (createPrescription retries when it sees one),
  // so it must be in place before the first prescription is saved.
  await Promise.all([Prescription.init(), PrescriptionImage.init()]);

  connected = true;
  console.log("pharmacy-db connected");
};