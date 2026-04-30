import { create } from "zustand";
import { api } from "@/lib/api";

export const useWorkspaceStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────

  // List of all workspaces the user belongs to
  workspaces: [],

  // The workspace currently being viewed
  // This is what the whole dashboard is "inside"
  activeWorkspace: null,

  isLoading: false,
  error: null,

  // ─── Actions ────────────────────────────────────────────────────────────────

  // Fetch all workspaces for the logged-in user
  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.get("/api/workspaces");
      set({
        workspaces: data.workspaces,
        isLoading: false,
        // Auto-select the first workspace if none is active yet
        activeWorkspace: get().activeWorkspace ?? data.workspaces[0] ?? null,
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Set which workspace is currently active (user clicked on it in sidebar)
  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace });
  },

  // Create a brand new workspace
  createWorkspace: async (name, description, accentColor) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post("/api/workspaces", {
        name,
        description,
        accentColor,
      });

      // Add the new workspace to the list and make it active
      set((state) => ({
        workspaces: [data.workspace, ...state.workspaces],
        activeWorkspace: data.workspace,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // Invite a member to the active workspace by email
  inviteMember: async (workspaceId, email, role = "Member") => {
    try {
      const data = await api.post(`/api/workspaces/${workspaceId}/invite`, {
        email,
        role,
      });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Clear any error
  clearError: () => set({ error: null }),
}));
