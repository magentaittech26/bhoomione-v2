<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Project extends Model
{
    protected $table = 'projects';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'name',
        'code',
        'developer_name',
        'location',
        'status',
        'rera_number',
        'approval_status',
        'approval_authority',
        'launch_date',
        'possession_target_date',
        'approvals_metadata',
    ];

    protected $casts = [
        'approvals_metadata' => 'array',
        'launch_date' => 'date',
        'possession_target_date' => 'date',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function layouts(): HasMany
    {
        return $this->hasMany(Layout::class, 'project_id');
    }

    public function plots(): HasManyThrough
    {
        return $this->hasManyThrough(Plot::class, Layout::class, 'project_id', 'layout_id');
    }

    public function availablePlots(): HasManyThrough
    {
        return $this->hasManyThrough(Plot::class, Layout::class, 'project_id', 'layout_id')->where('plots.status', 'AVAILABLE');
    }

    public function reservedPlots(): HasManyThrough
    {
        return $this->hasManyThrough(Plot::class, Layout::class, 'project_id', 'layout_id')->where('plots.status', 'RESERVED');
    }
}
