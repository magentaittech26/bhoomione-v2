<?php

namespace App\Core\Lifecycle\Contracts;

interface LifecycleHistoryRepositoryInterface
{
    public function recordTransition(LifecycleTransitionResultInterface $result, LifecycleContextInterface $context): string;
    public function getHistoryForEntity(string $entityType, string $entityId, ?string $tenantId = null, int $limit = 50): array;
    public function getLatestTransition(string $entityType, string $entityId, ?string $tenantId = null): ?array;
    public function findByIdempotencyKey(string $tenantId, string $idempotencyKey): ?array;
    public function recordIdempotency(string $tenantId, string $idempotencyKey, string $transitionId, array $requestData, array $responsePayload): void;
}
