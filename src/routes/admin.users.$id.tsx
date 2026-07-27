import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminUsers, type AdminUser, type AdminTransaction } from "@/lib/admin-api";
import { apiFetch } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/admin-api";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({ meta: [{ title: "User Detail — Techub Admin" }] }),
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { id } = Route.useParams();
  const userId = Number(id);
  const queryClient = useQueryClient();

  const [creditOpen, setCreditOpen] = useState(false);
  const [debitOpen, setDebitOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");

  const { data: userData, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminUsers.get(userId),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["admin", "user", userId, "transactions"],
    queryFn: () =>
      apiFetch<PaginatedResponse<AdminTransaction>>(`/admin/users/${userId}/transactions?per_page=20`),
  });

  const suspendMutation = useMutation({
    mutationFn: () => adminUsers.suspend(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }),
  });

  const activateMutation = useMutation({
    mutationFn: () => adminUsers.activate(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }),
  });

  const banMutation = useMutation({
    mutationFn: () => adminUsers.ban(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }),
  });

  const creditMutation = useMutation({
    mutationFn: () =>
      adminUsers.credit(userId, { amount: parseFloat(amount), narration: narration || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
      setCreditOpen(false);
      setAmount("");
      setNarration("");
    },
  });

  const debitMutation = useMutation({
    mutationFn: () =>
      adminUsers.debit(userId, { amount: parseFloat(amount), narration: narration || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
      setDebitOpen(false);
      setAmount("");
      setNarration("");
    },
  });

  const lockMutation = useMutation({
    mutationFn: () => adminUsers.lockWallet(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }),
  });

  const unlockMutation = useMutation({
    mutationFn: () => adminUsers.unlockWallet(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }),
  });

  const user = userData?.user;
  const transactions = txData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={user ? `${user.first_name} ${user.last_name}` : "User Detail"}
          description={user?.email}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {user.first_name} {user.last_name}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "active"
                          ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent"
                          : "bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)] border-transparent"
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {user.phone ?? "Not set"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Joined{" "}
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" /> Level: {user.level}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Wallet</div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="font-semibold tabular-nums">
                      {formatNaira(user.wallet?.available_balance ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary">{user.wallet?.is_locked ? "Locked" : "Active"}</Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Actions</div>
                  <div className="flex flex-wrap gap-2">
                    {user.status !== "suspended" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={suspendMutation.isPending}
                        onClick={() => suspendMutation.mutate()}
                      >
                        {suspendMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activateMutation.isPending}
                        onClick={() => activateMutation.mutate()}
                      >
                        {activateMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={banMutation.isPending}
                      onClick={() => banMutation.mutate()}
                    >
                      Ban
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setCreditOpen(true)}>
                      Credit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDebitOpen(true)}>
                      Debit
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.wallet?.is_locked ? (
                      <Button size="sm" variant="outline" disabled={lockMutation.isPending} onClick={() => lockMutation.mutate()}>
                        Lock Wallet
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={unlockMutation.isPending} onClick={() => unlockMutation.mutate()}>
                        Unlock Wallet
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">User not found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    : transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
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
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  {!txLoading && transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Wallet</DialogTitle>
            <DialogDescription>
              Add funds to {user?.first_name}'s wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Narration (optional)</Label>
              <Textarea placeholder="Reason for credit" value={narration} onChange={(e) => setNarration(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditOpen(false)}>Cancel</Button>
            <Button disabled={creditMutation.isPending || !amount} onClick={() => creditMutation.mutate()}>
              {creditMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={debitOpen} onOpenChange={setDebitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Debit Wallet</DialogTitle>
            <DialogDescription>
              Remove funds from {user?.first_name}'s wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Narration (optional)</Label>
              <Textarea placeholder="Reason for debit" value={narration} onChange={(e) => setNarration(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDebitOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={debitMutation.isPending || !amount} onClick={() => debitMutation.mutate()}>
              {debitMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Debit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
