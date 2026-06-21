<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeasurementUnit extends Model
{
    protected $table = 'measurement_units';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'code',
        'name',
        'conversion_to_sqft',
        'is_active',
    ];

    protected $casts = [
        'conversion_to_sqft' => 'decimal:8',
        'is_active' => 'boolean',
    ];

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
