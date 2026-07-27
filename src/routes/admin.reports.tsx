import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Download,
  BarChart3,
  Users,
  ArrowLeftRight,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Techub Admin" }] }),
  component: AdminReportsPage,
});

const reportTypes = [
  {
    title: "User Reports",
    description: "User registrations, activity, and demographics",
    icon: Users,
    count: "3 reports",
  },
  {
    title: "Transaction Reports",
    description: "Transaction volumes, success rates, and trends",
    icon: ArrowLeftRight,
    count: "5 reports",
  },
  {
    title: "Revenue Reports",
    description: "Platform revenue, fees collected, and projections",
    icon: Banknote,
    count: "4 reports",
  },
  {
    title: "Growth Reports",
    description: "User growth, service adoption, and market trends",
    icon: TrendingUp,
    count: "2 reports",
  },
];

function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and view platform reports."
        actions={
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((r) => (
          <Card key={r.title} className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <r.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{r.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-3">
                <Badge variant="secondary">{r.count}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Reports</CardTitle>
          <CardDescription>Previously generated reports available for download.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No reports generated yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Generate your first report from the categories above. Reports will appear here once created.
            </p>
            <Button className="mt-4" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
