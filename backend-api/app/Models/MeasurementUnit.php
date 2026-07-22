<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MeasurementUnit extends Model
{
    use SoftDeletes;

    protected $table = 'measurement_units';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'uuid',
        'code',
        'name',
        'display_name',
        'symbol',
        'short_code',
        'measurement_type',
        'conversion_factor',
        'conversion_to_sqft',
        'base_unit',
        'precision',
        'decimal_places',
        'display_order',
        'is_metric',
        'is_default',
        'is_system',
        'is_active',
        'country_code',
        'state_code',
        'tenant_override_allowed',
        'description',
    ];

    protected $casts = [
        'conversion_factor' => 'decimal:8',
        'conversion_to_sqft' => 'decimal:8',
        'precision' => 'integer',
        'decimal_places' => 'integer',
        'display_order' => 'integer',
        'is_metric' => 'boolean',
        'is_default' => 'boolean',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'tenant_override_allowed' => 'boolean',
    ];

    protected $dates = ['deleted_at'];

    public function layouts(): HasMany
    {
        return $this->hasMany(Layout::class, 'measurement_unit_id');
    }

    public function layoutTotalAreas(): HasMany
    {
        return $this->hasMany(Layout::class, 'total_area_unit_id');
    }

    public function plots(): HasMany
    {
        return $this->hasMany(Plot::class, 'measurement_unit_id');
    }
}
