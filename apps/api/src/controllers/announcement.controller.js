import { prisma } from "../lib/prisma.js";
import { io } from "../index.js";
// ─── Helper: check membership ─────────────────────────────────────────────────
const getMembership = async (userId, workspaceId) => {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
};

// ─── CREATE ANNOUNCEMENT ──────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/announcements
// Only Admins can post announcements
export const createAnnouncement = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    // Check membership and role
    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    if (membership.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admins can post announcements." });
    }

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ message: "Announcement title is required." });
    }

    if (!content?.trim()) {
      return res
        .status(400)
        .json({ message: "Announcement content is required." });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        workspaceId,
      },
    });
    io.to(workspaceId).emit("announcement:created", { announcement });
    res.status(201).json({ message: "Announcement posted.", announcement });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── GET ALL ANNOUNCEMENTS ────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/announcements
// Pinned announcements always appear first
export const getAnnouncements = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    const announcements = await prisma.announcement.findMany({
      where: { workspaceId },
      orderBy: [
        // Pinned ones always come first
        { pinned: "desc" },
        // Then most recent
        { createdAt: "desc" },
      ],
    });

    res.json({ announcements });
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── UPDATE ANNOUNCEMENT ──────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/announcements/:announcementId
// Only Admins can edit announcements
export const updateAnnouncement = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;
    const { title, content, pinned } = req.body;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership || membership.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admins can edit announcements." });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();

    // "pinned" is a boolean — handle it separately
    // because "if (pinned)" would be false when pinned = false
    if (pinned !== undefined) updateData.pinned = pinned;

    const announcement = await prisma.announcement.update({
      where: { id: announcementId },
      data: updateData,
    });
    io.to(workspaceId).emit("announcement:updated", { announcement });
    res.json({ message: "Announcement updated.", announcement });
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── DELETE ANNOUNCEMENT ──────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId/announcements/:announcementId
// Only Admins can delete announcements
export const deleteAnnouncement = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership || membership.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admins can delete announcements." });
    }

    await prisma.announcement.delete({ where: { id: announcementId } });
    io.to(workspaceId).emit("announcement:deleted", { announcementId });
    res.json({ message: "Announcement deleted." });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── TOGGLE PIN ───────────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId/announcements/:announcementId/pin
// Toggles the pinned status of an announcement
export const togglePin = async (req, res) => {
  try {
    const { workspaceId, announcementId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(userId, workspaceId);
    if (!membership || membership.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admins can pin announcements." });
    }

    // Get the current announcement to read its current pinned state
    const current = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!current) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    // Toggle: if pinned → unpin, if unpinned → pin
    const announcement = await prisma.announcement.update({
      where: { id: announcementId },
      data: { pinned: !current.pinned },
    });

    res.json({
      message: announcement.pinned
        ? "Announcement pinned."
        : "Announcement unpinned.",
      announcement,
    });
  } catch (error) {
    console.error("Toggle pin error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
