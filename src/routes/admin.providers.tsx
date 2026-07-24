import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Zap,
  Star,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
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
import { Switch } from "@/components/ui/switch";
import {
  adminProviders,
  type AdminVtuProvider,
  type ProviderGlobalStatistics,
} from "@/lib/admin-api";
import { SERVICE_OPTIONS, SERVICE_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/admin/providers")({
  head: () => ({ meta: [{ title: "VTU Providers — TechHub Admin" }] }),
  component: AdminProvidersPage,
});

function AdminProvidersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminVtuProvider | null>(null);
  const [actionTarget, setActionTarget] = useState<AdminVtuProvider | null>(null);
  const [actionType, setActionType] = useState<string>("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "providers", { search: debouncedSearch, status: statusFilter, page }],
    queryFn: () =>
      adminProviders.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        per_page: 15,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin", "providers", "statistics"],
    queryFn: () => adminProviders.globalStatistics(),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => adminProviders.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      setActionTarget(null);
      setActionType("");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => adminProviders.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      setActionTarget(null);
      setActionType("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminProviders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      setDeleteTarget(null);
    },
  });

  const providers = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.last_page ?? 1;
  const total = pagination?.total ?? 0;

  const stats: ProviderGlobalStatistics | undefined = statsData as ProviderGlobalStatistics | undefined;

  function handleAction() {
    if (!actionTarget) return;
    if (actionType === "toggle-status") toggleStatusMutation.mutate(actionTarget.id);
    else if (actionType === "set-default") setDefaultMutation.mutate(actionTarget.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="VTU Providers"
        description="Manage bill payment service providers and failover configuration."
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.total_providers ?? 0}</div>
                <div className="text-xs text-muted-foreground">Total Providers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.active_providers ?? 0}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)]">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.inactive_providers ?? 0}</div>
                <div className="text-xs text-muted-foreground">Inactive</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:oklch(0.96_0.08_75)] text-[color:oklch(0.45_0.15_75)]">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold truncate">{stats?.default_provider?.name ?? "None"}</div>
                <div className="text-xs text-muted-foreground">Default Provider</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                      </TableRow>
                    ))
                  : isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-destructive">
                          Failed to load providers: {error?.message || "Unknown error"}
                        </TableCell>
                      </TableRow>
                    ) : providers.map((p) => {
                      const successRate =
                        p.total_requests > 0
                          ? Math.round((p.successful_requests / p.total_requests) * 100)
                          : 0;

                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {p.logo ? (
                                <img src={p.logo} alt={p.name} className="h-8 w-8 rounded object-contain" />
                              ) : (
                                <div className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary font-bold text-xs">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <Link
                                  to="/admin/providers/$id"
                                  params={{ id: String(p.id) }}
                                  className="font-medium hover:underline"
                                >
                                  {p.name}
                                </Link>
                                <div className="text-xs text-muted-foreground">{p.slug}</div>
                              </div>
                              {p.is_default && (
                                <Badge variant="secondary" className="text-[9px]">DEFAULT</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                p.environment === "production"
                                  ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent"
                                  : "bg-[color:oklch(0.96_0.08_75)] text-[color:oklch(0.45_0.15_75)] border-transparent"
                              }
                            >
                              {p.environment === "production" ? "Production" : "Sandbox"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(p.supported_services ?? []).slice(0, 3).map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px]">
                                  {SERVICE_LABELS[s] ?? s}
                                </Badge>
                              ))}
                              {(p.supported_services ?? []).length > 3 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  +{(p.supported_services ?? []).length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums">{p.priority}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {successRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                p.status === "active"
                                  ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent"
                                  : "bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)] border-transparent"
                              }
                            >
                              {p.status === "active" ? "Active" : "Inactive"}
                            </Badge>
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
                                  <Link to="/admin/providers/$id" params={{ id: String(p.id) }}>
                                    Edit provider
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to="/admin/providers/$id" params={{ id: String(p.id) }}>
                                    View statistics
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionTarget(p);
                                    setActionType("toggle-status");
                                  }}
                                >
                                  {p.status === "active" ? "Disable" : "Enable"}
                                </DropdownMenuItem>
                                {!p.is_default && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setActionTarget(p);
                                      setActionType("set-default");
                                    }}
                                  >
                                    Set as default
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget(p)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                {!isLoading && providers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No providers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {providers.length} of {total}
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

      <CreateProviderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
          setShowCreateDialog(false);
        }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!actionTarget && actionType !== ""}
        onOpenChange={() => {
          setActionTarget(null);
          setActionType("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionType === "toggle-status"
                ? actionTarget?.status === "active"
                  ? "Disable Provider"
                  : "Enable Provider"
                : "Set Default Provider"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "toggle-status"
                ? `Are you sure you want to ${actionTarget?.status === "active" ? "disable" : "enable"} ${actionTarget?.name}?`
                : `Set ${actionTarget?.name} as the default provider? This will unset the current default.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionTarget(null);
                setActionType("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={toggleStatusMutation.isPending || setDefaultMutation.isPending}
              onClick={handleAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateProviderDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [priority, setPriority] = useState("0");
  const [isDefault, setIsDefault] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      adminProviders.create({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        base_url: baseUrl,
        api_key: apiKey || undefined,
        public_key: publicKey || undefined,
        secret_key: secretKey || undefined,
        username: username || undefined,
        password: password || undefined,
        authorization_token: authToken || undefined,
        webhook_secret: webhookSecret || undefined,
        environment,
        status: "active",
        priority: parseInt(priority) || 0,
        is_default: isDefault,
        supported_services: selectedServices,
      }),
    onSuccess: () => {
      resetForm();
      onSuccess();
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create provider");
    },
  });

  function resetForm() {
    setName("");
    setSlug("");
    setBaseUrl("");
    setApiKey("");
    setPublicKey("");
    setSecretKey("");
    setUsername("");
    setPassword("");
    setAuthToken("");
    setWebhookSecret("");
    setEnvironment("sandbox");
    setPriority("0");
    setIsDefault(false);
    setSelectedServices([]);
    setError("");
  }

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Provider</DialogTitle>
          <DialogDescription>Configure a new VTU service provider.</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="e.g. VTpass" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input placeholder="Auto-generated from name" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Base URL *</Label>
            <Input placeholder="https://sandbox.vtpass.com/api" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" placeholder="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Public Key</Label>
              <Input type="password" placeholder="Public Key" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Secret Key</Label>
              <Input type="password" placeholder="Secret Key" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Authorization Token</Label>
              <Input type="password" placeholder="Bearer token (if needed)" value={authToken} onChange={(e) => setAuthToken(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input type="password" placeholder="Webhook verification secret" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Environment *</Label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as "sandbox" | "production")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority (0-100)</Label>
              <Input type="number" min="0" max="100" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Default Provider</Label>
              <div className="flex h-10 items-center">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <span className="ml-2 text-sm text-muted-foreground">
                  {isDefault ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Supported Services *</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((s) => (
                <Badge
                  key={s}
                  variant={selectedServices.includes(s) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleService(s)}
                >
                  {SERVICE_LABELS[s]}
                </Badge>
              ))}
            </div>
            {selectedServices.length === 0 && (
              <p className="text-xs text-muted-foreground">Select at least one service</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name || !baseUrl || selectedServices.length === 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Create Provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
