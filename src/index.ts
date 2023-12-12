import express from "express";
import * as cron from "node-cron";
import V1Routes from "./api/v1/routes/routes";
import { connectDb } from "./api/v1/config/mongodb";
import { PORT } from "./api/v1/config";
import { generateFakeTransaction } from "./api/v1/utilities";
import { connectQueue } from "./api/v1/config/rabbitmq";
import RabbitMQManager from "./api/v1/services/rabbitmq-manager";
import { TransactionService } from "./api/v1/services/transaction.service";

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
  console.log(`Started server on ${PORT} port`);
  await connectDb();
  await connectQueue();
  const transactionService = new TransactionService();
  transactionService.khanbankQueue();
});

cron.schedule("*/10 * * * * *", async () => {
  const rabbitMQManager = RabbitMQManager.getInstance();
  const rabbitMqChannel =
    await rabbitMQManager.createChannel("bank_transaction");
  if (rabbitMqChannel) {
    // Банкны хамгийн сүүлийн гүйлгээг шалгаад түүнээс хойшихийг шиднэ.
    const transaction = generateFakeTransaction();
    rabbitMqChannel.sendToQueue(
      "khanbank",
      Buffer.from(JSON.stringify(transaction)),
      {
        persistent: true
      }
    );
  }
});
