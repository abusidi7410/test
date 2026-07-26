import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminAdmins, type AdminUser } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/admins/$id")({
  head: () => ({ meta: [{ title: "Admin Detail — TechHub Admin" }] }),
  component: AdminAdminDetailPage,
});

function AdminAdminDetailPage() {
  const { id } = Route.useParams();
  const adminId = Number(id);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "admin", adminId],
    queryFn: () => adminAdmins.get(adminId),
  });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const admin = data?.admin;

  useEffect(() => {
    if (admin) {
      setForm({
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
      });
    }
  }, [admin]);

  const updateMutation = useMutation({
    mutationFn: () => adminAdmins.update(adminId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "admin", adminId] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/admin/admins">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={admin ? `${admin.first_name} ${admin.last_name}` : "Admin Detail"}
          description={admin?.email}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 w-full rounded-md bg-muted" />
                <div className="h-10 w-full rounded-md bg-muted" />
                <div className="h-10 w-full rounded-md bg-muted" />
              </div>
            ) : admin ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {admin.first_name[0]}{admin.last_name[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{admin.first_name} {admin.last_name}</div>
                    <Badge
                      variant="outline"
                      className={
                        admin.status === "active"
                          ? "bg-[color:oklch(0.94_0.05_155)] text-[color:oklch(0.35_0.15_155)] border-transparent"
                          : "bg-[color:oklch(0.96_0.05_27)] text-[color:oklch(0.5_0.2_27)] border-transparent"
                      }
                    >
                      {admin.status}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    defaultValue={admin.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    defaultValue={admin.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    defaultValue={admin.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <Button
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Admin not found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            {admin ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono">{admin.id}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Verified</span>
                  <Badge variant={admin.email_verified_at ? "default" : "secondary"}>
                    {admin.email_verified_at ? "Yes" : "No"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(admin.created_at).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(admin.updated_at).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
