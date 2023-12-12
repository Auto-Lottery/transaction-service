import { Schema, model } from "mongoose";
import { Bank } from "../types/enums";

const TransactionSchema = new Schema({
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
  }
});

const TransactionModel = model("transactions", TransactionSchema);
export default TransactionModel;
