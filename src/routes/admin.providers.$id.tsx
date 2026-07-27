import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  Power,
  Star,
  Activity,
  BarChart3,
  TestTube2,
  Heart,
  Loader2,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminProviders,
  type AdminVtuProvider,
  type ProviderStatistics,
  type ProviderHealth,
  type ProviderTestResult,
} from "@/lib/admin-api";
import { SERVICE_OPTIONS, SERVICE_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/admin/providers/$id")({
  head: () => ({ meta: [{ title: "Provider — Techub Admin" }] }),
  component: AdminProviderDetailPage,
});

function AdminProviderDetailPage() {
  const { id } = useParams({ from: "/admin/providers/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [priorityValue, setPriorityValue] = useState("0");
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null);
  const [healthData, setHealthData] = useState<ProviderHealth | null>(null);
  const [testing, setTesting] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "providers", id],
    queryFn: () => adminProviders.get(Number(id)),
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin", "providers", id, "statistics"],
    queryFn: () => adminProviders.statistics(Number(id)),
  });

  const provider = (data as { provider: AdminVtuProvider } | undefined)?.provider;
  const stats = (statsData as ProviderStatistics | undefined)?.statistics;

  useEffect(() => {
    if (provider) {
      setPriorityValue(String(provider.priority));
    }
  }, [provider]);

  const updateMutation = useMutation({
    mutationFn: (formData: Record<string, unknown>) =>
      adminProviders.update(Number(id), formData as Parameters<typeof adminProviders.update>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "providers", id] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => adminProviders.toggleStatus(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "providers", id] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: () => adminProviders.setDefault(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "providers", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminProviders.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      navigate({ to: "/admin/providers" });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: () => adminProviders.updatePriority(Number(id), parseInt(priorityValue)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "providers", id] });
    },
  });

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await adminProviders.testConnection(Number(id));
      setTestResult(result.test_result);
      queryClient.invalidateQueries({ queryKey: ["admin", "providers", id] });
    } catch {
      setTestResult({
        success: false,
        message: "Request failed",
        response_time_ms: 0,
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleHealthCheck() {
    setHealthChecking(true);
    setHealthData(null);
    try {
      const result = await adminProviders.healthCheck(Number(id));
      setHealthData(result.health);
      queryClient.invalidateQueries({ queryKey: ["admin", "providers", id] });
    } catch {
      setHealthData({
        status: "unhealthy",
        last_check: new Date().toISOString(),
        response_time_ms: 0,
        message: "Health check failed",
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        success_rate: 0,
      });
    } finally {
      setHealthChecking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Provider not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/admin/providers" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to providers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/providers" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={provider.name}
          description={`Provider configuration and management — ${provider.slug}`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant={provider.status === "active" ? "outline" : "default"}
                onClick={() => toggleStatusMutation.mutate()}
                disabled={toggleStatusMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                {provider.status === "active" ? "Disable" : "Enable"}
              </Button>
              {!provider.is_default && (
                <Button
                  variant="outline"
                  onClick={() => setDefaultMutation.mutate()}
                  disabled={setDefaultMutation.isPending}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Set as Default
                </Button>
              )}
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          }
        />
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="connection" className="gap-1.5">
            <TestTube2 className="h-3.5 w-3.5" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            Health
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ProviderConfigTab
            provider={provider}
            onSave={(data) => updateMutation.mutate(data)}
            isSaving={updateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Test</CardTitle>
              <CardDescription>Test the API connection to this provider.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleTestConnection} disabled={testing}>
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <TestTube2 className="mr-2 h-4 w-4" />
                Test Connection
              </Button>

              {testResult && (
                <div
                  className={`rounded-lg border p-4 ${
                    testResult.success
                      ? "border-[color:oklch(0.5_0.15_155)] bg-[color:oklch(0.96_0.05_155)]"
                      : "border-destructive bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <Activity className="h-5 w-5 text-[color:oklch(0.4_0.15_155)]" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Response time: {testResult.response_time_ms}ms
                    {testResult.status_code && ` — Status: ${testResult.status_code}`}
                  </div>
                </div>
              )}

              {provider.last_health_check_at && (
                <div className="text-sm text-muted-foreground">
                  Last checked: {new Date(provider.last_health_check_at).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Priority</CardTitle>
              <CardDescription>Higher priority providers are tried first during failover (0-100).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={priorityValue}
                  onChange={(e) => setPriorityValue(e.target.value)}
                  className="w-32"
                />
                <Button
                  variant="outline"
                  onClick={() => priorityMutation.mutate()}
                  disabled={priorityMutation.isPending || priorityValue === String(provider.priority)}
                >
                  {priorityMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Update Priority
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Health Check</CardTitle>
              <CardDescription>Run a real-time health check against this provider.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleHealthCheck} disabled={healthChecking}>
                {healthChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Heart className="mr-2 h-4 w-4" />
                Run Health Check
              </Button>

              {healthData && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="mt-1 flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            healthData.status === "healthy" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="font-semibold capitalize">{healthData.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Response Time</div>
                      <div className="mt-1 font-semibold">{healthData.response_time_ms}ms</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Message</div>
                      <div className="mt-1 font-semibold text-sm">{healthData.message}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Last Check</div>
                      <div className="mt-1 font-semibold text-sm">
                        {new Date(healthData.last_check).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {provider.health_check_response && !healthData && (
                <div className="rounded-lg border p-4 text-sm">
                  <div className="font-medium">Last Health Check Response</div>
                  <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                    {JSON.stringify(provider.health_check_response, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Requests</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{stats?.total_requests ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Successful</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-green-600">
                  {stats?.successful_requests ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-red-600">
                  {stats?.failed_requests ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {stats?.success_rate ?? 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Avg Response Time</div>
                      <div className="text-sm text-muted-foreground">Across all requests</div>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {stats?.avg_response_time_ms ? `${Math.round(stats.avg_response_time_ms)}ms` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Pending Requests</div>
                      <div className="text-sm text-muted-foreground">Awaiting completion</div>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">{stats?.pending_requests ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Last Used</div>
                      <div className="text-sm text-muted-foreground">Most recent request</div>
                    </div>
                  </div>
                  <span className="text-sm">
                    {stats?.last_used_at ? new Date(stats.last_used_at).toLocaleString() : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Last Health Check</div>
                      <div className="text-sm text-muted-foreground">Connection status</div>
                    </div>
                  </div>
                  <span className="text-sm">
                    {stats?.last_health_check_at
                      ? new Date(stats.last_health_check_at).toLocaleString()
                      : "Never"}
                  </span>
                </div>
              </div>

              {stats?.last_error && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Last Error</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{stats.last_error}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Supported Services</div>
                <div className="flex flex-wrap gap-2">
                  {(statsData as ProviderStatistics | undefined)?.services?.map((s) => (
                    <Badge key={s} variant="secondary">
                      {SERVICE_LABELS[s] ?? s}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{provider.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProviderConfigTab({
  provider,
  onSave,
  isSaving,
}: {
  provider: AdminVtuProvider;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(provider.name);
  const [slug, setSlug] = useState(provider.slug);
  const [logo, setLogo] = useState(provider.logo ?? "");
  const [baseUrl, setBaseUrl] = useState(provider.base_url);
  const [apiKey, setApiKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [environment, setEnvironment] = useState(provider.environment);
  const [isDefault, setIsDefault] = useState(provider.is_default);
  const [selectedServices, setSelectedServices] = useState<string[]>(provider.supported_services ?? []);

  const [showCredentials, setShowCredentials] = useState(false);

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  function handleSave() {
    const data: Record<string, unknown> = {
      name,
      slug,
      base_url: baseUrl,
      environment,
      is_default: isDefault,
      supported_services: selectedServices,
    };

    if (logo) data.logo = logo;
    if (apiKey) data.api_key = apiKey;
    if (publicKey) data.public_key = publicKey;
    if (secretKey) data.secret_key = secretKey;
    if (username) data.username = username;
    if (password) data.password = password;
    if (authToken) data.authorization_token = authToken;
    if (webhookSecret) data.webhook_secret = webhookSecret;

    onSave(data);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Provider name, URL, and environment settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input placeholder="https://example.com/logo.png" value={logo} onChange={(e) => setLogo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Environment</Label>
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
              <Label>Default Provider</Label>
              <div className="flex h-10 items-center">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <span className="ml-2 text-sm text-muted-foreground">
                  {isDefault ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">API Credentials</CardTitle>
              <CardDescription>Leave blank to keep existing credentials unchanged.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              {showCredentials ? "Hide" : "Show"} Fields
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCredentials ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" placeholder="Keep current" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Input type="password" placeholder="Keep current" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input type="password" placeholder="Keep current" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Authorization Token</Label>
                  <Input type="password" placeholder="Keep current" value={authToken} onChange={(e) => setAuthToken(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="Keep current" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Keep current" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <Input type="password" placeholder="Keep current" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Show Fields" to update API credentials. Credentials are encrypted at rest.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Services</CardTitle>
          <CardDescription>Select which services this provider supports.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
