import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  })
  .parse(process.env);

  const dbHost = new URL(env.DATABASE_URL).hostname;
const dbLocal = ["localhost", "127.0.0.1", "[::1]"].includes(dbHost);
if (env.NODE_ENV === "production" && !dbLocal && !/sslmode=(require|verify-ca|verify-full)/.test(env.DATABASE_URL))
  throw new Error("Base distante : ajoutez ?sslmode=require à DATABASE_URL");