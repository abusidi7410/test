import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Bell, Lock, Globe, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { useSettings, useUpdateSettings } from "@/lib/queries";
import type { AppSettings } from "@/lib/api";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Techub" }] }),
  component: SettingsPage,
});

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettings();

  const [local, setLocal] = useState<AppSettings>({
    email_notifications: true,
    push_notifications: true,
    sms_alerts: false,
    marketing_emails: false,
    theme: "light",
    language: "en",
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setLocal(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  function patch(partial: Partial<AppSettings>) {
    const next = { ...local, ...partial };
    setLocal(next);
    updateSettings.mutate(next, {
      onError: (err) => {
        toast.error(err.message ?? "Failed to save settings");
        if (settingsQuery.data) setLocal(settingsQuery.data);
      },
    });
  }

  if (settingsQuery.isLoading) {
    return (
      <div>
        <PageHeader
          title="Settings"
          description="Customize appearance, notifications, security and more."
        />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Customize appearance, notifications, security and more."
      />
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card>
            <CardContent className="p-6">
              <Row title="Theme" desc="Toggle between light and dark mode.">
                <Button variant="outline" onClick={toggle} className="gap-2">
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Dark
                    </>
                  )}
                </Button>
              </Row>
              <Separator />
              <Row title="Language" desc="Choose your preferred language.">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={local.language}
                  onChange={(e) => patch({ language: e.target.value })}
                >
                  <option value="en">English (US)</option>
                  <option value="fr">Français</option>
                  <option value="yo">Yorùbá</option>
                  <option value="ha">Hausa</option>
                </select>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-6">
              <Row title="Email notifications" desc="Transaction alerts, receipts and news.">
                <Switch
                  checked={local.email_notifications}
                  onCheckedChange={(v) => patch({ email_notifications: v })}
                  disabled={updateSettings.isPending}
                />
              </Row>
              <Separator />
              <Row title="Push notifications" desc="Mobile alerts for account activity.">
                <Switch
                  checked={local.push_notifications}
                  onCheckedChange={(v) => patch({ push_notifications: v })}
                  disabled={updateSettings.isPending}
                />
              </Row>
              <Separator />
              <Row title="SMS alerts" desc="Get an SMS for every debit above ₦10,000.">
                <Switch
                  checked={local.sms_alerts}
                  onCheckedChange={(v) => patch({ sms_alerts: v })}
                  disabled={updateSettings.isPending}
                />
              </Row>
              <Separator />
              <Row title="Marketing emails" desc="Product updates and promotions.">
                <Switch
                  checked={local.marketing_emails}
                  onCheckedChange={(v) => patch({ marketing_emails: v })}
                  disabled={updateSettings.isPending}
                />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs">Current password</Label>
                    <Input type="password" placeholder="••••••••" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs">New password</Label>
                    <Input type="password" placeholder="••••••••" className="h-11" />
                  </div>
                </div>
                <Button className="w-fit">
                  <Lock className="mr-2 h-4 w-4" />
                  Update password
                </Button>
              </div>
              <Separator className="my-6" />
              <Row
                title="Two-factor authentication"
                desc="Add an extra layer of security using an authenticator app."
              >
                <Switch defaultChecked />
              </Row>
              <Separator />
              <Row
                title="Biometric login"
                desc="Log in with fingerprint or Face ID on trusted devices."
              >
                <Switch />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardContent className="p-6">
              {[
                { icon: Globe, name: "Google", status: "Connected" },
                { icon: Bell, name: "Facebook", status: "Not connected" },
                { icon: Smartphone, name: "TikTok", status: "Not connected" },
              ].map((c, i, arr) => (
                <div key={c.name}>
                  <div className="flex items-center gap-3 py-4">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <c.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.status}</div>
                    </div>
                    <Button variant={c.status === "Connected" ? "outline" : "default"} size="sm">
                      {c.status === "Connected" ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
