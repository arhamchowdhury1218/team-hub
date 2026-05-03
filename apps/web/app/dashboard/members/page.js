"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace.store";
import { usePresenceStore } from "@/store/presence.store";
import { api } from "@/lib/api";

export default function MembersPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { onlineUserIds } = usePresenceStore();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const isAdmin = activeWorkspace?.role === "Admin";

  // Fetch workspace members
  useEffect(() => {
    if (!activeWorkspace?.id) return;

    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const data = await api.get(`/api/workspaces/${activeWorkspace.id}`);
        setMembers(data.workspace.members);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [activeWorkspace?.id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteMessage("");

    try {
      const data = await api.post(
        `/api/workspaces/${activeWorkspace.id}/invite`,
        {
          email: inviteEmail,
          role: "Member",
        },
      );
      setInviteMessage(`✓ ${data.message}`);
      setInviteEmail("");

      // Re-fetch members list to show new member
      const updated = await api.get(`/api/workspaces/${activeWorkspace.id}`);
      setMembers(updated.workspace.members);
    } catch (err) {
      setInviteMessage(`✗ ${err.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Select a workspace first.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="text-gray-500 text-sm mt-1">
          {members.length} member{members.length !== 1 ? "s" : ""} in this
          workspace
        </p>
      </div>

      {/* Invite form — only visible to Admins */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Invite a member
          </h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isInviting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-400 text-white text-sm
                         font-medium rounded-lg transition"
            >
              {isInviting ? "Inviting..." : "Invite"}
            </button>
          </form>

          {/* Feedback message */}
          {inviteMessage && (
            <p
              className={`text-sm mt-2 ${
                inviteMessage.startsWith("✓")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {inviteMessage}
            </p>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Loading members...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => {
              // Check if this member is online using our presence store
              const isOnline = onlineUserIds.has(member.user.id);

              return (
                <div
                  key={member.user.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full bg-indigo-100 flex items-center
                                    justify-center text-indigo-700 font-semibold"
                    >
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Green dot if online */}
                    {isOnline && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 bg-green-400
                                       border-2 border-white rounded-full"
                      />
                    )}
                  </div>

                  {/* Name and email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-gray-400">{member.user.email}</p>
                  </div>

                  {/* Role badge */}
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full
                                    ${
                                      member.role === "Admin"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                  >
                    {member.role}
                  </span>

                  {/* Online status text */}
                  <span
                    className={`text-xs ${isOnline ? "text-green-500" : "text-gray-300"}`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
