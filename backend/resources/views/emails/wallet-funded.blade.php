@component('emails.layout', ['subject' => 'Wallet Funding Successful'])
    <p class="greeting">Hello {{ $firstName }},</p>
    <p class="paragraph">
        Your Techub wallet has been credited successfully.
    </p>
    <div class="amount-large">₦{{ $amount }}</div>
    <table class="info-table" role="presentation">
        <tr>
            <td>Amount Funded</td>
            <td>₦{{ $amount }}</td>
        </tr>
        <tr>
            <td>Reference</td>
            <td>{{ $reference }}</td>
        </tr>
        <tr>
            <td>Payment Method</td>
            <td>{{ $paymentMethod ?? 'Card / Bank Transfer' }}</td>
        </tr>
        <tr>
            <td>Current Balance</td>
            <td>₦{{ $balance }}</td>
        </tr>
        <tr>
            <td>Date</td>
            <td>{{ $date }}</td>
        </tr>
        <tr>
            <td>Status</td>
            <td><span class="status-badge success">Successful</span></td>
        </tr>
    </table>
    <table class="button-cell" role="presentation">
        <tr>
            <td>
                <a class="button" href="{{ $dashboardUrl }}">View Transactions</a>
            </td>
        </tr>
    </table>
    <p class="paragraph" style="margin-top: 20px;">
        If you have any questions about this transaction, please contact our support team.
    </p>
@endcomponent
