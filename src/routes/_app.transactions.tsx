import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter, Download } from "lucide-react";
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
import { useTransactions } from "@/lib/queries";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — TechHub" }] }),
  component: TransactionsPage,
});

type TxStatus = "completed" | "pending" | "failed";

const statusStyles: Record<TxStatus, string> = {
  completed: "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent",
  pending: "bg-[color:oklch(0.96_0.08_75)] text-[color:oklch(0.45_0.15_75)] border-transparent",
  failed: "bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)] border-transparent",
};

const statusLabel: Record<TxStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

function TransactionsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const txQuery = useTransactions({
    page,
    per_page: perPage,
    search: query || undefined,
    status: status !== "all" ? status : undefined,
  });

  const txData = txQuery.data;
  const transactions = txData?.data ?? [];
  const meta = txData?.meta;
  const totalPages = meta?.last_page ?? 1;
  const total = meta?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Transaction history"
        description="Search, filter and export all your account activity."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by service or transaction ID"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-44">
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
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txQuery.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-6 w-12" />
                        </TableCell>
                      </TableRow>
                    ))
                  : transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{t.service}</TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${t.direction === "in" ? "text-[color:var(--success)]" : ""}`}
                        >
                          {t.direction === "in" ? "+" : "-"}
                          {formatNaira(t.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusStyles[t.status]}>
                            {statusLabel[t.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                {!txQuery.isLoading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No transactions match your filters.
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
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
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
    </div>
  );
}
