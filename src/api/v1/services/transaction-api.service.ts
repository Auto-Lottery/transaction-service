import TransactionModel from "../models/transaction.model";
import { AdminUser } from "../types/user";
import { errorLog } from "../utilities/log";
import { Filter, generateQuery } from "../utilities/mongo";

export class TransactionApiService {
  constructor() {}

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
          description: updateData.description,
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
    return {
      code: 200,
      data: true
    };
  }
}
