<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkspaceTemplate extends Model
{
    protected $table = 'workspace_templates';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'code',
        'name',
        'description',
        'roles_permissions',
        'menus',
        'modules',
        'features',
        'limits',
        'default_settings',
        'branding',
        'seed_data',
    ];

    protected $casts = [
        'roles_permissions' => 'array',
        'menus' => 'array',
        'modules' => 'array',
        'features' => 'array',
        'limits' => 'array',
        'default_settings' => 'array',
        'branding' => 'array',
        'seed_data' => 'array',
    ];
}
