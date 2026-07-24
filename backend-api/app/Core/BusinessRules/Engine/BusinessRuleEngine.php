<?php

namespace App\Core\BusinessRules\Engine;

use App\Core\BusinessRules\Audit\BusinessRuleAuditService;
use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Contracts\BusinessRuleEngineInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleRegistryInterface;
use App\Core\BusinessRules\Enums\EvaluationMode;
use App\Core\BusinessRules\Enums\RuleSeverity;
use App\Core\BusinessRules\Results\BusinessRuleEvaluation;
use App\Core\BusinessRules\Results\RuleResult;
use App\Models\BusinessRuleOverride;
use Illuminate\Support\Str;
use Throwable;

class BusinessRuleEngine implements BusinessRuleEngineInterface
{
    protected RuleRegistryInterface $registry;
    protected BusinessRuleAuditService $auditService;

    public function __construct(
        RuleRegistryInterface $registry,
        BusinessRuleAuditService $auditService
    ) {
        $this->registry = $registry;
        $this->auditService = $auditService;
    }

    public function evaluate(string $action, BusinessRuleContext $context): BusinessRuleEvaluation
    {
        return $this->runEvaluation($action, $context, EvaluationMode::ENFORCE);
    }

    public function evaluateRules(array $ruleCodes, BusinessRuleContext $context): BusinessRuleEvaluation
    {
        return $this->runEvaluationForCodes($ruleCodes, $context, EvaluationMode::ENFORCE);
    }

    public function enforce(string $action, BusinessRuleContext $context): BusinessRuleEvaluation
    {
        $evaluation = $this->runEvaluation($action, $context, EvaluationMode::ENFORCE);
        $evaluation->throwIfBlocked();
        return $evaluation;
    }

    public function enforceRules(array $ruleCodes, BusinessRuleContext $context): BusinessRuleEvaluation
    {
        $evaluation = $this->runEvaluationForCodes($ruleCodes, $context, EvaluationMode::ENFORCE);
        $evaluation->throwIfBlocked();
        return $evaluation;
    }

    public function explain(string $action, BusinessRuleContext $context): BusinessRuleEvaluation
    {
        return $this->runEvaluation($action, $context, EvaluationMode::EXPLAIN);
    }

    protected function runEvaluation(string $action, BusinessRuleContext $context, EvaluationMode $mode): BusinessRuleEvaluation
    {
        $rules = $this->registry->getByAction($action, $context);
        return $this->executeRuleSet($rules, $context, $mode);
    }

    protected function runEvaluationForCodes(array $ruleCodes, BusinessRuleContext $context, EvaluationMode $mode): BusinessRuleEvaluation
    {
        $rules = [];
        foreach ($ruleCodes as $code) {
            $rule = $this->registry->get($code);
            if ($rule && $rule->appliesTo($context)) {
                $rules[] = $rule;
            }
        }
        return $this->executeRuleSet($rules, $context, $mode);
    }

    /**
     * @param array<BusinessRuleInterface> $rules
     */
    protected function executeRuleSet(array $rules, BusinessRuleContext $context, EvaluationMode $mode): BusinessRuleEvaluation
    {
        $startTime = microtime(true);
        $evaluationId = (string) Str::uuid();

        $evaluation = new BusinessRuleEvaluation(
            evaluationId: $evaluationId,
            action: $context->getAction(),
            entityType: $context->getEntityType(),
            entityId: $context->getEntityId(),
            correlationId: $context->getCorrelationId(),
            mode: $mode
        );

        foreach ($rules as $rule) {
            $ruleStartTime = microtime(true);

            try {
                // Check if active, valid override exists for overridable rules
                if ($rule->isOverridable() && $context->getTenantId() && $context->getEntityId()) {
                    $override = BusinessRuleOverride::where('tenant_id', $context->getTenantId())
                        ->where('rule_code', $rule->code())
                        ->where('entity_type', $context->getEntityType())
                        ->where('entity_id', $context->getEntityId())
                        ->where('status', 'APPROVED')
                        ->first();

                    if ($override && $override->isValid()) {
                        $ruleExecutionMs = (microtime(true) - $ruleStartTime) * 1000;
                        $overrideResult = RuleResult::pass(
                            ruleCode: $rule->code(),
                            ruleVersion: $rule->version(),
                            message: "Rule overridden by authorized override [ID: {$override->id}]",
                            evidence: [
                                'override_id' => $override->id,
                                'reason' => $override->reason,
                                'approved_by' => $override->approved_by,
                            ],
                            executionTimeMs: $ruleExecutionMs
                        );
                        $evaluation->addResult($overrideResult);
                        continue;
                    }
                }

                // Evaluate the rule safely
                $result = $rule->evaluate($context);
                $evaluation->addResult($result);

            } catch (Throwable $e) {
                // FAIL-CLOSED Principle: Any unexpected rule evaluation crash is recorded as a BLOCKING failure
                $ruleExecutionMs = (microtime(true) - $ruleStartTime) * 1000;
                $failedResult = RuleResult::fail(
                    ruleCode: $rule->code(),
                    ruleVersion: $rule->version(),
                    message: "Unexpected error during rule evaluation: " . $e->getMessage(),
                    errorCode: 'RULE_EVALUATION_EXCEPTION',
                    userMessage: "An error occurred while validating business policies. Please contact support.",
                    developerMessage: $e->getFile() . ':' . $e->getLine() . ' ' . $e->getMessage(),
                    evidence: ['exception' => get_class($e)],
                    remediation: "Review system logs and correct invalid context or rule state.",
                    severity: RuleSeverity::BLOCKING,
                    executionTimeMs: $ruleExecutionMs
                );
                $evaluation->addResult($failedResult);
            }
        }

        $totalExecutionMs = (microtime(true) - $startTime) * 1000;
        $evaluation->setExecutionTimeMs($totalExecutionMs);

        // Audit the evaluation
        $this->auditService->logEvaluation($context, $evaluation);

        return $evaluation;
    }
}
