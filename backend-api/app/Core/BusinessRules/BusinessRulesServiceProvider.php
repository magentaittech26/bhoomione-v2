<?php

namespace App\Core\BusinessRules;

use App\Core\BusinessRules\Audit\BusinessRuleAuditService;
use App\Core\BusinessRules\Contracts\BusinessRuleEngineInterface;
use App\Core\BusinessRules\Contracts\RuleRegistryInterface;
use App\Core\BusinessRules\Engine\BusinessRuleEngine;
use App\Core\BusinessRules\Registry\RuleRegistry;
use App\Modules\Bookings\Rules\BookingMinimumAmountReceivedRule;
use App\Modules\Collections\Rules\CollectionAmountNotAboveOutstandingRule;
use App\Modules\Layouts\Rules\LayoutBoundaryPolygonRequiredRule;
use App\Modules\Plots\Rules\PlotStatusAvailableRule;
use App\Modules\Projects\Rules\ProjectMandatoryApprovalsCompleteRule;
use Illuminate\Support\ServiceProvider;

class BusinessRulesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RuleRegistryInterface::class, function () {
            $registry = new RuleRegistry();
            
            // Register reference rules
            $registry->register(new ProjectMandatoryApprovalsCompleteRule());
            $registry->register(new LayoutBoundaryPolygonRequiredRule());
            $registry->register(new PlotStatusAvailableRule());
            $registry->register(new BookingMinimumAmountReceivedRule());
            $registry->register(new CollectionAmountNotAboveOutstandingRule());

            return $registry;
        });

        $this->app->singleton(BusinessRuleAuditService::class, function () {
            return new BusinessRuleAuditService();
        });

        $this->app->singleton(BusinessRuleEngineInterface::class, function ($app) {
            return new BusinessRuleEngine(
                $app->make(RuleRegistryInterface::class),
                $app->make(BusinessRuleAuditService::class)
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
