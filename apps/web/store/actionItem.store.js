import { create } from "zustand";
import { api } from "@/lib/api";

export const useActionItemStore = create((set) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  actionItems: [],
  isLoading: false,
  error: null,

  // ─── Fetch all action items ──────────────────────────────────────────────────
  fetchActionItems: async (workspaceId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.get(`/api/workspaces/${workspaceId}/action-items`);
      set({ actionItems: data.actionItems, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ─── Create action item ──────────────────────────────────────────────────────
  createActionItem: async (workspaceId, itemData) => {
    try {
      const data = await api.post(
        `/api/workspaces/${workspaceId}/action-items`,
        itemData,
      );
      set((state) => ({
        actionItems: [data.actionItem, ...state.actionItems],
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Update action item ──────────────────────────────────────────────────────
  // This is also used by the Kanban board when dragging cards between columns
  updateActionItem: async (workspaceId, itemId, updates) => {
    try {
      const data = await api.patch(
        `/api/workspaces/${workspaceId}/action-items/${itemId}`,
        updates,
      );
      set((state) => ({
        actionItems: state.actionItems.map((item) =>
          item.id === itemId ? data.actionItem : item,
        ),
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Delete action item ──────────────────────────────────────────────────────
  deleteActionItem: async (workspaceId, itemId) => {
    try {
      await api.delete(`/api/workspaces/${workspaceId}/action-items/${itemId}`);
      set((state) => ({
        actionItems: state.actionItems.filter((item) => item.id !== itemId),
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Move item to a different status column (Kanban drag) ────────────────────
  // This updates locally first for instant feedback, then saves to backend
  moveItem: (itemId, newStatus) => {
    set((state) => ({
      actionItems: state.actionItems.map((item) =>
        item.id === itemId ? { ...item, status: newStatus } : item,
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));
