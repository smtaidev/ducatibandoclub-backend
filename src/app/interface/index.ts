import { JwtPayload } from "jsonwebtoken";
import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User & JwtPayload;
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
    }
  }
}

