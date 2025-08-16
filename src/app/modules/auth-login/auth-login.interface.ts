export interface ISendOtp {
  email: string;
}

export interface IVerifyOtp {
  userId: string;
  otpCode: string;
}

export interface ILoginWithPassword {
  email: string;
  password: string;
}

export interface ISetPassword {
  userId: string;
  password: string;
}

export interface ILoginResponse {
  id: string;
  email: string;
  accessToken: string;
  isEmailVerified: boolean;
  hasPassword: boolean;
}

export interface IOtpResponse {
  userId: string;
  email: string;
  otpSent: boolean;
  message: string;
}
