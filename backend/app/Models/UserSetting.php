<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    protected $fillable = [
        'user_id',
        'email_notifications',
        'push_notifications',
        'sms_alerts',
        'marketing_emails',
        'theme',
        'language',
        'two_factor_enabled',
        'biometric_login',
    ];

    protected function casts(): array
    {
        return [
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'sms_alerts' => 'boolean',
            'marketing_emails' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'biometric_login' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
