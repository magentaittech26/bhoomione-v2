<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SvgElement extends Model
{
    protected $table = 'svg_elements';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'svg_document_id',
        'source_geometry_entity_id',
        'element_type',
        'svg_data',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(SvgDocument::class, 'svg_document_id');
    }

    public function geometryEntity(): BelongsTo
    {
        return $this->belongsTo(GeometryEntity::class, 'source_geometry_entity_id');
    }
}
