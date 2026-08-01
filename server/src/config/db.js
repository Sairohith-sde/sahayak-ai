import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI is not defined in .env. Operating in Memory Mode.");
    isConnected = false;
    return false;
  }

  try {
    // Set a short timeout (3 seconds) so that the app starts up immediately in memory mode if MongoDB is down
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log("✅ MongoDB Connected Successfully.");
    isConnected = true;
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection failed: ${error.message}. Continuing in Memory Mode.`);
    isConnected = false;
    return false;
  }
}

export function isMongoMode() {
  return isConnected && mongoose.connection.readyState === 1;
}
