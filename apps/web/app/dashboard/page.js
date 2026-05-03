"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace.store";
import { api } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Colors for each slice of the pie chart
// matches active=blue, completed=green, overdue=red
const CHART_COLORS = ["#6366f1", "#10b981", "#ef4444"];

// ── Stat Card component ────────────────────────────────────────────────────────
// A small reusable card that shows one number with a label
function StatCard({ label, value, sub, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspaceStore();

  // Analytics data from the backend
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch analytics whenever the workspace changes
  useEffect(() => {
    if (!activeWorkspace?.id) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await api.get(
          `/api/workspaces/${activeWorkspace.id}/analytics`,
        );
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [activeWorkspace?.id]);

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // We use fetch directly here (not our api helper)
      // because we need the raw response to create a file download
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspaces/${activeWorkspace.id}/analytics/export`,
        { credentials: "include" },
      );

      // Get the CSV text from the response
      const blob = await response.blob();

      // Create a temporary download link and click it programmatically
      // This is the standard browser trick for downloading files
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workspace-export.csv";
      a.click();

      // Clean up the temporary URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // ── No workspace selected ────────────────────────────────────────────────────
  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Team Hub!
          </h2>
          <p className="text-gray-500 text-sm">
            Create your first workspace using the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeWorkspace.accentColor }}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {activeWorkspace.name}
            </h1>
          </div>
          {activeWorkspace.description && (
            <p className="text-gray-500 text-sm ml-6">
              {activeWorkspace.description}
            </p>
          )}
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 border border-gray-300 hover:bg-gray-50
                     disabled:opacity-50 text-gray-600 text-sm
                     font-medium rounded-lg transition flex items-center gap-2"
        >
          {/* Download icon using unicode arrow */}
          {isExporting ? "Exporting..." : "↓ Export CSV"}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading analytics...
        </div>
      ) : analytics ? (
        <>
          {/* ── Stats grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total goals"
              value={analytics.stats.totalGoals}
              sub={`${analytics.stats.activeGoals} active`}
            />
            <StatCard
              label="Completed this week"
              value={analytics.stats.completedThisWeek}
              sub="action items done"
              color="text-green-600"
            />
            <StatCard
              label="Overdue items"
              value={analytics.stats.overdueItems}
              sub="need attention"
              color={
                analytics.stats.overdueItems > 0
                  ? "text-red-600"
                  : "text-gray-900"
              }
            />
            <StatCard
              label="Team members"
              value={activeWorkspace.memberCount}
              sub="in this workspace"
            />
          </div>

          {/* ── Chart + Activity row ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goal completion pie chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Goals by status
              </h2>

              {analytics.stats.totalGoals === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No goals yet
                </div>
              ) : (
                // ResponsiveContainer makes the chart fill its parent width
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={analytics.chartData}
                      // cx/cy = center x and y as percentage
                      cx="50%"
                      cy="50%"
                      // innerRadius makes it a donut chart (looks cleaner)
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {/* Each Cell colors one slice of the pie */}
                      {analytics.chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    {/* Tooltip shows on hover */}
                    <Tooltip
                      formatter={(value, name) => [`${value} goals`, name]}
                    />
                    {/* Legend shows color + label below chart */}
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent activity feed */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Recent goals
              </h2>

              {analytics.recentActivity.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No activity yet
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recentActivity.map((goal) => {
                    // Status dot color
                    const dotColor =
                      goal.status === "completed"
                        ? "bg-green-400"
                        : goal.status === "overdue"
                          ? "bg-red-400"
                          : "bg-indigo-400";

                    const formattedDate = new Date(
                      goal.createdAt,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={goal.id}
                        className="flex items-center gap-3 py-2
                                   border-b border-gray-50 last:border-0"
                      >
                        {/* Status dot */}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
                        />

                        {/* Goal info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {goal.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {goal.owner.name} · {formattedDate}
                          </p>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize
                                          shrink-0
                                          ${
                                            goal.status === "completed"
                                              ? "bg-green-100 text-green-700"
                                              : goal.status === "overdue"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-blue-100 text-blue-700"
                                          }`}
                        >
                          {goal.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
