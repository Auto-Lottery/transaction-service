import { Transaction } from "../types/transaction";

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export const phoneNumberRecognition = (description: string) => {
  const pattern: RegExp = /\d{8}/;
  const match = pattern.exec(description);

  if (match) {
    return match[0];
  } else {
    return null;
  }
};

export const generateFakeTransaction = (): Transaction => {
  const amount = [20000, 50000, 100000];
  const users = ["85266716", "99646141"];
  const selectAmountIndex = getRandomInt(0, amount.length);
  const selectUserIndex = getRandomInt(0, users.length);

  return {
    record: getRandomInt(10000, 50000),
    tranDate: Date.now().toString(),
    postDate: Date.now().toString(),
    amount: amount[selectAmountIndex],
    description: users[selectUserIndex],
    relatedAccount: "5050505050"
  };
};
