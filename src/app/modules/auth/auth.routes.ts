import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from "./auth.validation";
import { AuthControllers } from "./auth.controller";
import auth, { checkOTP } from '../../middlewares/auth';

const router = express.Router();



router.get(
  "/get-me",
  auth(),
  AuthControllers.getMe
);

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

router.patch(
  "/update-profile",
  validateRequest(authValidation.updateProfile),
  auth(),
  AuthControllers.updateProfile
);


router.post(
  "/password-login",
  validateRequest(authValidation.passwordLogin),
  AuthControllers.passwordLogin
);

router.post(
  "/logout",
  auth(),
  AuthControllers.logout
);

export const AuthRouters = router;