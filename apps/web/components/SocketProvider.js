"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useActionItemStore } from "@/store/actionItem.store";
import { useAnnouncementStore } from "@/store/announcement.store";
import socket from "@/lib/socket";
import { SocketProvider } from "@/components/SocketProvider";
import { usePresenceStore } from "@/store/presence.store";

export function SocketProvider({ children }) {
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { actionItems } = useActionItemStore();

  // ── Connect / disconnect based on login state ───────────────────────────────
  useEffect(() => {
    if (user) {
      // User is logged in — connect the socket
      socket.connect();
    } else {
      // User logged out — disconnect
      socket.disconnect();
    }

    // Cleanup: disconnect when component unmounts
    return () => {
      socket.disconnect();
    };
  }, [user]);
  // ── Listen for online presence events ───────────────────────────────────────
  useEffect(() => {
    const { setOnlineUsers, addOnlineUser, removeOnlineUser } =
      usePresenceStore.getState();

    // Full list when we first join the workspace
    socket.on("members:online_list", ({ userIds }) => {
      setOnlineUsers(userIds);
    });

    // Someone came online
    socket.on("member:online", ({ userId }) => {
      addOnlineUser(userId);
    });

    // Someone went offline
    socket.on("member:offline", ({ userId }) => {
      removeOnlineUser(userId);
    });

    return () => {
      socket.off("members:online_list");
      socket.off("member:online");
      socket.off("member:offline");
    };
  }, []);

  // ── Join workspace room when active workspace changes ───────────────────────
  useEffect(() => {
    if (activeWorkspace?.id && socket.connected) {
      // Tell the server we're viewing this workspace
      socket.emit("workspace:join", activeWorkspace.id);
    }
  }, [activeWorkspace?.id]);

  // Also join when socket first connects (in case workspace was already set)
  useEffect(() => {
    const handleConnect = () => {
      if (activeWorkspace?.id) {
        socket.emit("workspace:join", activeWorkspace.id);
      }
    };

    socket.on("connect", handleConnect);
    return () => socket.off("connect", handleConnect);
  }, [activeWorkspace?.id]);

  // ── Listen for action item events ───────────────────────────────────────────
  useEffect(() => {
    // New action item created by someone else
    const handleItemCreated = ({ actionItem }) => {
      // Only add it if it's not already in our local list
      // (the creator already added it optimistically)
      useActionItemStore.setState((state) => {
        const exists = state.actionItems.some((i) => i.id === actionItem.id);
        if (exists) return state;
        return { actionItems: [actionItem, ...state.actionItems] };
      });
    };

    // Action item updated (e.g. dragged to different column)
    const handleItemUpdated = ({ actionItem }) => {
      useActionItemStore.setState((state) => ({
        actionItems: state.actionItems.map((i) =>
          i.id === actionItem.id ? actionItem : i,
        ),
      }));
    };

    // Action item deleted
    const handleItemDeleted = ({ itemId }) => {
      useActionItemStore.setState((state) => ({
        actionItems: state.actionItems.filter((i) => i.id !== itemId),
      }));
    };

    // Register all listeners
    socket.on("action_item:created", handleItemCreated);
    socket.on("action_item:updated", handleItemUpdated);
    socket.on("action_item:deleted", handleItemDeleted);

    // Cleanup: remove listeners when component re-renders or unmounts
    // Without cleanup, you'd get duplicate listeners stacking up
    return () => {
      socket.off("action_item:created", handleItemCreated);
      socket.off("action_item:updated", handleItemUpdated);
      socket.off("action_item:deleted", handleItemDeleted);
    };
  }, []);

  // ── Listen for announcement events ──────────────────────────────────────────
  useEffect(() => {
    const handleAnnouncementCreated = ({ announcement }) => {
      useAnnouncementStore.setState((state) => {
        const exists = state.announcements.some(
          (a) => a.id === announcement.id,
        );
        if (exists) return state;
        return { announcements: [announcement, ...state.announcements] };
      });
    };

    const handleAnnouncementUpdated = ({ announcement }) => {
      useAnnouncementStore.setState((state) => {
        const updated = state.announcements.map((a) =>
          a.id === announcement.id ? announcement : a,
        );
        // Re-sort: pinned first
        updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return { announcements: updated };
      });
    };

    const handleAnnouncementDeleted = ({ announcementId }) => {
      useAnnouncementStore.setState((state) => ({
        announcements: state.announcements.filter(
          (a) => a.id !== announcementId,
        ),
      }));
    };

    socket.on("announcement:created", handleAnnouncementCreated);
    socket.on("announcement:updated", handleAnnouncementUpdated);
    socket.on("announcement:deleted", handleAnnouncementDeleted);

    return () => {
      socket.off("announcement:created", handleAnnouncementCreated);
      socket.off("announcement:updated", handleAnnouncementUpdated);
      socket.off("announcement:deleted", handleAnnouncementDeleted);
    };
  }, []);

  // Just renders children — this component is invisible
  return children;
}
