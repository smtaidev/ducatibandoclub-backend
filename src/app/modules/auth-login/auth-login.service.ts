import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import prisma from "../../lib/prisma";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { emailTemplate } from "../../utils/emailNotifications/emailHTML";
import { OTPFn } from "../auth/OTPFn";
import { UserStatus } from "@prisma/client";
import {
  ISendOtp,
  IVerifyOtp,
  ILoginWithPassword,
  ISetPassword,
  ILoginResponse,
  IOtpResponse,
} from "./auth-login.interface";

const sendOtp = async (payload: ISendOtp): Promise<IOtpResponse> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  let user;
  if (!existingUser) {
  
    user = await prisma.user.create({
      data: { 
        email: payload.email.trim(),
        status: UserStatus.INACTIVE 
      },
      select: { id: true, email: true, status: true },
    });
  } else {
    user = existingUser;
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Contact support.");
  }

  OTPFn(payload.email, user.id, "Email Verification", emailTemplate);

  return {
    userId: user.id,
    email: user.email,
    otpSent: true,
    message: "OTP sent successfully to your email",
  };
};

const verifyOtp = async (payload: IVerifyOtp) => {
  const otpRecord = await prisma.oTP.findUnique({
    where: { userId_otpCode: { userId: payload.userId, otpCode: payload.otpCode } },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  if (otpRecord.expiry < new Date()) {
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    throw new ApiError(httpStatus.REQUEST_TIMEOUT, "OTP expired");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  await prisma.$transaction(async (prisma) => {
    await prisma.user.update({
      where: { id: payload.userId },
      data: { 
        isEmailVerified: true, 
        status: UserStatus.ACTIVE 
      },
    });

    await prisma.oTP.deleteMany({ where: { userId: payload.userId } });
  });

  const hasPassword = !!user.password;

  let tempAccessToken = null;
  if (!hasPassword) {
    tempAccessToken = jwtHelpers.generateToken(
      { id: user.id },
      config.jwt.reset_pass_secret as Secret,
      config.jwt.reset_pass_token_expires_in as string
    );
  }

  return {
    userId: user.id,
    email: user.email,
    hasPassword,
    tempAccessToken, 
    message: hasPassword 
      ? "Email verified successfully. Please enter your password." 
      : "Email verified successfully. Please set your password.",
  };
};

const loginWithPassword = async (payload: ILoginWithPassword): Promise<ILoginResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Contact support.");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please verify your email first");
  }

  if (!user.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please set your password first");
  }

  const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  return {
    id: user.id,
    email: user.email,
    accessToken,
    isEmailVerified: user.isEmailVerified,
    hasPassword: true,
  };
};

const setPassword = async (userId: string, payload: ISetPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Contact support.");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please verify your email first");
  }

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  return {
    id: user.id,
    email: user.email,
    accessToken,
    isEmailVerified: user.isEmailVerified,
    hasPassword: true,
    message: "Password set successfully. You are now logged in.",
  };
};

export const AuthLoginServices = {
  sendOtp,
  verifyOtp,
  loginWithPassword,
  setPassword,
};
