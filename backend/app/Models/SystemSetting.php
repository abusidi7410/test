<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $table = 'system_settings';

    protected $fillable = [
        'group_name',
        'key_name',
        'value',
        'type',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'string',
        ];
    }

    public static function get(string $group, string $key, mixed $default = null): mixed
    {
        $cacheKey = "system_setting:{$group}:{$key}";

        return Cache::remember($cacheKey, 3600, function () use ($group, $key, $default) {
            $setting = static::where('group_name', $group)
                ->where('key_name', $key)
                ->first();

            return $setting?->value ?? $default;
        });
    }

    public static function set(string $group, string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['group_name' => $group, 'key_name' => $key],
            ['value' => (string) $value],
        );

        // Clear cache for this setting
        Cache::forget("system_setting:{$group}:{$key}");
    }

    public static function getGroup(string $group): array
    {
        $cacheKey = "system_settings:group:{$group}";

        return Cache::remember($cacheKey, 3600, function () use ($group) {
            $settings = static::where('group_name', $group)->get();

            return $settings->pluck('value', 'key_name')->toArray();
        });
    }

    public static function setGroup(string $group, array $settings): void
    {
        foreach ($settings as $key => $value) {
            static::set($group, $key, $value);
        }

        // Clear group cache
        Cache::forget("system_settings:group:{$group}");
    }
}
