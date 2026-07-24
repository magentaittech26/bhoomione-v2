<?php

namespace App\Core\BusinessRules\Results;

use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Enums\EvaluationMode;

class BusinessRuleEvaluation
{
    protected string $evaluationId;
    protected string $action;
    protected string $entityType;
    protected ?string $entityId;
    protected bool $passed = true;
    protected int $blockingFailureCount = 0;
    protected int $warningCount = 0;
    protected int $informationalCount = 0;
    protected array $results = [];
    protected array $evaluatedRuleCodes = [];
    protected array $skippedRuleCodes = [];
    protected float $executionTimeMs = 0.0;
    protected string $correlationId;
    protected EvaluationMode $mode;

    public function __construct(
        string $evaluationId,
        string $action,
        string $entityType,
        ?string $entityId,
        string $correlationId,
        EvaluationMode $mode = EvaluationMode::ENFORCE
    ) {
        $this->evaluationId = $evaluationId;
        $this->action = $action;
        $this->entityType = $entityType;
        $this->entityId = $entityId;
        $this->correlationId = $correlationId;
        $this->mode = $mode;
    }

    public function addResult(RuleResultInterface $result): void
    {
        $this->results[] = $result;
        $this->evaluatedRuleCodes[] = $result->getRuleCode();

        if ($result->isBlocking()) {
            $this->passed = false;
            $this->blockingFailureCount++;
        } elseif (!$result->isPassed() && $result->getSeverity()->value === 'WARNING') {
            $this->warningCount++;
        } else {
            $this->informationalCount++;
        }
    }

    public function addSkipped(string $ruleCode): void
    {
        $this->skippedRuleCodes[] = $ruleCode;
    }

    public function setExecutionTimeMs(float $timeMs): void
    {
        $this->executionTimeMs = $timeMs;
    }

    public function passed(): bool
    {
        return $this->passed;
    }

    public function failed(): bool
    {
        return !$this->passed;
    }

    public function hasBlockingFailures(): bool
    {
        return $this->blockingFailureCount > 0;
    }

    public function warnings(): array
    {
        return array_values(array_filter($this->results, fn(RuleResultInterface $r) => $r->getSeverity()->value === 'WARNING'));
    }

    public function failures(): array
    {
        return array_values(array_filter($this->results, fn(RuleResultInterface $r) => $r->isBlocking()));
    }

    public function firstBlockingFailure(): ?RuleResultInterface
    {
        foreach ($this->results as $result) {
            if ($result->isBlocking()) {
                return $result;
            }
        }
        return null;
    }

    public function getEvaluationId(): string { return $this->evaluationId; }
    public function getAction(): string { return $this->action; }
    public function getEntityType(): string { return $this->entityType; }
    public function getEntityId(): ?string { return $this->entityId; }
    public function getCorrelationId(): string { return $this->correlationId; }
    public function getMode(): EvaluationMode { return $this->mode; }
    public function getExecutionTimeMs(): float { return $this->executionTimeMs; }
    public function getResults(): array { return $this->results; }
    public function getEvaluatedRuleCodes(): array { return $this->evaluatedRuleCodes; }
    public function getSkippedRuleCodes(): array { return $this->skippedRuleCodes; }
    public function getBlockingFailureCount(): int { return $this->blockingFailureCount; }
    public function getWarningCount(): int { return $this->warningCount; }

    public function throwIfBlocked(): void
    {
        if ($this->hasBlockingFailures() && $this->mode === EvaluationMode::ENFORCE) {
            throw new \App\Core\BusinessRules\Exceptions\BusinessRuleException($this);
        }
    }

    public function toApiResponse(): array
    {
        $blockingRules = array_map(fn(RuleResultInterface $r) => [
            'rule_code' => $r->getRuleCode(),
            'rule_version' => $r->getRuleVersion(),
            'message' => $r->getUserMessage() ?? $r->getMessage(),
            'error_code' => $r->getErrorCode(),
            'remediation' => $r->getRemediation(),
            'evidence' => $r->getEvidence(),
            'failed_conditions' => $r->getFailedConditions(),
        ], $this->failures());

        $warnings = array_map(fn(RuleResultInterface $r) => [
            'rule_code' => $r->getRuleCode(),
            'rule_version' => $r->getRuleVersion(),
            'message' => $r->getUserMessage() ?? $r->getMessage(),
            'error_code' => $r->getErrorCode(),
            'remediation' => $r->getRemediation(),
        ], $this->warnings());

        if ($this->hasBlockingFailures()) {
            return [
                'success' => false,
                'message' => 'The requested operation is blocked by business rules.',
                'error' => [
                    'code' => 'BUSINESS_RULE_VIOLATION',
                    'evaluation_id' => $this->evaluationId,
                    'action' => $this->action,
                    'entity_type' => $this->entityType,
                    'entity_id' => $this->entityId,
                    'blocking_rules' => $blockingRules,
                    'warnings' => $warnings,
                ],
                'correlation_id' => $this->correlationId,
            ];
        }

        return [
            'success' => true,
            'message' => 'Business rules evaluation passed.',
            'data' => [
                'evaluation_id' => $this->evaluationId,
                'action' => $this->action,
                'entity_type' => $this->entityType,
                'entity_id' => $this->entityId,
                'passed' => true,
                'evaluated_rule_count' => count($this->evaluatedRuleCodes),
                'warnings' => $warnings,
                'execution_time_ms' => $this->executionTimeMs,
            ],
            'correlation_id' => $this->correlationId,
        ];
    }
}
