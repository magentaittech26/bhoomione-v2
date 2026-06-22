<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaasModule extends Model
{
    use SoftDeletes;

    protected $table = 'saas_modules';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'code', 'name', 'group', 'description', 'status', 'is_core', 'is_billable', 'sort_order'
    ];

    protected $casts = [
        'is_core' => 'boolean',
        'is_billable' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function features(): HasMany
    {
        return $this->hasMany(SaasFeature::class, 'module_id');
    }
}
