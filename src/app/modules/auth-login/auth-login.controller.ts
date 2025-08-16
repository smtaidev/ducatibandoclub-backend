import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthLoginServices } from "./auth-login.service";

const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthLoginServices.sendOtp(req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.message,
    data: result,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthLoginServices.verifyOtp(req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.message,
    data: result,
  });
});

const loginWithPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthLoginServices.loginWithPassword(req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Login successful",
    data: result,
  });
});

const setPassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; 
  const result = await AuthLoginServices.setPassword(userId, req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.message || "Password set successfully",
    data: result,
  });
});

export const AuthLoginControllers = {
  sendOtp,
  verifyOtp,
  loginWithPassword,
  setPassword,
};
