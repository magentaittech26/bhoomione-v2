<?php

namespace App\Core\Lifecycle\Contracts;

use App\Core\Lifecycle\Enums\LifecycleExecutionSource;

interface LifecycleContextInterface
{
    public function getTenantId(): ?string;
    public function getOrganizationId(): ?string;
    public function getActorId(): ?string;
    public function getActorRoles(): array;
    public function getEntityType(): string;
    public function getEntityId(): ?string;
    public function getCurrentState(): ?string;
    public function getRequestedDestinationState(): ?string;
    public function getTransitionCode(): ?string;
    public function getAction(): ?string;
    public function getProjectId(): ?string;
    public function getLayoutId(): ?string;
    public function getSubscriptionPlan(): ?string;
    public function getActiveEntitlements(): array;
    public function getExecutionSource(): LifecycleExecutionSource;
    public function getReason(): ?string;
    public function getEffectiveTimestamp(): \DateTimeInterface;
    public function getCorrelationId(): string;
    public function getIdempotencyKey(): ?string;
    public function getRequestData(): array;
    public function getEntitySnapshot(): ?array;
    public function getRelatedSnapshots(): array;
    public function getMetadata(): array;
    public function hasEntitlement(string $entitlementCode): bool;
    public function toArray(): array;
}
