import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MoreHorizontal, Loader2, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminAdmins, type AdminUser } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "Admins — TechHub Admin" }] }),
  component: AdminAdminsPage,
});

function AdminAdminsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "admin",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => adminAdmins.list(),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => adminAdmins.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      setCreateOpen(false);
      setForm({ first_name: "", last_name: "", email: "", password: "", password_confirmation: "", role: "admin" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminAdmins.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      setDeleteTarget(null);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: number) => adminAdmins.suspend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "admins"] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => adminAdmins.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "admins"] }),
  });

  const admins = data?.admins ?? [];

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Manage administrator accounts."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        }
      />
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                      </TableRow>
                    ))
                  : admins.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {a.first_name[0]}{a.last_name[0]}
                            </div>
                            {a.first_name} {a.last_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <Shield className="h-3 w-3" />
                            {a.role?.replace('_', ' ') ?? 'Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              a.status === "active"
                                ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent"
                                : "bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)] border-transparent"
                            }
                          >
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
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
                                <Link to="/admin/admins/$id" params={{ id: String(a.id) }}>
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {a.status === "active" ? (
                                <DropdownMenuItem
                                  disabled={suspendMutation.isPending}
                                  onClick={() => suspendMutation.mutate(a.id)}
                                >
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  disabled={activateMutation.isPending}
                                  onClick={() => activateMutation.mutate(a.id)}
                                >
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget(a)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && admins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No admin accounts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
            <DialogDescription>Create a new administrator account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={form.password_confirmation} onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={createMutation.isPending || !form.email || !form.password || form.password !== form.password_confirmation}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.first_name} {deleteTarget?.last_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
