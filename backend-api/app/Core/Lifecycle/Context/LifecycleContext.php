<?php

namespace App\Core\Lifecycle\Context;

use App\Core\Lifecycle\Contracts\LifecycleContextInterface;
use App\Core\Lifecycle\Enums\LifecycleExecutionSource;
use Illuminate\Support\Str;

class LifecycleContext implements LifecycleContextInterface
{
    protected ?string $tenantId;
    protected ?string $organizationId;
    protected ?string $actorId;
    protected array $actorRoles;
    protected string $entityType;
    protected ?string $entityId;
    protected ?string $currentState;
    protected ?string $requestedDestinationState;
    protected ?string $transitionCode;
    protected ?string $action;
    protected ?string $projectId;
    protected ?string $layoutId;
    protected ?string $subscriptionPlan;
    protected array $activeEntitlements;
    protected LifecycleExecutionSource $executionSource;
    protected ?string $reason;
    protected \DateTimeInterface $effectiveTimestamp;
    protected string $correlationId;
    protected ?string $idempotencyKey;
    protected array $requestData;
    protected ?array $entitySnapshot;
    protected array $relatedSnapshots;
    protected array $metadata;

    public function __construct(array $attributes = [])
    {
        $this->tenantId = $attributes['tenant_id'] ?? null;
        $this->organizationId = $attributes['organization_id'] ?? null;
        $this->actorId = $attributes['actor_id'] ?? null;
        $this->actorRoles = $attributes['actor_roles'] ?? [];
        $this->entityType = $attributes['entity_type'] ?? 'unknown';
        $this->entityId = $attributes['entity_id'] ?? null;
        $this->currentState = $attributes['current_state'] ?? null;
        $this->requestedDestinationState = $attributes['requested_destination_state'] ?? null;
        $this->transitionCode = $attributes['transition_code'] ?? null;
        $this->action = $attributes['action'] ?? null;
        $this->projectId = $attributes['project_id'] ?? null;
        $this->layoutId = $attributes['layout_id'] ?? null;
        $this->subscriptionPlan = $attributes['subscription_plan'] ?? null;
        $this->activeEntitlements = $attributes['active_entitlements'] ?? [];

        $source = $attributes['execution_source'] ?? 'WEB';
        $this->executionSource = $source instanceof LifecycleExecutionSource
            ? $source
            : (LifecycleExecutionSource::tryFrom(strtoupper((string)$source)) ?? LifecycleExecutionSource::WEB);

        $this->reason = $attributes['reason'] ?? null;
        $this->effectiveTimestamp = $attributes['effective_timestamp'] ?? new \DateTimeImmutable();
        $this->correlationId = $attributes['correlation_id'] ?? (string) Str::uuid();
        $this->idempotencyKey = $attributes['idempotency_key'] ?? null;

        $this->requestData = $this->sanitizePayload($attributes['request_data'] ?? []);
        $this->entitySnapshot = isset($attributes['entity_snapshot']) ? $this->sanitizePayload($attributes['entity_snapshot']) : null;
        $this->relatedSnapshots = $this->sanitizePayload($attributes['related_snapshots'] ?? []);
        $this->metadata = $attributes['metadata'] ?? [];
    }

    public static function create(array $attributes = []): self
    {
        return new self($attributes);
    }

    protected function sanitizePayload(array $data): array
    {
        $sensitiveKeys = ['password', 'secret', 'token', 'cvv', 'card_number', 'api_key'];
        foreach ($data as $key => $value) {
            if (is_string($key) && in_array(strtolower($key), $sensitiveKeys, true)) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->sanitizePayload($value);
            }
        }
        return $data;
    }

    public function getTenantId(): ?string { return $this->tenantId; }
    public function getOrganizationId(): ?string { return $this->organizationId; }
    public function getActorId(): ?string { return $this->actorId; }
    public function getActorRoles(): array { return $this->actorRoles; }
    public function getEntityType(): string { return $this->entityType; }
    public function getEntityId(): ?string { return $this->entityId; }
    public function getCurrentState(): ?string { return $this->currentState; }
    public function getRequestedDestinationState(): ?string { return $this->requestedDestinationState; }
    public function getTransitionCode(): ?string { return $this->transitionCode; }
    public function getAction(): ?string { return $this->action; }
    public function getProjectId(): ?string { return $this->projectId; }
    public function getLayoutId(): ?string { return $this->layoutId; }
    public function getSubscriptionPlan(): ?string { return $this->subscriptionPlan; }
    public function getActiveEntitlements(): array { return $this->activeEntitlements; }
    public function getExecutionSource(): LifecycleExecutionSource { return $this->executionSource; }
    public function getReason(): ?string { return $this->reason; }
    public function getEffectiveTimestamp(): \DateTimeInterface { return $this->effectiveTimestamp; }
    public function getCorrelationId(): string { return $this->correlationId; }
    public function getIdempotencyKey(): ?string { return $this->idempotencyKey; }
    public function getRequestData(): array { return $this->requestData; }
    public function getEntitySnapshot(): ?array { return $this->entitySnapshot; }
    public function getRelatedSnapshots(): array { return $this->relatedSnapshots; }
    public function getMetadata(): array { return $this->metadata; }

    public function hasEntitlement(string $entitlementCode): bool
    {
        if (empty($entitlementCode)) {
            return true;
        }
        return in_array($entitlementCode, $this->activeEntitlements, true);
    }

    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId,
            'organization_id' => $this->organizationId,
            'actor_id' => $this->actorId,
            'actor_roles' => $this->actorRoles,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'current_state' => $this->currentState,
            'requested_destination_state' => $this->requestedDestinationState,
            'transition_code' => $this->transitionCode,
            'action' => $this->action,
            'project_id' => $this->projectId,
            'layout_id' => $this->layoutId,
            'subscription_plan' => $this->subscriptionPlan,
            'active_entitlements' => $this->activeEntitlements,
            'execution_source' => $this->executionSource->value,
            'reason' => $this->reason,
            'effective_timestamp' => $this->effectiveTimestamp->format(\DateTimeInterface::ATOM),
            'correlation_id' => $this->correlationId,
            'idempotency_key' => $this->idempotencyKey,
            'request_data' => $this->requestData,
            'metadata' => $this->metadata,
        ];
    }
}
