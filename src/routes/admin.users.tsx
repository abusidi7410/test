import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter, MoreHorizontal, UserPlus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminUsers, type AdminUser } from "@/lib/admin-api";
import { formatNaira } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — TechHub Admin" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [actionUser, setActionUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNarration, setCreditNarration] = useState("");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "", password_confirmation: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "users", { search: debouncedSearch, status, page }],
    queryFn: () =>
      adminUsers.list({
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
        page,
        per_page: 15,
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const suspendMutation = useMutation({
    mutationFn: (id: number) => adminUsers.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setActionUser(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => adminUsers.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setActionUser(null);
    },
  });

  const banMutation = useMutation({
    mutationFn: (id: number) => adminUsers.ban(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setActionUser(null);
    },
  });

  const creditMutation = useMutation({
    mutationFn: ({ id, amount, narration }: { id: number; amount: number; narration?: string }) =>
      adminUsers.credit(id, { amount, narration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setActionUser(null);
      setCreditAmount("");
      setCreditNarration("");
    },
  });

  const debitMutation = useMutation({
    mutationFn: ({ id, amount, narration }: { id: number; amount: number; narration?: string }) =>
      adminUsers.debit(id, { amount, narration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setActionUser(null);
      setCreditAmount("");
      setCreditNarration("");
    },
  });

  const createUserMutation = useMutation({
    mutationFn: () => adminUsers.create({
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      phone: newUser.phone || undefined,
      password: newUser.password,
      password_confirmation: newUser.password_confirmation,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setAddUserOpen(false);
      setNewUser({ first_name: "", last_name: "", email: "", phone: "", password: "", password_confirmation: "" });
    },
  });

  const users = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.last_page ?? 1;
  const total = pagination?.total ?? 0;

  function handleAction(type: string) {
    if (!actionUser) return;
    if (type === "suspend") suspendMutation.mutate(actionUser.id);
    else if (type === "activate") activateMutation.mutate(actionUser.id);
    else if (type === "ban") banMutation.mutate(actionUser.id);
    else if (type === "credit" || type === "debit") {
      const amt = parseFloat(creditAmount);
      if (isNaN(amt) || amt <= 0) return;
      if (type === "credit")
        creditMutation.mutate({ id: actionUser.id, amount: amt, narration: creditNarration || undefined });
      else
        debitMutation.mutate({ id: actionUser.id, amount: amt, narration: creditNarration || undefined });
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage all platform users."
        actions={
          <Button onClick={() => setAddUserOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                      </TableRow>
                    ))
                  : isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-destructive">
                          Failed to load users: {error?.message || "Unknown error"}
                        </TableCell>
                      </TableRow>
                    ) : users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <Link
                            to="/admin/users/$id"
                            params={{ id: String(u.id) }}
                            className="hover:underline"
                          >
                            {u.first_name} {u.last_name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.phone ?? "—"}
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">
                          {formatNaira(u.wallet?.available_balance ?? 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              u.status === "active"
                                ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent"
                                : u.status === "suspended"
                                  ? "bg-[color:oklch(0.96_0.08_75)] text-[color:oklch(0.45_0.15_75)] border-transparent"
                                  : "bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)] border-transparent"
                            }
                          >
                            {u.status?.charAt(0).toUpperCase() + (u.status?.slice(1) ?? "")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to="/admin/users/$id" params={{ id: String(u.id) }}>
                                  View profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {u.status !== "suspended" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionUser(u);
                                    setActionType("suspend");
                                  }}
                                >
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {u.status !== "active" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionUser(u);
                                    setActionType("activate");
                                  }}
                                >
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("ban");
                                }}
                              >
                                Ban
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("credit");
                                }}
                              >
                                Credit wallet
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("debit");
                                }}
                              >
                                Debit wallet
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {users.length} of {total}
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

      <Dialog open={!!actionUser && actionType !== ""} onOpenChange={() => { setActionUser(null); setActionType(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionType} User</DialogTitle>
            <DialogDescription>
              {actionType === "credit" || actionType === "debit"
                ? `Enter amount to ${actionType} for ${actionUser?.first_name} ${actionUser?.last_name}`
                : `Are you sure you want to ${actionType} ${actionUser?.first_name} ${actionUser?.last_name}?`}
            </DialogDescription>
          </DialogHeader>
          {(actionType === "credit" || actionType === "debit") && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Narration (optional)</Label>
                <Textarea
                  placeholder="Reason for this action"
                  value={creditNarration}
                  onChange={(e) => setCreditNarration(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionUser(null); setActionType(""); }}>
              Cancel
            </Button>
            <Button
              variant={actionType === "ban" ? "destructive" : "default"}
              disabled={
                suspendMutation.isPending || activateMutation.isPending ||
                banMutation.isPending || creditMutation.isPending || debitMutation.isPending
              }
              onClick={() => handleAction(actionType)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={newUser.first_name} onChange={(e) => setNewUser((u) => ({ ...u, first_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={newUser.last_name} onChange={(e) => setNewUser((u) => ({ ...u, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input type="tel" value={newUser.phone} onChange={(e) => setNewUser((u) => ({ ...u, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={newUser.password_confirmation} onChange={(e) => setNewUser((u) => ({ ...u, password_confirmation: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button
              disabled={createUserMutation.isPending || !newUser.email || !newUser.password || newUser.password !== newUser.password_confirmation}
              onClick={() => createUserMutation.mutate()}
            >
              {createUserMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
