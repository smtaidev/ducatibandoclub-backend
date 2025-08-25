import jwt, { JwtPayload, Secret, TokenExpiredError, JsonWebTokenError, NotBeforeError } from "jsonwebtoken";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";

const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: any
): string => {
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  });
  return token;
};

const verifyToken = (token: string, secret: Secret) => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    // Handle JWT-specific errors with proper status codes
    if (error instanceof TokenExpiredError) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED, 
        "Access token has expired. Please login again.",
        JSON.stringify({
          name: "TokenExpiredError",
          message: "jwt expired",
          expiredAt: error.expiredAt,
          errorCode: "JWT_EXPIRED"
        })
      );
    } else if (error instanceof JsonWebTokenError) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid access token. Please login again.",
        JSON.stringify({
          name: "JsonWebTokenError",
          message: error.message,
          errorCode: "JWT_INVALID"
        })
      );
    } else if (error instanceof NotBeforeError) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Token is not active yet.",
        JSON.stringify({
          name: "NotBeforeError",
          message: error.message,
          date: error.date,
          errorCode: "JWT_NOT_ACTIVE"
        })
      );
    } else {
      // Generic JWT error
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid token. Please login again.",
        JSON.stringify({
          name: "JWTError",
          message: "Token verification failed",
          errorCode: "JWT_VERIFICATION_FAILED"
        })
      );
    }
  }
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
