<?php

namespace App\Core\BusinessRules\Context;

use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use Illuminate\Support\Str;

class BusinessRuleContext implements BusinessRuleContextInterface
{
    protected ?string $tenantId;
    protected ?string $organizationId;
    protected ?string $actorId;
    protected array $actorRoles;
    protected ?string $projectId;
    protected string $entityType;
    protected ?string $entityId;
    protected string $action;
    protected ?string $workflowState;
    protected ?string $requestedTransition;
    protected array $requestData;
    protected ?array $entitySnapshot;
    protected array $relatedEntitySnapshots;
    protected array $regionalContext;
    protected array $subscriptionContext;
    protected string $correlationId;
    protected string $executionSource;
    protected string $timestamp;
    protected array $metadata;

    public function __construct(array $data)
    {
        $this->tenantId = $data['tenant_id'] ?? null;
        $this->organizationId = $data['organization_id'] ?? null;
        $this->actorId = $data['actor_id'] ?? null;
        $this->actorRoles = $data['actor_roles'] ?? [];
        $this->projectId = $data['project_id'] ?? null;
        $this->entityType = $data['entity_type'] ?? 'generic';
        $this->entityId = $data['entity_id'] ?? null;
        $this->action = $data['action'] ?? 'unknown';
        $this->workflowState = $data['workflow_state'] ?? null;
        $this->requestedTransition = $data['requested_transition'] ?? null;
        
        // Sanitize sensitive values from request data before storing
        $this->requestData = $this->sanitizePayload($data['request_data'] ?? []);
        $this->entitySnapshot = $data['entity_snapshot'] ?? null;
        $this->relatedEntitySnapshots = $data['related_entity_snapshots'] ?? [];
        $this->regionalContext = $data['regional_context'] ?? [];
        $this->subscriptionContext = $data['subscription_context'] ?? [];
        $this->correlationId = $data['correlation_id'] ?? (string) Str::uuid();
        $this->executionSource = $data['execution_source'] ?? 'WEB'; // WEB, API, MOBILE, IMPORT, JOB, COMMAND, WORKFLOW, SYSTEM
        $this->timestamp = $data['timestamp'] ?? now()->toIso8601String();
        $this->metadata = $data['metadata'] ?? [];
    }

    public static function create(array $data): self
    {
        return new self($data);
    }

    protected function sanitizePayload(array $payload): array
    {
        $sensitiveKeys = ['password', 'secret', 'token', 'cvv', 'card_number', 'api_key'];
        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                $payload[$key] = $this->sanitizePayload($value);
            } elseif (in_array(strtolower($key), $sensitiveKeys, true)) {
                $payload[$key] = '[REDACTED]';
            }
        }
        return $payload;
    }

    public function getTenantId(): ?string { return $this->tenantId; }
    public function getOrganizationId(): ?string { return $this->organizationId; }
    public function getActorId(): ?string { return $this->actorId; }
    public function getActorRoles(): array { return $this->actorRoles; }
    public function getProjectId(): ?string { return $this->projectId; }
    public function getEntityType(): string { return $this->entityType; }
    public function getEntityId(): ?string { return $this->entityId; }
    public function getAction(): string { return $this->action; }
    public function getWorkflowState(): ?string { return $this->workflowState; }
    public function getRequestedTransition(): ?string { return $this->requestedTransition; }
    public function getRequestData(): array { return $this->requestData; }
    public function getEntitySnapshot(): ?array { return $this->entitySnapshot; }
    public function getRelatedEntitySnapshots(): array { return $this->relatedEntitySnapshots; }
    public function getRegionalContext(): array { return $this->regionalContext; }
    public function getSubscriptionContext(): array { return $this->subscriptionContext; }
    public function getCorrelationId(): string { return $this->correlationId; }
    public function getExecutionSource(): string { return $this->executionSource; }
    public function getTimestamp(): string { return $this->timestamp; }
    public function getMetadata(): array { return $this->metadata; }
}
