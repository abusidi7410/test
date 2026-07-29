@component('emails.layout', ['subject' => 'Welcome to Techub 🎉'])
    <p class="greeting">Hello {{ $firstName }},</p>
    <p class="paragraph">
        Welcome to Techub.
    </p>
    <p class="paragraph">
        Thank you for choosing Techub as your trusted platform for digital payments and everyday services. We're excited to have you with us.
    </p>
    <p class="paragraph">
        Your account has been successfully created and is now ready for use.
    </p>
    <p class="paragraph">
        From one secure dashboard you can:
    </p>
    <ul class="feature-list">
        <li>Purchase Airtime</li>
        <li>Buy Data Bundles</li>
        <li>Pay Electricity Bills</li>
        <li>Subscribe to Cable TV</li>
        <li>Fund Your Wallet</li>
        <li>Transfer & Withdraw Instantly</li>
        <li>Convert Airtime to Cash</li>
    </ul>
    <table class="button-cell" role="presentation">
        <tr>
            <td>
                <a class="button" href="{{ $dashboardUrl }}">Go to Dashboard</a>
            </td>
        </tr>
    </table>
    <p class="paragraph" style="margin-top: 20px;">
        If you have any questions, our support team is always ready to help.
    </p>
    <p class="paragraph">
        Thank you for choosing Techub.
    </p>
@endcomponent
