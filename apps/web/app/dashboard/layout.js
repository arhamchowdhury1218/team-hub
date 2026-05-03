"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import Sidebar from "@/components/Sidebar";
import { SocketProvider } from "@/components/SocketProvider";

// This layout wraps ALL pages inside /dashboard
// So the sidebar shows on every dashboard page automatically
export default function DashboardLayout({ children }) {
  const { user, isLoading: authLoading, logout } = useAuthStore();
  const { fetchWorkspaces } = useWorkspaceStore();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Once the user is confirmed logged in, load their workspaces
  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user, fetchWorkspaces]);

  // Show loading spinner while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // return (
  //   // Full screen flex row: sidebar | main content
  //   <div className="flex h-screen bg-gray-50 overflow-hidden">
  //     {/* Sidebar — fixed on the left */}
  //     <Sidebar />

  //     {/* Main content area — scrollable */}
  //     <main className="flex-1 overflow-y-auto">{children}</main>
  //   </div>
  // );
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      {/* SocketProvider connects the socket and listens for events */}
      <SocketProvider>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SocketProvider>
    </div>
  );
}
