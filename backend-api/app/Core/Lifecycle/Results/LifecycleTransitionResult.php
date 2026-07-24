<?php

namespace App\Core\Lifecycle\Results;

use App\Core\Lifecycle\Contracts\LifecycleTransitionResultInterface;
use App\Core\Lifecycle\Exceptions\LifecycleException;

class LifecycleTransitionResult implements LifecycleTransitionResultInterface
{
    protected ?string $transitionId;
    protected string $lifecycleCode;
    protected string $lifecycleVersion;
    protected string $entityType;
    protected ?string $entityId;
    protected string $transitionCode;
    protected string $previousState;
    protected string $destinationState;
    protected bool $permitted;
    protected bool $completed;
    protected array $authorizationResult;
    protected array $entitlementResult;
    protected ?string $businessRuleEvaluationId;
    protected array $failures;
    protected array $warnings;
    protected array $requiredActions;
    protected array $availableAlternatives;
    protected array $reversalInformation;
    protected string $correlationId;
    protected float $executionTimeMs;
    protected string $transitionedAt;
    protected array $metadata;

    public function __construct(array $attributes)
    {
        $this->transitionId = $attributes['transition_id'] ?? null;
        $this->lifecycleCode = $attributes['lifecycle_code'] ?? '';
        $this->lifecycleVersion = $attributes['lifecycle_version'] ?? '1.0.0';
        $this->entityType = $attributes['entity_type'] ?? '';
        $this->entityId = $attributes['entity_id'] ?? null;
        $this->transitionCode = $attributes['transition_code'] ?? '';
        $this->previousState = $attributes['previous_state'] ?? '';
        $this->destinationState = $attributes['destination_state'] ?? '';
        $this->permitted = (bool) ($attributes['permitted'] ?? true);
        $this->completed = (bool) ($attributes['completed'] ?? false);
        $this->authorizationResult = $attributes['authorization_result'] ?? ['passed' => true];
        $this->entitlementResult = $attributes['entitlement_result'] ?? ['passed' => true];
        $this->businessRuleEvaluationId = $attributes['business_rule_evaluation_id'] ?? null;
        $this->failures = $attributes['failures'] ?? [];
        $this->warnings = $attributes['warnings'] ?? [];
        $this->requiredActions = $attributes['required_actions'] ?? [];
        $this->availableAlternatives = $attributes['available_alternatives'] ?? [];
        $this->reversalInformation = $attributes['reversal_information'] ?? [];
        $this->correlationId = $attributes['correlation_id'] ?? '';
        $this->executionTimeMs = (float) ($attributes['execution_time_ms'] ?? 0.0);
        $this->transitionedAt = $attributes['transitioned_at'] ?? date('c');
        $this->metadata = $attributes['metadata'] ?? [];
    }

    public static function create(array $attributes): self
    {
        return new self($attributes);
    }

    public function getTransitionId(): ?string { return $this->transitionId; }
    public function getLifecycleCode(): string { return $this->lifecycleCode; }
    public function getLifecycleVersion(): string { return $this->lifecycleVersion; }
    public function getEntityType(): string { return $this->entityType; }
    public function getEntityId(): ?string { return $this->entityId; }
    public function getTransitionCode(): string { return $this->transitionCode; }
    public function getPreviousState(): string { return $this->previousState; }
    public function getDestinationState(): string { return $this->destinationState; }
    public function isPermitted(): bool { return $this->permitted && empty($this->failures); }
    public function isCompleted(): bool { return $this->completed; }
    public function getAuthorizationResult(): array { return $this->authorizationResult; }
    public function getEntitlementResult(): array { return $this->entitlementResult; }
    public function getBusinessRuleEvaluationId(): ?string { return $this->businessRuleEvaluationId; }
    public function failures(): array { return $this->failures; }
    public function warnings(): array { return $this->warnings; }
    public function getRequiredActions(): array { return $this->requiredActions; }
    public function getAvailableAlternatives(): array { return $this->availableAlternatives; }
    public function getReversalInformation(): array { return $this->reversalInformation; }
    public function getCorrelationId(): string { return $this->correlationId; }
    public function getExecutionTimeMs(): float { return $this->executionTimeMs; }
    public function getTransitionedAt(): string { return $this->transitionedAt; }
    public function getMetadata(): array { return $this->metadata; }

    public function throwIfBlocked(): void
    {
        if (!$this->isPermitted()) {
            $msg = !empty($this->failures)
                ? implode(' ', array_column($this->failures, 'message'))
                : "Transition [{$this->transitionCode}] is blocked for entity [{$this->entityType}:{$this->entityId}].";
            throw new LifecycleException($msg, 422, $this);
        }
    }

    public function toApiResponse(): array
    {
        $success = $this->isPermitted() && ($this->completed || true);

        if ($success) {
            return [
                'success' => true,
                'message' => "Transition [{$this->transitionCode}] " . ($this->completed ? 'completed' : 'permitted') . " successfully.",
                'data' => [
                    'transition_id' => $this->transitionId,
                    'lifecycle_code' => $this->lifecycleCode,
                    'lifecycle_version' => $this->lifecycleVersion,
                    'entity_type' => $this->entityType,
                    'entity_id' => $this->entityId,
                    'transition_code' => $this->transitionCode,
                    'previous_state' => $this->previousState,
                    'destination_state' => $this->destinationState,
                    'completed' => $this->completed,
                    'warnings' => $this->warnings,
                    'available_alternatives' => $this->availableAlternatives,
                    'execution_time_ms' => $this->executionTimeMs,
                    'transitioned_at' => $this->transitionedAt,
                ],
                'correlation_id' => $this->correlationId,
            ];
        }

        return [
            'success' => false,
            'message' => "Transition [{$this->transitionCode}] is blocked by lifecycle rules.",
            'error' => [
                'code' => 'LIFECYCLE_TRANSITION_BLOCKED',
                'lifecycle_code' => $this->lifecycleCode,
                'entity_type' => $this->entityType,
                'entity_id' => $this->entityId,
                'transition_code' => $this->transitionCode,
                'current_state' => $this->previousState,
                'requested_state' => $this->destinationState,
                'failures' => $this->failures,
                'warnings' => $this->warnings,
                'required_actions' => $this->requiredActions,
                'available_alternatives' => $this->availableAlternatives,
            ],
            'correlation_id' => $this->correlationId,
        ];
    }
}
