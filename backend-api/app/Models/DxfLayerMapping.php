<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DxfLayerMapping extends Model
{
    protected $table = 'dxf_layer_mappings';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'dxf_file_id',
        'layer_name',
        'layer_type',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function dxfFile(): BelongsTo
    {
        return $this->belongsTo(DxfFile::class, 'dxf_file_id');
    }
}
