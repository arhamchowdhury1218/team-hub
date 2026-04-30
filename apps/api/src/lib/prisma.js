import { PrismaClient } from "@prisma/client";

// PrismaClient is your gateway to the database
// Every time you call prisma.user.findMany() or prisma.goal.create()
// it goes through this client

// We use a global variable trick here to avoid creating too many
// database connections during development
// In development, Next.js/Node re-runs files often due to hot reload
// Without this trick, you'd create hundreds of connections and crash

// Check if a PrismaClient already exists on the global object
// (the global object persists between file reloads in development)
const globalForPrisma = globalThis;

// If one already exists, reuse it. Otherwise create a new one.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log which database queries are being run (helpful for debugging)
    log: ["query", "error", "warn"],
  });

// Save the client to the global object so the next reload reuses it
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
