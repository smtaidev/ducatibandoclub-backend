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

  updateProfile: z.object({
    body: z.object({
      name: z.string().min(1, "Name cannot be empty").optional(),
      image: z.string().url("Invalid image URL").optional(),
    }).refine((data) => Object.keys(data).length > 0, {
      message: "At least one field (name or image) must be provided",
    }),
  }),

  passwordLogin: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
    }),
  }),

  verifyResetOtp: z.object({
    body: z.object({
      userId: z.string().min(1, "User ID is required"),
      otpCode: z.string().min(1, "OTP code is required"),
    }),
  }),

  resetPassword: z.object({
    body: z.object({
      password: z.string().min(6, "Password must be at least 6 characters"),
    }),
  }),
};
