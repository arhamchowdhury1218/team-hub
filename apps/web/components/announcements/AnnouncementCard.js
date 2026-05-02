"use client";

import { useAnnouncementStore } from "@/store/announcement.store";

export default function AnnouncementCard({
  announcement,
  workspaceId,
  isAdmin,
}) {
  const { togglePin, deleteAnnouncement } = useAnnouncementStore();

  const handleDelete = async () => {
    if (confirm(`Delete "${announcement.title}"? This cannot be undone.`)) {
      await deleteAnnouncement(workspaceId, announcement.id);
    }
  };

  const handleTogglePin = async () => {
    await togglePin(workspaceId, announcement.id);
  };

  // Format date nicely
  const formattedDate = new Date(announcement.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <div
      className={`bg-white rounded-xl border p-6 transition
                    ${
                      announcement.pinned
                        ? "border-indigo-200 shadow-sm" // pinned gets a colored border
                        : "border-gray-200"
                    }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Pinned badge */}
          {announcement.pinned && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium
                             text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-2"
            >
              {/* Pin icon using unicode */}
              📌 Pinned
            </span>
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900">
            {announcement.title}
          </h3>

          {/* Date */}
          <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Pin / unpin button */}
            <button
              onClick={handleTogglePin}
              title={announcement.pinned ? "Unpin" : "Pin to top"}
              className={`text-sm px-2 py-1 rounded-lg transition
                          ${
                            announcement.pinned
                              ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                              : "text-gray-400 hover:bg-gray-100"
                          }`}
            >
              {announcement.pinned ? "Unpin" : "Pin"}
            </button>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="text-gray-300 hover:text-red-400 transition text-xl leading-none"
              title="Delete announcement"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {/* whitespace-pre-wrap preserves line breaks the user typed */}
      <p className="mt-4 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
        {announcement.content}
      </p>
    </div>
  );
}
