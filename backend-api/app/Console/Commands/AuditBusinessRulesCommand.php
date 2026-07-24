<?php

namespace App\Console\Commands;

use App\Models\BusinessRuleEvaluationModel;
use Illuminate\Console\Command;

class AuditBusinessRulesCommand extends Command
{
    protected $signature = 'business-rules:audit {--tenant= : Filter by tenant ID} {--limit=20 : Number of evaluations to list}';
    protected $description = 'View recent business rule evaluation audit logs';

    public function handle(): int
    {
        $tenantId = $this->option('tenant');
        $limit = (int) $this->option('limit');

        $query = BusinessRuleEvaluationModel::with('results')->latest('created_at');
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $evaluations = $query->take($limit)->get();

        if ($evaluations->isEmpty()) {
            $this->info("No business rule evaluations found in audit history.");
            return 0;
        }

        $this->info("Recent Business Rule Evaluations (Showing top {$evaluations->count()}):");

        $tableData = $evaluations->map(function ($e) {
            return [
                'ID' => substr($e->id, 0, 8) . '...',
                'Action' => $e->action,
                'Entity' => $e->entity_type . ':' . ($e->entity_id ?? 'N/A'),
                'Passed' => $e->passed ? 'PASS' : 'FAIL',
                'Blocking' => $e->blocking_count,
                'Warnings' => $e->warning_count,
                'Exec Time' => number_format($e->execution_time_ms, 2) . ' ms',
                'Time' => $e->created_at,
            ];
        });

        $this->table(['ID', 'Action', 'Entity', 'Passed', 'Blocking', 'Warnings', 'Exec Time', 'Time'], $tableData);

        return 0;
    }
}
