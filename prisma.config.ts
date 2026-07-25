import "dotenv/config";
import { defineConfig } from "prisma/config";

// Cek variabel mana yang tersedia
const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Tambahkan parameter timeout dan ssl untuk stabilitas di Vercel
const dbUrl = rawUrl ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}connect_timeout=30&sslmode=require` : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});
