<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'password_hash',
        'kyc_status',
        'status',
    ];

    protected $hidden = [
        'password_hash',
    ];

    /**
     * Get the password for the user.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Scope roles for global administrators.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    /**
     * Tenants mapped to this user with scoped roles.
     */
    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_users', 'user_id', 'tenant_id')
            ->withPivot('role_id')
            ->withTimestamps();
    }

    /**
     * Audit logs authored by this user.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    /**
     * Active refresh tokens associated with user session profiles.
     */
    public function refreshTokens(): HasMany
    {
        return $this->hasMany(RefreshToken::class, 'user_id');
    }

    /**
     * Assert if user possesses a specific permission code in the active security perimeter.
     *
     * @param string $permissionCode Unique identifier (e.g. 'users.manage')
     * @param string|null $tenantId UUID, if working inside a Tenant workspace frame.
     * @return bool
     */
    public function hasPermission(string $permissionCode, ?string $tenantId = null): bool
    {
        // If working under a Tenant context
        if ($tenantId !== null) {
            return DB::table('tenant_users')
                ->join('role_permissions', 'tenant_users.role_id', '=', 'role_permissions.role_id')
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('tenant_users.user_id', $this->id)
                ->where('tenant_users.tenant_id', $tenantId)
                ->where('permissions.code', $permissionCode)
                ->exists();
        }

        // Fallback: Check global platform admin role allocations
        return DB::table('user_roles')
            ->join('role_permissions', 'user_roles.role_id', '=', 'role_permissions.role_id')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('user_roles.user_id', $this->id)
            ->where('permissions.code', $permissionCode)
            ->exists();
    }
}
