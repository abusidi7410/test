<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminBroadcast extends Model
{
    use HasFactory;

    protected $table = 'admin_broadcasts';

    protected $fillable = [
        'sent_by',
        'title',
        'message',
        'type',
        'target',
        'target_users',
        'target_roles',
        'sent_at',
        'recipients_count',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'target_users' => 'array',
            'target_roles' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'sent_by');
    }
}
