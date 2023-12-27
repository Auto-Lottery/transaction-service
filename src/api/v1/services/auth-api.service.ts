import axios from "axios";
import { AUTH_SERVICE_URL } from "../config";
import { CustomResponse } from "../types/custom-response";
import { User } from "../types/user";
import { errorLog } from "../utilities/log";
import { NextFunction, Request, Response } from "express";

export class AuthApiService {
  constructor() {}

  async register(phoneNumber: string): Promise<CustomResponse<User>> {
    try {
      const res = await axios.post(`${AUTH_SERVICE_URL}/v1/auth/register`, {
        phoneNumber: phoneNumber
      });
      return res.data;
    } catch (err) {
      if (err instanceof Error) {
        return {
          code: 500,
          message: err.message
        };
      }
      errorLog("AUTH API REGISTER CALL ERR::: ", err);
      return {
        code: 500,
        message: "Бүртгэл амжилтгүй"
      };
    }
  }

  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = await axios.get(
        `${AUTH_SERVICE_URL}/v1/auth/verifyToken`,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );
      req.user = data;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  static async adminVerifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { data } = await axios.get(
        `${AUTH_SERVICE_URL}/v1/admin/verifyToken`,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );
      req.user = data;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
}
