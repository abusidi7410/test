import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter, MoreHorizontal, Loader2, CheckCircle, XCircle, RotateCcw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminTransactions } from "@/lib/admin-api";
import { formatNaira } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({ meta: [{ title: "Transactions — TechHub Admin" }] }),
  component: AdminTransactionsPage,
});

function AdminTransactionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ txId: number; action: string } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "transactions", { search: debouncedSearch, status, type, page }],
    queryFn: () =>
      adminTransactions.list({
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
        type: type !== "all" ? type : undefined,
        page,
        per_page: 15,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminTransactions.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      setConfirmAction(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminTransactions.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      setConfirmAction(null);
    },
  });

  const reverseMutation = useMutation({
    mutationFn: (id: number) => adminTransactions.reverse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      setConfirmAction(null);
    },
  });

  const transactions = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.last_page ?? 1;
  const total = pagination?.total ?? 0;

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.action === "approve") approveMutation.mutate(confirmAction.txId);
    else if (confirmAction.action === "reject") rejectMutation.mutate(confirmAction.txId);
    else if (confirmAction.action === "reverse") reverseMutation.mutate(confirmAction.txId);
  }

  const isMutating = approveMutation.isPending || rejectMutation.isPending || reverseMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="View and manage all platform transactions."
      />
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference, service, or user"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-10 pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-full sm:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                      </TableRow>
                    ))
                  : isError ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-sm text-destructive">
                          Failed to load transactions: {error?.message || "Unknown error"}
                        </TableCell>
                      </TableRow>
                    ) : transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                        <TableCell className="text-sm">
                          {tx.user ? `${tx.user.first_name} ${tx.user.last_name}` : "—"}
                        </TableCell>
                        <TableCell className="font-medium">{tx.service}</TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${tx.direction === "in" ? "text-[color:var(--success)]" : ""}`}
                        >
                          {tx.direction === "in" ? "+" : "-"}
                          {formatNaira(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            {tx.direction === "in" ? (
                              <><ArrowDownRight className="h-3 w-3" /> In</>
                            ) : (
                              <><ArrowUpRight className="h-3 w-3" /> Out</>
                            )}
                          </Badge>
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {tx.status === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ txId: tx.id, action: "approve" })}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ txId: tx.id, action: "reject" })}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {tx.status === "completed" && (
                                <DropdownMenuItem
                                  onClick={() => setConfirmAction({ txId: tx.id, action: "reverse" })}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reverse
                                </DropdownMenuItem>
                              )}
                              {tx.status === "pending" && (
                                <DropdownMenuItem disabled>
                                  No other actions
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {transactions.length} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="tabular-nums">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {confirmAction?.action} Transaction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.action} this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.action === "reject" ? "destructive" : "default"}
              disabled={isMutating}
              onClick={handleConfirm}
            >
              {isMutating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Confirm {confirmAction?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
