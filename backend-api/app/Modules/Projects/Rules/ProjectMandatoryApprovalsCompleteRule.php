<?php

namespace App\Modules\Projects\Rules;

use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Enums\RuleSeverity;
use App\Core\BusinessRules\Results\RuleResult;

class ProjectMandatoryApprovalsCompleteRule implements BusinessRuleInterface
{
    public function code(): string
    {
        return 'project.activation.mandatory_approvals_complete';
    }

    public function name(): string
    {
        return 'Mandatory Approvals Required for Project Activation';
    }

    public function description(): string
    {
        return 'Ensures that all mandatory regulatory, municipal, and RERA approvals are completed and valid before a project can be activated.';
    }

    public function module(): string
    {
        return 'Projects';
    }

    public function version(): string
    {
        return '1.0.0';
    }

    public function severity(): RuleSeverity
    {
        return RuleSeverity::BLOCKING;
    }

    public function isOverridable(): bool
    {
        return true;
    }

    public function appliesTo(BusinessRuleContextInterface $context): bool
    {
        return $context->getAction() === 'project.activate'
            || ($context->getEntityType() === 'project' && $context->getRequestedTransition() === 'ACTIVATED');
    }

    public function evaluate(BusinessRuleContextInterface $context): RuleResultInterface
    {
        $startTime = microtime(true);
        $snapshot = $context->getEntitySnapshot() ?? [];
        $approvals = $context->getRelatedEntitySnapshots()['approvals'] ?? ($snapshot['approvals'] ?? []);

        if (empty($approvals)) {
            $timeMs = (microtime(true) - $startTime) * 1000;
            return RuleResult::fail(
                ruleCode: $this->code(),
                ruleVersion: $this->version(),
                message: 'Project activation failed: No regulatory approvals found.',
                errorCode: 'PROJECT_MISSING_APPROVALS',
                userMessage: 'The project cannot be activated because mandatory approvals (e.g. RERA, Local Authority) have not been recorded.',
                developerMessage: 'Context entity snapshot lacks mandatory approvals array.',
                evidence: ['approvals_count' => 0],
                failedConditions: ['mandatory_approvals_present' => false],
                remediation: 'Upload and approve all mandatory RERA and local planning authority documents before activation.',
                executionTimeMs: $timeMs
            );
        }

        $missingOrPending = [];
        foreach ($approvals as $approval) {
            $isMandatory = $approval['is_mandatory'] ?? true;
            $status = strtoupper($approval['status'] ?? 'PENDING');
            $expiryDate = $approval['expiry_date'] ?? null;

            if ($isMandatory) {
                if ($status !== 'APPROVED' && $status !== 'COMPLETED') {
                    $missingOrPending[] = [
                        'type' => $approval['type'] ?? 'General Approval',
                        'authority' => $approval['authority'] ?? 'Regulatory Body',
                        'issue' => "Status is '{$status}' (Required: APPROVED)",
                    ];
                } elseif ($expiryDate && strtotime($expiryDate) < time()) {
                    $missingOrPending[] = [
                        'type' => $approval['type'] ?? 'General Approval',
                        'authority' => $approval['authority'] ?? 'Regulatory Body',
                        'issue' => "Approval expired on {$expiryDate}",
                    ];
                }
            }
        }

        $timeMs = (microtime(true) - $startTime) * 1000;

        if (!empty($missingOrPending)) {
            return RuleResult::fail(
                ruleCode: $this->code(),
                ruleVersion: $this->version(),
                message: 'Project activation blocked: Unfulfilled mandatory approvals detected.',
                errorCode: 'PROJECT_UNFULFILLED_APPROVALS',
                userMessage: 'Project activation is blocked due to missing, pending, or expired mandatory approvals.',
                developerMessage: 'Mandatory approvals evaluation failed.',
                evidence: ['unfulfilled_approvals' => $missingOrPending],
                failedConditions: ['all_mandatory_approvals_valid' => false],
                remediation: 'Ensure all mandatory approvals are marked APPROVED and possess valid unexpired dates.',
                executionTimeMs: $timeMs
            );
        }

        return RuleResult::pass(
            ruleCode: $this->code(),
            ruleVersion: $this->version(),
            message: 'All mandatory project approvals are completed and valid.',
            evidence: ['total_verified_approvals' => count($approvals)],
            executionTimeMs: $timeMs
        );
    }

    public function dependencies(): array
    {
        return [];
    }

    public function tags(): array
    {
        return ['projects', 'activation', 'compliance'];
    }
}
