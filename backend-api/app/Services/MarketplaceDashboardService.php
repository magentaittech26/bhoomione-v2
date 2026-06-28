<?php

namespace App\Services;

use App\Models\Project;
use App\Models\MarketplaceLead;
use Illuminate\Support\Facades\DB;

class MarketplaceDashboardService
{
    /**
     * Get aggregate stats for a specific tenant's marketplace dashboard.
     */
    public function getTenantStats(string $tenantId): array
    {
        $totalViews = (int) Project::where('tenant_id', $tenantId)->sum('views_count');
        $totalLeads = MarketplaceLead::where('tenant_id', $tenantId)->count();
        
        $leadsByType = MarketplaceLead::where('tenant_id', $tenantId)
            ->select('lead_type', DB::raw('count(*) as count'))
            ->groupBy('lead_type')
            ->get()
            ->pluck('count', 'lead_type');

        $publishedCount = Project::where('tenant_id', $tenantId)->where('publishing_status', 'Published')->count();
        $pendingCount = Project::where('tenant_id', $tenantId)->where('publishing_status', 'Pending Approval')->count();
        $hiddenCount = Project::where('tenant_id', $tenantId)->where('publishing_status', 'Hidden')->count();
        $featuredCount = Project::where('tenant_id', $tenantId)->where('publishing_status', 'Featured')->count();
        $archivedCount = Project::where('tenant_id', $tenantId)->where('publishing_status', 'Archived')->count();

        $topProjects = Project::where('tenant_id', $tenantId)
            ->orderBy('views_count', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'views_count', 'publishing_status']);

        $topLocations = Project::where('tenant_id', $tenantId)
            ->select('location', DB::raw('count(*) as count'))
            ->groupBy('location')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();

        // Monthly trends aggregated
        $monthlyViews = Project::where('tenant_id', $tenantId)
            ->select(DB::raw("TO_CHAR(created_at, 'YYYY-MM') as month"), DB::raw('SUM(views_count) as views'))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get()
            ->pluck('views', 'month');

        $monthlyLeads = MarketplaceLead::where('tenant_id', $tenantId)
            ->select(DB::raw("TO_CHAR(created_at, 'YYYY-MM') as month"), DB::raw('count(*) as leads'))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get()
            ->pluck('leads', 'month');

        // Merge months to build clean timeline trend array
        $allMonths = array_unique(array_merge(array_keys($monthlyViews->toArray()), array_keys($monthlyLeads->toArray())));
        sort($allMonths);
        $trends = [];
        foreach ($allMonths as $month) {
            $trends[] = [
                'month' => $month,
                'views' => (int) ($monthlyViews[$month] ?? 0),
                'leads' => (int) ($monthlyLeads[$month] ?? 0)
            ];
        }

        return [
            'total_views' => $totalViews,
            'total_leads' => $totalLeads,
            'lead_type_breakdown' => $leadsByType,
            'published_projects_count' => $publishedCount,
            'pending_projects_count' => $pendingCount,
            'hidden_projects_count' => $hiddenCount,
            'featured_projects_count' => $featuredCount,
            'archived_projects_count' => $archivedCount,
            'top_projects' => $topProjects,
            'top_locations' => $topLocations,
            'conversion_rate' => $totalViews > 0 ? round(($totalLeads / $totalViews) * 100, 2) : 0,
            'monthly_trends' => $trends
        ];
    }
}
