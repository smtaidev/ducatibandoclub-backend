import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || "12",
  otp_expiry_time: process.env.OTP_ACCESS_EXPIRES_IN || "5",
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,

    reset_pass_secret: process.env.JWT_RESET_PASS_SECRET,
    reset_pass_token_expires_in: process.env.JWT_RESET_PASS_EXPIRES_IN,
    store_address_token_expires_in: process.env.JWT_STORE_ADDRESS_EXPIRES_IN,
  },
   S3: {
    accessKeyId: process.env.S3_ACCESS_KEY || "DO002RGDJ947DJHJ9WDT",
    secretAccessKey: process.env.S3_SECRET_KEY || "e5+/pko6Ojar51Hb8ojUKfq2HtXy+tnGKOfs3rIcEfo",
    region: process.env.S3_REGION || "nyc3",
    bucketName: process.env.S3_BUCKET_NAME || "smtech-space",

  },  
   emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.EMAIL_PASSWORD,
    contact_mail_address: process.env.CONTACT_MAIL_ADDRESS,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceId: process.env.STRIPE_PRICE_ID, 
  }
}
