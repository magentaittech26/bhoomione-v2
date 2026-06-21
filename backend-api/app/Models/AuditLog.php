<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $keyType = 'string';
    public $incrementing = false;
    
    // Dissolving typical updated_at constraints for absolute lock correctness in audit tracking
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'tenant_id',
        'user_id',
        'entity_name',
        'entity_id',
        'action',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Optional tenant scope context relation.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Performing user relation mapping.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
