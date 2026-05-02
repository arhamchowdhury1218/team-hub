import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  createActionItem,
  getActionItems,
  updateActionItem,
  deleteActionItem,
} from "../controllers/actionItem.controller.js";

const router = Router({ mergeParams: true });

router.use(protect);

// GET  /api/workspaces/:workspaceId/action-items
// POST /api/workspaces/:workspaceId/action-items
router.get("/", getActionItems);
router.post("/", createActionItem);

// PATCH  /api/workspaces/:workspaceId/action-items/:itemId
// DELETE /api/workspaces/:workspaceId/action-items/:itemId
router.patch("/:itemId", updateActionItem);
router.delete("/:itemId", deleteActionItem);

export default router;
