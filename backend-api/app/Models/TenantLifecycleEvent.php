<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantLifecycleEvent extends Model
{
    protected $table = 'tenant_lifecycle_events';

    protected $keyType = 'string';
    public $incrementing = false;
    
    // Created_at only, no updated_at since it is a read-only ledger
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'tenant_id',
        'old_status',
        'new_status',
        'reason',
        'changed_by',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Associated tenant.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
