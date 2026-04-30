"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

// This component runs checkAuth() once when the app first loads
// It silently checks if the user has a valid cookie and loads their info
// Every page is wrapped in this so the user state is always ready
export function AuthProvider({ children }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Run once on mount — checks GET /api/auth/me
    checkAuth();
  }, [checkAuth]);

  // Just renders whatever is inside it (children = all your pages)
  return children;
}
