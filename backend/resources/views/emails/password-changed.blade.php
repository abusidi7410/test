@component('emails.layout', ['subject' => 'Your Password Was Changed'])
    <p class="greeting">Hello {{ $firstName }},</p>
    <p class="paragraph">
        This email is to confirm that your Techub account password was successfully changed.
    </p>
    <table class="info-table" role="presentation">
        <tr>
            <td>Date</td>
            <td>{{ $changedAt }}</td>
        </tr>
        @if ($ipAddress)
        <tr>
            <td>IP Address</td>
            <td>{{ $ipAddress }}</td>
        </tr>
        @endif
        @if ($device)
        <tr>
            <td>Device</td>
            <td>{{ $device }}</td>
        </tr>
        @endif
    </table>
    <div style="background-color: #fef8e7; border-radius: 12px; padding: 16px; margin-top: 8px;">
        <p style="font-size: 13px; color: #8a6d0b; margin: 0;">
            <strong>Didn't make this change?</strong> If you did not change your password, please contact our support team immediately at <a href="mailto:support@techub.com" style="color: #6C5CE7;">support@techub.com</a>.
        </p>
    </div>
    <p class="paragraph" style="margin-top: 20px;">
        For your security, we recommend enabling two-factor authentication if you haven't already.
    </p>
@endcomponent
