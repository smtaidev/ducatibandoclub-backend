import { z } from 'zod';

export const authValidation = {
  signUpOrLogin: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().optional(),
    }),
  }),

  verifyOtp: z.object({
    body: z.object({
      userId: z.string().min(1, "User ID is required"),
      otpCode: z.string().min(1, "OTP code is required"),
    }),
  }),

  resendOtp: z.object({
    body: z.object({
      userId: z.string().min(1, "User ID is required"),
    }),
  }),

  setPassword: z.object({
    body: z.object({
      password: z.string().min(6, "Password must be at least 6 characters"),
    }),
  }),

  changePassword: z.object({
    body: z.object({
      password: z.string().min(6, "Password must be at least 6 characters"),
    }),
  }),
};








/*
import { Role } from "@prisma/client";
import z from "zod";


const phoneRegex = /^[+]*[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}$/;

const registerUser = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required!",
    }),
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
    phone: z
      .string({
        required_error: "Phone is required!",
      })
      .regex(phoneRegex, {
        message: "Phone number is not valid. Please enter a valid phone number.",
      }),
    password: z
      .string({
        required_error: "Password is required!",
      })
      .min(8, "Password should be at least 8 characters"),
    role: z.enum([Role.ADMIN, Role.ADMIN], {
      errorMap: () => {
        return { message: `Role should be either ${Role.ADMIN} or ${Role.USER}` };
      },
    }),

    fcmToken: z.string().optional(),
  }),
});


const verifyOtp = z.object({
  body: z.object({
    userId: z.string({
      required_error: "userId is required!",
    }),
    otpCode: z.string({
      required_error: "otpCode is required!",
    }).length(6, "otpCode must be 6 digit"),
  }),
});


const loginUser = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
    password: z.string({
      required_error: "Password is required!",
    }),
    fcmToken: z.string().optional()
  }),
});


const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
  }),
});



const resetPassword = z.object({
  body: z.object({
    newPassword: z.string({
      required_error: "Password is required!",
    }).min(8, "password should be minimum 8 characters "),
  }),
});
const changePassword = z.object({
  body: z.object({
    password: z.string({
      required_error: "Password is required!",
    }).min(8, "password should be minimum 8 characters "),
  }),
});





export const authValidation = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,


};

*/