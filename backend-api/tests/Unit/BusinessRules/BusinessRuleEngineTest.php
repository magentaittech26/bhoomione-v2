<?php

namespace Tests\Unit\BusinessRules;

use App\Core\BusinessRules\Audit\BusinessRuleAuditService;
use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Engine\BusinessRuleEngine;
use App\Core\BusinessRules\Enums\RuleSeverity;
use App\Core\BusinessRules\Exceptions\BusinessRuleException;
use App\Core\BusinessRules\Registry\RuleRegistry;
use App\Core\BusinessRules\Results\RuleResult;
use App\Modules\Bookings\Rules\BookingMinimumAmountReceivedRule;
use App\Modules\Collections\Rules\CollectionAmountNotAboveOutstandingRule;
use App\Modules\Layouts\Rules\LayoutBoundaryPolygonRequiredRule;
use App\Modules\Plots\Rules\PlotStatusAvailableRule;
use App\Modules\Projects\Rules\ProjectMandatoryApprovalsCompleteRule;
use Tests\TestCase;

class BusinessRuleEngineTest extends TestCase
{
    protected RuleRegistry $registry;
    protected BusinessRuleEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = new RuleRegistry();
        $auditService = new BusinessRuleAuditService();
        $this->engine = new BusinessRuleEngine($this->registry, $auditService);
    }

    public function test_registry_registers_and_rejects_duplicate_rule_codes(): void
    {
        $rule1 = new PlotStatusAvailableRule();
        $this->registry->register($rule1);

        $this->assertTrue($this->registry->has('plot.booking.status_available'));

        $this->expectException(\InvalidArgumentException::class);
        $this->registry->register(new PlotStatusAvailableRule());
    }

    public function test_plot_booking_status_available_rule_passes_when_available(): void
    {
        $rule = new PlotStatusAvailableRule();
        $this->registry->register($rule);

        $context = BusinessRuleContext::create([
            'action' => 'plot.book',
            'entity_type' => 'plot',
            'entity_id' => 'plot-123',
            'entity_snapshot' => ['status' => 'AVAILABLE'],
        ]);

        $evaluation = $this->engine->evaluate('plot.book', $context);

        $this->assertTrue($evaluation->passed());
        $this->assertEquals(0, $evaluation->getBlockingFailureCount());
    }

    public function test_plot_booking_status_available_rule_fails_when_booked(): void
    {
        $rule = new PlotStatusAvailableRule();
        $this->registry->register($rule);

        $context = BusinessRuleContext::create([
            'action' => 'plot.book',
            'entity_type' => 'plot',
            'entity_id' => 'plot-123',
            'entity_snapshot' => ['status' => 'BOOKED'],
        ]);

        $evaluation = $this->engine->evaluate('plot.book', $context);

        $this->assertFalse($evaluation->passed());
        $this->assertEquals(1, $evaluation->getBlockingFailureCount());
        $this->assertEquals('PLOT_NOT_AVAILABLE', $evaluation->firstBlockingFailure()->getErrorCode());
    }

    public function test_project_mandatory_approvals_rule_blocks_when_approvals_missing(): void
    {
        $rule = new ProjectMandatoryApprovalsCompleteRule();
        $this->registry->register($rule);

        $context = BusinessRuleContext::create([
            'action' => 'project.activate',
            'entity_type' => 'project',
            'entity_id' => 'proj-999',
            'entity_snapshot' => ['approvals' => []],
        ]);

        $evaluation = $this->engine->evaluate('project.activate', $context);

        $this->assertTrue($evaluation->hasBlockingFailures());
        $this->assertEquals('PROJECT_MISSING_APPROVALS', $evaluation->firstBlockingFailure()->getErrorCode());
    }

    public function test_layout_boundary_polygon_required_rule_validates_geometry(): void
    {
        $rule = new LayoutBoundaryPolygonRequiredRule();
        $this->registry->register($rule);

        $validContext = BusinessRuleContext::create([
            'action' => 'layout.approve',
            'entity_type' => 'layout',
            'entity_id' => 'lay-111',
            'entity_snapshot' => [
                'boundary_polygon' => [
                    'coordinates' => [[0, 0], [10, 0], [10, 10], [0, 0]],
                ],
            ],
        ]);

        $evaluation = $this->engine->evaluate('layout.approve', $validContext);
        $this->assertTrue($evaluation->passed());
    }

    public function test_collection_amount_not_above_outstanding_blocks_overpayment(): void
    {
        $rule = new CollectionAmountNotAboveOutstandingRule();
        $this->registry->register($rule);

        $context = BusinessRuleContext::create([
            'action' => 'collection.record',
            'entity_type' => 'payment',
            'request_data' => ['amount' => 15000],
            'entity_snapshot' => ['outstanding_balance' => 10000],
            'metadata' => ['tenant_policy' => ['allow_advance_payments' => false]],
        ]);

        $evaluation = $this->engine->evaluate('collection.record', $context);
        $this->assertTrue($evaluation->hasBlockingFailures());
        $this->assertEquals('COLLECTION_EXCEEDS_OUTSTANDING', $evaluation->firstBlockingFailure()->getErrorCode());
    }

    public function test_booking_minimum_amount_received_rule(): void
    {
        $rule = new BookingMinimumAmountReceivedRule();
        $this->registry->register($rule);

        $context = BusinessRuleContext::create([
            'action' => 'booking.confirm',
            'entity_type' => 'booking',
            'entity_snapshot' => [
                'required_minimum_amount' => 50000,
                'total_confirmed_received' => 20000,
            ],
        ]);

        $evaluation = $this->engine->evaluate('booking.confirm', $context);
        $this->assertTrue($evaluation->hasBlockingFailures());
        $this->assertEquals('BOOKING_INSUFFICIENT_CONFIRMED_DEPOSIT', $evaluation->firstBlockingFailure()->getErrorCode());
    }

    public function test_engine_enforce_throws_business_rule_exception(): void
    {
        $rule = new PlotStatusAvailableRule();
        $this->registry->register($rule);

        $context = BusinessRuleContext::create([
            'action' => 'plot.book',
            'entity_type' => 'plot',
            'entity_snapshot' => ['status' => 'SOLD'],
        ]);

        $this->expectException(BusinessRuleException::class);
        $this->engine->enforce('plot.book', $context);
    }
}
