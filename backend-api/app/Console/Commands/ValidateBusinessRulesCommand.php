<?php

namespace App\Console\Commands;

use App\Core\BusinessRules\Contracts\RuleRegistryInterface;
use Illuminate\Console\Command;

class ValidateBusinessRulesCommand extends Command
{
    protected $signature = 'business-rules:validate';
    protected $description = 'Validate business rule registry for missing dependencies and code conflicts';

    public function handle(RuleRegistryInterface $registry): int
    {
        $issues = $registry->validateRegistry();

        if (empty($issues)) {
            $this->info("✔ Business Rule Registry validation PASSED. All registered rules and dependencies are valid.");
            return 0;
        }

        $this->error("✖ Business Rule Registry validation FAILED with " . count($issues) . " issue(s):");
        foreach ($issues as $issue) {
            $this->line(" - {$issue}");
        }

        return 1;
    }
}
