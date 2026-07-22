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
        'tenant_id',
        'tenant_override_allowed',
        'description',
        'created_by',
        'updated_by',
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

    public function tenantSettings(): HasMany
    {
        return $this->hasMany(TenantMeasurementUnitSetting::class, 'measurement_unit_id');
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true)->whereNull('tenant_id');
    }

    public function scopeForTenant($query, ?string $tenantId)
    {
        return $query->where(function ($q) use ($tenantId) {
            $q->where('is_system', true);
            if (!empty($tenantId)) {
                $q->orWhere('tenant_id', $tenantId);
            }
        });
    }
}
