import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthServices } from "./auth.service";
import config from "../../../config";

const signUpOrLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.signUpOrLogin(req.body);

  if (result.statusCode) {
    return sendResponse(res, {
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: result,
  });
});

const verifiedEmail = catchAsync(async (req: Request, res: Response) => {
  const { userId, otpCode } = req.body;
  const result = await AuthServices.verifyEmail(userId, { otpCode });

  //  res.cookie('accessToken', result.accessToken, {
  //   httpOnly: false,
  //   secure: false,
  //   sameSite: 'none',
  //   maxAge: 24 * 60 * 60 * 1000, // 1 day
  // })

  res.cookie("accessToken", result.accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  ...(process.env.NODE_ENV === "production" && { domain: "localhost" }) 
});

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Email verified successfully',
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const result = await AuthServices.resendOtp(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP resent successfully',
    data: result,
  });
});

const setPassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  const { password } = req.body;
  const result = await AuthServices.setPassword(userId, password);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password set successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  const { password } = req.body;
  const result = await AuthServices.changePassword(userId, { password });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  
  const result = await AuthServices.logout(userId);
  
  // Clear the access token cookie if it exists
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: true,
  });
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logout successful',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  
  const result = await AuthServices.updateProfile(userId, req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  
  const result = await AuthServices.getMe(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

export const AuthControllers = {
  signUpOrLogin,
  verifiedEmail,
  resendOtp,
  setPassword,
  changePassword,
  logout,
  updateProfile,
  getMe,
};




