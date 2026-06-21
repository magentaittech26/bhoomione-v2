<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Road extends Model
{
    protected $table = 'roads';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'layout_id',
        'source_geometry_entity_id',
        'generation_batch_id',
        'road_name',
        'road_type',
        'width',
        'length',
        'area_value',
        'measurement_unit_id',
        'bounding_box',
    ];

    protected $casts = [
        'width' => 'decimal:2',
        'length' => 'decimal:2',
        'area_value' => 'decimal:4',
        'bounding_box' => 'array',
    ];

    public function layout(): BelongsTo
    {
        return $this->belongsTo(Layout::class, 'layout_id');
    }

    public function geometryEntity(): BelongsTo
    {
        return $this->belongsTo(GeometryEntity::class, 'source_geometry_entity_id');
    }

    public function generationBatch(): BelongsTo
    {
        return $this->belongsTo(GenerationBatch::class, 'generation_batch_id');
    }

    public function measurementUnit(): BelongsTo
    {
        return $this->belongsTo(MeasurementUnit::class, 'measurement_unit_id');
    }
}
