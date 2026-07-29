import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings, Shield, Banknote, Mail, Globe, Loader2, Save, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminSettings } from "@/lib/admin-api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Techub Admin" }] }),
  component: AdminSettingsPage,
});

interface SettingsState {
  platform_name: string;
  support_email: string;
  platform_description: string;
  default_currency: string;
  maintenance_mode: boolean;
  require_2fa: boolean;
  require_email_verification: boolean;
  login_notifications: boolean;
  session_timeout: number;
  max_login_attempts: number;
  airtime_fee: number;
  data_fee: number;
  electricity_fee: number;
  transfer_fee: number;
  withdrawal_fee: number;
  min_transaction: number;
  flat_fee_mode: boolean;
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  welcome_email: boolean;
  transaction_receipts: boolean;
  weekly_reports: boolean;
  google_enabled: boolean;
  google_client_id: string;
  google_client_secret: string;
  apple_enabled: boolean;
  whatsapp_enabled: boolean;
}

const defaults: SettingsState = {
  platform_name: "Techub",
  support_email: "support@techub.com",
  platform_description: "Techub is your all-in-one financial services platform.",
  default_currency: "NGN",
  maintenance_mode: false,
  require_2fa: false,
  require_email_verification: true,
  login_notifications: true,
  session_timeout: 60,
  max_login_attempts: 5,
  airtime_fee: 2,
  data_fee: 2,
  electricity_fee: 100,
  transfer_fee: 50,
  withdrawal_fee: 1.5,
  min_transaction: 100,
  flat_fee_mode: false,
  smtp_host: "",
  smtp_port: "587",
  smtp_username: "",
  smtp_password: "",
  welcome_email: true,
  transaction_receipts: true,
  weekly_reports: false,
  google_enabled: true,
  google_client_id: "",
  google_client_secret: "",
  apple_enabled: false,
  whatsapp_enabled: false,
};

const groups: Record<string, (keyof SettingsState)[]> = {
  general: ["platform_name", "support_email", "platform_description", "default_currency", "maintenance_mode"],
  security: ["require_2fa", "require_email_verification", "login_notifications", "session_timeout", "max_login_attempts"],
  fees: ["airtime_fee", "data_fee", "electricity_fee", "transfer_fee", "withdrawal_fee", "min_transaction", "flat_fee_mode"],
  email: ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "welcome_email", "transaction_receipts", "weekly_reports"],
  social: ["google_enabled", "google_client_id", "google_client_secret", "apple_enabled", "whatsapp_enabled"],
};

function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => {
    loadAllSettings();
  }, []);

  async function loadAllSettings() {
    setLoading(true);
    try {
      const results = await Promise.all(
        Object.keys(groups).map((group) =>
          adminSettings.getGroup(group).catch(() => ({} as Record<string, unknown>)),
        ),
      );
      const merged = Object.assign({}, ...results);
      setSettings((prev) => ({ ...prev, ...merged }));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(group: string) {
    setSaving(group);
    try {
      const keys = groups[group];
      const payload: Record<string, unknown> = {};
      for (const key of keys) {
        payload[key] = settings[key];
      }
      await adminSettings.updateGroup(group, payload);
      setSaved(group);
      toast.success(`${group} settings updated successfully.`);
      setTimeout(() => setSaved(null), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save settings";
      toast.error(message);
    } finally {
      setSaving(null);
    }
  }

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure platform settings and preferences." />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5">
            <Banknote className="h-3.5 w-3.5" /> Fees
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Social Login
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Settings</CardTitle>
              <CardDescription>Basic platform configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input value={settings.platform_name} onChange={(e) => update("platform_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input value={settings.support_email} onChange={(e) => update("support_email", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Platform Description</Label>
                <Textarea rows={3} value={settings.platform_description} onChange={(e) => update("platform_description", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input value={settings.default_currency} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Maintenance Mode</Label>
                  <div className="flex items-center gap-3">
                    <Switch checked={settings.maintenance_mode} onCheckedChange={(v) => update("maintenance_mode", v)} />
                    <span className="text-sm text-muted-foreground">Disable public access</span>
                  </div>
                </div>
              </div>
              <SaveButton group="general" saving={saving} saved={saved} onClick={handleSave} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Settings</CardTitle>
              <CardDescription>Manage authentication and security policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Require 2FA for admin accounts</div>
                  </div>
                  <Switch checked={settings.require_2fa} onCheckedChange={(v) => update("require_2fa", v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Email Verification</div>
                    <div className="text-sm text-muted-foreground">Require email verification for new users</div>
                  </div>
                  <Switch checked={settings.require_email_verification} onCheckedChange={(v) => update("require_email_verification", v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Login Notifications</div>
                    <div className="text-sm text-muted-foreground">Notify admins of new login sessions</div>
                  </div>
                  <Switch checked={settings.login_notifications} onCheckedChange={(v) => update("login_notifications", v)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" value={settings.session_timeout} onChange={(e) => update("session_timeout", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input type="number" value={settings.max_login_attempts} onChange={(e) => update("max_login_attempts", Number(e.target.value))} />
                </div>
              </div>
              <SaveButton group="security" saving={saving} saved={saved} onClick={handleSave} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Configuration</CardTitle>
              <CardDescription>Set transaction fees and service charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Airtime Fee (%)</Label>
                  <Input type="number" value={settings.airtime_fee} onChange={(e) => update("airtime_fee", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fee (%)</Label>
                  <Input type="number" value={settings.data_fee} onChange={(e) => update("data_fee", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Electricity Fee (₦)</Label>
                  <Input type="number" value={settings.electricity_fee} onChange={(e) => update("electricity_fee", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Transfer Fee (₦)</Label>
                  <Input type="number" value={settings.transfer_fee} onChange={(e) => update("transfer_fee", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Withdrawal Fee (%)</Label>
                  <Input type="number" value={settings.withdrawal_fee} step="0.1" onChange={(e) => update("withdrawal_fee", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Transaction (₦)</Label>
                  <Input type="number" value={settings.min_transaction} onChange={(e) => update("min_transaction", Number(e.target.value))} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Flat Fee Mode</div>
                  <div className="text-sm text-muted-foreground">Use flat fees instead of percentage</div>
                </div>
                <Switch checked={settings.flat_fee_mode} onCheckedChange={(v) => update("flat_fee_mode", v)} />
              </div>
              <SaveButton group="fees" saving={saving} saved={saved} onClick={handleSave} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Settings</CardTitle>
              <CardDescription>Configure email templates and SMTP settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input placeholder="smtp.example.com" value={settings.smtp_host} onChange={(e) => update("smtp_host", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input placeholder="587" value={settings.smtp_port} onChange={(e) => update("smtp_port", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input placeholder="username" value={settings.smtp_username} onChange={(e) => update("smtp_username", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password</Label>
                  <Input type="password" placeholder="password" value={settings.smtp_password} onChange={(e) => update("smtp_password", e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Welcome Email</div>
                    <div className="text-sm text-muted-foreground">Send welcome email on registration</div>
                  </div>
                  <Switch checked={settings.welcome_email} onCheckedChange={(v) => update("welcome_email", v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Transaction Receipts</div>
                    <div className="text-sm text-muted-foreground">Email receipts for all transactions</div>
                  </div>
                  <Switch checked={settings.transaction_receipts} onCheckedChange={(v) => update("transaction_receipts", v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Weekly Reports</div>
                    <div className="text-sm text-muted-foreground">Send weekly activity reports to users</div>
                  </div>
                  <Switch checked={settings.weekly_reports} onCheckedChange={(v) => update("weekly_reports", v)} />
                </div>
              </div>
              <SaveButton group="email" saving={saving} saved={saved} onClick={handleSave} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Login */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social Login</CardTitle>
              <CardDescription>Manage third-party authentication providers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#4285F4] text-white font-bold text-sm">G</div>
                    <div>
                      <div className="font-medium">Google</div>
                      <div className="text-sm text-muted-foreground">Allow users to sign in with Google</div>
                    </div>
                  </div>
                  <Switch checked={settings.google_enabled} onCheckedChange={(v) => update("google_enabled", v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#000] text-white font-bold text-sm">A</div>
                    <div>
                      <div className="font-medium">Apple</div>
                      <div className="text-sm text-muted-foreground">Allow users to sign in with Apple</div>
                    </div>
                  </div>
                  <Switch checked={settings.apple_enabled} onCheckedChange={(v) => update("apple_enabled", v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#25D366] text-white font-bold text-sm">W</div>
                    <div>
                      <div className="font-medium">WhatsApp</div>
                      <div className="text-sm text-muted-foreground">Allow users to sign in with WhatsApp</div>
                    </div>
                  </div>
                  <Switch checked={settings.whatsapp_enabled} onCheckedChange={(v) => update("whatsapp_enabled", v)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Google Client ID</Label>
                  <Input placeholder="Enter Google Client ID" value={settings.google_client_id} onChange={(e) => update("google_client_id", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Google Client Secret</Label>
                  <Input type="password" placeholder="Enter Google Client Secret" value={settings.google_client_secret} onChange={(e) => update("google_client_secret", e.target.value)} />
                </div>
              </div>
              <SaveButton group="social" saving={saving} saved={saved} onClick={handleSave} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SaveButton({
  group,
  saving,
  saved,
  onClick,
}: {
  group: string;
  saving: string | null;
  saved: string | null;
  onClick: (group: string) => void;
}) {
  const isSaving = saving === group;
  const isSaved = saved === group;

  return (
    <Button onClick={() => onClick(group)} disabled={isSaving}>
      {isSaving ? (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      ) : isSaved ? (
        <Check className="mr-1 h-3.5 w-3.5" />
      ) : (
        <Save className="mr-1 h-3.5 w-3.5" />
      )}
      {isSaving ? "Saving..." : isSaved ? "Saved" : "Save Changes"}
    </Button>
  );
}
