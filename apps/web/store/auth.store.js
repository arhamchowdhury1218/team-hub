import { create } from "zustand";
import { api } from "@/lib/api";

// create() makes a new Zustand store
// Think of it like a global useState that any component can access
export const useAuthStore = create((set) => ({
  // ─── State ──────────────────────────────────────────────────────────────────

  // The currently logged-in user object, or null if not logged in
  user: null,

  // True while we're checking if the user is logged in on page load
  // Prevents the page from flashing the login screen before checking
  isLoading: true,

  // Any error message to show the user (e.g. "Invalid password")
  error: null,

  // ─── Actions ────────────────────────────────────────────────────────────────
  // Actions are functions that update the state

  // Called on app startup — checks if the user is already logged in
  // by hitting GET /api/auth/me (which reads the cookie automatically)
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const data = await api.get("/api/auth/me");
      // If successful, save the user to state
      set({ user: data.user, isLoading: false });
    } catch {
      // If the request fails (no cookie, expired token, etc.)
      // just set user to null — they're not logged in
      set({ user: null, isLoading: false });
    }
  },

  // Register a new account
  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      // Save the new user to state
      set({ user: data.user, isLoading: false });
      return true; // signal success to the component
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false; // signal failure
    }
  },

  // Log in with email and password
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post("/api/auth/login", { email, password });
      set({ user: data.user, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // Log out
  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      // Always clear the user from state, even if the request fails
      set({ user: null, error: null });
    }
  },

  // Clear any error message (e.g. when user starts typing again)
  clearError: () => set({ error: null }),
}));
