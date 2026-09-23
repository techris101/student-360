"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Calendar,
  Sparkles,
  Users,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/app/actions/notifications";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";

interface NotificationsListProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export function NotificationsList({
  initialNotifications,
  initialUnreadCount,
}: NotificationsListProps) {
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);
  const [markingAll, setMarkingAll] = React.useState(false);

  const handleMarkRead = async (id: string) => {
    // Optimistic
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await markNotificationReadAction(id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: now })));
    setUnreadCount(0);

    try {
      await markAllNotificationsReadAction();
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "deadline_reminder":
        return <Calendar size={16} strokeWidth={1.5} className="text-[var(--amber)]" />;
      case "eligible_opportunity":
        return <Sparkles size={16} strokeWidth={1.5} className="text-[var(--teal)]" />;
      case "cohort_activity":
        return <Users size={16} strokeWidth={1.5} className="text-[var(--ink)]" />;
      default:
        return <Bell size={16} strokeWidth={1.5} className="text-[var(--ink-2)]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Recent updates
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--teal)] text-white">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs h-8 text-[var(--ink-2)] hover:text-[var(--ink)]"
          >
            <CheckCheck size={14} className="mr-1.5" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--ink-2)]">
          <Bell size={24} strokeWidth={1.5} className="mx-auto mb-2 opacity-50" />
          <p>No notifications yet.</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            When new matching opportunities, deadline reminders, or cohort messages
            arrive, they will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)] rounded-[6px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
          {notifications.map((item) => {
            const isUnread = !item.read_at;

            return (
              <div
                key={item.id}
                className={`p-4 transition-colors flex items-start gap-3.5 ${
                  isUnread ? "bg-[var(--surface-2)]/40" : "bg-[var(--surface)]"
                }`}
              >
                {/* Kind Icon */}
                <div className="p-2 rounded-[4px] bg-[var(--surface)] border border-[var(--line)] shrink-0 mt-0.5">
                  {getKindIcon(item.kind)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span
                          className="h-2 w-2 rounded-full bg-[var(--teal)] shrink-0"
                          title="Unread"
                        />
                      )}
                      <span className="text-sm font-semibold text-[var(--ink)]">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {formatTimestamp(item.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    {item.link && (
                      <Link
                        href={item.link}
                        className="text-xs font-medium text-[var(--teal)] hover:underline"
                        onClick={() => {
                          if (isUnread) handleMarkRead(item.id);
                        }}
                      >
                        View details
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(item.id)}
                        className="text-xs text-[var(--muted)] hover:text-[var(--ink)] inline-flex items-center gap-1"
                      >
                        <Check size={12} />
                        <span>Mark as read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
