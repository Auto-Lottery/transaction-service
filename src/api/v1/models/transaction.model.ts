import { Schema, model, Types } from "mongoose";
import { Bank } from "../types/enums";
import TransactionArchiveModel from "./transaction-archive.model";
import { errorLog } from "../utilities/log";

const TransactionSchema = new Schema(
  {
    bankTransactionId: {
      type: String,
      required: true,
      lowerCase: true
    },
    bank: {
      type: String,
      required: true,
      enum: {
        values: [
          Bank.KHANBANK,
          Bank.KHANBANK,
          Bank.TDB,
          Bank.STATEBANK,
          Bank.GOLOMTBANK
        ]
      }
    },
    amount: {
      type: Number,
      required: true
    },
    fromAccountNumber: {
      type: String,
      required: true
    },
    tranDescription: {
      type: String
    },
    tranType: {
      type: String,
      enum: {
        values: ["DEPOSIT", "WITHDRAW"]
      }
    },
    description: {
      type: String
    },
    status: {
      type: String
    },
    transactionDate: {
      type: Date,
      required: true
    },
    createdDate: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 0
    }
  },
  {
    versionKey: false
  }
);

TransactionSchema.pre("updateOne", async function (next) {
  try {
    const existingDocument = await this.model.findOne(this.getQuery());

    if (existingDocument) {
      const archiveVersion = {
        ...existingDocument.toObject(),
        baseTransactionId: existingDocument._id
      };
      archiveVersion._id = new Types.ObjectId();
      await TransactionArchiveModel.create(archiveVersion);

      const updateData = this.getUpdate();
      if (updateData) {
        this.setUpdate({
          ...updateData,
          $inc: { version: 1 }
        });
      }
    }
    next();
  } catch (err) {
    errorLog("UPDATE ONE PRE ::: ", err);
    throw new Error("INTERNAL SERVER ERROR");
  }
});

const TransactionModel = model("transactions", TransactionSchema);

export default TransactionModel;
