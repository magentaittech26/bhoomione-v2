<?php

namespace App\Core\Lifecycle\Engine;

use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Contracts\BusinessRuleEngineInterface;
use App\Core\Lifecycle\Contracts\LifecycleContextInterface;
use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Contracts\LifecycleEngineInterface;
use App\Core\Lifecycle\Contracts\LifecycleHistoryRepositoryInterface;
use App\Core\Lifecycle\Contracts\LifecycleRegistryInterface;
use App\Core\Lifecycle\Contracts\LifecycleTransitionResultInterface;
use App\Core\Lifecycle\Events\LifecycleTransitionCompleted;
use App\Core\Lifecycle\Exceptions\LifecycleEntitlementException;
use App\Core\Lifecycle\Exceptions\LifecycleStateConflictException;
use App\Core\Lifecycle\Exceptions\LifecycleTransitionNotAllowedException;
use App\Core\Lifecycle\Results\LifecycleTransitionResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LifecycleEngine implements LifecycleEngineInterface
{
    protected LifecycleRegistryInterface $registry;
    protected BusinessRuleEngineInterface $businessRuleEngine;
    protected LifecycleHistoryRepositoryInterface $historyRepository;

    public function __construct(
        LifecycleRegistryInterface $registry,
        BusinessRuleEngineInterface $businessRuleEngine,
        LifecycleHistoryRepositoryInterface $historyRepository
    ) {
        $this->registry = $registry;
        $this->businessRuleEngine = $businessRuleEngine;
        $this->historyRepository = $historyRepository;
    }

    public function definition(string $entityType): LifecycleDefinitionInterface
    {
        return $this->registry->getByEntityType($entityType)->definition();
    }

    public function currentState(object|array $entity, string $entityType): string
    {
        return $this->registry->getByEntityType($entityType)->resolveCurrentState($entity);
    }

    public function availableTransitions(object|array $entity, LifecycleContextInterface $context): array
    {
        $provider = $this->registry->getByEntityType($context->getEntityType());
        $definition = $provider->definition();
        $currentState = $provider->resolveCurrentState($entity);

        $transitions = $definition->availableTransitions($currentState);
        $resultList = [];

        foreach ($transitions as $transition) {
            $eval = $this->canTransition($entity, $transition->code(), $context);
            $resultList[] = [
                'transition_code' => $transition->code(),
                'name' => $transition->name(),
                'description' => $transition->description(),
                'destination_state' => $transition->destinationState(),
                'permitted' => $eval->isPermitted(),
                'failures' => $eval->failures(),
                'warnings' => $eval->warnings(),
                'required_entitlement' => $transition->requiredEntitlement(),
                'required_permission' => $transition->requiredPermission(),
            ];
        }

        return $resultList;
    }

    public function canTransition(object|array $entity, string $transitionCode, LifecycleContextInterface $context): LifecycleTransitionResultInterface
    {
        return $this->evaluateTransition($entity, $transitionCode, $context, false);
    }

    public function explainTransition(object|array $entity, string $transitionCode, LifecycleContextInterface $context): LifecycleTransitionResultInterface
    {
        return $this->evaluateTransition($entity, $transitionCode, $context, true);
    }

    protected function evaluateTransition(
        object|array $entity,
        string $transitionCode,
        LifecycleContextInterface $context,
        bool $explainMode = false
    ): LifecycleTransitionResultInterface {
        $startTime = microtime(true);
        $provider = $this->registry->getByEntityType($context->getEntityType());
        $definition = $provider->definition();
        $currentState = $provider->resolveCurrentState($entity);

        $transition = $definition->transition($transitionCode);

        $failures = [];
        $warnings = [];
        $requiredActions = [];
        $ruleEvalId = null;

        // 1. Check transition existence
        if (!$transition) {
            $failures[] = [
                'code' => 'LIFECYCLE_TRANSITION_NOT_FOUND',
                'message' => "Transition [{$transitionCode}] is not defined for lifecycle [{$definition->code()}].",
            ];
            $timeMs = (microtime(true) - $startTime) * 1000;
            return LifecycleTransitionResult::create([
                'lifecycle_code' => $definition->code(),
                'lifecycle_version' => $definition->version(),
                'entity_type' => $context->getEntityType(),
                'entity_id' => $context->getEntityId(),
                'transition_code' => $transitionCode,
                'previous_state' => $currentState,
                'destination_state' => 'UNKNOWN',
                'permitted' => false,
                'failures' => $failures,
                'correlation_id' => $context->getCorrelationId(),
                'execution_time_ms' => $timeMs,
            ]);
        }

        $destinationState = $transition->destinationState();

        // 2. Check current state origin validity
        if (!$transition->acceptsFromState($currentState)) {
            $failures[] = [
                'code' => 'LIFECYCLE_INVALID_ORIGIN_STATE',
                'message' => "Transition [{$transitionCode}] cannot be initiated from state [{$currentState}]. Allowed states: [" . implode(', ', $transition->fromStates()) . "].",
            ];
        }

        // 3. Check execution source
        if (!in_array($context->getExecutionSource()->value, $transition->allowedExecutionSources(), true)) {
            $failures[] = [
                'code' => 'LIFECYCLE_EXECUTION_SOURCE_DISALLOWED',
                'message' => "Execution source [{$context->getExecutionSource()->value}] is not allowed for transition [{$transitionCode}].",
            ];
        }

        // 4. Check subscription entitlement
        if ($transition->requiredEntitlement() !== null) {
            $entitlement = $transition->requiredEntitlement();
            if (!$context->hasEntitlement($entitlement)) {
                $failures[] = [
                    'code' => 'SUBSCRIPTION_ENTITLEMENT_REQUIRED',
                    'message' => "Transition [{$transitionCode}] requires active subscription entitlement [{$entitlement}].",
                    'required_entitlement' => $entitlement,
                ];
            }
        }

        // 5. Check business rules
        $ruleCodes = $transition->requiredBusinessRules();
        if (!empty($ruleCodes)) {
            $ruleContext = BusinessRuleContext::create([
                'tenant_id' => $context->getTenantId(),
                'actor_id' => $context->getActorId(),
                'action' => $transitionCode,
                'entity_type' => $context->getEntityType(),
                'entity_id' => $context->getEntityId(),
                'project_id' => $context->getProjectId(),
                'request_data' => $context->getRequestData(),
                'entity_snapshot' => is_array($entity) ? $entity : ($context->getEntitySnapshot() ?? []),
                'related_entity_snapshots' => $context->getRelatedSnapshots(),
                'execution_source' => $context->getExecutionSource()->value,
                'metadata' => $context->getMetadata(),
            ]);

            $ruleEvaluation = $this->businessRuleEngine->evaluateRules($ruleCodes, $ruleContext);
            $ruleEvalId = $ruleEvaluation->getEvaluationId();

            if ($ruleEvaluation->hasBlockingFailures()) {
                foreach ($ruleEvaluation->blockingFailures() as $ruleFailure) {
                    $failures[] = [
                        'code' => $ruleFailure->getErrorCode() ?? $ruleFailure->getRuleCode(),
                        'rule_code' => $ruleFailure->getRuleCode(),
                        'message' => $ruleFailure->getMessage(),
                        'user_message' => $ruleFailure->getUserMessage(),
                        'remediation' => $ruleFailure->getRemediation(),
                    ];
                }
            }

            foreach ($ruleEvaluation->warnings() as $ruleWarning) {
                $warnings[] = [
                    'code' => $ruleWarning->getErrorCode() ?? $ruleWarning->getRuleCode(),
                    'message' => $ruleWarning->getMessage(),
                ];
            }
        }

        $timeMs = (microtime(true) - $startTime) * 1000;

        return LifecycleTransitionResult::create([
            'lifecycle_code' => $definition->code(),
            'lifecycle_version' => $definition->version(),
            'entity_type' => $context->getEntityType(),
            'entity_id' => $context->getEntityId(),
            'transition_code' => $transitionCode,
            'previous_state' => $currentState,
            'destination_state' => $destinationState,
            'permitted' => empty($failures),
            'completed' => false,
            'business_rule_evaluation_id' => $ruleEvalId,
            'failures' => $failures,
            'warnings' => $warnings,
            'required_actions' => $requiredActions,
            'available_alternatives' => array_map(fn($t) => $t->code(), $definition->availableTransitions($currentState)),
            'correlation_id' => $context->getCorrelationId(),
            'execution_time_ms' => $timeMs,
        ]);
    }

    public function transition(object|array &$entity, string $transitionCode, LifecycleContextInterface $context): LifecycleTransitionResultInterface
    {
        $startTime = microtime(true);
        $tenantId = $context->getTenantId() ?? '00000000-0000-0000-0000-000000000000';

        // 1. Idempotency Check
        if ($context->getIdempotencyKey()) {
            $existingIdempotency = $this->historyRepository->findByIdempotencyKey($tenantId, $context->getIdempotencyKey());
            if ($existingIdempotency) {
                return LifecycleTransitionResult::create($existingIdempotency['response_payload']['data'] ?? []);
            }
        }

        // 2. Pre-evaluation
        $evaluation = $this->canTransition($entity, $transitionCode, $context);
        if (!$evaluation->isPermitted()) {
            $evaluation->throwIfBlocked();
        }

        $provider = $this->registry->getByEntityType($context->getEntityType());
        $definition = $provider->definition();
        $transition = $definition->transition($transitionCode);

        // 3. Authoritative DB Transaction
        $result = DB::transaction(function () use (&$entity, $provider, $definition, $transition, $context, $evaluation, $startTime, $tenantId) {
            $previousState = $provider->resolveCurrentState($entity);

            // Re-verify state conflict inside transaction
            if (!$transition->acceptsFromState($previousState)) {
                throw new LifecycleStateConflictException(
                    "State conflict: Entity state changed to [{$previousState}] prior to commit.",
                    implode(', ', $transition->fromStates()),
                    $previousState
                );
            }

            // Apply destination state
            $destinationState = $transition->destinationState();
            $provider->applyState($entity, $destinationState);

            $timeMs = (microtime(true) - $startTime) * 1000;
            $transitionId = (string) Str::uuid();

            $completedResult = LifecycleTransitionResult::create([
                'transition_id' => $transitionId,
                'lifecycle_code' => $definition->code(),
                'lifecycle_version' => $definition->version(),
                'entity_type' => $context->getEntityType(),
                'entity_id' => $context->getEntityId(),
                'transition_code' => $transition->code(),
                'previous_state' => $previousState,
                'destination_state' => $destinationState,
                'permitted' => true,
                'completed' => true,
                'business_rule_evaluation_id' => $evaluation->getBusinessRuleEvaluationId(),
                'correlation_id' => $context->getCorrelationId(),
                'execution_time_ms' => $timeMs,
                'transitioned_at' => date('c'),
            ]);

            // Save history record
            $savedTransitionId = $this->historyRepository->recordTransition($completedResult, $context);

            // Save idempotency if present
            if ($context->getIdempotencyKey()) {
                $this->historyRepository->recordIdempotency(
                    $tenantId,
                    $context->getIdempotencyKey(),
                    $savedTransitionId,
                    $context->getRequestData(),
                    $completedResult->toApiResponse()
                );
            }

            return $completedResult;
        });

        // 4. Dispatch Asynchronous Domain Event after commit
        event(new LifecycleTransitionCompleted([
            'transition_id' => $result->getTransitionId(),
            'tenant_id' => $context->getTenantId(),
            'lifecycle_code' => $result->getLifecycleCode(),
            'lifecycle_version' => $result->getLifecycleVersion(),
            'entity_type' => $result->getEntityType(),
            'entity_id' => $result->getEntityId(),
            'transition_code' => $result->getTransitionCode(),
            'previous_state' => $result->getPreviousState(),
            'destination_state' => $result->getDestinationState(),
            'actor_id' => $context->getActorId(),
            'correlation_id' => $result->getCorrelationId(),
            'timestamp' => $result->getTransitionedAt(),
            'metadata' => $result->getMetadata(),
        ]));

        return $result;
    }

    public function reverse(object|array &$entity, string $transitionId, LifecycleContextInterface $context): LifecycleTransitionResultInterface
    {
        $latest = $this->historyRepository->getLatestTransition($context->getEntityType(), $context->getEntityId() ?? '', $context->getTenantId());

        if (!$latest || $latest['id'] !== $transitionId) {
            throw new LifecycleTransitionNotAllowedException(
                "Only the most recent committed transition can be reversed.",
                'reversal',
                $latest['destination_state'] ?? 'UNKNOWN'
            );
        }

        $provider = $this->registry->getByEntityType($context->getEntityType());
        $definition = $provider->definition();
        $transition = $definition->transition($latest['transition_code']);

        if (!$transition || !$transition->isReversible() || !$transition->reversalTransitionCode()) {
            throw new LifecycleTransitionNotAllowedException(
                "Transition [{$latest['transition_code']}] is marked as non-reversible.",
                $latest['transition_code'],
                $latest['destination_state']
            );
        }

        return $this->transition($entity, $transition->reversalTransitionCode(), $context);
    }

    public function history(string $entityType, string $entityId, ?string $tenantId = null, int $limit = 50): array
    {
        return $this->historyRepository->getHistoryForEntity($entityType, $entityId, $tenantId, $limit);
    }
}
