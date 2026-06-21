<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SvgStyleProfile extends Model
{
    protected $table = 'svg_style_profiles';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'profile_key',
        'fill_color',
        'stroke_color',
        'stroke_width',
        'opacity',
        'additional_styles',
    ];

    protected $casts = [
        'additional_styles' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
