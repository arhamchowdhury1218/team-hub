import { prisma } from "../lib/prisma.js";

// ─── CREATE WORKSPACE ─────────────────────────────────────────────────────────
// POST /api/workspaces
// Creates a new workspace and makes the creator an Admin automatically

export const createWorkspace = async (req, res) => {
  try {
    const { name, description, accentColor } = req.body;

    // req.user comes from the protect middleware
    // it contains the logged in user's id
    const userId = req.user.id;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Workspace name is required." });
    }

    // Use a Prisma "transaction" here
    // A transaction means: run ALL of these database operations together
    // If any one of them fails, ALL of them are rolled back (undone)
    // This prevents a workspace being created without an Admin member
    const workspace = await prisma.$transaction(async (tx) => {
      // Step 1: create the workspace record
      const newWorkspace = await tx.workspace.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          // Use provided color or fall back to default indigo
          accentColor: accentColor || "#6366f1",
        },
      });

      // Step 2: add the creator as an Admin member of this workspace
      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: newWorkspace.id,
          role: "Admin", // creator always gets Admin role
        },
      });

      return newWorkspace;
    });

    // Return the full workspace with member count
    res.status(201).json({
      message: "Workspace created successfully.",
      workspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── GET MY WORKSPACES ────────────────────────────────────────────────────────
// GET /api/workspaces
// Returns all workspaces the logged-in user is a member of

export const getMyWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all WorkspaceMember records for this user
    // and include the full workspace data with each one
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            // Also count how many members each workspace has
            _count: {
              select: { members: true },
            },
          },
        },
      },
      // Most recently joined workspaces first
      orderBy: { joinedAt: "desc" },
    });

    // Reshape the data to be cleaner for the frontend
    // Instead of { role, workspace: { id, name... } }
    // Return:     { id, name, role, memberCount... }
    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      description: m.workspace.description,
      accentColor: m.workspace.accentColor,
      memberCount: m.workspace._count.members,
      role: m.role, // the user's role in THIS workspace
      joinedAt: m.joinedAt,
    }));

    res.json({ workspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── GET SINGLE WORKSPACE ─────────────────────────────────────────────────────
// GET /api/workspaces/:id
// Returns one workspace with its members list

export const getWorkspace = async (req, res) => {
  try {
    const { id } = req.params; // :id from the URL
    const userId = req.user.id;

    // First check if this user is actually a member of this workspace
    // We never return workspace data to non-members
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        // This uses the @@unique([userId, workspaceId]) we defined in schema
        userId_workspaceId: { userId, workspaceId: id },
      },
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace." });
    }

    // Fetch the workspace with all its members and their user info
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            // For each member record, also get the user's name and avatar
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    res.json({ workspace, userRole: membership.role });
  } catch (error) {
    console.error("Get workspace error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── UPDATE WORKSPACE ─────────────────────────────────────────────────────────
// PATCH /api/workspaces/:id
// Updates workspace name, description, or accent color
// Only Admins can do this

export const updateWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, accentColor } = req.body;

    // Check the user is an Admin of this workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });

    if (!membership || membership.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admins can update the workspace." });
    }

    // Update only the fields that were provided
    // The "?? existing" pattern means "use new value if provided, else keep existing"
    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(accentColor && { accentColor }),
      },
    });

    res.json({ message: "Workspace updated.", workspace });
  } catch (error) {
    console.error("Update workspace error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── INVITE MEMBER ────────────────────────────────────────────────────────────
// POST /api/workspaces/:id/invite
// Adds a user to the workspace by email
// Only Admins can invite

export const inviteMember = async (req, res) => {
  try {
    const { id } = req.params; // workspace id
    const { email, role } = req.body; // email of person to invite
    const userId = req.user.id;

    // Only admins can invite
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });

    if (!membership || membership.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admins can invite members." });
    }

    // Find the user being invited by their email
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!invitedUser) {
      return res
        .status(404)
        .json({ message: "No account found with that email." });
    }

    // Check if they're already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitedUser.id,
          workspaceId: id,
        },
      },
    });

    if (existingMember) {
      return res
        .status(409)
        .json({ message: "This user is already a member." });
    }

    // Add them as a member with the specified role (default: Member)
    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: invitedUser.id,
        workspaceId: id,
        role: role === "Admin" ? "Admin" : "Member",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json({
      message: `${invitedUser.name} has been added to the workspace.`,
      member: newMember,
    });
  } catch (error) {
    console.error("Invite member error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ─── REMOVE MEMBER ────────────────────────────────────────────────────────────
// DELETE /api/workspaces/:id/members/:memberId
// Removes a member from the workspace
// Only Admins can remove members

export const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.id;

    // Check the requester is an Admin
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });

    if (!membership || membership.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admins can remove members." });
    }

    // Prevent removing yourself
    if (memberId === userId) {
      return res.status(400).json({ message: "You cannot remove yourself." });
    }

    // Delete the membership record
    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: id,
        },
      },
    });

    res.json({ message: "Member removed successfully." });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
