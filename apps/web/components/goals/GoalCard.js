"use client";

import { useState } from "react";
import { useGoalStore } from "@/store/goal.store";
import MilestoneItem from "./MilestoneItem";

// Status badge colors
const STATUS_STYLES = {
  active: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
};

export default function GoalCard({ goal, workspaceId }) {
  // Controls whether the milestones section is expanded
  const [expanded, setExpanded] = useState(false);
  // Controls the "add milestone" input
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");

  const { updateGoal, deleteGoal, createMilestone } = useGoalStore();

  // Calculate overall progress from milestones
  // If no milestones, progress is 0
  const avgProgress =
    goal.milestones.length > 0
      ? Math.round(
          goal.milestones.reduce((sum, m) => sum + m.progress, 0) /
            goal.milestones.length,
        )
      : 0;

  // Format the due date nicely
  const formattedDue = goal.dueDate
    ? new Date(goal.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handleStatusChange = async (newStatus) => {
    await updateGoal(workspaceId, goal.id, { status: newStatus });
  };

  const handleDelete = async () => {
    // Simple confirmation before deleting
    if (confirm(`Delete goal "${goal.title}"? This cannot be undone.`)) {
      await deleteGoal(workspaceId, goal.id);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;

    const success = await createMilestone(workspaceId, goal.id, {
      title: milestoneTitle,
      progress: 0,
    });

    if (success) {
      setMilestoneTitle("");
      setShowMilestoneInput(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      {/* Goal header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>

          {/* Description */}
          {goal.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {goal.description}
            </p>
          )}

          {/* Meta row: owner, due date */}
          <div className="flex items-center gap-4 mt-2">
            {/* Owner avatar + name */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full bg-indigo-100 flex items-center
                              justify-center text-indigo-700 text-xs font-semibold"
              >
                {goal.owner.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-500">{goal.owner.name}</span>
            </div>

            {/* Due date */}
            {formattedDue && (
              <span className="text-xs text-gray-400">Due {formattedDue}</span>
            )}

            {/* Milestone count */}
            {goal.milestones.length > 0 && (
              <span className="text-xs text-gray-400">
                {goal.milestones.filter((m) => m.completed).length}/
                {goal.milestones.length} milestones
              </span>
            )}
          </div>
        </div>

        {/* Right side: status badge + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status dropdown */}
          <select
            value={goal.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-xs font-medium px-2 py-1 rounded-full border-0
                        cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500
                        ${STATUS_STYLES[goal.status] || STATUS_STYLES.active}`}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-400 transition text-lg leading-none"
            title="Delete goal"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {goal.milestones.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Overall progress</span>
            <span className="text-xs font-medium text-gray-600">
              {avgProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestones section */}
      <div className="mt-4">
        {/* Toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-600 hover:underline"
        >
          {expanded
            ? "Hide milestones"
            : `Show milestones (${goal.milestones.length})`}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {/* List of milestones */}
            {goal.milestones.length === 0 ? (
              <p className="text-xs text-gray-400">No milestones yet.</p>
            ) : (
              goal.milestones.map((milestone) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  workspaceId={workspaceId}
                  goalId={goal.id}
                />
              ))
            )}

            {/* Add milestone input */}
            {showMilestoneInput ? (
              <form onSubmit={handleAddMilestone} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="Milestone title..."
                  autoFocus
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneInput(false)}
                  className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowMilestoneInput(true)}
                className="text-xs text-gray-400 hover:text-indigo-600 mt-1 transition"
              >
                + Add milestone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
