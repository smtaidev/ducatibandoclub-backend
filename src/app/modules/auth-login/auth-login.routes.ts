// import express from 'express';
// import validateRequest from '../../middlewares/validateRequest';
// import { authLoginValidation } from './auth-login.validation';
// import { AuthLoginControllers } from './auth-login.controller';
// import { checkOTP } from '../../middlewares/auth';

// const router = express.Router();

// router.post(
//   '/send-otp',
//   validateRequest(authLoginValidation.sendOtp),
//   AuthLoginControllers.sendOtp
// );

// router.post(
//   '/verify-otp',
//   validateRequest(authLoginValidation.verifyOtp),
//   AuthLoginControllers.verifyOtp
// );

// router.post(
//   '/login-with-password',
//   validateRequest(authLoginValidation.loginWithPassword),
//   AuthLoginControllers.loginWithPassword
// );

// router.post(
//   '/set-password',
//   validateRequest(authLoginValidation.setPassword),
//   checkOTP, 
//   AuthLoginControllers.setPassword
// );

// export const AuthLoginRoutes = router;
