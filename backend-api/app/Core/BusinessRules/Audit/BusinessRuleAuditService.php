<?php

namespace App\Core\BusinessRules\Audit;

use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Results\BusinessRuleEvaluation;
use App\Models\BusinessRuleEvaluationModel;
use App\Models\BusinessRuleEvaluationResultModel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class BusinessRuleAuditService
{
    public function logEvaluation(BusinessRuleContext $context, BusinessRuleEvaluation $evaluation): void
    {
        try {
            $evalModel = BusinessRuleEvaluationModel::create([
                'id' => $evaluation->getEvaluationId(),
                'tenant_id' => $context->getTenantId(),
                'actor_id' => $context->getActorId(),
                'action' => $context->getAction(),
                'entity_type' => $context->getEntityType(),
                'entity_id' => $context->getEntityId(),
                'passed' => $evaluation->passed(),
                'blocking_count' => $evaluation->getBlockingFailureCount(),
                'warning_count' => $evaluation->getWarningCount(),
                'execution_time_ms' => $evaluation->getExecutionTimeMs(),
                'mode' => $evaluation->getMode()->value,
                'execution_source' => $context->getExecutionSource(),
                'correlation_id' => $context->getCorrelationId(),
                'created_at' => now(),
            ]);

            /** @var RuleResultInterface $result */
            foreach ($evaluation->getResults() as $result) {
                BusinessRuleEvaluationResultModel::create([
                    'id' => (string) Str::uuid(),
                    'evaluation_id' => $evalModel->id,
                    'rule_code' => $result->getRuleCode(),
                    'rule_version' => $result->getRuleVersion(),
                    'passed' => $result->isPassed(),
                    'severity' => $result->getSeverity()->value,
                    'error_code' => $result->getErrorCode(),
                    'message' => $result->getMessage(),
                    'user_message' => $result->getUserMessage(),
                    'developer_message' => $result->getDeveloperMessage(),
                    'remediation' => $result->getRemediation(),
                    'evidence' => $result->getEvidence(),
                    'failed_conditions' => $result->getFailedConditions(),
                    'created_at' => now(),
                ]);
            }
        } catch (Throwable $e) {
            // Fail safe on audit logging failure: write to system logger without breaking evaluation flow
            Log::error("Failed to persist business rule audit entry: " . $e->getMessage(), [
                'evaluation_id' => $evaluation->getEvaluationId(),
                'action' => $context->getAction(),
                'exception' => $e,
            ]);
        }
    }
}
