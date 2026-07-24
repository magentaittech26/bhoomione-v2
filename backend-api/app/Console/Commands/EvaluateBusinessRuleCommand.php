<?php

namespace App\Console\Commands;

use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Contracts\BusinessRuleEngineInterface;
use Illuminate\Console\Command;

class EvaluateBusinessRuleCommand extends Command
{
    protected $signature = 'business-rules:evaluate {action} {entityType} {entityId?} {--tenant=} {--actor=} {--explain} {--dry-run}';
    protected $description = 'Evaluate business rules for a given action and entity context';

    public function handle(BusinessRuleEngineInterface $engine): int
    {
        $action = $this->argument('action');
        $entityType = $this->argument('entityType');
        $entityId = $this->argument('entityId');
        $tenantId = $this->option('tenant');
        $actorId = $this->option('actor');
        $isExplain = $this->option('explain');

        $context = BusinessRuleContext::create([
            'tenant_id' => $tenantId,
            'actor_id' => $actorId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'execution_source' => 'COMMAND',
        ]);

        $evaluation = $isExplain
            ? $engine->explain($action, $context)
            : $engine->evaluate($action, $context);

        if ($evaluation->passed()) {
            $this->info("✔ Business rule evaluation PASSED for action [{$action}] on [{$entityType}:{$entityId}].");
            $this->line("Execution time: " . number_format($evaluation->getExecutionTimeMs(), 2) . " ms");
            return 0;
        }

        $this->error("✖ Business rule evaluation BLOCKED for action [{$action}] on [{$entityType}:{$entityId}].");
        $this->line("Blocking failures: " . $evaluation->getBlockingFailureCount());

        foreach ($evaluation->failures() as $failure) {
            $this->line(" - [{$failure->getRuleCode()}] " . $failure->getMessage());
            if ($failure->getRemediation()) {
                $this->comment("   Remediation: " . $failure->getRemediation());
            }
        }

        return 1;
    }
}
