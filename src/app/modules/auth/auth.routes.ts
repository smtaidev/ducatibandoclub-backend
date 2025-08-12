import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from "./auth.validation";
import { AuthControllers } from "./auth.controller";
import auth, { checkOTP } from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/create-account', validateRequest(authValidation.registerUser),
  AuthControllers.createAccount
);

router.post(
  "/email-verify",
  validateRequest(authValidation.verifyOtp),
  AuthControllers.verifiedEmail
);

router.post(
  "/resend-otp",
  AuthControllers.resendOtp
);

router.post(
  "/login",
  validateRequest(authValidation.loginUser),
  AuthControllers.loginUser
);
router.post(
  "/admin/login",
  validateRequest(authValidation.loginUser),
  AuthControllers.adminLoginUser
);

router.post(
  "/forgot-password",
  validateRequest(authValidation.forgotPassword),
  AuthControllers.forgotPassword
);

// router.post(
//   "/verify-reset-password-otp",
//   validateRequest(authValidation.verifyOtp),
//   AuthControllers.verifyOtp
// );
router.post(
  "/reset-password",
  validateRequest(authValidation.resetPassword),
  checkOTP,
  AuthControllers.resetPassword
);
router.post(
  "/change-password",
  validateRequest(authValidation.changePassword),
  auth(),
  AuthControllers.changePassword
);


export const AuthRouters = router;
