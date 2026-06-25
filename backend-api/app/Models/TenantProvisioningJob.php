<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantProvisioningJob extends Model
{
    protected $table = 'tenant_provisioning_jobs';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'job_type',
        'status',
        'started_at',
        'completed_at',
        'error_message',
        'created_by',
        'current_step',
        'progress_percent',
        'duration_seconds',
        'retry_count',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Associated tenant relation.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
