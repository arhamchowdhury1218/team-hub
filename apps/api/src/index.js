// // Load environment variables from .env file
// // Must be first line before anything else uses process.env
// import "dotenv/config";

// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { createServer } from "http";
// import { Server } from "socket.io";
// import authRoutes from "./routes/auth.routes.js";
// import workspaceRoutes from "./routes/workspace.routes.js";
// import goalRoutes from "./routes/goal.routes.js";
// import announcementRoutes from "./routes/announcement.routes.js";
// import actionItemRoutes from "./routes/actionItem.routes.js";

// // Create the Express app
// const app = express();

// // Create an HTTP server that wraps Express
// // Socket.io needs this — it attaches to the same server as Express
// const httpServer = createServer(app);

// // Create the Socket.io server
// // It listens on the same port as Express
// const io = new Server(httpServer, {
//   cors: {
//     // Only allow connections from your frontend URL
//     // process.env.CLIENT_URL comes from your .env file
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true, // allow cookies to be sent with socket connections
//   },
// });

// // ─── Middleware ────────────────────────────────────────────────────────────────
// // Middleware runs on EVERY request before it hits your routes

// // Allow requests from your frontend (cross-origin requests)
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true, // allow cookies (needed for JWT in cookies)
//   }),
// );

// // Parse incoming JSON bodies so you can read req.body in your routes
// app.use(express.json());

// // Parse incoming cookies so you can read req.cookies in your routes
// app.use(cookieParser());

// // ─── Routes ───────────────────────────────────────────────────────────────────

// // Mount routes — all auth routes are prefixed with /api/auth
// // So register is at POST /api/auth/register
// //    login    is at POST /api/auth/login
// //    etc.
// app.use("/api/auth", authRoutes);
// app.use("/api/workspaces", workspaceRoutes);
// app.use("/api/workspaces/:workspaceId/goals", goalRoutes);
// app.use("/api/workspaces/:workspaceId/announcements", announcementRoutes);
// app.use("/api/workspaces/:workspaceId/action-items", actionItemRoutes);

// // ─── Socket.io ────────────────────────────────────────────────────────────────
// // When a client connects via WebSocket
// io.on("connection", (socket) => {
//   console.log(`⚡ Socket connected: ${socket.id}`);

//   // When this client disconnects
//   socket.on("disconnect", () => {
//     console.log(`Socket disconnected: ${socket.id}`);
//   });
// });

// // ─── Health check route ───────────────────────────────────────────────────────
// // A simple GET /health route so Railway (and you) can check the server is running
// app.get("/health", (req, res) => {
//   res.json({ status: "ok", message: "Server is running" });
// });

// // ─── Start the server ─────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 4000;

// httpServer.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// // Export io so other files (like route handlers) can emit socket events
// export { io };
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import goalRoutes from "./routes/goal.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import actionItemRoutes from "./routes/actionItem.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/goals", goalRoutes);
app.use("/api/workspaces/:workspaceId/announcements", announcementRoutes);
app.use("/api/workspaces/:workspaceId/action-items", actionItemRoutes);
app.use("/api/workspaces/:workspaceId/analytics", analyticsRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
// Middleware: authenticate socket connections using JWT from cookie
// This runs before any socket event handler
io.use((socket, next) => {
  try {
    // Socket.io sends cookies in the handshake headers
    // We parse them manually here
    const cookieHeader = socket.handshake.headers.cookie || "";

    // Find the accessToken cookie value
    // Cookies look like: "accessToken=abc123; refreshToken=xyz"
    const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);

    if (!tokenMatch) {
      return next(new Error("Authentication required."));
    }

    const token = tokenMatch[1];

    // Verify the JWT — same as in the HTTP middleware
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach user info to the socket so we can use it in event handlers
    socket.user = decoded;

    next(); // allow the connection
  } catch (err) {
    next(new Error("Invalid token."));
  }
});

// Track online members per workspace
// Structure: { workspaceId: Set of userIds }
// We use a Map of Sets so we can easily add/remove users
const onlineMembers = new Map();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} (user: ${socket.user.id})`);

  // ── Join workspace room ──────────────────────────────────────────────────
  // Called when a user opens a workspace in the frontend
  // They join a room named after the workspace ID
  socket.on("workspace:join", (workspaceId) => {
    // Leave any previously joined workspace room
    // A user can only be "in" one workspace at a time
    if (socket.currentWorkspace) {
      socket.leave(socket.currentWorkspace);

      // Remove from online tracking
      const members = onlineMembers.get(socket.currentWorkspace);
      if (members) {
        members.delete(socket.user.id);
        // Tell other members this user went offline in that workspace
        io.to(socket.currentWorkspace).emit("member:offline", {
          userId: socket.user.id,
        });
      }
    }

    // Join the new workspace room
    socket.join(workspaceId);
    socket.currentWorkspace = workspaceId;

    // Add to online tracking
    if (!onlineMembers.has(workspaceId)) {
      onlineMembers.set(workspaceId, new Set());
    }
    onlineMembers.get(workspaceId).add(socket.user.id);

    // Tell all members in this workspace that this user is now online
    // socket.to() sends to everyone in the room EXCEPT the sender
    socket.to(workspaceId).emit("member:online", {
      userId: socket.user.id,
    });

    // Send the current online members list back to the user who just joined
    socket.emit("members:online_list", {
      userIds: [...(onlineMembers.get(workspaceId) || [])],
    });

    console.log(`User ${socket.user.id} joined workspace ${workspaceId}`);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (socket.currentWorkspace) {
      const members = onlineMembers.get(socket.currentWorkspace);
      if (members) {
        members.delete(socket.user.id);
        // Notify workspace members this user went offline
        io.to(socket.currentWorkspace).emit("member:offline", {
          userId: socket.user.id,
        });
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export io so controllers can emit events
export { io };
