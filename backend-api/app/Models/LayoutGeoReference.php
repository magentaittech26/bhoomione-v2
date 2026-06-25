<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LayoutGeoReference extends Model
{
    protected $table = 'layout_geo_references';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'layout_id',
        'anchor_1_dxf_x',
        'anchor_1_dxf_y',
        'anchor_1_lat',
        'anchor_1_lng',
        'anchor_2_dxf_x',
        'anchor_2_dxf_y',
        'anchor_2_lat',
        'anchor_2_lng',
        'transform_matrix',
    ];

    protected $casts = [
        'anchor_1_dxf_x' => 'float',
        'anchor_1_dxf_y' => 'float',
        'anchor_1_lat' => 'float',
        'anchor_1_lng' => 'float',
        'anchor_2_dxf_x' => 'float',
        'anchor_2_dxf_y' => 'float',
        'anchor_2_lat' => 'float',
        'anchor_2_lng' => 'float',
        'transform_matrix' => 'array',
    ];

    public function layout(): BelongsTo
    {
        return $this->belongsTo(Layout::class, 'layout_id');
    }
}
