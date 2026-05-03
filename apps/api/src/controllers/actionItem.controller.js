import { prisma } from "../lib/prisma.js";
import { io } from "../index.js";
// ─── Helper: check membership ─────────────────────────────────────────────────
const getMembership = async (userId, workspaceId) => {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
};

// ─── CREATE ACTION ITEM ───────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/action-items
export const createActionItem = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, priority, dueDate, assigneeId, goalId } = req.body;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ message: "Action item title is required." });
    }

    // Validate priority value — must be one of these three
    const validPriorities = ["low", "medium", "high"];
    const itemPriority = validPriorities.includes(priority)
      ? priority
      : "medium";

    const actionItem = await prisma.actionItem.create({
      data: {
        title: title.trim(),
        priority: itemPriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId,
        // assigneeId and goalId are optional — only set if provided
        assigneeId: assigneeId || null,
        goalId: goalId || null,
        // Status always starts as "todo" on creation
        status: "todo",
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        goal: {
          select: { id: true, title: true },
        },
      },
    });

    res.status(201).json({ message: "Action item created.", actionItem });
  } catch (error) {
    console.error("Create action item error:", error);
    io.to(workspaceId).emit("action_item:created", { actionItem });
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── GET ALL ACTION ITEMS ─────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/action-items
export const getActionItems = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // Optional filters from query string
    // e.g. ?status=todo or ?assigneeId=abc123
    const { status, assigneeId, goalId } = req.query;

    const actionItems = await prisma.actionItem.findMany({
      where: {
        workspaceId,
        // Only add these filters if they were provided in the query
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
        ...(goalId && { goalId }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        goal: {
          select: { id: true, title: true },
        },
      },
      orderBy: [
        // High priority items first
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    res.json({ actionItems });
  } catch (error) {
    console.error("Get action items error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── UPDATE ACTION ITEM ───────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/action-items/:itemId
export const updateActionItem = async (req, res) => {
  try {
    const { workspaceId, itemId } = req.params;
    const { title, status, priority, dueDate, assigneeId, goalId } = req.body;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // Build update object with only the fields that were sent
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (goalId !== undefined) updateData.goalId = goalId || null;

    const actionItem = await prisma.actionItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        goal: {
          select: { id: true, title: true },
        },
      },
    });
    io.to(workspaceId).emit("action_item:updated", { actionItem });
    res.json({ message: "Action item updated.", actionItem });
  } catch (error) {
    console.error("Update action item error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── DELETE ACTION ITEM ───────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/action-items/:itemId
export const deleteActionItem = async (req, res) => {
  try {
    const { workspaceId, itemId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    await prisma.actionItem.delete({ where: { id: itemId } });
    io.to(workspaceId).emit("action_item:deleted", { itemId });
    res.json({ message: "Action item deleted." });
  } catch (error) {
    console.error("Delete action item error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
