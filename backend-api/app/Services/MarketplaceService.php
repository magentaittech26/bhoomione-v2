<?php

namespace App\Services;

use App\Models\Project;
use App\Models\DeveloperProfile;
use App\Models\Layout;
use App\Models\Plot;
use Illuminate\Support\Facades\Cache;

class MarketplaceService
{
    /**
     * Get home dashboard feed data.
     */
    public function getMarketplaceHomeFeed(): array
    {
        return Cache::remember('marketplace_home_feed', 300, function () {
            // 1. Featured Projects
            $featuredProjects = Project::whereIn('publishing_status', ['Published', 'Featured'])
                ->where('is_featured', true)
                ->with(['layouts', 'tenant'])
                ->orderBy('created_at', 'desc')
                ->limit(4)
                ->get();

            // 2. Latest Projects
            $latestProjects = Project::whereIn('publishing_status', ['Published', 'Featured'])
                ->with(['layouts', 'tenant'])
                ->orderBy('created_at', 'desc')
                ->limit(4)
                ->get();

            // 3. Featured Developers
            $featuredDevelopers = DeveloperProfile::where('verification_status', 'VERIFIED')
                ->orderBy('rating', 'desc')
                ->limit(4)
                ->get();

            // 4. Popular Locations
            $popularLocations = Project::whereIn('publishing_status', ['Published', 'Featured'])
                ->select('location', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                ->groupBy('location')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get();

            // 5. Recently Added
            $recentlyAdded = Project::whereIn('publishing_status', ['Published', 'Featured'])
                ->with(['layouts', 'tenant'])
                ->orderBy('created_at', 'desc')
                ->limit(4)
                ->get();

            // 6. Investment Opportunities
            $investmentOpportunities = Project::whereIn('publishing_status', ['Published', 'Featured'])
                ->with(['layouts', 'tenant'])
                ->orderBy('views_count', 'asc')
                ->limit(4)
                ->get();

            // 7. New Launches
            $newLaunches = Project::whereIn('publishing_status', ['Published', 'Featured'])
                ->whereNotNull('launch_date')
                ->with(['layouts', 'tenant'])
                ->orderBy('launch_date', 'desc')
                ->limit(4)
                ->get();

            // 8. Trending Projects
            $trendingProjects = Project::whereIn('publishing_status', ['Published', 'Featured'])
                ->with(['layouts', 'tenant'])
                ->orderBy('views_count', 'desc')
                ->limit(4)
                ->get();

            return [
                'featured_projects' => $featuredProjects,
                'latest_projects' => $latestProjects,
                'featured_developers' => $featuredDevelopers,
                'popular_locations' => $popularLocations,
                'recently_added' => $recentlyAdded,
                'investment_opportunities' => $investmentOpportunities,
                'new_launches' => $newLaunches,
                'trending_projects' => $trendingProjects
            ];
        });
    }

    /**
     * Invalidate feed cache on mutable updates.
     */
    public static function invalidateHomeFeedCache(): void
    {
        Cache::forget('marketplace_home_feed');
    }
}
