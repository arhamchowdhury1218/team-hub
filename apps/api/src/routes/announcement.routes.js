import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  togglePin,
} from "../controllers/announcement.controller.js";

// mergeParams lets us access :workspaceId from the parent route
const router = Router({ mergeParams: true });

router.use(protect);

// GET  /api/workspaces/:workspaceId/announcements
// POST /api/workspaces/:workspaceId/announcements
router.get("/", getAnnouncements);
router.post("/", createAnnouncement);

// PATCH  /api/workspaces/:workspaceId/announcements/:announcementId
// DELETE /api/workspaces/:workspaceId/announcements/:announcementId
router.patch("/:announcementId", updateAnnouncement);
router.delete("/:announcementId", deleteAnnouncement);

// PATCH /api/workspaces/:workspaceId/announcements/:announcementId/pin
router.patch("/:announcementId/pin", togglePin);

export default router;
