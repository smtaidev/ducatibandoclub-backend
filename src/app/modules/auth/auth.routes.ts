import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from "./auth.validation";
import { AuthControllers } from "./auth.controller";
import auth, { checkOTP } from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/login',
  validateRequest(authValidation.signUpOrLogin),
  AuthControllers.signUpOrLogin
);

router.post(
  "/verify-email",
  validateRequest(authValidation.verifyOtp),
  AuthControllers.verifiedEmail
);

router.post(
  "/resend-otp",
  validateRequest(authValidation.resendOtp),
  AuthControllers.resendOtp
);

router.post(
  "/set-password",
  validateRequest(authValidation.setPassword),
  checkOTP,
  AuthControllers.setPassword
);

router.post(
  "/change-password",
  validateRequest(authValidation.changePassword),
  auth(),
  AuthControllers.changePassword
);

export const AuthRouters = router;