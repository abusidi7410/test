<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\VtuProvider;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:transactions,users,revenue,providers'],
            'period' => ['nullable', 'string', 'in:daily,weekly,monthly,yearly'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = $validated['start_date'] ? Carbon::parse($validated['start_date'])->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $endDate = $validated['end_date'] ? Carbon::parse($validated['end_date'])->endOfDay() : Carbon::now()->endOfDay();
        $period = $validated['period'] ?? 'daily';

        $data = match ($validated['type']) {
            'transactions' => $this->getTransactionReport($startDate, $endDate, $period),
            'users' => $this->getUserReport($startDate, $endDate, $period),
            'revenue' => $this->getRevenueReport($startDate, $endDate, $period),
            'providers' => $this->getProviderReport($startDate, $endDate, $period),
        };

        return $this->successResponse([
            'report' => [
                'type' => $validated['type'],
                'period' => $period,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'generated_at' => now()->toISOString(),
                ...$data,
            ],
        ]);
    }

    public function export(Request $request): void
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:transactions,users,revenue,providers'],
            'period' => ['nullable', 'string', 'in:daily,weekly,monthly,yearly'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = $validated['start_date'] ? Carbon::parse($validated['start_date'])->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $endDate = $validated['end_date'] ? Carbon::parse($validated['end_date'])->endOfDay() : Carbon::now()->endOfDay();
        $period = $validated['period'] ?? 'daily';

        $data = match ($validated['type']) {
            'transactions' => $this->getTransactionReport($startDate, $endDate, $period),
            'users' => $this->getUserReport($startDate, $endDate, $period),
            'revenue' => $this->getRevenueReport($startDate, $endDate, $period),
            'providers' => $this->getProviderReport($startDate, $endDate, $period),
        };

        $csvContent = $this->generateCsv($validated['type'], $data);

        $filename = 'report_' . $validated['type'] . '_' . $startDate->format('Y-m-d') . '_to_' . $endDate->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        response()->stream(function () use ($csvContent) {
            echo $csvContent;
        }, 200, $headers)->send();
    }

    public function exportPdf(Request $request): mixed
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:transactions,users,revenue,providers'],
            'period' => ['nullable', 'string', 'in:daily,weekly,monthly,yearly'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = $validated['start_date'] ? Carbon::parse($validated['start_date'])->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $endDate = $validated['end_date'] ? Carbon::parse($validated['end_date'])->endOfDay() : Carbon::now()->endOfDay();
        $period = $validated['period'] ?? 'daily';

        $data = match ($validated['type']) {
            'transactions' => $this->getTransactionReport($startDate, $endDate, $period),
            'users' => $this->getUserReport($startDate, $endDate, $period),
            'revenue' => $this->getRevenueReport($startDate, $endDate, $period),
            'providers' => $this->getProviderReport($startDate, $endDate, $period),
        };

        $report = [
            'type' => $validated['type'],
            'period' => $period,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'generated_at' => now()->toISOString(),
            ...$data,
        ];

        $title = ucfirst($validated['type']) . ' Report';
        $filename = 'report_' . $validated['type'] . '_' . $startDate->format('Y-m-d') . '_to_' . $endDate->format('Y-m-d') . '.pdf';

        $pdf = Pdf::loadView('reports.pdf', compact('title', 'report'));
        return $pdf->download($filename);
    }

    private function getTransactionReport(Carbon $startDate, Carbon $endDate, string $period): array
    {
        $baseQuery = Transaction::whereBetween('created_at', [$startDate, $endDate]);

        $totalCount = (clone $baseQuery)->count();

        $byStatus = (clone $baseQuery)
            ->select('status', \DB::raw('COUNT(*) as count'), \DB::raw('SUM(amount) as total_amount'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $byCategory = (clone $baseQuery)
            ->select('category', \DB::raw('COUNT(*) as count'), \DB::raw('SUM(amount) as total_amount'))
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $byDate = (clone $baseQuery)
            ->select(\DB::raw('DATE(created_at) as date'), \DB::raw('COUNT(*) as count'), \DB::raw('SUM(amount) as total_amount'))
            ->groupBy(\DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        $totalVolume = (clone $baseQuery)->where('status', TransactionStatus::SUCCESSFUL)->sum('amount');

        return [
            'total_count' => $totalCount,
            'by_status' => $byStatus,
            'by_category' => $byCategory,
            'by_date' => $byDate,
            'total_volume' => $totalVolume,
        ];
    }

    private function getUserReport(Carbon $startDate, Carbon $endDate, string $period): array
    {
        $totalCount = User::count();

        $newUsersByPeriod = User::whereBetween('created_at', [$startDate, $endDate])
            ->select(\DB::raw('DATE(created_at) as date'), \DB::raw('COUNT(*) as count'))
            ->groupBy(\DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        $activeUsers = User::where('last_login_at', '>=', $startDate)->count();
        $inactiveUsers = $totalCount - $activeUsers;

        return [
            'total_count' => $totalCount,
            'new_users_by_period' => $newUsersByPeriod,
            'active_users' => $activeUsers,
            'inactive_users' => $inactiveUsers,
        ];
    }

    private function getRevenueReport(Carbon $startDate, Carbon $endDate, string $period): array
    {
        $baseQuery = Transaction::where('status', TransactionStatus::SUCCESSFUL)
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalRevenue = (clone $baseQuery)->sum('amount');
        $totalFees = (clone $baseQuery)->sum('fees');

        $byService = (clone $baseQuery)
            ->select('category', \DB::raw('COUNT(*) as count'), \DB::raw('SUM(amount) as total_amount'), \DB::raw('SUM(fees) as total_fees'))
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $byPeriod = (clone $baseQuery)
            ->select(\DB::raw('DATE(created_at) as date'), \DB::raw('SUM(amount) as total_amount'), \DB::raw('SUM(fees) as total_fees'))
            ->groupBy(\DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return [
            'total_revenue' => $totalRevenue,
            'total_fees' => $totalFees,
            'by_service' => $byService,
            'by_period' => $byPeriod,
        ];
    }

    private function getProviderReport(Carbon $startDate, Carbon $endDate, string $period): array
    {
        $providers = VtuProvider::all()->map(fn ($provider) => [
            'id' => $provider->id,
            'name' => $provider->name,
            'slug' => $provider->slug,
            'total_requests' => $provider->total_requests,
            'successful_requests' => $provider->successful_requests,
            'failed_requests' => $provider->failed_requests,
            'success_rate' => $provider->getSuccessRate(),
            'avg_response_time_ms' => $provider->avg_response_time_ms,
            'status' => $provider->status->value,
        ]);

        return [
            'total_providers' => VtuProvider::count(),
            'active_providers' => VtuProvider::where('status', 'active')->count(),
            'providers' => $providers,
        ];
    }

    private function generateCsv(string $type, array $data): string
    {
        $output = fopen('php://temp', 'r+');

        match ($type) {
            'transactions' => $this->writeTransactionsCsv($output, $data),
            'users' => $this->writeUsersCsv($output, $data),
            'revenue' => $this->writeRevenueCsv($output, $data),
            'providers' => $this->writeProvidersCsv($output, $data),
        };

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    private function writeTransactionsCsv($handle, array $data): void
    {
        fputcsv($handle, ['Metric', 'Value']);
        fputcsv($handle, ['Total Transactions', $data['total_count']]);
        fputcsv($handle, ['Total Volume', $data['total_volume']]);
        fputcsv($handle, []);
        fputcsv($handle, ['Status', 'Count', 'Total Amount']);

        foreach ($data['by_status'] as $status => $info) {
            fputcsv($handle, [$status, $info->count, $info->total_amount]);
        }

        fputcsv($handle, []);
        fputcsv($handle, ['Category', 'Count', 'Total Amount']);

        foreach ($data['by_category'] as $category => $info) {
            fputcsv($handle, [$category, $info->count, $info->total_amount]);
        }

        fputcsv($handle, []);
        fputcsv($handle, ['Date', 'Count', 'Total Amount']);

        foreach ($data['by_date'] as $row) {
            fputcsv($handle, [$row->date, $row->count, $row->total_amount]);
        }
    }

    private function writeUsersCsv($handle, array $data): void
    {
        fputcsv($handle, ['Metric', 'Value']);
        fputcsv($handle, ['Total Users', $data['total_count']]);
        fputcsv($handle, ['Active Users', $data['active_users']]);
        fputcsv($handle, ['Inactive Users', $data['inactive_users']]);
        fputcsv($handle, []);
        fputcsv($handle, ['Date', 'New Users']);

        foreach ($data['new_users_by_period'] as $row) {
            fputcsv($handle, [$row->date, $row->count]);
        }
    }

    private function writeRevenueCsv($handle, array $data): void
    {
        fputcsv($handle, ['Metric', 'Value']);
        fputcsv($handle, ['Total Revenue', $data['total_revenue']]);
        fputcsv($handle, ['Total Fees', $data['total_fees']]);
        fputcsv($handle, []);
        fputcsv($handle, ['Service', 'Count', 'Total Amount', 'Total Fees']);

        foreach ($data['by_service'] as $service => $info) {
            fputcsv($handle, [$service, $info->count, $info->total_amount, $info->total_fees]);
        }

        fputcsv($handle, []);
        fputcsv($handle, ['Date', 'Total Amount', 'Total Fees']);

        foreach ($data['by_period'] as $row) {
            fputcsv($handle, [$row->date, $row->total_amount, $row->total_fees]);
        }
    }

    private function writeProvidersCsv($handle, array $data): void
    {
        fputcsv($handle, ['Provider', 'Slug', 'Status', 'Total Requests', 'Successful', 'Failed', 'Success Rate (%)', 'Avg Response (ms)']);

        foreach ($data['providers'] as $provider) {
            fputcsv($handle, [
                $provider['name'],
                $provider['slug'],
                $provider['status'],
                $provider['total_requests'],
                $provider['successful_requests'],
                $provider['failed_requests'],
                $provider['success_rate'],
                $provider['avg_response_time_ms'],
            ]);
        }
    }
}
