import ErroredTransactionModel from "../models/errored-transaction.model";
import TransactionModel from "../models/transaction.model";
import { Bank } from "../types/enums";
import { Transaction } from "../types/transaction";
import { phoneNumberRecognition } from "../utilities";
import { errorLog, infoLog } from "../utilities/log";
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
          const dataJsonString = msg.content.toString();
          if (!dataJsonString) {
            errorLog("Queue empty message");
            queueChannel.ack(msg);
            return;
          }

          try {
            const tran: Transaction = JSON.parse(dataJsonString);
            //Transaction dotroos orlogo zarlaga esehiig ylgah dutuu

            // Гүйлгээ бүртгэлтэй эсэхийг шалгана
            const oldTran = await TransactionModel.findOne({
              bankTransactionId: tran.record
            });

            // Гүйлгээний мэдээлэл давхардсан
            if (oldTran) {
              infoLog("Duplicate transaction: ", tran.record, tran.tranDate);
              queueChannel.ack(msg);
              return;
            }

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

            if (tran.amount < 10000) {
              tranData.description = "Мөнгөн дүн хүрэлцэхгүй байна.";
              tranData.status = "FAILED";

              const transaction = new TransactionModel(tranData);
              await transaction.save();
              queueChannel.ack(msg);
              return;
            }

            // Утасны дугаарыг гүйлгээний утгаас ялгаж авах
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
            return;
          } catch (err) {
            ErroredTransactionModel.create({
              transactionData: dataJsonString
            });
            errorLog(`SAVE DEPOSIT TRANSACTION ERR::: `, err);
            queueChannel.ack(msg);
            return;
          }
        }
      },
      {
        noAck: false
      }
    );
  }

  async transactionUpdateQueue() {
    const exchangeName = "bank_transaction";
    const queueName = "transaction";
    const routingKey = "complete";

    const queueChannel = await this.rabbitMqManager.createChannel(exchangeName);

    queueChannel.assertExchange(exchangeName, "direct", {
      durable: true
    });

    queueChannel.assertQueue(queueName, {
      durable: true
    });

    queueChannel.bindQueue(queueName, exchangeName, routingKey);

    queueChannel.prefetch(1);

    queueChannel.consume(
      queueName,
      async (msg) => {
        if (msg?.content) {
          const dataJsonString = msg.content.toString();
          if (!dataJsonString) {
            errorLog("Queue empty message");
            queueChannel.ack(msg);
            return;
          }
          try {
            const transaction = JSON.parse(dataJsonString);
            const tran = await TransactionModel.updateOne(
              {
                _id: transaction.transactionId
              },
              {
                $set: {
                  status: transaction.status,
                  description: transaction.description,
                  phoneNumber: transaction?.phoneNumber
                }
              }
            );
            if (tran.matchedCount === 0) {
              ErroredTransactionModel.create({
                transactionData: JSON.stringify(transaction),
                description: "Transaction not found!!!"
              });
              queueChannel.ack(msg);
            }
            if (tran.matchedCount === 1 && tran.modifiedCount === 1) {
              queueChannel.ack(msg);
            }
          } catch (err) {
            errorLog("Transaction update queue error::: ", err);
          }
        }
      },
      {
        noAck: false
      }
    );
  }

  async retryTransactionsSendToQueue(transactoinId: string) {
    try {
      const rabbitMQManager = RabbitMQManager.getInstance();
      const rabbitMqChannel =
        await rabbitMQManager.createChannel("bank_transaction");
      const queueName = "retry";
      if (rabbitMqChannel) {
        rabbitMqChannel.sendToQueue(queueName, Buffer.from(transactoinId), {
          persistent: true
        });
      }
    } catch (err) {
      errorLog(err);
    }
  }

  async updateTransaction(updateData: Record<string, string>) {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const { _id, version, ...other } = updateData;
    const tran = await TransactionModel.updateOne(
      {
        _id: _id
      },
      {
        $set: {
          ...other
        }
      }
    );
    if (tran.matchedCount === 0) {
      return {
        code: 500,
        message: "Гүйлгээний мэдээлэл олдсонгүй."
      };
    }
    return {
      code: 200,
      data: true
    };
  }

  async retryTransactions() {
    const exchangeName = "bank_transaction";
    const queueName = "retry";
    const routingKey = "sending";
    const rabbitMqManager = RabbitMQManager.getInstance();
    const queueChannel = await rabbitMqManager.createChannel(exchangeName);
    const generatorQueueChannel =
      await this.rabbitMqManager.createChannel("generator");
    queueChannel.assertExchange(exchangeName, "direct", {
      durable: true
    });

    queueChannel.assertQueue(queueName, {
      durable: true
    });

    queueChannel.bindQueue(queueName, exchangeName, routingKey);

    queueChannel.prefetch(1);

    queueChannel.consume(
      queueName,
      async (msg) => {
        if (msg?.content) {
          const dataJsonString = msg.content.toString();
          if (!dataJsonString) {
            errorLog("Queue empty message");
            queueChannel.ack(msg);
            return;
          }
          try {
            const transactionId = dataJsonString;
            const transaction = await TransactionModel.findById(transactionId);
            if (!transaction) {
              infoLog(`Transaction retry id - ${transactionId}: Not found`);
              queueChannel.ack(msg);
              return;
            }

            transaction.isRetry = false;
            transaction.description = "Сугалаа үүсгэж байна";
            transaction.status = "PENDING";
            if (transaction.amount < 10000) {
              transaction.description = "Мөнгөн дүн хүрэлцэхгүй байна.";
              transaction.status = "FAILED";
              await this.updateTransaction(transaction.toJSON());
              queueChannel.ack(msg);
              return;
            }

            // Утасны дугаарыг гүйлгээний утгаас ялгаж авах
            const phoneNumber = phoneNumberRecognition(
              transaction.tranDescription || ""
            );

            if (!phoneNumber) {
              transaction.status = "FAILED";
              transaction.description = "Утасны дугаарын формат буруу";
              await this.updateTransaction(transaction.toJSON());
              queueChannel.ack(msg);
              return;
            }

            // Утасны дугаараар бүртгэл үүсгэх
            const authApiService = new AuthApiService();
            const res = await authApiService.register(phoneNumber);

            if (res.code === 500) {
              transaction.status = "FAILED";
              transaction.description = res.message;
              await this.updateTransaction(transaction.toJSON());
              queueChannel.ack(msg);
              return;
            }

            await this.updateTransaction(transaction.toJSON());
            // Generator queue-рүү шиднэ
            generatorQueueChannel.sendToQueue(
              "barimt",
              Buffer.from(
                JSON.stringify({
                  user: res.data,
                  transaction: {
                    id: transaction._id,
                    amount: transaction.amount
                  }
                })
              ),
              {
                persistent: true
              }
            );
            queueChannel.ack(msg);
            return;
          } catch (err) {
            errorLog("Retry Transaction update queue error::: ", err);
          }
        }
      },
      {
        noAck: false
      }
    );
  }
}
