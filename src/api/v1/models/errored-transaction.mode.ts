import { Schema, model } from "mongoose";
const ErroredTransactionSchema = new Schema(
  {
    transactionData: {
      type: String,
      required: true
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
