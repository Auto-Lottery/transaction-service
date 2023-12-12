export type Transaction = {
  record: number;
  tranDate: string;
  postDate: string;
  time?: string;
  branch?: string;
  teller?: string;
  journal?: number;
  code?: number;
  amount: number;
  balance?: number;
  debit?: number;
  correction?: number;
  description: string;
  relatedAccount: string;
};
