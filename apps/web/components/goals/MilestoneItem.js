"use client";

import { useState } from "react";
import { useGoalStore } from "@/store/goal.store";

export default function MilestoneItem({ milestone, workspaceId, goalId }) {
  // Local state for editing the progress slider
  const [progress, setProgress] = useState(milestone.progress);
  const [isSaving, setIsSaving] = useState(false);

  const { updateMilestone, deleteMilestone } = useGoalStore();

  // Called when user releases the slider
  const handleProgressChange = async (newProgress) => {
    setIsSaving(true);
    await updateMilestone(workspaceId, goalId, milestone.id, {
      progress: newProgress,
      // Mark as completed if progress reaches 100
      completed: newProgress === 100,
    });
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await deleteMilestone(workspaceId, goalId, milestone.id);
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group">
      {/* Completed checkbox */}
      <input
        type="checkbox"
        checked={milestone.completed}
        onChange={(e) => {
          const newProgress = e.target.checked ? 100 : 0;
          setProgress(newProgress);
          handleProgressChange(newProgress);
        }}
        className="w-4 h-4 rounded accent-indigo-600 cursor-pointer shrink-0"
      />

      {/* Milestone title */}
      <span
        className={`text-sm flex-1 ${milestone.completed ? "line-through text-gray-400" : "text-gray-700"}`}
      >
        {milestone.title}
      </span>

      {/* Progress slider */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          // Only save to backend when user releases the slider (not on every pixel move)
          onMouseUp={() => handleProgressChange(progress)}
          onTouchEnd={() => handleProgressChange(progress)}
          className="w-20 accent-indigo-600"
        />
        <span className="text-xs text-gray-400 w-8 text-right">
          {isSaving ? "..." : `${progress}%`}
        </span>
      </div>

      {/* Delete button — only visible on hover */}
      <button
        onClick={handleDelete}
        className="text-gray-300 hover:text-red-400 transition opacity-0
                   group-hover:opacity-100 text-base leading-none"
        title="Delete milestone"
      >
        ×
      </button>
    </div>
  );
}
