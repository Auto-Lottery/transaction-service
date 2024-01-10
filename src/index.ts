import express from "express";
import V1Routes from "./api/v1/routes/routes";
import { connectDb } from "./api/v1/config/mongodb";
import { PORT } from "./api/v1/config";
import { connectQueue } from "./api/v1/config/rabbitmq";
import { TransactionService } from "./api/v1/services/transaction.service";
import { infoLog } from "./api/v1/utilities/log";

const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

app.get("/", function (req, res: express.Response) {
  res.send("Bank transaction service!");
});

app.use("/v1", V1Routes);

app.listen(PORT, async () => {
  infoLog(`Started server on ${PORT} port`);
  await connectDb();
  await connectQueue();
  const transactionService = new TransactionService();
  transactionService.khanbankQueue();
  transactionService.transactionUpdateQueue();
  transactionService.retryTransactions();
});
