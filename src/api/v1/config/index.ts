import { config } from "dotenv";
config();

const VAULT_URL = process.env.VAULT_URL || "";
const VAULT_TOKEN = process.env.VAULT_TOKEN || "";
const PORT = Number(process.env.PORT || "5001");
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "";

export { VAULT_URL, VAULT_TOKEN, PORT, AUTH_SERVICE_URL };
