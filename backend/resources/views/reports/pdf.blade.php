<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{{ $title }}</title>
<style>
  body { font-family: 'DejaVu Sans', sans-serif; font-size: 10pt; color: #1a1a2e; line-height: 1.4; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
  .header h1 { font-size: 18pt; color: #2563eb; margin: 0 0 5px; }
  .header p { font-size: 9pt; color: #6b7280; margin: 2px 0; }
  .meta { margin-bottom: 15px; }
  .meta table { width: 100%; font-size: 9pt; }
  .meta td { padding: 2px 8px; }
  .meta td:first-child { color: #6b7280; width: 120px; }
  table.data { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
  table.data th { background: #2563eb; color: white; padding: 6px 8px; text-align: left; }
  table.data td { padding: 4px 8px; border-bottom: 1px solid #e5e7eb; }
  table.data tr:nth-child(even) td { background: #f9fafb; }
  .summary { margin: 15px 0; }
  .summary-card { display: inline-block; padding: 8px 15px; border: 1px solid #e5e7eb; border-radius: 4px; margin: 3px; text-align: center; }
  .summary-card .value { font-size: 14pt; font-weight: bold; color: #2563eb; }
  .summary-card .label { font-size: 7pt; color: #6b7280; text-transform: uppercase; }
  .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 7pt; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 5px; }
  .page-break { page-break-after: always; }
</style>
</head>
<body>

<div class="header">
  <h1>{{ $title }}</h1>
  <p>{{ $report['start_date'] }} to {{ $report['end_date'] }} &middot; Generated {{ $report['generated_at'] }}</p>
</div>

<div class="meta">
  <table>
    <tr><td>Report Type</td><td>{{ ucfirst($report['type']) }}</td></tr>
    <tr><td>Period</td><td>{{ ucfirst($report['period']) }}</td></tr>
    <tr><td>Generated</td><td>{{ $report['generated_at'] }}</td></tr>
  </table>
</div>

@if($report['type'] === 'transactions')
  <div class="summary">
    <div class="summary-card"><div class="value">{{ number_format($report['total_count']) }}</div><div class="label">Total Transactions</div></div>
    <div class="summary-card"><div class="value">₦{{ number_format($report['total_volume'], 2) }}</div><div class="label">Total Volume</div></div>
  </div>

  <h3>By Status</h3>
  <table class="data">
    <tr><th>Status</th><th>Count</th><th>Total Amount</th></tr>
    @foreach($report['by_status'] as $status => $info)
    <tr><td>{{ $status }}</td><td>{{ $info->count }}</td><td>₦{{ number_format($info->total_amount, 2) }}</td></tr>
    @endforeach
  </table>

  <h3>By Category</h3>
  <table class="data">
    <tr><th>Category</th><th>Count</th><th>Total Amount</th></tr>
    @foreach($report['by_category'] as $category => $info)
    <tr><td>{{ $category }}</td><td>{{ $info->count }}</td><td>₦{{ number_format($info->total_amount, 2) }}</td></tr>
    @endforeach
  </table>

  <div class="page-break"></div>

  <h3>Daily Breakdown</h3>
  <table class="data">
    <tr><th>Date</th><th>Count</th><th>Total Amount</th></tr>
    @foreach($report['by_date'] as $row)
    <tr><td>{{ $row->date }}</td><td>{{ $row->count }}</td><td>₦{{ number_format($row->total_amount, 2) }}</td></tr>
    @endforeach
  </table>

@elseif($report['type'] === 'users')
  <div class="summary">
    <div class="summary-card"><div class="value">{{ number_format($report['total_count']) }}</div><div class="label">Total Users</div></div>
    <div class="summary-card"><div class="value">{{ number_format($report['active_users']) }}</div><div class="label">Active</div></div>
    <div class="summary-card"><div class="value">{{ number_format($report['inactive_users']) }}</div><div class="label">Inactive</div></div>
  </div>

  <h3>New Users</h3>
  <table class="data">
    <tr><th>Date</th><th>New Users</th></tr>
    @foreach($report['new_users_by_period'] as $row)
    <tr><td>{{ $row->date }}</td><td>{{ $row->count }}</td></tr>
    @endforeach
  </table>

@elseif($report['type'] === 'revenue')
  <div class="summary">
    <div class="summary-card"><div class="value">₦{{ number_format($report['total_revenue'], 2) }}</div><div class="label">Total Revenue</div></div>
    <div class="summary-card"><div class="value">₦{{ number_format($report['total_fees'], 2) }}</div><div class="label">Total Fees</div></div>
  </div>

  <h3>By Service</h3>
  <table class="data">
    <tr><th>Service</th><th>Count</th><th>Total Amount</th><th>Total Fees</th></tr>
    @foreach($report['by_service'] as $service => $info)
    <tr><td>{{ $service }}</td><td>{{ $info->count }}</td><td>₦{{ number_format($info->total_amount, 2) }}</td><td>₦{{ number_format($info->total_fees, 2) }}</td></tr>
    @endforeach
  </table>

  <div class="page-break"></div>

  <h3>Daily Revenue</h3>
  <table class="data">
    <tr><th>Date</th><th>Total Amount</th><th>Total Fees</th></tr>
    @foreach($report['by_period'] as $row)
    <tr><td>{{ $row->date }}</td><td>₦{{ number_format($row->total_amount, 2) }}</td><td>₦{{ number_format($row->total_fees, 2) }}</td></tr>
    @endforeach
  </table>

@elseif($report['type'] === 'providers')
  <div class="summary">
    <div class="summary-card"><div class="value">{{ $report['total_providers'] }}</div><div class="label">Total Providers</div></div>
    <div class="summary-card"><div class="value">{{ $report['active_providers'] }}</div><div class="label">Active</div></div>
  </div>

  <table class="data">
    <tr><th>Provider</th><th>Status</th><th>Requests</th><th>Success</th><th>Failed</th><th>Rate</th><th>Avg Response</th></tr>
    @foreach($report['providers'] as $p)
    <tr>
      <td>{{ $p['name'] }}</td>
      <td>{{ $p['status'] }}</td>
      <td>{{ number_format($p['total_requests']) }}</td>
      <td>{{ number_format($p['successful_requests']) }}</td>
      <td>{{ number_format($p['failed_requests']) }}</td>
      <td>{{ $p['success_rate'] }}%</td>
      <td>{{ $p['avg_response_time_ms'] }}ms</td>
    </tr>
    @endforeach
  </table>
@endif

<div class="footer">
  Techub &middot; {{ date('Y') }} &middot; Confidential
</div>

</body>
</html>
