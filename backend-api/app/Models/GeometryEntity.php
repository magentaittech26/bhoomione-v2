<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeometryEntity extends Model
{
    protected $table = 'geometry_entities';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'import_job_id',
        'source_layer_mapping_id',
        'layer_name',
        'geometry_type',
        'is_closed',
        'vertex_count',
        'vertices_json',
        'area_value',
        'bounding_box',
        'source_unit',
        'normalized_unit',
        'geometry_hash',
        'validation_status',
        'validation_messages',
    ];

    protected $casts = [
        'is_closed' => 'boolean',
        'vertex_count' => 'integer',
        'vertices_json' => 'array',
        'area_value' => 'double',
        'bounding_box' => 'array',
        'validation_messages' => 'array',
    ];

    public function importJob(): BelongsTo
    {
        return $this->belongsTo(ImportJob::class, 'import_job_id');
    }

    public function sourceLayerMapping(): BelongsTo
    {
        return $this->belongsTo(DxfLayerMapping::class, 'source_layer_mapping_id');
    }
}
