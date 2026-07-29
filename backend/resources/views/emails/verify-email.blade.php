@component('emails.layout', ['subject' => 'Verify Your Email Address'])
    <p class="greeting">Hello {{ $firstName }},</p>
    <p class="paragraph">
        Thank you for creating an account with Techub. To start using your account securely, please verify your email address by clicking the button below.
    </p>
    <table class="button-cell" role="presentation">
        <tr>
            <td>
                <a class="button" href="{{ $verificationUrl }}">Verify Email Address</a>
            </td>
        </tr>
    </table>
    <p class="paragraph">
        This verification link will expire in {{ $expiresIn }}.
    </p>
    <p class="paragraph">
        If you did not create an account with Techub, please ignore this email. No further action is required.
    </p>
    <div style="background-color: #fef8e7; border-radius: 12px; padding: 16px; margin-top: 16px;">
        <p style="font-size: 13px; color: #8a6d0b; margin: 0;">
            <strong>Security Notice:</strong> Never share your verification link with anyone. Techub will never ask for your password or verification code via email or phone.
        </p>
    </div>
@endcomponent
