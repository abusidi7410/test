import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  Send,
  ArrowDownToLine,
  Eye,
  EyeOff,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet, useTransactions } from "@/lib/queries";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/_app/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Techub" }] }),
  component: WalletPage,
});

function WalletPage() {
  const [show, setShow] = useState(true);
  const walletQuery = useWallet();
  const txQuery = useTransactions({ per_page: 8 });

  const wallet = walletQuery.data;
  const transactions = txQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet" description="Manage your balance, cards, and account activity." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-transparent text-white lg:col-span-2">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.22 27) 0%, oklch(0.35 0.15 27) 100%)",
            }}
          />
          <CardContent className="relative flex h-full flex-col justify-between p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/70">Techub Wallet</div>
                <div className="mt-1 text-sm text-white/80">Primary account</div>
              </div>
              <CreditCard className="h-6 w-6 text-white/80" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                Available balance
                <button
                  onClick={() => setShow((v) => !v)}
                  className="text-white/80"
                  aria-label="Toggle balance"
                >
                  {show ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
              {walletQuery.isLoading ? (
                <Skeleton className="mt-1 h-10 w-48 bg-white/20" />
              ) : (
                <div className="mt-1 text-4xl font-bold tabular-nums">
                  {show ? formatNaira(wallet?.balance ?? 0) : "₦ • • • •"}
                </div>
              )}
              <div className="mt-2 font-mono text-sm tracking-widest text-white/80">
                •••• •••• •••• 2431
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Button asChild size="lg" className="h-16 justify-start gap-3">
            <Link to="/fund-wallet">
              <PlusCircle className="h-5 w-5" />
              Fund Wallet
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16 justify-start gap-3">
            <Link to="/transfer">
              <Send className="h-5 w-5" />
              Transfer
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-16 justify-start gap-3 lg:col-span-1"
          >
            <Link to="/withdraw">
              <ArrowDownToLine className="h-5 w-5" />
              Withdraw
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Link to="/transactions" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {txQuery.isLoading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-lg ${t.direction === "in" ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.4_0.15_155)]" : "bg-accent text-accent-foreground"}`}
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
                      {new Date(t.created_at).toLocaleDateString()} • {t.reference}
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
                  No recent activity.
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
