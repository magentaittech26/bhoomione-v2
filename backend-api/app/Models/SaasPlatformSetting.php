<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasPlatformSetting extends Model
{
    protected $table = 'saas_platform_settings';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'setting_group', 'setting_key', 'setting_value', 'setting_type', 'is_public'
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];
}
