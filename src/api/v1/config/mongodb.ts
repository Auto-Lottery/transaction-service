import mongoose from "mongoose";
import VaultManager from "../services/vault-manager";

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
    console.log(err);
    throw new Error("Өгөгдлийн сантай холбогдоход алдаа гарлаа");
  }
};

mongoose.connection.on("connected", async () => {
  console.log("MongoDB connected.");
});
