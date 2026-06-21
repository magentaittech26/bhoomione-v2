<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefreshToken extends Model
{
    protected $table = 'refresh_tokens';

    protected $keyType = 'string';
    public $incrementing = false;

    // Disabling standard Laravel timestamps as refresh tokens have only a creation and expire date
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'user_id',
        'token_hash',
        'revoked',
        'expires_at',
    ];

    protected $casts = [
        'revoked' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * Parent user mapping.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
