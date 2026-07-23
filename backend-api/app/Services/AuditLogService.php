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
            $userId = !empty($params['userId']) && Str::isUuid($params['userId']) ? $params['userId'] : null;
            $tenantId = !empty($params['tenantId']) && Str::isUuid($params['tenantId']) ? $params['tenantId'] : null;
            $entityId = !empty($params['entityId']) && Str::isUuid($params['entityId']) ? $params['entityId'] : '00000000-0000-0000-0000-000000000000';

            AuditLog::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'entity_name' => $params['entityName'] ?? 'system',
                'entity_id' => $entityId,
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
