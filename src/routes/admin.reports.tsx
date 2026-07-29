import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Download, BarChart3, Users, ArrowLeftRight,
  Banknote, TrendingUp, Loader2, FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminReports } from "@/lib/admin-api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Techub Admin" }] }),
  component: AdminReportsPage,
});

const reportTypes = [
  { id: "transactions", title: "Transaction Reports", description: "Transaction volumes, success rates, and trends", icon: ArrowLeftRight },
  { id: "users", title: "User Reports", description: "User registrations, activity, and demographics", icon: Users },
  { id: "revenue", title: "Revenue Reports", description: "Platform revenue, fees collected, and projections", icon: Banknote },
  { id: "providers", title: "Provider Reports", description: "VTU provider performance and health", icon: TrendingUp },
];

const periods = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function AdminReportsPage() {
  const [type, setType] = useState("transactions");
  const [period, setPeriod] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = {
    type,
    period,
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () => adminReports.generate(params),
    enabled: false,
  });

  const handleGenerate = () => {
    refetch();
  };

  const handleExportCsv = () => {
    adminReports.exportCsv(params);
    toast.success("CSV download started");
  };

  const handleExportPdf = () => {
    adminReports.exportPdf(params);
    toast.success("PDF download started");
  };

  const report = data?.report as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export platform reports."
        actions={
          <div className="flex gap-2">
            <Link to="/admin/reports" className="text-sm text-muted-foreground hover:text-foreground">Reports</Link>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Report</CardTitle>
          <CardDescription>Choose report parameters and generate.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>{rt.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
            {report && (
              <>
                <Button variant="outline" onClick={handleExportCsv}>
                  <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportPdf}>
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">Generating report...</span>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">Failed to generate report. Please try again.</p>
            <Button variant="outline" className="mt-3" onClick={handleGenerate}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {report && !isLoading && (
        <SummaryCards report={report} />
      )}

      {!report && !isLoading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reportTypes.map((rt) => (
              <Card key={rt.title} className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => setType(rt.id)}>
                <CardContent className="p-5">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <rt.icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">{rt.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{rt.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">No Report Generated</CardTitle>
              <CardDescription>Select parameters above and click "Generate Report".</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-semibold">No reports generated yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Choose a report type and date range above, then click Generate Report.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCards({ report }: { report: Record<string, unknown> }) {
  const type = report.type as string;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base capitalize">{type} Report</CardTitle>
        <CardDescription>
          {report.start_date as string} to {report.end_date as string} &middot; Generated {new Date(report.generated_at as string).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {type === "transactions" && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <SummaryCard label="Total Transactions" value={(report.total_count as number)?.toLocaleString()} />
              <SummaryCard label="Total Volume" value={`₦${Number(report.total_volume).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
            </div>
            <Separator />
            <h4 className="text-sm font-medium">By Status</h4>
            <ReportTable headers={["Status", "Count", "Amount"]} rows={Object.entries(report.by_status as Record<string, { count: number; total_amount: number }>).map(([k, v]) => [k, String(v.count), `₦${Number(v.total_amount).toLocaleString()}`])} />
            <h4 className="text-sm font-medium">By Category</h4>
            <ReportTable headers={["Category", "Count", "Amount"]} rows={Object.entries(report.by_category as Record<string, { count: number; total_amount: number }>).map(([k, v]) => [k, String(v.count), `₦${Number(v.total_amount).toLocaleString()}`])} />
          </>
        )}
        {type === "users" && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Total Users" value={(report.total_count as number)?.toLocaleString()} />
              <SummaryCard label="Active" value={(report.active_users as number)?.toLocaleString()} />
              <SummaryCard label="Inactive" value={(report.inactive_users as number)?.toLocaleString()} />
            </div>
            <Separator />
            <h4 className="text-sm font-medium">New Users</h4>
            <ReportTable headers={["Date", "New Users"]} rows={(report.new_users_by_period as { date: string; count: number }[])?.map((r) => [r.date, String(r.count)])} />
          </>
        )}
        {type === "revenue" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Total Revenue" value={`₦${Number(report.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              <SummaryCard label="Total Fees" value={`₦${Number(report.total_fees).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
            </div>
            <Separator />
            <h4 className="text-sm font-medium">By Service</h4>
            <ReportTable headers={["Service", "Count", "Amount", "Fees"]} rows={Object.entries(report.by_service as Record<string, { count: number; total_amount: number; total_fees: number }>).map(([k, v]) => [k, String(v.count), `₦${Number(v.total_amount).toLocaleString()}`, `₦${Number(v.total_fees).toLocaleString()}`])} />
          </>
        )}
        {type === "providers" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Total Providers" value={String(report.total_providers)} />
              <SummaryCard label="Active" value={String(report.active_providers)} />
            </div>
            <Separator />
            <ReportTable headers={["Provider", "Status", "Requests", "Success", "Failed", "Rate", "Avg Response"]} rows={(report.providers as Record<string, string | number>[])?.map((p) => [String(p.name), String(p.status), String(p.total_requests), String(p.successful_requests), String(p.failed_requests), `${p.success_rate}%`, `${p.avg_response_time_ms}ms`])} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-muted-foreground">No data available.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
