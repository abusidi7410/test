@component('emails.layout', ['subject' => 'Reset Your Password'])
    <p class="greeting">Hello {{ $firstName }},</p>
    <p class="paragraph">
        We received a request to reset the password for your Techub account. Click the button below to create a new password.
    </p>
    <table class="button-cell" role="presentation">
        <tr>
            <td>
                <a class="button" href="{{ $resetUrl }}">Reset Password</a>
            </td>
        </tr>
    </table>
    <p class="paragraph">
        This password reset link will expire in {{ $expiresIn }}.
    </p>
    <p class="paragraph">
        If you did not request a password reset, please ignore this email. Your account remains secure and no changes have been made.
    </p>
    <div style="background-color: #fef8e7; border-radius: 12px; padding: 16px; margin-top: 16px;">
        <p style="font-size: 13px; color: #8a6d0b; margin: 0;">
            <strong>Security Advice:</strong> Choose a strong password that you don't use on other sites. Enable two-factor authentication for added security.
        </p>
    </div>
@endcomponent
