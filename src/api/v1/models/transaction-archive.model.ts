import { Schema, model } from "mongoose";
import { Bank } from "../types/enums";

const TransactionArchiveSchema = new Schema(
  {
    bankTransactionId: {
      type: String,
      required: true,
      lowerCase: true,
      index: true
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
      required: true,
      index: true
    },
    fromAccountNumber: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String
    },
    updatedUserId: {
      type: String
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
    isRetry: {
      type: Boolean,
      required: true,
      default: false
    },
    description: {
      type: String
    },
    status: {
      type: String
    },
    transactionDate: {
      type: Date,
      required: true,
      index: -1
    },
    createdDate: {
      type: Number,
      default: Date.now,
      index: -1
    },
    baseTransactionId: {
      type: String,
      required: true,
      index: true
    },
    version: {
      type: Number,
      default: 0,
      index: -1
    }
  },
  {
    versionKey: false
  }
);

const TransactionArchiveModel = model(
  "transactionsarchive",
  TransactionArchiveSchema
);

export default TransactionArchiveModel;
