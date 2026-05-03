import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getAnalytics,
  exportCSV,
} from "../controllers/analytics.controller.js";

const router = Router({ mergeParams: true });

router.use(protect);

// GET /api/workspaces/:workspaceId/analytics
router.get("/", getAnalytics);

// GET /api/workspaces/:workspaceId/analytics/export
router.get("/export", exportCSV);

export default router;
