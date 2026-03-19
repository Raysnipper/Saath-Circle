import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { getRequiredEnv } from "@/lib/env"

const globalForPrisma = globalThis as unknown as {
  prisma_v7: PrismaClient | undefined
}

const connectionString = getRequiredEnv("DATABASE_URL")
const adapter = new PrismaNeonHttp(connectionString, {})

try {
  globalForPrisma.prisma_v7 = globalForPrisma.prisma_v7 ?? new PrismaClient({ adapter })
} catch (error) {
  throw error;
}
export const prisma = globalForPrisma.prisma_v7;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v7 = prisma

export default prisma
