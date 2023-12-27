export type User = {
  phoneNumber: string;
  operator: string;
  _id: string;
};

export type UserWithToken = {
  accessToken: string;
} & User;

export type AdminUser = {
  phoneNumber: string;
  operator: string;
  _id: string;
  roles: string[];
};

export type AdminUserWithToken = {
  token: string;
  exp?: number;
} & AdminUser;
