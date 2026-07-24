<?php

namespace App\Console\Commands;

use App\Core\Lifecycle\Contracts\LifecycleRegistryInterface;
use Illuminate\Console\Command;

class AuditLifecyclesCommand extends Command
{
    protected $signature = 'lifecycle:audit';
    protected $description = 'Audit all registered lifecycle definitions, states, transitions, and business rule bindings.';

    public function handle(LifecycleRegistryInterface $registry): int
    {
        $this->info("=========================================================");
        $this->info("   BHOOMIONE V3 - LIFECYCLE ENGINE AUDIT REPORT");
        $this->info("=========================================================");

        $providers = $registry->all();
        $this->info("Total Registered Lifecycle Providers: " . count($providers));
        $this->newLine();

        $rows = [];
        $totalStates = 0;
        $totalTransitions = 0;
        $hasErrors = false;

        foreach ($providers as $provider) {
            $def = $provider->definition();
            $issues = $def->validateDefinition();

            $stateCount = count($def->states());
            $transitionCount = count($def->transitions());
            $totalStates += $stateCount;
            $totalTransitions += $transitionCount;

            $status = empty($issues) ? '<fg=green>VALID</>' : '<fg=red>INVALID (' . count($issues) . ' issues)</>';
            if (!empty($issues)) {
                $hasErrors = true;
            }

            $rows[] = [
                $def->code(),
                $provider->entityType(),
                $provider->module(),
                $def->version(),
                $stateCount,
                $transitionCount,
                $def->initialState(),
                implode(', ', $def->terminalStates()),
                $status,
            ];
        }

        $this->table(
            ['Lifecycle Code', 'Entity Type', 'Module', 'Version', 'States', 'Transitions', 'Initial State', 'Terminal States', 'Status'],
            $rows
        );

        $this->newLine();
        $this->info("Summary: {$totalStates} states and {$totalTransitions} transitions validated across " . count($providers) . " domain lifecycles.");

        if ($hasErrors) {
            $this->error("Audit completed with errors. Please check lifecycle provider definitions.");
            return 1;
        }

        $this->info("All lifecycle definitions are valid and ready for enterprise operation.");
        return 0;
    }
}
