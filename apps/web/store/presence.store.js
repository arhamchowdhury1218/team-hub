import { create } from "zustand";

// Tracks which user IDs are currently online in the active workspace
export const usePresenceStore = create((set) => ({
  // Set of user IDs who are online
  onlineUserIds: new Set(),

  // Called when we get the full online list on joining a workspace
  setOnlineUsers: (userIds) => {
    set({ onlineUserIds: new Set(userIds) });
  },

  // Called when a member comes online
  addOnlineUser: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.add(userId);
      return { onlineUserIds: next };
    });
  },

  // Called when a member goes offline
  removeOnlineUser: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next };
    });
  },
}));
