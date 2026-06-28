<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MarketplaceSearchService
{
    /**
     * Search projects based on filters.
     */
    public function searchProjects(array $filters, string $ipAddress = '127.0.0.1', string $userAgent = 'System'): object
    {
        $query = Project::whereIn('publishing_status', ['Published', 'Featured']);

        // Search text filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('developer_name', 'like', "%{$search}%");
            });
        }

        // Location Filters: State, District, City
        if (!empty($filters['state'])) {
            $query->where('location', 'like', "%" . $filters['state'] . "%");
        }
        if (!empty($filters['district'])) {
            $query->where('location', 'like', "%" . $filters['district'] . "%");
        }
        if (!empty($filters['city'])) {
            $query->where('location', 'like', "%" . $filters['city'] . "%");
        }

        // Developer name filter
        if (!empty($filters['developer'])) {
            $query->where('developer_name', $filters['developer']);
        }

        // Project Name
        if (!empty($filters['project'])) {
            $query->where('name', 'like', "%" . $filters['project'] . "%");
        }

        // Layout Name or Code
        if (!empty($filters['layout'])) {
            $layoutName = $filters['layout'];
            $query->whereHas('layouts', function($q) use ($layoutName) {
                $q->where('name', 'like', "%{$layoutName}%")
                  ->orWhere('code', 'like', "%{$layoutName}%");
            });
        }

        // Price Range Filters
        if (isset($filters['min_price']) || isset($filters['max_price'])) {
            $minPrice = $filters['min_price'] ?? 0;
            $maxPrice = $filters['max_price'] ?? 999999999;
            $query->whereHas('layouts.plots', function($q) use ($minPrice, $maxPrice) {
                $q->whereBetween('price', [$minPrice, $maxPrice]);
            });
        } elseif (!empty($filters['price_range'])) {
            $price = $filters['price_range'];
            $query->whereHas('layouts', function($q) use ($price) {
                $q->where('price_range', 'like', "%{$price}%");
            });
        }

        // Area Range
        if (isset($filters['min_area']) || isset($filters['max_area'])) {
            $minArea = $filters['min_area'] ?? 0;
            $maxArea = $filters['max_area'] ?? 999999999;
            $query->whereHas('layouts.plots', function($q) use ($minArea, $maxArea) {
                $q->whereBetween('area_value', [$minArea, $maxArea]);
            });
        }

        // Facing
        if (!empty($filters['facing'])) {
            $facing = $filters['facing'];
            $query->whereHas('layouts.plots', function($q) use ($facing) {
                $q->where('facing', $facing);
            });
        }

        // Amenities & Project Type
        if (!empty($filters['amenities'])) {
            $amenity = $filters['amenities'];
            $query->whereHas('layouts', function($q) use ($amenity) {
                $q->where('layout_type', 'like', "%{$amenity}%");
            });
        }
        if (!empty($filters['project_type'])) {
            $pType = $filters['project_type'];
            $query->whereHas('layouts', function($q) use ($pType) {
                $q->where('layout_type', 'like', "%{$pType}%");
            });
        }

        // Availability Filter
        if (!empty($filters['availability'])) {
            $query->whereHas('layouts.plots', function($q) {
                $q->where('booking_status', 'AVAILABLE');
            });
        }

        // Sorting: Newest, Price, Area, Featured, Popularity
        $sortBy = $filters['sort_by'] ?? 'newest';
        switch ($sortBy) {
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            case 'price':
                $query->leftJoin('layouts', 'projects.id', '=', 'layouts.project_id')
                      ->leftJoin('plots', 'layouts.id', '=', 'plots.layout_id')
                      ->orderBy('plots.price', 'asc')
                      ->select('projects.*')
                      ->distinct();
                break;
            case 'area':
                $query->leftJoin('layouts', 'projects.id', '=', 'layouts.project_id')
                      ->orderBy('layouts.total_area_value', 'desc')
                      ->select('projects.*')
                      ->distinct();
                break;
            case 'featured':
                $query->orderBy('is_featured', 'desc');
                break;
            case 'popularity':
                $query->orderBy('views_count', 'desc');
                break;
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        // Resolve relations and paginate
        $projects = $query->with(['tenant', 'layouts' => function($q) {
            $q->where('visibility', '!=', 'Private')->where('visibility', '!=', 'Hidden');
        }])->paginate($filters['per_page'] ?? 15);

        // Increment views count and track view in history
        foreach ($projects as $proj) {
            $proj->increment('views_count');
            try {
                DB::table('marketplace_view_tracking')->insert([
                    'id' => Str::uuid()->toString(),
                    'project_id' => $proj->id,
                    'ip_address' => $ipAddress,
                    'user_agent' => $userAgent,
                    'created_at' => now()
                ]);
            } catch (\Throwable $e) {
                // Ignore tracking failures gracefully
            }
        }

        return $projects;
    }
}
