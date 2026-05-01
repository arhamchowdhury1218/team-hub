import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "../controllers/goal.controller.js";

// mergeParams: true is IMPORTANT here
// Without it, :workspaceId from the parent route would not be accessible
// in this router. mergeParams makes parent URL params available here.
const router = Router({ mergeParams: true });

// All routes require login
router.use(protect);

// Goal routes
// GET  /api/workspaces/:workspaceId/goals
// POST /api/workspaces/:workspaceId/goals
router.get("/", getGoals);
router.post("/", createGoal);

// GET    /api/workspaces/:workspaceId/goals/:goalId
// PATCH  /api/workspaces/:workspaceId/goals/:goalId
// DELETE /api/workspaces/:workspaceId/goals/:goalId
router.get("/:goalId", getGoal);
router.patch("/:goalId", updateGoal);
router.delete("/:goalId", deleteGoal);

// Milestone routes — nested under a goal
// POST   /api/workspaces/:workspaceId/goals/:goalId/milestones
// PATCH  /api/workspaces/:workspaceId/goals/:goalId/milestones/:milestoneId
// DELETE /api/workspaces/:workspaceId/goals/:goalId/milestones/:milestoneId
router.post("/:goalId/milestones", createMilestone);
router.patch("/:goalId/milestones/:milestoneId", updateMilestone);
router.delete("/:goalId/milestones/:milestoneId", deleteMilestone);

export default router;
