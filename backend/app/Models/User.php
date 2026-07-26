<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AccountLevel;
use App\Enums\UserStatus;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuid, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'email',
        'phone',
        'password',
        'avatar',
        'level',
        'referral_code',
        'referred_by',
        'email_verified_at',
        'phone_verified_at',
        'two_factor_enabled',
        'two_factor_secret',
        'transaction_pin',
        'pin_set_at',
        'status',
        'last_login_at',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'transaction_pin' => 'hashed',
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'pin_set_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'last_login_at' => 'datetime',
            'level' => AccountLevel::class,
            'status' => UserStatus::class,
        ];
    }

    public function hasTransactionPin(): bool
    {
        return $this->pin_set_at !== null;
    }

    public function verifyTransactionPin(string $pin): bool
    {
        if (!$this->hasTransactionPin()) {
            return false;
        }

        return \Illuminate\Support\Facades\Hash::check($pin, $this->transaction_pin);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function referredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(BankAccount::class);
    }

    public function giftCards(): HasMany
    {
        return $this->hasMany(GiftCard::class);
    }
}
