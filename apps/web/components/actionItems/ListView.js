"use client";

import { useActionItemStore } from "@/store/actionItem.store";

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const STATUS_STYLES = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export default function ListView({ actionItems, workspaceId }) {
  const { updateActionItem, deleteActionItem } = useActionItemStore();

  const handleStatusChange = async (itemId, newStatus) => {
    await updateActionItem(workspaceId, itemId, { status: newStatus });
  };

  const handleDelete = async (item) => {
    if (confirm(`Delete "${item.title}"?`)) {
      await deleteActionItem(workspaceId, item.id);
    }
  };

  if (actionItems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">
          No action items yet. Create your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table header */}
      <div
        className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50
                      border-b border-gray-200 text-xs font-semibold
                      text-gray-500 uppercase tracking-wider"
      >
        <div className="col-span-5">Title</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Due</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-100">
        {actionItems.map((item) => {
          const formattedDue = item.dueDate
            ? new Date(item.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "—";

          return (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center
                         hover:bg-gray-50 transition group"
            >
              {/* Title + assignee */}
              <div className="col-span-5">
                <p className="text-sm font-medium text-gray-800">
                  {item.title}
                </p>
                {item.assignee && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.assignee.name}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="col-span-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                                  ${PRIORITY_STYLES[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>

              {/* Status dropdown */}
              <div className="col-span-2">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className={`text-xs font-medium px-2 py-1 rounded-full border-0
                              cursor-pointer focus:outline-none focus:ring-2
                              focus:ring-indigo-500
                              ${STATUS_STYLES[item.status]}`}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Due date */}
              <div className="col-span-2">
                <span className="text-xs text-gray-500">{formattedDue}</span>
              </div>

              {/* Delete */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => handleDelete(item)}
                  className="text-gray-300 hover:text-red-400 transition
                             opacity-0 group-hover:opacity-100 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
