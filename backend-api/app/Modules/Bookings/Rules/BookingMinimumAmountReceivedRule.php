<?php

namespace App\Modules\Bookings\Rules;

use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Enums\RuleSeverity;
use App\Core\BusinessRules\Results\RuleResult;

class BookingMinimumAmountReceivedRule implements BusinessRuleInterface
{
    public function code(): string
    {
        return 'booking.confirmation.minimum_amount_received';
    }

    public function name(): string
    {
        return 'Minimum Booking Amount Received for Confirmation';
    }

    public function description(): string
    {
        return 'Verifies that a plot booking has received settled payments equal to or exceeding the mandatory minimum deposit amount before changing state to CONFIRMED.';
    }

    public function module(): string
    {
        return 'Bookings';
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
        return $context->getAction() === 'booking.confirm'
            || ($context->getEntityType() === 'booking' && $context->getRequestedTransition() === 'CONFIRMED');
    }

    public function evaluate(BusinessRuleContextInterface $context): RuleResultInterface
    {
        $startTime = microtime(true);
        $snapshot = $context->getEntitySnapshot() ?? $context->getRequestData();

        $requiredMinimumAmount = (float) ($snapshot['required_minimum_amount'] ?? $snapshot['booking_amount'] ?? 0.0);
        $totalConfirmedPayments = (float) ($snapshot['total_confirmed_received'] ?? 0.0);

        if ($totalConfirmedPayments < $requiredMinimumAmount) {
            $shortfall = $requiredMinimumAmount - $totalConfirmedPayments;
            $timeMs = (microtime(true) - $startTime) * 1000;

            return RuleResult::fail(
                ruleCode: $this->code(),
                ruleVersion: $this->version(),
                message: "Booking confirmation blocked: Received payments ({$totalConfirmedPayments}) do not meet required minimum ({$requiredMinimumAmount}).",
                errorCode: 'BOOKING_INSUFFICIENT_CONFIRMED_DEPOSIT',
                userMessage: "Booking confirmation requires a minimum settled deposit of {$requiredMinimumAmount}. Currently received: {$totalConfirmedPayments}. Outstanding shortfall: {$shortfall}.",
                developerMessage: "Minimum payment check failed. Required: {$requiredMinimumAmount}, Received: {$totalConfirmedPayments}.",
                evidence: [
                    'required_minimum_amount' => $requiredMinimumAmount,
                    'total_confirmed_received' => $totalConfirmedPayments,
                    'shortfall' => $shortfall,
                ],
                failedConditions: ['minimum_deposit_met' => false],
                remediation: "Record settled payment receipts worth at least {$shortfall} or obtain an authorized override waiver.",
                executionTimeMs: $timeMs
            );
        }

        $timeMs = (microtime(true) - $startTime) * 1000;

        return RuleResult::pass(
            ruleCode: $this->code(),
            ruleVersion: $this->version(),
            message: 'Minimum required booking deposit received.',
            evidence: [
                'required_minimum_amount' => $requiredMinimumAmount,
                'total_confirmed_received' => $totalConfirmedPayments,
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
        return ['bookings', 'confirmation', 'financials'];
    }
}
