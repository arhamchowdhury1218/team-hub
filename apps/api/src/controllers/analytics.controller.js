import { prisma } from "../lib/prisma.js";

// ─── GET WORKSPACE ANALYTICS ──────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/analytics
export const getAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check membership
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // ── Calculate "start of this week" ────────────────────────────────────────
    // We use this to find items completed THIS week
    const now = new Date();
    const startOfWeek = new Date(now);
    // getDay() returns 0 (Sunday) to 6 (Saturday)
    // We subtract that many days to get back to Sunday midnight
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0); // set to midnight

    // ── Run all queries in parallel ───────────────────────────────────────────
    // Promise.all runs all these database queries at the same time
    // instead of waiting for each one to finish before starting the next
    // This is much faster than running them sequentially
    const [
      totalGoals,
      activeGoals,
      completedGoals,
      overdueGoals,
      totalActionItems,
      completedThisWeek,
      overdueItems,
      goalsByStatus,
      recentActivity,
    ] = await Promise.all([
      // Total number of goals in this workspace
      prisma.goal.count({ where: { workspaceId } }),

      // Goals currently active
      prisma.goal.count({ where: { workspaceId, status: "active" } }),

      // Goals marked as completed
      prisma.goal.count({ where: { workspaceId, status: "completed" } }),

      // Goals marked as overdue
      prisma.goal.count({ where: { workspaceId, status: "overdue" } }),

      // Total action items
      prisma.actionItem.count({ where: { workspaceId } }),

      // Action items moved to "done" this week
      prisma.actionItem.count({
        where: {
          workspaceId,
          status: "done",
          // updatedAt >= start of this week
          updatedAt: { gte: startOfWeek },
        },
      }),

      // Action items that are overdue
      // (not done AND have a due date in the past)
      prisma.actionItem.count({
        where: {
          workspaceId,
          status: { not: "done" },
          dueDate: { lt: now }, // lt = less than (before now)
        },
      }),

      // Goals grouped by status for the chart
      // This returns: [{ status: 'active', _count: 3 }, ...]
      prisma.goal.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: true,
      }),

      // Last 5 goals created — for the recent activity feed
      prisma.goal.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          owner: {
            select: { name: true },
          },
        },
      }),
    ]);

    // ── Format chart data ─────────────────────────────────────────────────────
    // Convert the groupBy result into a clean array for Recharts
    // Recharts expects: [{ name: 'Active', value: 3 }, ...]
    const chartData = [
      { name: "Active", value: 0 },
      { name: "Completed", value: 0 },
      { name: "Overdue", value: 0 },
    ];

    goalsByStatus.forEach((group) => {
      if (group.status === "active") chartData[0].value = group._count;
      if (group.status === "completed") chartData[1].value = group._count;
      if (group.status === "overdue") chartData[2].value = group._count;
    });

    res.json({
      stats: {
        totalGoals,
        activeGoals,
        completedGoals,
        overdueGoals,
        totalActionItems,
        completedThisWeek,
        overdueItems,
      },
      chartData,
      recentActivity,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── EXPORT WORKSPACE DATA AS CSV ────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/analytics/export
export const exportCSV = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check membership
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // Fetch all action items with their details
    const actionItems = await prisma.actionItem.findMany({
      where: { workspaceId },
      include: {
        assignee: { select: { name: true } },
        goal: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Build CSV string manually ─────────────────────────────────────────────
    // CSV = comma separated values
    // First line = headers, rest = data rows
    const headers = [
      "Title",
      "Status",
      "Priority",
      "Assignee",
      "Goal",
      "Due Date",
      "Created",
    ];

    const rows = actionItems.map((item) => [
      // Wrap values in quotes to handle commas inside values
      `"${item.title}"`,
      item.status,
      item.priority,
      item.assignee?.name || "Unassigned",
      `"${item.goal?.title || "None"}"`,
      item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "None",
      new Date(item.createdAt).toLocaleDateString(),
    ]);

    // Join each row with commas, join all rows with newlines
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );

    // Set response headers to tell the browser this is a file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="workspace-export.csv"',
    );

    // Send the CSV string as the response body
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
