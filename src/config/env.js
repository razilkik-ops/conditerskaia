import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || "dev-secret-change-me",
  adminEmail: process.env.ADMIN_EMAIL || "admin@candy.local",
  adminPassword: process.env.ADMIN_PASSWORD || "admin12345",
  appUrl: process.env.APP_URL || "http://localhost:3000"
};
