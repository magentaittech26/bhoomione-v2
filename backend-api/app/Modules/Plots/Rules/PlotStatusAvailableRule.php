<?php

namespace App\Modules\Plots/Rules;

use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Enums\RuleSeverity;
use App\Core\BusinessRules\Results\RuleResult;

class PlotStatusAvailableRule implements BusinessRuleInterface
{
    public function code(): string
    {
        return 'plot.booking.status_available';
    }

    public function name(): string
    {
        return 'Plot Must Be Available For Booking';
    }

    public function description(): string
    {
        return 'Ensures that a plot inventory item possesses an authoritative current status of AVAILABLE before any booking or hold reservation can be initiated.';
    }

    public function module(): string
    {
        return 'Plots';
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
        return false;
    }

    public function appliesTo(BusinessRuleContextInterface $context): bool
    {
        return $context->getAction() === 'plot.book'
            || $context->getAction() === 'booking.create'
            || ($context->getEntityType() === 'plot' && $context->getRequestedTransition() === 'BOOKED');
    }

    public function evaluate(BusinessRuleContextInterface $context): RuleResultInterface
    {
        $startTime = microtime(true);
        $snapshot = $context->getEntitySnapshot() ?? $context->getRequestData();
        $currentStatus = strtoupper($snapshot['status'] ?? 'UNKNOWN');

        if ($currentStatus !== 'AVAILABLE') {
            $timeMs = (microtime(true) - $startTime) * 1000;
            return RuleResult::fail(
                ruleCode: $this->code(),
                ruleVersion: $this->version(),
                message: "Plot booking blocked: Plot status is '{$currentStatus}' instead of AVAILABLE.",
                errorCode: 'PLOT_NOT_AVAILABLE',
                userMessage: "This plot cannot be booked because its current status is '{$currentStatus}'. Only plots with AVAILABLE status can be booked.",
                developerMessage: "Plot status check failed. Expected: AVAILABLE, Found: {$currentStatus}.",
                evidence: [
                    'plot_id' => $context->getEntityId(),
                    'current_status' => $currentStatus,
                ],
                failedConditions: ['status_is_available' => false],
                remediation: 'Select an available plot or release/cancel any active holds or prior bookings.',
                executionTimeMs: $timeMs
            );
        }

        $timeMs = (microtime(true) - $startTime) * 1000;

        return RuleResult::pass(
            ruleCode: $this->code(),
            ruleVersion: $this->version(),
            message: 'Plot status is AVAILABLE for booking.',
            evidence: [
                'plot_id' => $context->getEntityId(),
                'status' => 'AVAILABLE',
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
        return ['plots', 'bookings', 'inventory'];
    }
}
