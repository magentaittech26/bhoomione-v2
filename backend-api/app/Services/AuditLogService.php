<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Str;

class AuditLogService
{
    /**
     * Commits a state transformation or identity access event into PostgreSQL binary parameters.
     */
    public static function log(array $params): void
    {
        try {
            AuditLog::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $params['tenantId'] ?? null,
                'user_id' => $params['userId'] ?? null,
                'entity_name' => $params['entityName'] ?? 'system',
                'entity_id' => $params['entityId'] ?? '00000000-0000-0000-0000-000000000000',
                'action' => $params['action'] ?? 'UNKNOWN_ACTION',
                'old_values' => $params['oldValues'] ?? null,
                'new_values' => $params['newValues'] ?? null,
                'ip_address' => $params['ipAddress'] ?? null,
                'user_agent' => $params['userAgent'] ?? null,
            ]);
        } catch (\Exception $e) {
            // Safe logging fallback to verify systems metrics in developers console output streams
            logger()->error("⚠️ Failed to write audit logger parameters: " . $e->getMessage());
        }
    }
}
