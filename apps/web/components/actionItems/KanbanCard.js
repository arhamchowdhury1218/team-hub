"use client";

import { useActionItemStore } from "@/store/actionItem.store";

// Priority badge styles
const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export default function KanbanCard({ item, workspaceId, onDragStart }) {
  const { deleteActionItem } = useActionItemStore();

  const handleDelete = async (e) => {
    // Stop the click from triggering the drag
    e.stopPropagation();
    if (confirm(`Delete "${item.title}"?`)) {
      await deleteActionItem(workspaceId, item.id);
    }
  };

  const formattedDue = item.dueDate
    ? new Date(item.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      // draggable="true" makes this element draggable
      draggable="true"
      onDragStart={(e) => onDragStart(e, item.id)}
      className="bg-white rounded-lg border border-gray-200 p-3
                 cursor-grab active:cursor-grabbing hover:shadow-sm
                 transition group"
    >
      {/* Title + delete button */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
          {item.title}
        </p>
        <button
          onClick={handleDelete}
          className="text-gray-300 hover:text-red-400 transition text-base
                     leading-none opacity-0 group-hover:opacity-100 shrink-0"
        >
          ×
        </button>
      </div>

      {/* Linked goal */}
      {item.goal && (
        <p className="text-xs text-indigo-500 mt-1.5 truncate">
          ↗ {item.goal.title}
        </p>
      )}

      {/* Footer: priority + assignee + due date */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {/* Priority badge */}
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize
                          ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium}`}
        >
          {item.priority}
        </span>

        {/* Due date */}
        {formattedDue && (
          <span className="text-xs text-gray-400">{formattedDue}</span>
        )}

        {/* Assignee avatar */}
        {item.assignee && (
          <div className="ml-auto flex items-center gap-1">
            <div
              className="w-5 h-5 rounded-full bg-indigo-100 flex items-center
                            justify-center text-indigo-700 text-xs font-semibold"
            >
              {item.assignee.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
