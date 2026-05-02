"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAnnouncementStore } from "@/store/announcement.store";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import CreateAnnouncementModal from "@/components/announcements/CreateAnnouncementModal";

export default function AnnouncementsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { announcements, isLoading, fetchAnnouncements } =
    useAnnouncementStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check if current user is an Admin of this workspace
  // so we can show/hide the create button and pin/delete controls
  const isAdmin = activeWorkspace?.role === "Admin";

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchAnnouncements(activeWorkspace.id);
    }
  }, [activeWorkspace?.id, fetchAnnouncements]);

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Select a workspace first.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">
            Important updates from your team admins
          </p>
        </div>

        {/* Only Admins see the "Post announcement" button */}
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white
                       text-sm font-medium rounded-lg transition"
          >
            + Post announcement
          </button>
        )}
      </div>

      {/* Announcements feed */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            No announcements yet.
            {isAdmin && " Post one to keep your team informed."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              workspaceId={activeWorkspace.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          workspaceId={activeWorkspace.id}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
