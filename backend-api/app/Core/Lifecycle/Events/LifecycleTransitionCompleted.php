<?php

namespace App\Core\Lifecycle\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LifecycleTransitionCompleted
{
    use Dispatchable, SerializesModels;

    public string $transitionId;
    public ?string $tenantId;
    public string $lifecycleCode;
    public string $lifecycleVersion;
    public string $entityType;
    public ?string $entityId;
    public string $transitionCode;
    public string $previousState;
    public string $destinationState;
    public ?string $actorId;
    public string $correlationId;
    public string $timestamp;
    public array $metadata;

    public function __construct(array $payload)
    {
        $this->transitionId = $payload['transition_id'] ?? '';
        $this->tenantId = $payload['tenant_id'] ?? null;
        $this->lifecycleCode = $payload['lifecycle_code'] ?? '';
        $this->lifecycleVersion = $payload['lifecycle_version'] ?? '1.0.0';
        $this->entityType = $payload['entity_type'] ?? '';
        $this->entityId = $payload['entity_id'] ?? null;
        $this->transitionCode = $payload['transition_code'] ?? '';
        $this->previousState = $payload['previous_state'] ?? '';
        $this->destinationState = $payload['destination_state'] ?? '';
        $this->actorId = $payload['actor_id'] ?? null;
        $this->correlationId = $payload['correlation_id'] ?? '';
        $this->timestamp = $payload['timestamp'] ?? date('c');
        $this->metadata = $payload['metadata'] ?? [];
    }
}
