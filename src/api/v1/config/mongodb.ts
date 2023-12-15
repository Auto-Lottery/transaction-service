import mongoose from "mongoose";
import VaultManager from "../services/vault-manager";
import { errorLog, infoLog } from "../utilities/log";

export const connectDb = async () => {
  try {
    const vaultManager = VaultManager.getInstance();
    const config = await vaultManager.read("kv/data/mongodb");
    await mongoose.connect(config.MONGO_URL, {
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true
      }
    });
  } catch (err) {
    errorLog(err);
    throw new Error("Өгөгдлийн сантай холбогдоход алдаа гарлаа");
  }
};

mongoose.connection.on("connected", async () => {
  infoLog("MongoDB connected.");
});
