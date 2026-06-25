<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Layout extends Model
{
    protected $table = 'layouts';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'name',
        'code',
        'layout_type',
        'approval_number',
        'approval_date',
        'total_area_value',
        'total_area_unit_id',
        'measurement_unit_id',
        'status',
    ];

    protected $casts = [
        'approval_date' => 'date',
        'total_area_value' => 'decimal:4',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function measurementUnit(): BelongsTo
    {
        return $this->belongsTo(MeasurementUnit::class, 'measurement_unit_id');
    }

    public function totalAreaUnit(): BelongsTo
    {
        return $this->belongsTo(MeasurementUnit::class, 'total_area_unit_id');
    }

    public function plots(): HasMany
    {
        return $this->hasMany(Plot::class, 'layout_id');
    }

    public function geoReference()
    {
        return $this->hasOne(LayoutGeoReference::class, 'layout_id');
    }
}
