import httpStatus from "http-status";

import sendResponse from "../../helpers/sendResponse";
import { AuthServices } from "./auth.service";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";

const createAccount = catchAsync(async (req, res) => {

  const host = req.header('host') || '';

  const result = await AuthServices.createAccount(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'verify your otp code',
    data: result,
  });
});

const verifiedEmail = catchAsync(async (req, res) => {
  const { userId, otpCode, type } = req.body

  const result: any = await AuthServices.verifyEmail(userId, { otpCode, type });
  if (result.statusCode) {
    const { statusCode, message, ...data } = result
    return sendResponse(res, {
      statusCode,
      message,
      data: data,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully',
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUserFromDB(req.body);

  if (result.statusCode) {
    const { statusCode, message, ...data } = result
    return sendResponse(res, {
      statusCode,
      message,
      data: data,
    });

  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: result,
  });
});
const adminLoginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.adminLoginUserFromDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: result,
  });
});


const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "An secret number has been send",
    data: result,
  });
});

// const verifyOtp = catchAsync(async (req, res) => {
//   const result: any = await AuthServices.verifyOtp(req.body);
//   console.log(result.statusCode);
//   if (result.statusCode) {
//     const { statusCode, message, ...data } = result
//     return sendResponse(res, {
//       statusCode,
//       message,
//       data: data,
//     });
//   }


//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'OTP verified successfully please reset your password',
//     data: result,
//   });
// });

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id
  const newPassword = req.body.newPassword;
  const result = await AuthServices.resetPassword(userId, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password Reset successfully please login",
    data: result,
  });
});
const changePassword = catchAsync(async (req, res) => {
  const userId: string = req.user.id;
  const oldPassword: string = req.body.oldPassword;
  const newPassword: string = req.body.newPassword;
  const result = await AuthServices.changePassword(userId,
    {
      newPassword,
      oldPassword,
    });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'password changed successfully',
    data: result,
  });
});
const resendOtp = catchAsync(async (req, res) => {
  const userId = req.body.userId

  const result: any = await AuthServices.resendOtp(userId);


  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully',
    data: result,
  });
});

export const AuthControllers = {
  createAccount,
  loginUser,
  forgotPassword, resetPassword, changePassword,
  verifiedEmail,
  adminLoginUser, resendOtp


};
