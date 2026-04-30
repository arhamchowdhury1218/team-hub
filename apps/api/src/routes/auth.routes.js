import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
  getMe,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

// Router is a mini Express app just for these routes
// We'll mount it at /api/auth in index.js
const router = Router();

// Public routes — no login required
// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", logout);

// POST /api/auth/refresh
// Called automatically when access token expires
router.post("/refresh", refresh);

// Protected route — must be logged in
// GET /api/auth/me
// "protect" middleware runs first, then getMe
router.get("/me", protect, getMe);

export default router;
