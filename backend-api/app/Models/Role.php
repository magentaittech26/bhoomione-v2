<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $table = 'roles';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'code',
        'name',
        'scope',
    ];

    /**
     * Users matching this role at global scopes.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles', 'role_id', 'user_id');
    }

    /**
     * Users matching this role within scoped tenant workspace boundaries.
     */
    public function tenantUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_users', 'role_id', 'user_id')
            ->withPivot('tenant_id')
            ->withTimestamps();
    }

    /**
     * Permissions grouped under this role container.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }
}
