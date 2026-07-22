<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantMeasurementUnitSetting extends Model
{
    use SoftDeletes;

    protected $table = 'tenant_measurement_unit_settings';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'uuid',
        'tenant_id',
        'measurement_unit_id',
        'is_enabled',
        'is_default',
        'display_precision',
        'decimal_places_override',
        'display_order',
        'custom_label',
        'custom_symbol',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'is_default' => 'boolean',
        'display_precision' => 'integer',
        'decimal_places_override' => 'integer',
        'display_order' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function measurementUnit(): BelongsTo
    {
        return $this->belongsTo(MeasurementUnit::class, 'measurement_unit_id');
    }
}
