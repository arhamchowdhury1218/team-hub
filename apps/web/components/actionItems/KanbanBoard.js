"use client";

import { useActionItemStore } from "@/store/actionItem.store";
import KanbanCard from "./KanbanCard";

// The three columns on the Kanban board
// Each maps to a "status" value in the database
const COLUMNS = [
  { id: "todo", label: "To Do", color: "bg-gray-100" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-50" },
  { id: "done", label: "Done", color: "bg-green-50" },
];

export default function KanbanBoard({ actionItems, workspaceId }) {
  const { moveItem, updateActionItem } = useActionItemStore();

  // ── Drag and drop handlers ──────────────────────────────────────────────────
  // HTML5 drag and drop API — built into the browser, no library needed

  // Called when a card starts being dragged
  // We store the item's id in the dataTransfer object
  const handleDragStart = (e, itemId) => {
    e.dataTransfer.setData("itemId", itemId);
  };

  // Called when a dragged card is hovering over a column
  // We must call preventDefault() to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Called when a card is dropped onto a column
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();

    // Read the item id we stored on drag start
    const itemId = e.dataTransfer.getData("itemId");

    // Find the item to check its current status
    const item = actionItems.find((i) => i.id === itemId);

    // Don't do anything if dropped in the same column
    if (!item || item.status === newStatus) return;

    // Update locally first for instant visual feedback (optimistic UI)
    moveItem(itemId, newStatus);

    // Then save to the backend
    await updateActionItem(workspaceId, itemId, { status: newStatus });
  };

  return (
    // Three equal-width columns side by side
    <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
      {COLUMNS.map((column) => {
        // Filter action items that belong to this column
        const columnItems = actionItems.filter(
          (item) => item.status === column.id,
        );

        return (
          <div
            key={column.id}
            // onDragOver and onDrop make this div a valid drop target
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`${column.color} rounded-xl p-4 flex flex-col min-h-64`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {column.label}
              </h3>
              {/* Item count badge */}
              <span className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full">
                {columnItems.length}
              </span>
            </div>

            {/* Cards in this column */}
            <div className="space-y-2 flex-1">
              {columnItems.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  Drop items here
                </p>
              ) : (
                columnItems.map((item) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    workspaceId={workspaceId}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
