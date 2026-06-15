import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const databaseUser = encodeURIComponent(process.env.DATABASE_USER || "");
const databasePassword = encodeURIComponent(process.env.DATABASE_PASSWORD || "");
const databaseHost = process.env.DATABASE_HOST || "localhost";
const databasePort = Number(process.env.DATABASE_PORT || 3306);
const databaseName = process.env.DATABASE_NAME || "";

const adapter = new PrismaMariaDb(
  `mariadb://${databaseUser}:${databasePassword}@${databaseHost}:${databasePort}/${databaseName}?allowPublicKeyRetrieval=true&connectionLimit=5`
);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
