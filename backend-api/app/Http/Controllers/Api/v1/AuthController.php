<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use App\Services\JwtTokenService;
use App\Services\AuditLogService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Extracts context parameters (IP and User-Agent) for precise audit trails.
     */
    private function getClientContext(Request $request): array
    {
        return [
            'ip' => $request->ip(),
            'userAgent' => $request->userAgent(),
        ];
    }

    /**
     * POST /api/v1/auth/admin/login
     */
    public function adminLogin(LoginRequest $request)
    {
        $context = $this->getClientContext($request);

        try {
            $userProfile = AuthService::authenticatePlatformAdmin($request->email, $request->password);

            $refreshToken = JwtTokenService::generateAndSaveRefreshToken($userProfile['id']);
            $accessToken = JwtTokenService::generateAccessToken([
                'userId' => $userProfile['id'],
                'email' => $userProfile['email'],
                'name' => $userProfile['name'],
                'role' => $userProfile['role'],
                'tenantId' => null,
            ]);

            AuditLogService::log([
                'tenantId' => null,
                'userId' => $userProfile['id'],
                'entityName' => 'users',
                'entityId' => $userProfile['id'],
                'action' => 'LOGIN_SUCCESS',
                'newValues' => ['scope' => 'GLOBAL', 'email' => $userProfile['email']],
                'ipAddress' => $context['ip'],
                'userAgent' => $context['userAgent'],
            ]);

            $userProfile['permissions'] = PermissionService::getUserPermissions($userProfile['id'], null);

            return response()->json([
                'accessToken' => $accessToken,
                'refreshToken' => $refreshToken,
                'user' => $userProfile,
            ]);
        } catch (\Exception $e) {
            AuditLogService::log([
                'tenantId' => null,
                'userId' => null,
                'entityName' => 'security_events',
                'entityId' => '00000000-0000-0000-0000-000000000000',
                'action' => 'LOGIN_FAILURE',
                'oldValues' => ['email' => $request->email, 'attempt_scope' => 'GLOBAL', 'reason' => $e->getMessage()],
                'ipAddress' => $context['ip'],
                'userAgent' => $context['userAgent'],
            ]);

            return response()->json(['error' => $e->getMessage()], 401);
        }
    }

    /**
     * POST /api/v1/auth/tenant/login
     */
    public function tenantLogin(Request $request)
    {
        // Custom inline verification to throw 400 for empty login fields
        if (!$request->has('email') || !$request->has('password')) {
            return response()->json(['error' => 'Email and password parameters are required.'], 400);
        }

        $context = $this->getClientContext($request);
        $resolvedTenant = $request->attributes->get('resolvedTenant');

        if (!$resolvedTenant) {
            return response()->json([
                'error' => 'Tenant context could not be resolved. Please specify X-Tenant-ID header or access via workspace domain.'
            ], 400);
        }

        try {
            $userProfile = AuthService::authenticateTenantUser($request->email, $request->password, $resolvedTenant->id);

            $refreshToken = JwtTokenService::generateAndSaveRefreshToken($userProfile['id']);
            $accessToken = JwtTokenService::generateAccessToken([
                'userId' => $userProfile['id'],
                'email' => $userProfile['email'],
                'name' => $userProfile['name'],
                'role' => $userProfile['role'],
                'tenantId' => $resolvedTenant->id,
            ]);

            AuditLogService::log([
                'tenantId' => $resolvedTenant->id,
                'userId' => $userProfile['id'],
                'entityName' => 'users',
                'entityId' => $userProfile['id'],
                'action' => 'LOGIN_SUCCESS',
                'newValues' => [
                    'scope' => 'TENANT',
                    'email' => $userProfile['email'],
                    'tenantCode' => $resolvedTenant->tenantCode
                ],
                'ipAddress' => $context['ip'],
                'userAgent' => $context['userAgent'],
            ]);

            $userProfile['permissions'] = PermissionService::getUserPermissions($userProfile['id'], $resolvedTenant->id);

            return response()->json([
                'accessToken' => $accessToken,
                'refreshToken' => $refreshToken,
                'user' => $userProfile,
            ]);
        } catch (\Exception $e) {
            AuditLogService::log([
                'tenantId' => $resolvedTenant->id,
                'userId' => null,
                'entityName' => 'security_events',
                'entityId' => '00000000-0000-0000-0000-000000000000',
                'action' => 'LOGIN_FAILURE',
                'oldValues' => [
                    'email' => $request->email,
                    'attempt_scope' => 'TENANT',
                    'tenantId' => $resolvedTenant->id,
                    'reason' => $e->getMessage()
                ],
                'ipAddress' => $context['ip'],
                'userAgent' => $context['userAgent'],
            ]);

            return response()->json(['error' => $e->getMessage()], 401);
        }
    }

    /**
     * POST /api/v1/auth/refresh
     */
    public function refresh(Request $request)
    {
        $refreshToken = $request->input('refreshToken');
        $context = $this->getClientContext($request);

        if (!$refreshToken) {
            return response()->json(['error' => 'Refresh token parameter is missing.'], 400);
        }

        try {
            $userId = JwtTokenService::validateRefreshToken($refreshToken);

            if (!$userId) {
                return response()->json(['error' => 'Refresh token is invalid, revoked, or expired.'], 401);
            }

            // Using simple profile resolve
            $profile = AuthService::getUserProfile($userId, null);

            $accessToken = JwtTokenService::generateAccessToken([
                'userId' => $profile['id'],
                'email' => $profile['email'],
                'name' => $profile['name'],
                'role' => $profile['role'],
                'tenantId' => $profile['tenantId'],
            ]);

            AuditLogService::log([
                'tenantId' => $profile['tenantId'],
                'userId' => $profile['id'],
                'entityName' => 'users',
                'entityId' => $profile['id'],
                'action' => 'TOKEN_REFRESH',
                'ipAddress' => $context['ip'],
                'userAgent' => $context['userAgent'],
            ]);

            return response()->json([
                'accessToken' => $accessToken
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to refresh authentication token.'], 500);
        }
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request)
    {
        $refreshToken = $request->input('refreshToken');
        $context = $this->getClientContext($request);

        if (!$refreshToken) {
            return response()->json(['error' => 'Refresh token is required to execute logout workflow.'], 400);
        }

        try {
            $userId = JwtTokenService::validateRefreshToken($refreshToken);

            if ($userId) {
                JwtTokenService::revokeRefreshToken($refreshToken);
                $profile = null;

                try {
                    $profile = AuthService::getUserProfile($userId, null);
                } catch (\Exception $ex) {}

                AuditLogService::log([
                    'tenantId' => $profile ? $profile['tenantId'] : null,
                    'userId' => $userId,
                    'entityName' => 'users',
                    'entityId' => $userId,
                    'action' => 'LOGOUT',
                    'ipAddress' => $context['ip'],
                    'userAgent' => $context['userAgent'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logged out session successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to verify or execute logout request.'], 500);
        }
    }

    /**
     * POST /api/v1/auth/password-reset/request
     */
    public function requestPasswordReset(Request $request)
    {
        $email = $request->input('email');
        $context = $this->getClientContext($request);

        if (!$email) {
            return response()->json(['error' => 'Email parameter is required.'], 400);
        }

        try {
            $result = AuthService::requestPasswordReset($email);

            AuditLogService::log([
                'tenantId' => null,
                'userId' => null,
                'entityName' => 'security_events',
                'entityId' => '00000000-0000-0000-0000-000000000000',
                'action' => 'PASSWORD_RESET_REQUEST',
                'newValues' => ['email' => $email, 'resultMessage' => $result['message'], 'resetToken' => $result['resetToken'] ?? null],
                'ipAddress' => $context['ip'],
                'userAgent' => $context['userAgent'],
            ]);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'tokenSymbolReferenceSandbox' => $result['resetToken'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Internal error executing password reset step.'], 500);
        }
    }

    /**
     * POST /api/v1/auth/password-reset/submit
     */
    public function submitPasswordReset(Request $request)
    {
        $email = $request->input('email');
        $token = $request->input('token');
        $newPassword = $request->input('newPassword');
        $context = $this->getClientContext($request);

        if (!$email || !$token || !$newPassword) {
            return response()->json(['error' => 'Email, validation token, and newPassword parameters are mandatory.'], 400);
        }

        try {
            $success = AuthService::submitPasswordReset($email, $token, $newPassword);

            if (!$success) {
                return response()->json(['error' => 'Password update failed. Profile mismatch or expired confirmation parameters.'], 400);
            }

            AuditLogService::log([
                'tenantId' => null,
                'userId' => null,
                'entityName' => 'security_events',
                'entityId' => '00000000-0000-0000-0000-000000000000',
                'action' => 'PASSWORD_RESET_SUBMIT',
                'newValues' => ['email' => $email, 'token' => $token],
                'ipAddress' => $context['ip'],
                'userAgent' => $context['userAgent'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Credentials modified successfully. Proceed to login page.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * GET /api/v1/me
     */
    public function me(Request $request)
    {
        $bearer = $request->bearerToken();

        if (!$bearer) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        try {
            $decoded = JwtTokenService::verifyAccessToken($bearer);
            $profile = AuthService::getUserProfile($decoded['userId'], $decoded['tenantId']);
            $profile['permissions'] = PermissionService::getUserPermissions($decoded['userId'], $decoded['tenantId']);

            return response()->json([
                'user' => $profile
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?: 'Could not reconcile profile credentials.'], 401);
        }
    }
}
