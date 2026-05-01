import { prisma } from "../lib/prisma.js";

// ─── Helper: check workspace membership ───────────────────────────────────────
// We reuse this check in almost every goal route
// Returns the membership record or null
const getMembership = async (userId, workspaceId) => {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
};

// ─── CREATE GOAL ──────────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/goals
export const createGoal = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, dueDate, ownerId } = req.body;
    const userId = req.user.id;

    // Check the requester is a member of this workspace
    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    if (!title?.trim()) {
      return res.status(400).json({ message: "Goal title is required." });
    }

    // Create the goal
    // If no ownerId provided, the creator becomes the owner
    const goal = await prisma.goal.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId,
        // Use provided ownerId or fall back to the creator
        ownerId: ownerId || userId,
      },
      include: {
        // Include the owner's info in the response
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        // Include milestones (will be empty array on creation)
        milestones: true,
      },
    });

    res.status(201).json({ message: "Goal created.", goal });
  } catch (error) {
    console.error("Create goal error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── GET ALL GOALS ────────────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/goals
export const getGoals = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check membership
    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // Optional filter by status from query string
    // e.g. GET /api/workspaces/:id/goals?status=active
    const { status } = req.query;

    const goals = await prisma.goal.findMany({
      where: {
        workspaceId,
        // Only apply status filter if it was provided
        ...(status && { status }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        milestones: true,
        // Count how many action items are linked to each goal
        _count: {
          select: { actionItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ goals });
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── GET SINGLE GOAL ──────────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/goals/:goalId
export const getGoal = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        milestones: {
          orderBy: { createdAt: "asc" },
        },
        // Include linked action items
        actionItems: {
          include: {
            assignee: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!goal || goal.workspaceId !== workspaceId) {
      return res.status(404).json({ message: "Goal not found." });
    }

    res.json({ goal });
  } catch (error) {
    console.error("Get goal error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── UPDATE GOAL ──────────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/goals/:goalId
export const updateGoal = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;
    const userId = req.user.id;
    const { title, description, status, dueDate, ownerId } = req.body;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // Build the update object dynamically
    // Only include fields that were actually sent in the request
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (ownerId !== undefined) updateData.ownerId = ownerId;

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        milestones: true,
      },
    });

    res.json({ message: "Goal updated.", goal });
  } catch (error) {
    console.error("Update goal error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── DELETE GOAL ──────────────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/goals/:goalId
// Only Admins or the goal owner can delete
export const deleteGoal = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // Fetch the goal to check ownership
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    // Only the goal owner or a workspace Admin can delete
    const isOwner = goal.ownerId === userId;
    const isAdmin = membership.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({
          message: "Only the goal owner or an Admin can delete this goal.",
        });
    }

    await prisma.goal.delete({ where: { id: goalId } });

    res.json({ message: "Goal deleted." });
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── CREATE MILESTONE ─────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/goals/:goalId/milestones
export const createMilestone = async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params;
    const { title, progress } = req.body;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    if (!title?.trim()) {
      return res.status(400).json({ message: "Milestone title is required." });
    }

    // progress must be between 0 and 100
    const progressValue = Math.min(100, Math.max(0, Number(progress) || 0));

    const milestone = await prisma.milestone.create({
      data: {
        title: title.trim(),
        progress: progressValue,
        goalId,
      },
    });

    res.status(201).json({ message: "Milestone created.", milestone });
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── UPDATE MILESTONE ─────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/goals/:goalId/milestones/:milestoneId
export const updateMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { title, progress, completed } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, Number(progress)));
    }
    if (completed !== undefined) {
      updateData.completed = completed;
      // If marking as completed, set progress to 100 automatically
      if (completed) updateData.progress = 100;
    }

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    res.json({ message: "Milestone updated.", milestone });
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── DELETE MILESTONE ─────────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/goals/:goalId/milestones/:milestoneId
export const deleteMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    await prisma.milestone.delete({ where: { id: milestoneId } });

    res.json({ message: "Milestone deleted." });
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
