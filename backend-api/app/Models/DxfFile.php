<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DxfFile extends Model
{
    protected $table = 'dxf_files';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'project_id',
        'layout_id',
        'file_name',
        'file_path',
        'file_size',
        'file_hash',
        'version',
        'created_by',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function layout(): BelongsTo
    {
        return $this->belongsTo(Layout::class, 'layout_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function importJobs(): HasMany
    {
        return $this->hasMany(ImportJob::class, 'dxf_file_id');
    }

    public function dxfLayerMappings(): HasMany
    {
        return $this->hasMany(DxfLayerMapping::class, 'dxf_file_id');
    }
}
