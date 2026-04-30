"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname(); // current URL path

  const { user, logout } = useAuthStore();
  const { workspaces, activeWorkspace, setActiveWorkspace } =
    useWorkspaceStore();

  // Controls whether the "Create Workspace" modal is open
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Switch to a different workspace when clicked in the sidebar
  const handleWorkspaceClick = (workspace) => {
    setActiveWorkspace(workspace);
    router.push("/dashboard");
  };

  // Navigation links shown under the active workspace
  // "href" is the URL, "label" is the text shown
  const navLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/goals", label: "Goals" },
    { href: "/dashboard/announcements", label: "Announcements" },
    { href: "/dashboard/action-items", label: "Action Items" },
    { href: "/dashboard/members", label: "Members" },
  ];

  return (
    <>
      {/* Sidebar container */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        {/* ── App brand at the top ── */}
        <div className="px-4 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Team Hub</h1>
        </div>

        {/* ── Workspace list ── */}
        <div className="px-3 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Workspaces
          </p>

          {/* Show each workspace as a clickable item */}
          <div className="space-y-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleWorkspaceClick(ws)}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm
                            transition text-left
                            ${
                              activeWorkspace?.id === ws.id
                                ? "bg-gray-100 text-gray-900 font-medium" // active style
                                : "text-gray-600 hover:bg-gray-50" // inactive style
                            }`}
              >
                {/* Colored dot using the workspace accent color */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ws.accentColor }}
                />
                {/* Workspace name — truncate if too long */}
                <span className="truncate">{ws.name}</span>

                {/* Show the user's role as a small badge */}
                {ws.role === "Admin" && (
                  <span className="ml-auto text-xs text-indigo-500 font-medium">
                    Admin
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Button to create a new workspace */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full mt-2 flex items-center gap-2 px-2 py-2 text-sm
                       text-gray-400 hover:text-gray-600 hover:bg-gray-50
                       rounded-lg transition"
          >
            {/* Simple "+" icon made with text */}
            <span className="text-lg leading-none">+</span>
            <span>New workspace</span>
          </button>
        </div>

        {/* ── Navigation links (only shown if a workspace is active) ── */}
        {activeWorkspace && (
          <div className="px-3 pt-2 pb-2 border-t border-gray-100 mt-2">
            {/* Show the active workspace name above the nav */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 truncate">
              {activeWorkspace.name}
            </p>

            <nav className="space-y-1">
              {navLinks.map((link) => {
                // Check if this link matches the current URL
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-2 py-2 rounded-lg text-sm transition
                                ${
                                  isActive
                                    ? "bg-indigo-50 text-indigo-700 font-medium"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* ── User profile at the bottom ── */}
        {/* "mt-auto" pushes this to the very bottom of the sidebar */}
        <div className="mt-auto border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            {/* Avatar circle with initials */}
            <div
              className="w-8 h-8 rounded-full bg-indigo-100 flex items-center
                            justify-center text-indigo-700 text-sm font-semibold shrink-0"
            >
              {/* Take first letter of user's name */}
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            {/* Name and email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
              title="Sign out"
            >
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}
