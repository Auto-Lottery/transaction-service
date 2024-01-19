import TransactionRequestModel from "../models/transaction-request";
import TransactionModel from "../models/transaction.model";
import { AdminUser } from "../types/user";
import { errorLog } from "../utilities/log";
import { Filter, generateQuery } from "../utilities/mongo";
import RabbitMQManager from "./rabbitmq-manager";
import { TransactionService } from "./transaction.service";

export class TransactionApiService {
  private transactionService;
  constructor() {
    this.transactionService = new TransactionService();
  }

  async getAllTransactions(filter: Filter) {
    const { field, order } = filter?.sort || {
      field: "_id",
      order: "desc"
    };
    const { page, pageSize } = filter?.pagination || {
      page: 1,
      pageSize: 10
    };
    try {
      const skip = (page - 1) * pageSize;
      const query = generateQuery(filter?.conditions || []);

      const resultList = await TransactionModel.find(query)
        .skip(skip)
        .limit(pageSize)
        .sort({
          [field]: order === "desc" ? -1 : 1
        });
      const count = await TransactionModel.countDocuments(query);
      return {
        listData: resultList,
        total: count
      };
    } catch (error) {
      errorLog("Transaction list fetch error ", error);
      throw new Error(`Transaction list fetch error`);
    }
  }

  async getUserTransactions(
    phoneNumber?: string,
    page: number = 1,
    pageSize: number = 20
  ) {
    try {
      const skip = (page - 1) * pageSize;

      const resultList = await TransactionModel.find({
        phoneNumber: phoneNumber
      })
        .skip(skip)
        .limit(pageSize)
        .sort({
          createdDate: -1
        });
      const count = await TransactionModel.countDocuments({
        phoneNumber: phoneNumber
      });
      return {
        listData: resultList,
        total: count
      };
    } catch (error) {
      errorLog("Transaction list fetch error ", error);
      throw new Error(`Transaction list fetch error`);
    }
  }

  async manualUpdateTransaction(
    user: AdminUser,
    updateData: Record<string, string>
  ) {
    const tran = await TransactionModel.updateOne(
      {
        _id: updateData.id
      },
      {
        $set: {
          status: updateData.status,
          tranDescription: updateData.tranDescription,
          description: updateData.description,
          isRetry: updateData.isRetry,
          updatedUserId: user._id
        }
      }
    );
    if (tran.matchedCount === 0) {
      return {
        code: 500,
        message: "Гүйлгээний мэдээлэл олдсонгүй."
      };
    }
    if (updateData.isRetry) {
      this.transactionService.retryTransactionsSendToQueue(updateData.id);
    }
    return {
      code: 200,
      data: true
    };
  }

  async manualCreateTransaction(
    data: { phoneNumber: string; lotteryCount: number },
    user: AdminUser
  ) {
    const newRequest = await TransactionRequestModel.create({
      count: data.lotteryCount,
      phoneNumber: data.phoneNumber,
      createdUser: user._id,
      description: "MANUAL"
    });
    try {
      const rabbitMQManager = RabbitMQManager.getInstance();
      const rabbitMqChannel =
        await rabbitMQManager.createChannel("bank_transaction");

      if (rabbitMqChannel) {
        rabbitMqChannel.sendToQueue(
          "khanbank",
          Buffer.from(
            JSON.stringify({
              record: newRequest._id.toString(),
              tranDate: newRequest.createdDate,
              amount: newRequest.count * 10000,
              description: newRequest.phoneNumber,
              relatedAccount: "MANUAL"
            })
          ),
          {
            persistent: true
          }
        );
      }

      return {
        code: 200,
        data: {
          requestId: newRequest._id.toString(),
          status: "DONE"
        }
      };
    } catch (err) {
      errorLog("MANUAL TRAN ERROR::: ", err);
      return {
        code: 200,
        data: {
          smsId: newRequest._id.toString(),
          status: "ERROR"
        }
      };
    }
  }
}
