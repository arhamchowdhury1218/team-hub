"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useActionItemStore } from "@/store/actionItem.store";
import KanbanBoard from "@/components/actionItems/KanbanBoard";
import ListView from "@/components/actionItems/ListView";
import CreateActionItemModal from "@/components/actionItems/CreateActionItemModal";

export default function ActionItemsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { actionItems, isLoading, fetchActionItems } = useActionItemStore();

  // Toggle between 'kanban' and 'list' view
  const [view, setView] = useState("kanban");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchActionItems(activeWorkspace.id);
    }
  }, [activeWorkspace?.id, fetchActionItems]);

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Select a workspace first.</p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track tasks and who is responsible for them
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle: Kanban / List */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition
                          ${
                            view === "kanban"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition
                          ${
                            view === "list"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
            >
              List
            </button>
          </div>

          {/* Create button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white
                       text-sm font-medium rounded-lg transition"
          >
            + New item
          </button>
        </div>
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading action items...
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          actionItems={actionItems}
          workspaceId={activeWorkspace.id}
        />
      ) : (
        <ListView actionItems={actionItems} workspaceId={activeWorkspace.id} />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateActionItemModal
          workspaceId={activeWorkspace.id}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
