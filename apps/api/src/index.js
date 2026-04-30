// Load environment variables from .env file
// Must be first line before anything else uses process.env
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";

// Create the Express app
const app = express();

// Create an HTTP server that wraps Express
// Socket.io needs this — it attaches to the same server as Express
const httpServer = createServer(app);

// Create the Socket.io server
// It listens on the same port as Express
const io = new Server(httpServer, {
  cors: {
    // Only allow connections from your frontend URL
    // process.env.CLIENT_URL comes from your .env file
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // allow cookies to be sent with socket connections
  },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
// Middleware runs on EVERY request before it hits your routes

// Allow requests from your frontend (cross-origin requests)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // allow cookies (needed for JWT in cookies)
  }),
);

// Parse incoming JSON bodies so you can read req.body in your routes
app.use(express.json());

// Parse incoming cookies so you can read req.cookies in your routes
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────

// Mount routes — all auth routes are prefixed with /api/auth
// So register is at POST /api/auth/register
//    login    is at POST /api/auth/login
//    etc.
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);

// ─── Socket.io ────────────────────────────────────────────────────────────────
// When a client connects via WebSocket
io.on("connection", (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // When this client disconnects
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Health check route ───────────────────────────────────────────────────────
// A simple GET /health route so Railway (and you) can check the server is running
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// ─── Start the server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export io so other files (like route handlers) can emit socket events
export { io };
