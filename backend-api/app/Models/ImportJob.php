<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImportJob extends Model
{
    protected $table = 'import_jobs';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'dxf_file_id',
        'status',
        'total_entities_found',
        'extracted_metadata',
        'error_message',
        'queued_at',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'extracted_metadata' => 'array',
        'queued_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function dxfFile(): BelongsTo
    {
        return $this->belongsTo(DxfFile::class, 'dxf_file_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ImportJobLog::class, 'import_job_id');
    }
}
