<?php

namespace App\Console\Commands;

use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleRegistryInterface;
use Illuminate\Console\Command;

class ListBusinessRulesCommand extends Command
{
    protected $signature = 'business-rules:list {--module= : Filter rules by module}';
    protected $description = 'List all registered business rules in the central Business Rules Engine';

    public function handle(RuleRegistryInterface $registry): int
    {
        $module = $this->option('module');
        $rules = $module ? $registry->getByModule($module) : $registry->all();

        if (empty($rules)) {
            $this->warn("No business rules registered" . ($module ? " for module [{$module}]" : "") . ".");
            return 0;
        }

        $tableData = array_map(function (BusinessRuleInterface $rule) {
            return [
                'Code' => $rule->code(),
                'Name' => $rule->name(),
                'Module' => $rule->module(),
                'Version' => $rule->version(),
                'Severity' => $rule->severity()->value,
                'Overridable' => $rule->isOverridable() ? 'YES' : 'NO',
            ];
        }, array_values($rules));

        $this->info("Registered Business Rules (" . count($rules) . "):");
        $this->table(['Code', 'Name', 'Module', 'Version', 'Severity', 'Overridable'], $tableData);

        return 0;
    }
}
