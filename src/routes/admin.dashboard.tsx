import { createFileRoute, Link } from "@tanstack/react-router";
import { memo } from "react";
import {
  Users,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Wallet,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { adminDashboard, type AdminDashboardStats } from "@/lib/admin-api";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — TechHub" }] }),
  component: AdminDashboardPage,
});

const StatCard = memo(function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-32" />
        ) : (
          <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
        )}
        {hint && !loading && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
});

function AdminDashboardPage() {
  const { data: stats, isLoading, isError, error } = useQuery<AdminDashboardStats>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminDashboard.getStats(),
    staleTime: 60_000,
  });

  const recentTx = stats?.recent_transactions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of platform activity and key metrics."
      />

      {isError && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-destructive">
              Failed to load dashboard: {error?.message || "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.total_users?.toLocaleString() ?? "0"}
          icon={Users}
          hint={`${stats?.active_users ?? 0} active`}
          loading={isLoading}
        />
        <StatCard
          label="Total Transactions"
          value={stats?.total_transactions?.toLocaleString() ?? "0"}
          icon={ArrowLeftRight}
          hint={`${stats?.pending_transactions ?? 0} pending`}
          loading={isLoading}
        />
        <StatCard
          label="Transaction Volume"
          value={formatNaira(stats?.total_volume ?? 0)}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatCard
          label="Revenue"
          value={formatNaira(stats?.revenue ?? 0)}
          icon={Banknote}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Wallet Balance"
          value={formatNaira(stats?.wallet_balance ?? 0)}
          icon={Wallet}
          loading={isLoading}
        />
        <StatCard
          label="Pending Transactions"
          value={String(stats?.pending_transactions ?? 0)}
          icon={Clock}
          hint="Requires attention"
          loading={isLoading}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground">
                Latest platform activity
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/transactions">
                View all <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      </TableRow>
                    ))
                  : recentTx.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          {tx.reference}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tx.user
                            ? `${tx.user.first_name} ${tx.user.last_name}`
                            : "—"}
                        </TableCell>
                        <TableCell className="font-medium">{tx.service}</TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${tx.direction === "in" ? "text-[color:var(--success)]" : ""}`}
                        >
                          {tx.direction === "in" ? "+" : "-"}
                          {formatNaira(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tx.status === "completed"
                                ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent"
                                : tx.status === "pending"
                                  ? "bg-[color:oklch(0.96_0.08_75)] text-[color:oklch(0.45_0.15_75)] border-transparent"
                                  : "bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)] border-transparent"
                            }
                          >
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && recentTx.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
