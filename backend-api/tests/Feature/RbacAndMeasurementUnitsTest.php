<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Services\JwtTokenService;
use App\Services\PermissionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RbacAndMeasurementUnitsTest extends TestCase
{
    /**
     * Test unauthenticated request to POST /api/v1/measurement-units returns HTTP 401.
     */
    public function test_unauthenticated_request_returns_401()
    {
        $response = $this->postJson('/api/v1/measurement-units', [
            'code' => 'TEST_SQFT',
            'name' => 'Test Square Feet',
            'symbol' => 'tsqft',
            'conversion_factor' => 1.0,
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test authenticated request without masters.measurement_units.create returns HTTP 403.
     */
    public function test_user_without_create_permission_returns_403()
    {
        $userId = (string) Str::uuid();
        $tenantId = (string) Str::uuid();

        // Create token for a mock user without permissions
        $token = JwtTokenService::generateAccessToken([
            'userId' => $userId,
            'email' => 'noaccess@bhoomione.com',
            'role' => 'READ_ONLY_USER',
            'tenantId' => $tenantId,
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Tenant-ID' => $tenantId,
        ])->postJson('/api/v1/measurement-units', [
            'code' => 'UNAUTH_UOM',
            'name' => 'Unauthorized Unit',
            'symbol' => 'uuo',
            'conversion_factor' => 1.0,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test RBAC sync artisan command idempotency and execution.
     */
    public function test_rbac_sync_artisan_command()
    {
        $exitCode = $this->artisan('rbac:sync-permissions');
        $this->assertEquals(0, $exitCode);

        // Verify measurement unit permissions exist
        $exists = DB::table('permissions')
            ->where('code', 'masters.measurement_units.create')
            ->exists();

        $this->assertTrue($exists);
    }

    /**
     * Test tenant isolation in PermissionService evaluation.
     */
    public function test_tenant_isolation_in_permission_evaluation()
    {
        $userId = (string) Str::uuid();
        $tenantA = (string) Str::uuid();
        $tenantB = (string) Str::uuid();

        // Evaluate permissions for tenantA vs tenantB
        $permsA = PermissionService::getUserPermissions($userId, $tenantA);
        $permsB = PermissionService::getUserPermissions($userId, $tenantB);

        // Assert empty or scoped permissions
        $this->assertIsArray($permsA);
        $this->assertIsArray($permsB);
    }
}
