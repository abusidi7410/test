import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Mail, Phone, ShieldCheck, Pencil, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/lib/queries";
import { profileSchema, type ProfileInput } from "@/lib/validations";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Techub" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();

  const profile = profileQuery.data;
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "";
  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("") || "?";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone ?? "" }
      : undefined,
  });

  function onSubmit(data: ProfileInput) {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
        setEditing(false);
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to update profile");
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information and verification."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="relative mx-auto w-fit">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted"
                aria-label="Change photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            {profileQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="mx-auto h-5 w-32" />
                <Skeleton className="mx-auto h-4 w-24" />
              </div>
            ) : (
              <>
                <h2 className="mt-4 text-lg font-semibold">{fullName}</h2>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" /> Verified account
                </div>
                <Badge variant="secondary" className="mt-3">
                  {profile?.level ?? "Level 1"}
                </Badge>
              </>
            )}
            <div className="mt-6 space-y-3 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {profile?.email ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {profile?.phone ?? "—"}
              </div>
            </div>
            <div className="mt-6 text-left">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Level upgrade progress</span>
                <span className="font-semibold">72%</span>
              </div>
              <Progress value={72} />
              <Button className="mt-4 w-full">Upgrade to Level 3</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Personal information</h3>
                <p className="text-xs text-muted-foreground">
                  This will be displayed on your account.
                </p>
              </div>
              {editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
            {profileQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="mb-1.5 h-3 w-16" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs">First name</Label>
                  <Input {...register("first_name")} disabled={!editing} className="h-11" />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-destructive">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Last name</Label>
                  <Input {...register("last_name")} disabled={!editing} className="h-11" />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Email</Label>
                  <Input value={profile?.email ?? ""} disabled className="h-11" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Phone</Label>
                  <Input {...register("phone")} disabled={!editing} className="h-11" />
                </div>
                {editing && (
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={updateProfile.isPending} className="h-11">
                      {updateProfile.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {updateProfile.isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                )}
              </form>
            )}
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">Security settings</div>
                  <p className="text-xs text-muted-foreground">
                    Password, two-factor authentication, connected accounts.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
