import { Schema, model } from "mongoose";
const ErroredTransactionSchema = new Schema(
  {
    transactionData: {
      type: String,
      required: true
    },
    description: {
      type: String
    }
  },
  {
    versionKey: false
  }
);

const ErroredTransactionModel = model(
  "erroredtransaction",
  ErroredTransactionSchema
);
export default ErroredTransactionModel;
