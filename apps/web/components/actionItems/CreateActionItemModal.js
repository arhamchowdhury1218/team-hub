"use client";

import { useState } from "react";
import { useActionItemStore } from "@/store/actionItem.store";

export default function CreateActionItemModal({ workspaceId, onClose }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { createActionItem } = useActionItemStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setIsSubmitting(true);
    const success = await createActionItem(workspaceId, {
      title,
      priority,
      dueDate,
    });
    setIsSubmitting(false);

    if (success) onClose();
    else setError("Failed to create action item. Please try again.");
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Create an action item
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          A task that needs to get done.
        </p>

        {error && (
          <div
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg
                          text-red-600 text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write Q3 report"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="flex gap-2">
              {["low", "medium", "high"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize
                              transition border
                              ${
                                priority === p
                                  ? p === "high"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : p === "medium"
                                      ? "bg-amber-100 text-amber-700 border-amber-200"
                                      : "bg-gray-100 text-gray-700 border-gray-200"
                                  : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                              }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due date
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm
                         text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-400 text-white rounded-lg text-sm
                         font-medium transition"
            >
              {isSubmitting ? "Creating..." : "Create item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
