<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GenerationBatch extends Model
{
    protected $table = 'generation_batches';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'import_job_id',
        'generated_plots',
        'generated_roads',
        'generated_amenities',
        'status',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'generated_plots' => 'array',
        'generated_roads' => 'array',
        'generated_amenities' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function importJob(): BelongsTo
    {
        return $this->belongsTo(ImportJob::class, 'import_job_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
