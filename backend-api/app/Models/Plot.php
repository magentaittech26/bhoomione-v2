<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plot extends Model
{
    protected $table = 'plots';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'layout_id',
        'plot_number',
        'area_value',
        'measurement_unit_id',
        'length',
        'width',
        'road_width',
        'corner_plot',
        'facing',
        'dimensions',
        'dimensions_metadata',
        'status',
        'source_geometry_entity_id',
        'generation_batch_id',
        'detected_label',
        'generated_label',
    ];

    protected $casts = [
        'area_value' => 'decimal:4',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'road_width' => 'decimal:2',
        'corner_plot' => 'boolean',
        'dimensions_metadata' => 'array',
    ];

    public function layout(): BelongsTo
    {
        return $this->belongsTo(Layout::class, 'layout_id');
    }

    public function measurementUnit(): BelongsTo
    {
        return $this->belongsTo(MeasurementUnit::class, 'measurement_unit_id');
    }

    public function geometryEntity(): BelongsTo
    {
        return $this->belongsTo(GeometryEntity::class, 'source_geometry_entity_id');
    }

    public function generationBatch(): BelongsTo
    {
        return $this->belongsTo(GenerationBatch::class, 'generation_batch_id');
    }
}
