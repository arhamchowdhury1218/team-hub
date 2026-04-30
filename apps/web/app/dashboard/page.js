"use client";

import { useWorkspaceStore } from "@/store/workspace.store";

export default function DashboardPage() {
  const { activeWorkspace, workspaces } = useWorkspaceStore();

  // If no workspaces yet, show a prompt to create one
  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Team Hub!
          </h2>
          <p className="text-gray-500 text-sm">
            Create your first workspace using the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  // If no active workspace selected yet
  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">
          Select a workspace from the sidebar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Workspace header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          {/* Accent color dot */}
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: activeWorkspace.accentColor }}
          />
          <h1 className="text-2xl font-bold text-gray-900">
            {activeWorkspace.name}
          </h1>
        </div>
        {activeWorkspace.description && (
          <p className="text-gray-500 text-sm ml-6">
            {activeWorkspace.description}
          </p>
        )}
      </div>

      {/* Stats grid — placeholder cards we'll fill in with real data later */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total goals", value: "—" },
          { label: "Completed this week", value: "—" },
          { label: "Overdue", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Members count card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-1">Team members</p>
        <p className="text-gray-500 text-sm">
          {activeWorkspace.memberCount}{" "}
          {activeWorkspace.memberCount === 1 ? "member" : "members"} in this
          workspace
        </p>
      </div>
    </div>
  );
}
