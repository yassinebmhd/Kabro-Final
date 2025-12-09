import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:8080",
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  JWT_SECRET: process.env.JWT_SECRET || "devsecret",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MAIL_FROM: process.env.MAIL_FROM || "no-reply@kabro.local",
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  OWNER_WHATSAPP: process.env.OWNER_WHATSAPP,
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || "dev",
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  APP_URL: process.env.APP_URL || "http://localhost:8080",
};
