import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        id: string;
        email?: string;
        role?: string;
        // Add other user properties as needed
      };
    }
  }
}
