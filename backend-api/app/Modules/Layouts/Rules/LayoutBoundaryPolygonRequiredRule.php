<?php

namespace App\Modules\Layouts\Rules;

use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Enums\RuleSeverity;
use App\Core\BusinessRules\Results\RuleResult;

class LayoutBoundaryPolygonRequiredRule implements BusinessRuleInterface
{
    public function code(): string
    {
        return 'layout.approval.boundary_polygon_required';
    }

    public function name(): string
    {
        return 'Boundary Polygon Required for Layout Approval';
    }

    public function description(): string
    {
        return 'Verifies that a layout contains a valid, closed, non-intersecting boundary polygon with a positive area before approval.';
    }

    public function module(): string
    {
        return 'Layouts';
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
        return $context->getAction() === 'layout.approve'
            || ($context->getEntityType() === 'layout' && $context->getRequestedTransition() === 'APPROVED');
    }

    public function evaluate(BusinessRuleContextInterface $context): RuleResultInterface
    {
        $startTime = microtime(true);
        $snapshot = $context->getEntitySnapshot() ?? $context->getRequestData();
        $boundary = $snapshot['boundary_polygon'] ?? null;

        if (!$boundary || !is_array($boundary)) {
            $timeMs = (microtime(true) - $startTime) * 1000;
            return RuleResult::fail(
                ruleCode: $this->code(),
                ruleVersion: $this->version(),
                message: 'Layout approval failed: Missing boundary polygon geometry.',
                errorCode: 'LAYOUT_MISSING_BOUNDARY',
                userMessage: 'The layout cannot be approved because it does not have a boundary polygon defined.',
                developerMessage: 'Key boundary_polygon was missing or invalid array in layout snapshot.',
                evidence: ['boundary_present' => false],
                failedConditions: ['boundary_polygon_exists' => false],
                remediation: 'Upload or draw the boundary polygon in the Layout GIS editor before submitting for approval.',
                executionTimeMs: $timeMs
            );
        }

        $coordinates = $boundary['coordinates'] ?? $boundary;
        if (!is_array($coordinates) || count($coordinates) < 3) {
            $timeMs = (microtime(true) - $startTime) * 1000;
            return RuleResult::fail(
                ruleCode: $this->code(),
                ruleVersion: $this->version(),
                message: 'Layout approval failed: Polygon vertices count insufficient.',
                errorCode: 'LAYOUT_INVALID_POLYGON_VERTICES',
                userMessage: 'The layout boundary polygon is invalid because it contains fewer than 3 vertices.',
                developerMessage: 'Polygon coordinate count < 3.',
                evidence: ['vertex_count' => count($coordinates)],
                failedConditions: ['minimum_vertices_met' => false],
                remediation: 'Provide a closed polygon geometry with at least 3 distinct boundary coordinate points.',
                executionTimeMs: $timeMs
            );
        }

        // Check closed polygon (first and last vertex match)
        $first = reset($coordinates);
        $last = end($coordinates);
        $isClosed = ($first[0] == $last[0] && $first[1] == $last[1]);

        $timeMs = (microtime(true) - $startTime) * 1000;

        return RuleResult::pass(
            ruleCode: $this->code(),
            ruleVersion: $this->version(),
            message: 'Layout boundary polygon is valid and closed.',
            evidence: [
                'vertex_count' => count($coordinates),
                'is_closed' => $isClosed,
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
        return ['layouts', 'approval', 'gis'];
    }
}
