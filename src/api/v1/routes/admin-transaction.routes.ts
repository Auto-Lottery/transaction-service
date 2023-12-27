import express from "express";
import { TransactionApiService } from "../services/transaction-api.service";
import { errorLog } from "../utilities/log";
import { AdminUser } from "../types/user";
const adminTransactionRoutes = express.Router();

adminTransactionRoutes.post("/getAllTransactions", async (req, res) => {
  const filter = req.body;
  if (req?.user) {
    try {
      const transactionApiService = new TransactionApiService();
      const queryResult =
        await transactionApiService.getAllTransactions(filter);

      return res.status(200).json({
        code: 200,
        data: queryResult
      });
    } catch (err) {
      errorLog("GET ALL TRANSACTION LIST::: ", err);
      return res.status(500).json(err);
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
});

adminTransactionRoutes.get("/getUserTransactions", async (req, res) => {
  const { phoneNumber, page, pageSize } = req.query;
  if (req?.user) {
    try {
      const transactionApiService = new TransactionApiService();
      const queryResult = await transactionApiService.getUserTransactions(
        phoneNumber as string,
        Number(page || 1),
        Number(pageSize || 20)
      );

      return res.status(200).json({
        code: 200,
        data: queryResult
      });
    } catch (err) {
      errorLog("GET ALL TRANSACTION LIST::: ", err);
      return res.status(500).json(err);
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
});

adminTransactionRoutes.post("/updateTransaction", (req, res) => {
  if (req?.user) {
    try {
      const transactionApiService = new TransactionApiService();
      const result = transactionApiService.manualUpdateTransaction(
        req.user as AdminUser,
        req.body
      );
      res.send(result);
    } catch (err) {
      errorLog("MANUAL UPDATE TRANSACTION LIST::: ", err);
      return res.status(500).json(err);
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
});
export default adminTransactionRoutes;
