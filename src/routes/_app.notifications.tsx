import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, useMarkAllNotificationsRead } from "@/lib/queries";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Techub" }] }),
  component: NotificationsPage,
});

const toneMap: Record<string, string> = {
  success: "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.4_0.15_155)]",
  primary: "bg-accent text-accent-foreground",
  warning: "bg-[color:oklch(0.96_0.08_75)] text-[color:oklch(0.45_0.15_75)]",
  muted: "bg-muted text-muted-foreground",
};

function getNotificationTone(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("success") || lower.includes("completed")) return "success";
  if (lower.includes("warning") || lower.includes("alert") || lower.includes("new device"))
    return "warning";
  if (lower.includes("feature") || lower.includes("new")) return "primary";
  return "muted";
}

function getNotificationIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("success") || lower.includes("completed")) return CheckCircle2;
  if (lower.includes("warning") || lower.includes("alert") || lower.includes("new device"))
    return AlertCircle;
  if (lower.includes("feature") || lower.includes("new")) return Bell;
  return Info;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data ?? [];

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: (err) => toast.error(err.message ?? "Failed to mark notifications"),
    });
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay on top of transactions and account activity."
        actions={
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            {markAllRead.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mark all read
          </Button>
        }
      />
      <Card>
        <CardContent className="p-2 sm:p-4">
          {notificationsQuery.isLoading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-start gap-3 p-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3.5 w-64" />
                  </div>
                </li>
              ))}
            </ul>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = getNotificationIcon(n.title);
                const tone = n.read_at ? "muted" : getNotificationTone(n.title);
                return (
                  <li key={n.id} className="flex items-start gap-3 p-4">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${toneMap[tone]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold">{n.title}</div>
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
