import { create } from "zustand";
import { api } from "@/lib/api";

export const useAnnouncementStore = create((set) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  announcements: [],
  isLoading: false,
  error: null,

  // ─── Fetch all announcements for a workspace ─────────────────────────────────
  fetchAnnouncements: async (workspaceId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.get(
        `/api/workspaces/${workspaceId}/announcements`,
      );
      set({ announcements: data.announcements, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ─── Create announcement ─────────────────────────────────────────────────────
  createAnnouncement: async (workspaceId, title, content) => {
    try {
      const data = await api.post(
        `/api/workspaces/${workspaceId}/announcements`,
        {
          title,
          content,
        },
      );

      // Prepend — newest first (but pinned ones will be sorted on next fetch)
      set((state) => ({
        announcements: [data.announcement, ...state.announcements],
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Toggle pin ──────────────────────────────────────────────────────────────
  togglePin: async (workspaceId, announcementId) => {
    try {
      const data = await api.patch(
        `/api/workspaces/${workspaceId}/announcements/${announcementId}/pin`,
      );

      // Update the pinned status in local state
      set((state) => {
        const updated = state.announcements.map((a) =>
          a.id === announcementId ? data.announcement : a,
        );
        // Re-sort: pinned first, then by date
        updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return { announcements: updated };
      });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ─── Delete announcement ─────────────────────────────────────────────────────
  deleteAnnouncement: async (workspaceId, announcementId) => {
    try {
      await api.delete(
        `/api/workspaces/${workspaceId}/announcements/${announcementId}`,
      );
      set((state) => ({
        announcements: state.announcements.filter(
          (a) => a.id !== announcementId,
        ),
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
