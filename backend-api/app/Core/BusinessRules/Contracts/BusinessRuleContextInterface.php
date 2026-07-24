<?php

namespace App\Core\BusinessRules\Contracts;

interface BusinessRuleContextInterface
{
    public function getTenantId(): ?string;
    public function getOrganizationId(): ?string;
    public function getActorId(): ?string;
    public function getActorRoles(): array;
    public function getProjectId(): ?string;
    public function getEntityType(): string;
    public function getEntityId(): ?string;
    public function getAction(): string;
    public function getWorkflowState(): ?string;
    public function getRequestedTransition(): ?string;
    public function getRequestData(): array;
    public function getEntitySnapshot(): ?array;
    public function getRelatedEntitySnapshots(): array;
    public function getRegionalContext(): array;
    public function getSubscriptionContext(): array;
    public function getCorrelationId(): string;
    public function getExecutionSource(): string;
    public function getTimestamp(): string;
    public function getMetadata(): array;
}
