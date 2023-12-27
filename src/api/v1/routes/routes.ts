import express from "express";
import transactionRoutes from "./admin-transaction.routes";
import { AuthApiService } from "../services/auth-api.service";
const V1Routes = express.Router();

V1Routes.get("/", (req, res) => {
  res.send({
    data: "v1"
  });
});

V1Routes.use(
  "/adminTransaction",
  AuthApiService.adminVerifyToken,
  transactionRoutes
);

export default V1Routes;
