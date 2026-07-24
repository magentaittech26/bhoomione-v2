<?php

namespace App\Core\Lifecycle\Contracts;

interface LifecycleTransitionResultInterface
{
    public function getTransitionId(): ?string;
    public function getLifecycleCode(): string;
    public function getLifecycleVersion(): string;
    public function getEntityType(): string;
    public function getEntityId(): ?string;
    public function getTransitionCode(): string;
    public function getPreviousState(): string;
    public function getDestinationState(): string;
    public function isPermitted(): bool;
    public function isCompleted(): bool;
    public function getAuthorizationResult(): array;
    public function getEntitlementResult(): array;
    public function getBusinessRuleEvaluationId(): ?string;
    public function failures(): array;
    public function warnings(): array;
    public function getRequiredActions(): array;
    public function getAvailableAlternatives(): array;
    public function getReversalInformation(): array;
    public function getCorrelationId(): string;
    public function getExecutionTimeMs(): float;
    public function getTransitionedAt(): string;
    public function getMetadata(): array;
    public function throwIfBlocked(): void;
    public function toApiResponse(): array;
}
