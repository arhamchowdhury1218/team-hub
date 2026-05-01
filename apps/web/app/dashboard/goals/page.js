"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useGoalStore } from "@/store/goal.store";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import GoalCard from "@/components/goals/GoalCard";

export default function GoalsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { goals, isLoading, fetchGoals } = useGoalStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch goals whenever the active workspace changes
  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchGoals(activeWorkspace.id);
    }
  }, [activeWorkspace?.id, fetchGoals]);

  // Filter goals by status
  const filteredGoals = goals.filter((g) => {
    if (statusFilter === "all") return true;
    return g.status === statusFilter;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your team's objectives and key results
          </p>
        </div>

        {/* Create goal button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white
                     text-sm font-medium rounded-lg transition"
        >
          + New goal
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "active", "completed", "overdue"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize
                        ${
                          statusFilter === s
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-gray-500 hover:bg-gray-100"
                        }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading goals...
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            {statusFilter === "all"
              ? "No goals yet. Create your first goal!"
              : `No ${statusFilter} goals.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              workspaceId={activeWorkspace.id}
            />
          ))}
        </div>
      )}

      {/* Create goal modal */}
      {showCreateModal && (
        <CreateGoalModal
          workspaceId={activeWorkspace.id}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
