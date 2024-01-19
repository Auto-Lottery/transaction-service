import { Schema, model } from "mongoose";

const TransactionRequestSchema = new Schema(
  {
    count: {
      type: Number,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    createdUser: {
      type: String,
      required: true
    },
    createdDate: {
      type: Number,
      default: Date.now,
      index: -1
    }
  },
  {
    versionKey: false
  }
);

const TransactionRequestModel = model(
  "transactionrequest",
  TransactionRequestSchema
);

export default TransactionRequestModel;
