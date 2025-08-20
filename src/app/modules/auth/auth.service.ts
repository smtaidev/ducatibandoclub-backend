import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import sentEmailUtility from "../../utils/sentEmailUtility";
import prisma from "../../lib/prisma";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { emailTemplate } from "../../utils/emailNotifications/emailHTML";
import { OTPFn } from "./OTPFn";
import { UserStatus } from "@prisma/client";

const signUpOrLogin = async (payload: { email: string; password?: string }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  let user;
  if (!existingUser) {

    user = await prisma.$transaction(async (transactionClient) => {
      const newUser = await transactionClient.user.create({
        data: { email: payload.email.trim() },
        select: { id: true, email: true },
      });
      OTPFn(payload.email, newUser.id, "Email Verification", emailTemplate);
      return newUser;
    });
    return {
      id: user.id,
      email: user.email,
      otpSent: true,
      message: "OTP sent successfully to your email for signup",
    };
  }

  // Login: Check user status and password, always send OTP
  user = existingUser;
  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Contact support.");
  }

  if (payload.password) {
    const isCorrectPassword = await bcrypt.compare(payload.password, user.password || "");
    if (!isCorrectPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
    }
  }

  // Always send OTP, even if email is verified
  OTPFn(user.email, user.id, "Email Verification", emailTemplate);
  return {
    statusCode: httpStatus.PERMANENT_REDIRECT,
    message: "Please verify your email",
    data: { userId: user.id, email: user.email },
  };
};

const verifyEmail = async (userId: string, { otpCode }: { otpCode: string }) => {
  const otpRecord = await prisma.oTP.findUnique({
    where: { userId_otpCode: { userId, otpCode } },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  if (otpRecord.expiry < new Date()) {
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    throw new ApiError(httpStatus.REQUEST_TIMEOUT, "OTP expired");
  }

  const user = await prisma.$transaction(async (prisma) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!user.isEmailVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true, status: UserStatus.ACTIVE },
      });
    }

    await prisma.oTP.deleteMany({ where: { userId } });

    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string
    );

    const hasPassword = !!user.password;

    return { id: user.id, email: user.email, isProMember: user.isProMember, hasPassword, accessToken };
  });

  return user;
};

const resendOtp = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const existingOtp = await prisma.oTP.findFirst({ where: { id: userId } });

  if (existingOtp) {
    await prisma.oTP.delete({ where: { id: existingOtp.id } });
  }

  OTPFn(existingUser.email, existingUser.id, "Email Verification", emailTemplate);

  return {
    userId: existingUser.id,
    email: existingUser.email,
    otpSent: true,
    message: "OTP sent successfully to your email",
  };
};

const setPassword = async (userId: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  return { message: "Password set successfully" };
};

const changePassword = async (userId: string, payload: { password: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });  
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Contact support.");
  }

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully" };
};

const logout = async (userId: string) => {
  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // For JWT stateless logout, we mainly return a success message
  // In a production environment, you might want to:
  // 1. Blacklist the token in Redis or database
  // 2. Clear any server-side sessions
  // 3. Log the logout event for security purposes
  
  return { message: "Logged out successfully" };
};

const updateProfile = async (userId: string, payload: { name?: string; image?: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Contact support.");
  }

  // Create update data object with only provided fields
  const updateData: { name?: string; image?: string } = {};
  
  if (payload.name !== undefined) {
    updateData.name = payload.name.trim();
  }
  if (payload.image !== undefined) {
    updateData.image = payload.image;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isProMember: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return updatedUser;
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isEmailVerified: true,
      isProMember: true,
      role: true,
      status: true,
      subscriptionStatus: true,
      membershipEnds: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Contact support.");
  }

  return user;
};

export const AuthServices = {
  signUpOrLogin,
  verifyEmail,
  resendOtp,
  setPassword,
  changePassword,
  logout,
  updateProfile,
  getMe,
};




