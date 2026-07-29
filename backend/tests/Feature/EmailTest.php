<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Mail\PasswordChangedMail;
use App\Mail\ResetPasswordMail;
use App\Mail\VerifyEmailMail;
use App\Mail\WalletFundedMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    public function test_welcome_email_content_is_correct(): void
    {
        $user = new User(['first_name' => 'Jane', 'email' => 'jane@example.com']);

        $mailable = new WelcomeMail($user);

        $mailable->assertHasSubject('Welcome to Techub 🎉');
        $mailable->assertSeeInHtml('Hello Jane');
        $mailable->assertSeeInHtml('Go to Dashboard');
        $mailable->assertSeeInHtml('Airtime');
        $mailable->assertSeeInHtml('Data Bundles');
    }

    public function test_verification_email_content_is_correct(): void
    {
        $user = new User(['first_name' => 'Jane']);

        $mailable = new VerifyEmailMail(
            $user,
            'https://techub.com/verify?token=abc',
            '60 minutes',
        );

        $mailable->assertHasSubject('Verify Your Email Address');
        $mailable->assertSeeInHtml('Hello Jane');
        $mailable->assertSeeInHtml('Verify Email Address');
        $mailable->assertSeeInHtml('Security Notice');
    }

    public function test_password_reset_email_content_is_correct(): void
    {
        $user = new User(['first_name' => 'John']);

        $mailable = new ResetPasswordMail(
            $user,
            'https://techub.com/reset-password?token=abc',
            '60 minutes',
        );

        $mailable->assertHasSubject('Reset Your Password');
        $mailable->assertSeeInHtml('Hello John');
        $mailable->assertSeeInHtml('Reset Password');
        $mailable->assertSeeInHtml('Security Advice');
    }

    public function test_password_changed_email_content_is_correct(): void
    {
        $user = new User(['first_name' => 'John']);

        $mailable = new PasswordChangedMail($user, '192.168.1.1', 'Mozilla/5.0');

        $mailable->assertHasSubject('Your Password Was Changed');
        $mailable->assertSeeInHtml('Hello John');
        $mailable->assertSeeInHtml('192.168.1.1');
        $mailable->assertSeeInHtml('Mozilla/5.0');
        $mailable->assertSeeInHtml('support@techub.com');
    }

    public function test_wallet_funded_email_content_is_correct(): void
    {
        $user = new User(['first_name' => 'John', 'email' => 'john@example.com']);

        $mailable = new WalletFundedMail(
            $user,
            '10,000.00',
            'REF-123',
            '50,000.00',
            'card',
            '15 January 2026, 2:30 PM',
        );

        $mailable->assertHasSubject('Wallet Funding Successful');
        $mailable->assertSeeInHtml('Hello John');
        $mailable->assertSeeInHtml('10,000.00');
        $mailable->assertSeeInHtml('REF-123');
        $mailable->assertSeeInHtml('50,000.00');
        $mailable->assertSeeInHtml('Successful');
    }

    public function test_email_layout_renders_complete_html(): void
    {
        $user = new User(['first_name' => 'Test', 'email' => 'test@example.com']);

        $mailable = new WelcomeMail($user);
        $rendered = $mailable->render();

        $this->assertStringContainsString('Techub', $rendered);
        $this->assertStringContainsString('support@techub.com', $rendered);
        $this->assertStringContainsString(date('Y'), $rendered);
        $this->assertStringContainsString('</html>', $rendered);
    }

    public function test_all_mailable_subjects_are_professional(): void
    {
        $user = new User(['first_name' => 'Test', 'email' => 'test@example.com']);

        $this->assertStringContainsString('Welcome', (new WelcomeMail($user))->envelope()->subject);
        $this->assertStringContainsString('Verify', (new VerifyEmailMail($user, 'url'))->envelope()->subject);
        $this->assertStringContainsString('Reset', (new ResetPasswordMail($user, 'url'))->envelope()->subject);
        $this->assertStringContainsString('Password Was Changed', (new PasswordChangedMail($user))->envelope()->subject);
        $this->assertStringContainsString('Funding Successful', (new WalletFundedMail($user, '100', 'ref', '500'))->envelope()->subject);
    }

    public function test_mailables_implement_should_queue(): void
    {
        $user = new User(['first_name' => 'Test', 'email' => 'test@example.com']);

        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, new WelcomeMail($user));
        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, new VerifyEmailMail($user, 'url'));
        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, new ResetPasswordMail($user, 'url'));
        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, new PasswordChangedMail($user));
        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, new WalletFundedMail($user, '100', 'ref', '500'));
    }
}
