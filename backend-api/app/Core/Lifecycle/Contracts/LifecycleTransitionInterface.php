<?php

namespace App\Core\Lifecycle\Contracts;

interface LifecycleTransitionInterface
{
    public function code(): string;
    public function name(): string;
    public function description(): string;
    public function fromStates(): array;
    public function destinationState(): string;
    public function requiredPermission(): ?string;
    public function requiredBusinessRules(): array;
    public function requiredEntitlement(): ?string;
    public function requiresReason(): bool;
    public function requiresApproval(): bool;
    public function isReversible(): bool;
    public function reversalTransitionCode(): ?string;
    public function isAutomatic(): bool;
    public function isSystemOnly(): bool;
    public function isDestructive(): bool;
    public function isFinancial(): bool;
    public function isComplianceSensitive(): bool;
    public function allowedExecutionSources(): array;
    public function events(): array;
    public function metadata(): array;
    public function acceptsFromState(string $currentState): bool;
    public function toArray(): array;
}
