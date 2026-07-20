import { createFileRoute } from "@tanstack/react-router";
import { Copy, Share2, Users, Gift } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useReferrals } from "@/lib/queries";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/_app/referrals")({
  head: () => ({ meta: [{ title: "Referrals — TechHub" }] }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const referralsQuery = useReferrals();
  const data = referralsQuery.data;
  const link = data?.referral_link ?? "";
  const totalInvited = data?.referrals?.length ?? 0;
  const totalEarned = data?.total_earned ?? 0;
  const pendingRewards =
    data?.referrals?.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.earned, 0) ??
    0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refer & earn"
        description="Invite friends and earn rewards for every successful signup."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { label: "Total invited", value: String(totalInvited), icon: Users },
          { label: "Total earned", value: formatNaira(totalEarned), icon: Gift },
          { label: "Pending rewards", value: formatNaira(pendingRewards), icon: Gift },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                {referralsQuery.isLoading ? (
                  <Skeleton className="mt-1 h-6 w-20" />
                ) : (
                  <div className="text-xl font-bold tabular-nums">{s.value}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold">Your referral link</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Share this link and earn ₦2,000 when your friend completes their first transaction.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {referralsQuery.isLoading ? (
              <Skeleton className="h-11 flex-1" />
            ) : (
              <Input readOnly value={link} className="h-11 font-mono text-sm" />
            )}
            <Button
              onClick={() => {
                navigator.clipboard?.writeText(link);
                toast.success("Copied to clipboard");
              }}
              variant="outline"
              className="h-11"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button className="h-11">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
