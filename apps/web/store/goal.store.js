import { create } from "zustand";
import { api } from "@/lib/api";

export const useGoalStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  goals: [],
  activeGoal: null, // the goal currently being viewed in detail
  isLoading: false,
  error: null,

  // ─── Fetch all goals for a workspace ────────────────────────────────────────
  fetchGoals: async (workspaceId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.get(`/api/workspaces/${workspaceId}/goals`);
      set({ goals: data.goals, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ─── Create a new goal ───────────────────────────────────────────────────────
  createGoal: async (workspaceId, goalData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post(
        `/api/workspaces/${workspaceId}/goals`,
        goalData,
      );

      // Prepend the new goal to the list
      set((state) => ({
        goals: [data.goal, ...state.goals],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // ─── Update a goal ───────────────────────────────────────────────────────────
  updateGoal: async (workspaceId, goalId, updates) => {
    try {
      const data = await api.patch(
        `/api/workspaces/${workspaceId}/goals/${goalId}`,
        updates,
      );

      // Replace the old goal in the list with the updated one
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? data.goal : g)),
        // Also update activeGoal if it's the same goal
        activeGoal:
          state.activeGoal?.id === goalId ? data.goal : state.activeGoal,
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Delete a goal ───────────────────────────────────────────────────────────
  deleteGoal: async (workspaceId, goalId) => {
    try {
      await api.delete(`/api/workspaces/${workspaceId}/goals/${goalId}`);

      // Remove the deleted goal from the list
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
        activeGoal: state.activeGoal?.id === goalId ? null : state.activeGoal,
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Set the active goal (for detail view) ───────────────────────────────────
  setActiveGoal: (goal) => set({ activeGoal: goal }),

  // ─── Create a milestone under a goal ────────────────────────────────────────
  createMilestone: async (workspaceId, goalId, milestoneData) => {
    try {
      const data = await api.post(
        `/api/workspaces/${workspaceId}/goals/${goalId}/milestones`,
        milestoneData,
      );

      // Add the milestone to the correct goal in the list
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId
            ? { ...g, milestones: [...g.milestones, data.milestone] }
            : g,
        ),
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Update a milestone ──────────────────────────────────────────────────────
  updateMilestone: async (workspaceId, goalId, milestoneId, updates) => {
    try {
      const data = await api.patch(
        `/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`,
        updates,
      );

      // Update the milestone inside its parent goal
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                milestones: g.milestones.map((m) =>
                  m.id === milestoneId ? data.milestone : m,
                ),
              }
            : g,
        ),
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  // ─── Delete a milestone ──────────────────────────────────────────────────────
  deleteMilestone: async (workspaceId, goalId, milestoneId) => {
    try {
      await api.delete(
        `/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`,
      );

      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                milestones: g.milestones.filter((m) => m.id !== milestoneId),
              }
            : g,
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
