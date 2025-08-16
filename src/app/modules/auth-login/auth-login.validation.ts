import { z } from 'zod';

export const authLoginValidation = {
  sendOtp: z.object({
    body: z.object({
      email: z
        .string({
          required_error: "Email is required!",
        })
        .email({
          message: "Invalid email format!",
        }),
    }),
  }),

  verifyOtp: z.object({
    body: z.object({
      userId: z.string({
        required_error: "User ID is required!",
      }),
      otpCode: z
        .string({
          required_error: "OTP code is required!",
        })
        .length(6, "OTP code must be 6 digits"),
    }),
  }),

  loginWithPassword: z.object({
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
    }),
  }),

  setPassword: z.object({
    body: z.object({
      password: z
        .string({
          required_error: "Password is required!",
        })
        .min(6, "Password must be at least 6 characters"),
    }),
  }),
};
