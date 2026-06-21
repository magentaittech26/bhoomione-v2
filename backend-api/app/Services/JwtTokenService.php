<?php

namespace App\Services;

use App\Models\RefreshToken;
use Illuminate\Support\Str;
use Carbon\Carbon;

class JwtTokenService
{
    /**
     * Retrieve the JWT signing secret keys from config boundaries.
     */
    private static function getSecret(): string
    {
        return env('JWT_SECRET', 'bhoomione_v2_ultra_secure_development_secret_key_2026');
    }

    /**
     * Generates a 15-minute cryptographically signed JWT access token.
     */
    public static function generateAccessToken(array $payload): string
    {
        $issuedAt = time();
        $expireAt = $issuedAt + 900; // 15 Minutes

        $jwtPayload = [
            'sub' => $payload['userId'],
            'email' => $payload['email'],
            'name' => $payload['name'],
            'role' => $payload['role'] ?? null,
            'tenantId' => $payload['tenantId'] ?? null,
            'iat' => $issuedAt,
            'exp' => $expireAt,
        ];

        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($jwtPayload)));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::getSecret(), true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Generates a revocable cryptographically secure refresh token string and registers it in database.
     */
    public static function generateAndSaveRefreshToken(string $userId): string
    {
        $rawToken = bin2hex(random_bytes(40));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = Carbon::now()->addDays(30);

        RefreshToken::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'revoked' => false,
            'expires_at' => $expiresAt,
        ]);

        return $rawToken;
    }

    /**
     * Verifies access token and decodes payload. Returns decoded payload array or throws Exception.
     */
    public static function verifyAccessToken(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \Exception("Invalid token signature mapping.");
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::getSecret(), true);
        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if (!hash_equals($expectedSignature, $base64UrlSignature)) {
            throw new \Exception("Security check: Token signature checks failed.");
        }

        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload)), true);

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new \Exception("Token state expired. Re-authentication necessary.");
        }

        return [
            'userId' => $payload['sub'],
            'email' => $payload['email'],
            'name' => $payload['name'],
            'role' => $payload['role'] ?? null,
            'tenantId' => $payload['tenantId'] ?? null,
        ];
    }

    /**
     * Validates refresh token from incoming parameters.
     * Returns user_id string if valid, or null if invalid/revoked/expired.
     */
    public static function validateRefreshToken(string $rawToken): ?string
    {
        try {
            $tokenHash = hash('sha256', $rawToken);
            $tokenModel = RefreshToken::where('token_hash', $tokenHash)->first();

            if (!$tokenModel || $tokenModel->revoked || $tokenModel->expires_at->isPast()) {
                return null;
            }

            return $tokenModel->user_id;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Revokes specific refresh token structure. Returns true if successful or false otherwise.
     */
    public static function revokeRefreshToken(string $rawToken): bool
    {
        try {
            $tokenHash = hash('sha256', $rawToken);
            $tokenModel = RefreshToken::where('token_hash', $tokenHash)->first();

            if ($tokenModel) {
                $tokenModel->update(['revoked' => true]);
                return true;
            }

            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Revokes all active refresh tokens for specific user security profile reset.
     */
    public static function revokeAllUserTokens(string $userId): void
    {
        RefreshToken::where('user_id', $userId)->update(['revoked' => true]);
    }
}
