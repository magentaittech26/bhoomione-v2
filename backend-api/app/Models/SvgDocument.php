<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SvgDocument extends Model
{
    protected $table = 'svg_documents';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'layout_id',
        'generation_batch_id',
        'width',
        'height',
        'viewbox',
        'version',
        'render_profile',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function layout(): BelongsTo
    {
        return $this->belongsTo(Layout::class, 'layout_id');
    }

    public function generationBatch(): BelongsTo
    {
        return $this->belongsTo(GenerationBatch::class, 'generation_batch_id');
    }

    public function elements(): HasMany
    {
        return $this->hasMany(SvgElement::class, 'svg_document_id');
    }

    public function labels(): HasMany
    {
        return $this->hasMany(SvgLabel::class, 'svg_document_id');
    }
}
