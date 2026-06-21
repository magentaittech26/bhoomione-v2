<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SvgLabel extends Model
{
    protected $table = 'svg_labels';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'svg_document_id',
        'source_plot_id',
        'text',
        'x',
        'y',
        'rotation',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(SvgDocument::class, 'svg_document_id');
    }

    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class, 'source_plot_id');
    }
}
