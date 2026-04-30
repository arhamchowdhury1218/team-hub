import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  inviteMember,
  removeMember,
} from "../controllers/workspace.controller.js";

const router = Router();

// ALL workspace routes require the user to be logged in
// Instead of adding "protect" to every single route,
// we use router.use() to apply it to all routes in this file at once
router.use(protect);

// GET  /api/workspaces        → get all workspaces I belong to
// POST /api/workspaces        → create a new workspace
router.get("/", getMyWorkspaces);
router.post("/", createWorkspace);

// GET   /api/workspaces/:id            → get one workspace + its members
// PATCH /api/workspaces/:id            → update workspace details
router.get("/:id", getWorkspace);
router.patch("/:id", updateWorkspace);

// POST   /api/workspaces/:id/invite          → invite a member by email
// DELETE /api/workspaces/:id/members/:memberId → remove a member
router.post("/:id/invite", inviteMember);
router.delete("/:id/members/:memberId", removeMember);

export default router;
