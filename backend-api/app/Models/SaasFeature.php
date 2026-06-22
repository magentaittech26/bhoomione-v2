<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaasFeature extends Model
{
    use SoftDeletes;

    protected $table = 'saas_features';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'module_id', 'code', 'name', 'group', 'description', 'status', 'default_enabled'
    ];

    protected $casts = [
        'default_enabled' => 'boolean',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(SaasModule::class, 'module_id');
    }
}
