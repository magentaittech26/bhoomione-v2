<?php

namespace App\Core\Lifecycle\History;

use App\Core\Lifecycle\Contracts\LifecycleContextInterface;
use App\Core\Lifecycle\Contracts\LifecycleHistoryRepositoryInterface;
use App\Core\Lifecycle\Contracts\LifecycleTransitionResultInterface;
use App\Models\LifecycleIdempotencyRecordModel;
use App\Models\LifecycleTransitionModel;
use Illuminate\Support\Str;

class LifecycleHistoryRepository implements LifecycleHistoryRepositoryInterface
{
    public function recordTransition(LifecycleTransitionResultInterface $result, LifecycleContextInterface $context): string
    {
        $id = (string) Str::uuid();

        LifecycleTransitionModel::create([
            'id' => $id,
            'tenant_id' => $context->getTenantId() ?? '00000000-0000-0000-0000-000000000000',
            'organization_id' => $context->getOrganizationId(),
            'lifecycle_code' => $result->getLifecycleCode(),
            'lifecycle_version' => $result->getLifecycleVersion(),
            'entity_type' => $result->getEntityType(),
            'entity_id' => $result->getEntityId() ?? 'N/A',
            'transition_code' => $result->getTransitionCode(),
            'previous_state' => $result->getPreviousState(),
            'destination_state' => $result->getDestinationState(),
            'actor_id' => $context->getActorId(),
            'execution_source' => $context->getExecutionSource()->value,
            'reason' => $context->getReason(),
            'business_rule_evaluation_id' => $result->getBusinessRuleEvaluationId(),
            'override_id' => null,
            'correlation_id' => $result->getCorrelationId(),
            'metadata' => array_merge($context->getMetadata(), $result->getMetadata()),
            'transitioned_at' => now(),
            'reversed_transition_id' => null,
        ]);

        return $id;
    }

    public function getHistoryForEntity(string $entityType, string $entityId, ?string $tenantId = null, int $limit = 50): array
    {
        $query = LifecycleTransitionModel::where('entity_type', $entityType)
            ->where('entity_id', $entityId);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->orderBy('transitioned_at', 'desc')
            ->take($limit)
            ->get()
            ->toArray();
    }

    public function getLatestTransition(string $entityType, string $entityId, ?string $tenantId = null): ?array
    {
        $query = LifecycleTransitionModel::where('entity_type', $entityType)
            ->where('entity_id', $entityId);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $record = $query->orderBy('transitioned_at', 'desc')->first();
        return $record ? $record->toArray() : null;
    }

    public function findByIdempotencyKey(string $tenantId, string $idempotencyKey): ?array
    {
        $record = LifecycleIdempotencyRecordModel::where('tenant_id', $tenantId)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        return $record ? $record->toArray() : null;
    }

    public function recordIdempotency(string $tenantId, string $idempotencyKey, string $transitionId, array $requestData, array $responsePayload): void
    {
        LifecycleIdempotencyRecordModel::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'idempotency_key' => $idempotencyKey,
            'lifecycle_code' => $responsePayload['data']['lifecycle_code'] ?? 'unknown',
            'entity_type' => $responsePayload['data']['entity_type'] ?? 'unknown',
            'entity_id' => $responsePayload['data']['entity_id'] ?? 'unknown',
            'transition_code' => $responsePayload['data']['transition_code'] ?? 'unknown',
            'transition_id' => $transitionId,
            'request_hash' => md5(json_encode($requestData)),
            'response_payload' => $responsePayload,
        ]);
    }
}
