import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Send,
  ArrowDownToLine,
  Smartphone,
  Wifi,
  Receipt,
  QrCode,
  TrendingUp,
  Wallet as WalletIcon,
  Gift,
  Users,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/lib/auth";
import { useWallet, useTransactions, useSpendingSummary } from "@/lib/queries";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Techub" },
      {
        name: "description",
        content: "Your Techub wallet, spending and quick actions in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

const quickActions = [
  { title: "Fund Wallet", to: "/fund-wallet", icon: PlusCircle },
  { title: "Transfer", to: "/transfer", icon: Send },
  { title: "Withdraw", to: "/withdraw", icon: ArrowDownToLine },
  { title: "Buy Airtime", to: "/airtime", icon: Smartphone },
  { title: "Buy Data", to: "/data", icon: Wifi },
  { title: "Pay Bills", to: "/electricity", icon: Receipt },
  { title: "Scan QR", to: "/transfer", icon: QrCode },
] as const;

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "primary";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div
          className={`mt-2 text-2xl font-bold tabular-nums ${tone === "primary" ? "text-primary" : ""}`}
        >
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { user: authUser } = useAuth();
  const walletQuery = useWallet();
  const txQuery = useTransactions({ per_page: 5 });
  const spendingQuery = useSpendingSummary();

  const wallet = walletQuery.data;
  const transactions = txQuery.data?.data ?? [];
  const spending = spendingQuery.data;

  const firstName = authUser?.first_name ?? authUser?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening with your money today."
        actions={
          <>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/transactions">View history</Link>
            </Button>
            <Button asChild>
              <Link to="/fund-wallet">
                <PlusCircle className="mr-2 h-4 w-4" />
                Fund Wallet
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card className="relative overflow-hidden border-transparent text-white">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(600px 200px at 100% 0%, oklch(0.62 0.22 27) 0%, transparent 60%), linear-gradient(135deg, oklch(0.2 0.03 260), oklch(0.15 0.02 260))",
              }}
            />
            <CardContent className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/60">
                    <WalletIcon className="h-3.5 w-3.5" /> Wallet Balance
                  </div>
                  {walletQuery.isLoading ? (
                    <Skeleton className="mt-2 h-10 w-48 bg-white/20" />
                  ) : (
                    <div className="mt-2 text-4xl font-bold tabular-nums sm:text-5xl">
                      {formatNaira(wallet?.balance ?? 0)}
                    </div>
                  )}
                  <div className="mt-1 text-sm text-white/60">
                    Daily limit: {formatNaira(wallet?.daily_limit ?? 0)} •{" "}
                    {authUser?.level ?? "Level 1"}
                  </div>
                </div>
                <Badge className="bg-white/10 text-white hover:bg-white/15">Active</Badge>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                  <Link to="/fund-wallet">
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Add funds
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <Link to="/transfer">
                    <Send className="mr-1.5 h-4 w-4" />
                    Transfer
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <Link to="/withdraw">
                    <ArrowDownToLine className="mr-1.5 h-4 w-4" />
                    Withdraw
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          {walletQuery.isLoading ? (
            <>
              <Card>
                <CardContent className="p-5">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Stat
                label="Today's spending"
                value={formatNaira(wallet?.spent_today ?? 0)}
                hint={spending?.today ? `↑ 8% vs yesterday` : undefined}
              />
              <Stat
                label="This month"
                value={formatNaira(wallet?.spent_month ?? 0)}
                hint={spending?.month ? `Across recent transactions` : undefined}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Referral earnings" value={formatNaira(0)} hint="Invite friends to earn" />
        <Stat label="Cashback" value={formatNaira(0)} hint="Redeemable anytime" />
        <Stat label="Rewards" value={`0 available`} hint="Complete tasks to earn" tone="primary" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Quick actions</h2>
              <p className="text-xs text-muted-foreground">Everything you need, one tap away.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {quickActions.map((a) => (
              <Link
                key={a.title}
                to={a.to}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{a.title}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Weekly spending</h2>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" /> +12%
              </Badge>
            </div>
            <div className="h-64">
              {spendingQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={spending?.series ?? []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatNaira(v)}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#spend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Latest transactions</h2>
              <Link to="/transactions" className="text-xs font-medium text-primary hover:underline">
                See all
              </Link>
            </div>
            {txQuery.isLoading ? (
              <ul className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {transactions.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.direction === "in" ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.4_0.15_155)]" : "bg-accent text-accent-foreground"}`}
                    >
                      {t.direction === "in" ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.service}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold tabular-nums ${t.direction === "in" ? "text-[color:var(--success)]" : ""}`}
                    >
                      {t.direction === "in" ? "+" : "-"}
                      {formatNaira(t.amount)}
                    </div>
                  </li>
                ))}
                {transactions.length === 0 && (
                  <li className="py-6 text-center text-sm text-muted-foreground">
                    No transactions yet.
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: Gift,
            title: "Buy Gift Cards",
            desc: "Amazon, Google Play, Steam and more at the best rates.",
            to: "/gift-cards",
          },
          {
            icon: Users,
            title: "Refer & earn",
            desc: `Earn up to ${formatNaira(2000)} for every friend you invite.`,
            to: "/referrals",
          },
          {
            icon: Sparkles,
            title: "Upgrade to Level 3",
            desc: "Unlock higher limits and premium perks.",
            to: "/profile",
          },
        ].map((p) => (
          <Link key={p.title} to={p.to} className="group">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {p.title}{" "}
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
