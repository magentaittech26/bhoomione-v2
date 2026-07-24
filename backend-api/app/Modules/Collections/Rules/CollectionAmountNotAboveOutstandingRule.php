<?php

namespace App\Modules\Collections\Rules;

use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Enums\RuleSeverity;
use App\Core\BusinessRules\Results\RuleResult;

class CollectionAmountNotAboveOutstandingRule implements BusinessRuleInterface
{
    public function code(): string
    {
        return 'collection.amount.not_above_outstanding';
    }

    public function name(): string
    {
        return 'Collection Amount Must Not Exceed Outstanding Balance';
    }

    public function description(): string
    {
        return 'Prevents payment receipts from exceeding the authoritative total outstanding invoice or payment schedule balance, unless explicit tenant advance policy is enabled.';
    }

    public function module(): string
    {
        return 'Collections';
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
        return $context->getAction() === 'collection.record'
            || $context->getAction() === 'payment.receive'
            || ($context->getEntityType() === 'payment' && $context->getAction() === 'create');
    }

    public function evaluate(BusinessRuleContextInterface $context): RuleResultInterface
    {
        $startTime = microtime(true);
        $data = $context->getRequestData();
        $snapshot = $context->getEntitySnapshot() ?? [];

        $requestedAmount = (float) ($data['amount'] ?? $snapshot['amount'] ?? 0.0);
        $outstandingBalance = (float) ($snapshot['outstanding_balance'] ?? 0.0);
        $allowAdvance = (bool) ($context->getMetadata()['tenant_policy']['allow_advance_payments'] ?? false);

        if ($requestedAmount > $outstandingBalance && !$allowAdvance) {
            $excess = $requestedAmount - $outstandingBalance;
            $timeMs = (microtime(true) - $startTime) * 1000;

            return RuleResult::fail(
                ruleCode: $this->code(),
                ruleVersion: $this->version(),
                message: "Collection recording blocked: Payment amount ({$requestedAmount}) exceeds outstanding balance ({$outstandingBalance}).",
                errorCode: 'COLLECTION_EXCEEDS_OUTSTANDING',
                userMessage: "Payment receipt of {$requestedAmount} exceeds the remaining balance of {$outstandingBalance} by {$excess}. Advance payments are not permitted under current tenant policy.",
                developerMessage: "Collection limit check failed. Requested: {$requestedAmount}, Maximum allowed: {$outstandingBalance}.",
                evidence: [
                    'requested_amount' => $requestedAmount,
                    'outstanding_balance' => $outstandingBalance,
                    'excess_amount' => $excess,
                    'allow_advance_policy' => false,
                ],
                failedConditions: ['amount_within_outstanding_limit' => false],
                remediation: "Adjust the payment receipt amount to {$outstandingBalance} or enable advance payment policy in Tenant Settings.",
                executionTimeMs: $timeMs
            );
        }

        $timeMs = (microtime(true) - $startTime) * 1000;

        return RuleResult::pass(
            ruleCode: $this->code(),
            ruleVersion: $this->version(),
            message: 'Collection amount is within authorized outstanding limit or covered by advance policy.',
            evidence: [
                'requested_amount' => $requestedAmount,
                'outstanding_balance' => $outstandingBalance,
            ],
            executionTimeMs: $timeMs
        );
    }

    public function dependencies(): array
    {
        return [];
    }

    public function tags(): array
    {
        return ['collections', 'financials', 'receipting'];
    }
}
