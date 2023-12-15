import TransactionModel from "../models/transaction.model";
import { Bank } from "../types/enums";
import { Transaction } from "../types/transaction";
import { phoneNumberRecognition } from "../utilities";
import { AuthApiService } from "./auth-api.service";
import RabbitMQManager from "./rabbitmq-manager";

export class TransactionService {
  private rabbitMqManager: RabbitMQManager;

  constructor() {
    this.rabbitMqManager = RabbitMQManager.getInstance();
  }

  async khanbankQueue() {
    const queueChannel =
      await this.rabbitMqManager.createChannel("bank_transaction");

    const generatorQueueChannel =
      await this.rabbitMqManager.createChannel("generator");

    queueChannel.assertExchange("bank_transaction", "direct", {
      durable: true
    });

    const queueName = "khanbank";
    const routingKey = "deposit";

    queueChannel.assertQueue(queueName, {
      durable: true
    });

    queueChannel.bindQueue(queueName, "bank_transaction", routingKey);

    queueChannel.prefetch(1);

    queueChannel.consume(
      queueName,
      async (msg) => {
        if (msg?.content) {
          const tran: Transaction = JSON.parse(msg.content.toString());

          console.log(tran);
          //Transaction dotroos orlogo zarlaga esehiig ylgah dutuu

          // Гүйлгээ бүртгэлтэй эсэхийг шалгана
          const oldTran = await TransactionModel.findOne({
            bankTransactionId: tran.record
          });

          // Гүйлгээний мэдээлэл давхардсан
          if (oldTran) {
            console.log(
              "DUPLICATE TRANSACTION::: ",
              tran.record,
              tran.tranDate
            );
            queueChannel.ack(msg);
            return;
          }

          try {
            const tranData = {
              bankTransactionId: tran.record,
              amount: tran.amount,
              bank: Bank.KHANBANK,
              fromAccountNumber: tran.relatedAccount,
              transactionDate: tran.tranDate,
              tranDescription: tran.description,
              tranType: "DEPOSIT",
              description: "Сугалаа үүсгэж байна",
              status: "PENDING"
            };

            // Утасны дугаарын гүйлгээний утгаас ялгаж авах
            const phoneNumber = phoneNumberRecognition(tran.description);
            if (!phoneNumber) {
              tranData.status = "FAILED";
              tranData.description = "Утасны дугаарын формат буруу";

              const transaction = new TransactionModel(tranData);
              await transaction.save();
              queueChannel.ack(msg);
              return;
            }

            // Утасны дугаараар бүртгэл үүсгэх
            const authApiService = new AuthApiService();
            const res = await authApiService.register(phoneNumber);

            if (res.code === 500) {
              tranData.status = "FAILED";
              tranData.description = res.message;
              const transaction = new TransactionModel(tranData);
              await transaction.save();
              queueChannel.ack(msg);
              return;
            }

            const transaction = new TransactionModel(tranData);
            const newTransaction = (await transaction.save()).toJSON();

            // Generator queue-рүү шиднэ
            generatorQueueChannel.sendToQueue(
              "barimt",
              Buffer.from(
                JSON.stringify({
                  user: res.data,
                  transaction: {
                    id: newTransaction._id,
                    amount: newTransaction.amount
                  }
                })
              ),
              {
                persistent: true
              }
            );
            queueChannel.ack(msg);
          } catch (err) {
            console.log(`SAVE DEPOSIT TRANSACTION ERR::: `, err);
          }
        }
      },
      {
        noAck: false
      }
    );
  }

  async transactionUpdateQueue() {
    const queueChannel =
      await this.rabbitMqManager.createChannel("bank_transaction");

    queueChannel.assertExchange("bank_transaction", "direct", {
      durable: true
    });

    const queueName = "transaction";
    const routingKey = "complete";

    queueChannel.assertQueue(queueName, {
      durable: true
    });

    queueChannel.bindQueue(queueName, "bank_transaction", routingKey);

    queueChannel.prefetch(1);

    queueChannel.consume(
      queueName,
      async (msg) => {
        if (msg?.content) {
          const transaction = JSON.parse(msg.content?.toString());
          TransactionModel.updateOne(
            {
              _id: transaction.id
            },
            {
              status: transaction.status,
              description: transaction.description
            }
          );
        }
      },
      {
        noAck: false
      }
    );
  }
}
