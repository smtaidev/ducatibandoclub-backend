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
    // Signup: Create new user
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

    // Update email verification status only if not already verified
    if (!user.isEmailVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true, status: UserStatus.ACTIVE },
      });
    }

    await prisma.oTP.deleteMany({ where: { userId } });

    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string
    );

    return { id: user.id, email: user.email, accessToken };
  });

  return user;
};

const resendOtp = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
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

export const AuthServices = {
  signUpOrLogin,
  verifyEmail,
  resendOtp,
  setPassword,
  changePassword,
};










/*
import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";

import ApiError from "../../errors/ApiError";
import sentEmailUtility from "../../utils/sentEmailUtility";


import prisma from "../../lib/prisma";
import { IChangePassword, IOtp, IRegisterUser, IUserLogin } from "./auth.interface ";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { Role, UserStatus } from "@prisma/client";
import { emailTemplate } from "../../utils/emailNotifications/emailHTML";
import { OTPFn } from "./OTPFn";
import { forgotEmailTemplate } from "../../utils/emailNotifications/forgotHTML";


// const createAccount1 = async (payload: IRegisterUser) => {
//   const user = await prisma.$transaction(async (prisma) => {
//     const existingUser = await prisma.user.findUnique({
//       where: { email: payload.email },

//     });

//     if (existingUser) {
//       throw new ApiError(
//         httpStatus.CONFLICT,
//         "This email is already registered"
//       );
//     }

//     const hashPassword = await bcrypt.hash(
//       payload.password,
//       Number(config.bcrypt_salt_rounds)
//     );


//     const newUser = await prisma.user.create({
//       data: {
//         name: payload.name,
//         email: payload.email,
//         password: hashPassword,
//         role: payload.role || Role.BUYER,
//         status: payload.role === Role.BUYER ? UserStatus.ACTIVE : UserStatus.PENDING,

//         // fcmToken: payload?.fcmToken,
//       },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         role: true,
//         image: true,
//         status: true,
//         isVerified: true,
//       },
//     });
//     return newUser

//   });
//   if (!user) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User creation failed");
//   }

//   const OTP_EXPIRY_TIME = Number(config.otp_expiry_time) * 60 * 1000;
//   const expiry = new Date(Date.now() + OTP_EXPIRY_TIME);

//   const otpCode = Math.floor(100000 + Math.random() * 900000);

//   const emailSubject = "OTP Verification";
//   const emailText = `Your OTP is: ${otpCode}`;
//   const emailHTML = emailTemplate(otpCode);
//   await sentEmailUtility(payload.email, emailSubject, emailText, emailHTML);

//   await prisma.oTP.create({
//     data: {
//       otpCode: otpCode.toString(),
//       userId: user.id,
//       expiry,
//     },
//   });
//   return {
//     userId: user.id,
//     email: user.email,
//     name: user.name,
//     role: user.role,
//     image: user.image,
//     status: user.status,
//     isVerified: user.isVerified,
//   }
// }

const createAccount = async (payload: {
  email: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    OTPFn(payload.email, existingUser.id, "email Verification", emailTemplate);
    return {
      id: existingUser.id,
      name: existingUser.name,
      otpSent: true,
      message: "OTP sent successfully to your email",
      type: 'register'
    };
  }

  // const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  const userData = {
    email: payload.email.trim(),
  };
  const result = await prisma.$transaction(async (transactionClient: any) => {
    // Create a Stripe customer
    const user = await transactionClient.user.create({
      data: {
        ...userData,
      },
    });
    // 
    OTPFn(payload.email, user.id, "email Verification", emailTemplate)
    return {
      id: user.id,
      name: user.name,
      otpSent: true,
      message: "OTP sent successfully to your email",
      type: 'register'
    };
  });

  return result;
};

const verifyEmail = async (userId: string, { otpCode, fcmToken, type }: { otpCode: string; fcmToken?: string, type: string }) => {

  const otpRecord = await prisma.oTP.findUnique({
    where: {
      userId_otpCode: {
        userId,
        otpCode
      }
    },
  });  //
  if (!otpRecord) {

    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP or expired OTP");
  }
  if (otpRecord.expiry < new Date()) {
    await prisma.oTP.delete({
      where: {
        id: otpRecord.id,
      },
    });
    throw new ApiError(httpStatus.REQUEST_TIMEOUT, "OTP expired");
  }

  const user = await prisma.$transaction(async (prisma) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    if (user.isVerified) {
      if (fcmToken) {
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            fcmToken,
          },
        });
      }

    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          status: UserStatus.ACTIVE,
          fcmToken,
        },
      });
    }
    // Find OTP record

    // Delete OTP record
    await prisma.oTP.deleteMany({ where: { userId } });
    let accessToken: string = jwtHelpers.generateToken(
      {
        id: user.id,
      },
      config.jwt.reset_pass_secret as Secret,
      config.jwt.reset_pass_token_expires_in as string
    );;
    if (user.role === Role.USER) {

      return {
        statusCode: type === 'register' ? httpStatus.OK : httpStatus.PERMANENT_REDIRECT,
        message: type === 'register' ? " Email Verification successful" : "otp verified successfully",
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        status: UserStatus.ACTIVE,
        isVerified: true,
        accessToken: type === 'register' ? null : accessToken, // If it's a registration, no access token is needed
      }
    } else if (user.role === Role.USER) {  
      const accessTokenFor = jwtHelpers.generateToken(
        {
          id: user.id,
        },
        config.jwt.reset_pass_secret as Secret,
        config.jwt.store_address_token_expires_in as string
      );

      return {
        statusCode: type === 'register' ? httpStatus.TEMPORARY_REDIRECT : httpStatus.PERMANENT_REDIRECT,
        message: type === 'register' ? "Please update your store location" : "otp verified successfully",
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        status: UserStatus.ACTIVE,
        isVerified: true,
        accessToken: type === 'register' ? accessTokenFor : accessToken 
      }
    }

  });
  return user
};
const resendOtp = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User Not found");
  }

  OTPFn(existingUser.email, existingUser.id, "email Verification code", emailTemplate)

  // Return user details and OTP status
  return {
    userId: existingUser.id,
    otpSent: true,
    name: existingUser.name,
    message: "OTP sent successfully to your email",
  };
};

// const forgotPassword = async (payload: { email: string }) => {
//   // Check if the user exists
//   const user = await prisma.user.findUnique({
//     where: { email: payload.email },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
//   };

//   OTPFn(user.email, user.id, "Forgot Password OTP email", forgotEmailTemplate)
//   return {
//     id: user.id,
//     name: user.name,
//     otpSent: true,
//     message: "OTP sent successfully to your email",
//     type: 'forgotPassword'
//   };
// };

const verifyOtp = async (payload: IOtp) => {
  const { userId, otpCode } = payload
  const otpData = await prisma.oTP.findUnique({
    where: {
      userId_otpCode: {
        userId,
        otpCode
      }
    },
  });
  if (!otpData) {
    throw new ApiError(httpStatus.NOT_FOUND, "OTP not found");
  }

  if (otpData.expiry < new Date()) {
    throw new ApiError(httpStatus.REQUEST_TIMEOUT, "OTP expired");
  }

  await prisma.oTP.delete({
    where: {
      id: otpData.id,
    },
  });
  const accessToken = jwtHelpers.generateToken(
    {
      id: userId,
    },
    config.jwt.access_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string
  );
  return { accessToken };
};


// const loginUserFromDB = async (payload: IUserLogin) => {
//   const userData = await prisma.user.findUnique({
//     where: {
//       email: payload.email,
//     },
//     include: {
//       storeAddress: true,
//     }
//   });
//   if (!userData) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   if (userData.status === UserStatus.BLOCKED) {
//     throw new ApiError(httpStatus.FORBIDDEN, "Your account is not active. Please contact with admin.");
//   }

//   const isCorrectPassword = await bcrypt.compare(
//     payload.password,
//     userData.password as string
//   );

//   if (!isCorrectPassword) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect");
//   }
//   if (!userData.isEmailVerified) {

//     OTPFn(userData.email, userData.id, "email Verification", emailTemplate)

//     return {
//       statusCode: httpStatus.PERMANENT_REDIRECT,
//       message: "Please confirm verify your email",
//       userId: userData.id,
//       email: userData.email,
//       name: userData.name,
//       role: userData.role,
//       image: userData.image,
//       status: userData.status,
//       isVerified: userData.isVerified,
//       type: "register",
//       accessToken: null, // No access token until email is verified
//     }
//   }

//   if (payload.fcmToken) {
//     await prisma.user.update({
//       where: {
//         id: userData.id,
//       },
//       data: {
//         fcmToken: payload.fcmToken,
//       },
//     });
//   }

//   const accessToken = jwtHelpers.generateToken(
//     {
//       id: userData.id,
//       email: userData.email as string,
//       role: userData.role,
//     },
//     config.jwt.access_secret as Secret,
//     config.jwt.access_expires_in as string
//   );

//   if (userData.role === Role.USER && userData.storeAddress.length === 0) {
//     const accessTokenFor = jwtHelpers.generateToken(
//       {
//         id: userData.id,
//       },
//       config.jwt.reset_pass_secret as Secret,
//       config.jwt.store_address_token_expires_in as string
//     );
//     return {
//       statusCode: httpStatus.TEMPORARY_REDIRECT,
//       message: "Please update store location",
//       id: userData.id,
//       name: userData.name,
//       email: userData.email,
//       role: userData.role,
//       image: userData.image,
//       status: userData.status,
//       isVerified: userData.isVerified,
//       accessToken: accessTokenFor
//     }
//   }

//   // Return user details and access token
//   return {
//     id: userData.id,
//     name: userData.name,
//     email: userData.email,
//     role: userData.role,
//     image: userData.image,
//     status: userData.status,
//     isVerified: userData.isVerified,
//     accessToken: accessToken,
//   };
// };
// const adminLoginUserFromDB = async (payload: IUserLogin) => {
//   const userData = await prisma.user.findUnique({
//     where: {
//       email: payload.email,
//       OR: [
//         { role: Role.ADMIN }
//       ]
//     },
//   });
//   if (!userData) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const isCorrectPassword = await bcrypt.compare(
//     payload.password,
//     userData.password as string
//   );

//   if (!isCorrectPassword) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect");
//   }


//   const accessToken = jwtHelpers.generateToken(
//     {
//       id: userData.id,
//       email: userData.email as string,
//       role: userData.role,
//     },
//     config.jwt.access_secret as Secret,
//     config.jwt.access_expires_in as string
//   );

//   // Return user details and access token
//   return {
//     id: userData.id,
//     name: userData.name,
//     email: userData.email,
//     role: userData.role,
//     image: userData.image,
//     status: userData.status,
//     isVerified: userData.isVerified,
//     accessToken: accessToken,
//   };
// };

// const resetPassword = async (userId: string, newPassword: string) => {
//   const hashedPassword: string = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

//   await prisma.user.update({
//     where: {
//       id: userId,
//     },
//     data: {
//       password: hashedPassword,
//     },
//   });

//   return {
//     message: "please login"
//   };
// };

const changePassword = async (userId: string, payload: IChangePassword) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId }
  });

  console.log(userData);

  if (!userData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found!, If you have already have account please reset your password'
    );
  }

  // Check if the user status is BLOCKED
  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Your account has been blocked. Please contact support.'
    );
  }

  // // Check if the password is correct
  // const isCorrectPassword = await bcrypt.compare(
  //   payload.oldPassword,
  //   userData.password as string
  // );

  // if (!isCorrectPassword) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Credentials not matched');
  // }
  // Hash the user's password

  const salt = bcrypt.genSaltSync(Number(config.bcrypt_salt_rounds) || 12); // Generate a random salt

  const hashedPassword: string = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));


  // Update the user's password in the database template
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });
  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found in the database.');
  }
  return {
    message: 'password updated successfully',
  };
};





export const AuthServices = {
  createAccount,
  // loginUserFromDB,
  verifyEmail,
  // forgotPassword,
  verifyOtp,
  // resetPassword,
  changePassword,
  // adminLoginUserFromDB,
  resendOtp

};
*/