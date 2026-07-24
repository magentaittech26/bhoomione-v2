<?php

namespace App\Core\Lifecycle\Definitions;

use App\Core\Lifecycle\Contracts\LifecycleTransitionInterface;

class LifecycleTransition implements LifecycleTransitionInterface
{
    protected string $code;
    protected string $name;
    protected string $description;
    protected array $fromStates;
    protected string $destinationState;
    protected ?string $requiredPermission;
    protected array $requiredBusinessRules;
    protected ?string $requiredEntitlement;
    protected bool $requiresReason;
    protected bool $requiresApproval;
    protected bool $reversible;
    protected ?string $reversalTransitionCode;
    protected bool $automatic;
    protected bool $systemOnly;
    protected bool $destructive;
    protected bool $financial;
    protected bool $complianceSensitive;
    protected array $allowedExecutionSources;
    protected array $events;
    protected array $metadata;

    public function __construct(array $attributes)
    {
        $this->code = strtolower($attributes['code'] ?? '');
        $this->name = $attributes['name'] ?? $this->code;
        $this->description = $attributes['description'] ?? '';
        $this->fromStates = array_map('strtoupper', $attributes['from_states'] ?? []);
        $this->destinationState = strtoupper($attributes['destination_state'] ?? '');
        $this->requiredPermission = $attributes['required_permission'] ?? null;
        $this->requiredBusinessRules = $attributes['required_business_rules'] ?? [];
        $this->requiredEntitlement = $attributes['required_entitlement'] ?? null;
        $this->requiresReason = (bool) ($attributes['requires_reason'] ?? false);
        $this->requiresApproval = (bool) ($attributes['requires_approval'] ?? false);
        $this->reversible = (bool) ($attributes['reversible'] ?? false);
        $this->reversalTransitionCode = $attributes['reversal_transition_code'] ?? null;
        $this->automatic = (bool) ($attributes['automatic'] ?? false);
        $this->systemOnly = (bool) ($attributes['system_only'] ?? false);
        $this->destructive = (bool) ($attributes['destructive'] ?? false);
        $this->financial = (bool) ($attributes['financial'] ?? false);
        $this->complianceSensitive = (bool) ($attributes['compliance_sensitive'] ?? false);
        $this->allowedExecutionSources = $attributes['allowed_execution_sources'] ?? ['WEB', 'API', 'MOBILE', 'OFFLINE_SYNC', 'IMPORT', 'COMMAND', 'JOB', 'WORKFLOW', 'SYSTEM'];
        $this->events = $attributes['events'] ?? [];
        $this->metadata = $attributes['metadata'] ?? [];
    }

    public function code(): string { return $this->code; }
    public function name(): string { return $this->name; }
    public function description(): string { return $this->description; }
    public function fromStates(): array { return $this->fromStates; }
    public function destinationState(): string { return $this->destinationState; }
    public function requiredPermission(): ?string { return $this->requiredPermission; }
    public function requiredBusinessRules(): array { return $this->requiredBusinessRules; }
    public function requiredEntitlement(): ?string { return $this->requiredEntitlement; }
    public function requiresReason(): bool { return $this->requiresReason; }
    public function requiresApproval(): bool { return $this->requiresApproval; }
    public function isReversible(): bool { return $this->reversible; }
    public function reversalTransitionCode(): ?string { return $this->reversalTransitionCode; }
    public function isAutomatic(): bool { return $this->automatic; }
    public function isSystemOnly(): bool { return $this->systemOnly; }
    public function isDestructive(): bool { return $this->destructive; }
    public function isFinancial(): bool { return $this->financial; }
    public function isComplianceSensitive(): bool { return $this->complianceSensitive; }
    public function allowedExecutionSources(): array { return $this->allowedExecutionSources; }
    public function events(): array { return $this->events; }
    public function metadata(): array { return $this->metadata; }

    public function acceptsFromState(string $currentState): bool
    {
        return in_array(strtoupper($currentState), $this->fromStates, true);
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'from_states' => $this->fromStates,
            'destination_state' => $this->destinationState,
            'required_permission' => $this->requiredPermission,
            'required_business_rules' => $this->requiredBusinessRules,
            'required_entitlement' => $this->requiredEntitlement,
            'requires_reason' => $this->requiresReason,
            'requires_approval' => $this->requiresApproval,
            'reversible' => $this->reversible,
            'reversal_transition_code' => $this->reversalTransitionCode,
            'automatic' => $this->automatic,
            'system_only' => $this->systemOnly,
            'destructive' => $this->destructive,
            'financial' => $this->financial,
            'compliance_sensitive' => $this->complianceSensitive,
            'allowed_execution_sources' => $this->allowedExecutionSources,
            'events' => $this->events,
            'metadata' => $this->metadata,
        ];
    }
}
