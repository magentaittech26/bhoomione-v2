<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\MarketplaceSearchRequest;
use App\Http\Requests\StoreMarketplaceLeadRequest;
use App\Http\Requests\UpdateDeveloperProfileRequest;
use App\Http\Requests\PublishProjectRequest;
use App\Http\Requests\ModerationRequest;
use App\Http\Resources\DeveloperProfileResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\MarketplaceLeadResource;
use App\Http\Resources\DashboardResource;
use App\Http\Resources\LayoutResource;
use App\Http\Resources\PlotResource;
use App\Models\DeveloperProfile;
use App\Models\Project;
use App\Models\Layout;
use App\Models\Plot;
use App\Models\MarketplaceLead;
use App\Models\Tenant;
use App\Services\MarketplaceService;
use App\Services\MarketplaceSearchService;
use App\Services\MarketplaceLeadService;
use App\Services\MarketplaceDashboardService;
use App\Services\MarketplaceModerationService;
use App\Services\MarketplaceSEOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class MarketplaceController extends Controller
{
    protected $marketplaceService;
    protected $searchService;
    protected $leadService;
    protected $dashboardService;
    protected $moderationService;
    protected $seoService;

    public function __construct(
        MarketplaceService $marketplaceService,
        MarketplaceSearchService $searchService,
        MarketplaceLeadService $leadService,
        MarketplaceDashboardService $dashboardService,
        MarketplaceModerationService $moderationService,
        MarketplaceSEOService $seoService
    ) {
        $this->marketplaceService = $marketplaceService;
        $this->searchService = $searchService;
        $this->leadService = $leadService;
        $this->dashboardService = $dashboardService;
        $this->moderationService = $moderationService;
        $this->seoService = $seoService;
    }

    /**
     * Helper to resolve active tenant context dynamically.
     */
    private function getTenantId(Request $request): string
    {
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : ($request->attributes->get('authenticatedUserPayload')['tenantId'] ?? null);
        
        if (!$tenantId) {
            abort(response()->json([
                'error' => 'Tenant context could not be resolved. Please specify X-Tenant-ID header.'
            ], 400));
        }

        return $tenantId;
    }

    /**
     * Helper to log audit actions inside the ecosystem.
     */
    private function logAudit(string $action, string $targetType, string $targetId, array $old = [], array $new = [])
    {
        try {
            \App\Services\AuditLogService::log(
                tenantId: null,
                userId: null,
                action: $action,
                module: 'Marketplace',
                entityType: $targetType,
                entityId: $targetId,
                oldValues: $old,
                newValues: $new
            );
        } catch (\Throwable $e) {
            // Ignore audit logging errors gracefully in dev environments
        }
    }

    // ==========================================
    // PUBLIC DISCOVERY ENDPOINTS
    // ==========================================

    /**
     * GET /api/v1/public/marketplace/home
     */
    public function publicMarketplaceHome(Request $request)
    {
        $feed = $this->marketplaceService->getMarketplaceHomeFeed();
        
        return response()->json([
            'featured_projects' => ProjectResource::collection($feed['featured_projects']),
            'latest_projects' => ProjectResource::collection($feed['latest_projects']),
            'featured_developers' => DeveloperProfileResource::collection($feed['featured_developers']),
            'popular_locations' => $feed['popular_locations'],
            'recently_added' => ProjectResource::collection($feed['recently_added']),
            'investment_opportunities' => ProjectResource::collection($feed['investment_opportunities']),
            'new_launches' => ProjectResource::collection($feed['new_launches']),
            'trending_projects' => ProjectResource::collection($feed['trending_projects'])
        ]);
    }

    /**
     * GET /api/v1/public/marketplace/projects
     */
    public function publicProjects(MarketplaceSearchRequest $request)
    {
        // Tag request to let API Resources know we are in a public context
        $request->headers->set('X-Public-Marketplace', 'true');

        $projects = $this->searchService->searchProjects(
            $request->validated(),
            $request->ip() ?: '127.0.0.1',
            $request->userAgent() ?: 'System'
        );

        return ProjectResource::collection($projects);
    }

    /**
     * GET /api/v1/public/marketplace/projects/{id}
     */
    public function publicProjectShow(Request $request, $id)
    {
        $request->headers->set('X-Public-Marketplace', 'true');

        $project = Project::whereIn('publishing_status', ['Published', 'Featured'])
            ->with(['tenant', 'layouts' => function($q) {
                $q->where('visibility', '!=', 'Private')->where('visibility', '!=', 'Hidden')->with('plots');
            }])
            ->findOrFail($id);

        $project->increment('views_count');

        // Dynamically compute and store SEO default values using the SEO Service
        $project->seo_settings = $this->seoService->generateProjectSEO($project);

        return new ProjectResource($project);
    }

    /**
     * GET /api/v1/public/marketplace/developers
     */
    public function publicDevelopers(Request $request)
    {
        $developers = DeveloperProfile::where('public_visibility', true)
            ->where('verification_status', 'VERIFIED')
            ->orderBy('company_name', 'asc')
            ->paginate($request->input('per_page', 15));

        return DeveloperProfileResource::collection($developers);
    }

    /**
     * GET /api/v1/public/marketplace/developers/{slug}
     */
    public function publicDeveloperShow(Request $request, $slug)
    {
        $request->headers->set('X-Public-Marketplace', 'true');

        $dev = DeveloperProfile::where('seo_slug', $slug)
            ->where('public_visibility', true)
            ->firstOrFail();

        $projects = Project::where('tenant_id', $dev->tenant_id)
            ->whereIn('publishing_status', ['Published', 'Featured'])
            ->with(['layouts' => function($q) {
                $q->where('visibility', '!=', 'Private')->where('visibility', '!=', 'Hidden')->with('plots');
            }])
            ->get();

        $seo = $this->seoService->generateDeveloperSEO($dev);

        return response()->json([
            'developer' => new DeveloperProfileResource($dev),
            'projects' => ProjectResource::collection($projects),
            'seo' => $seo
        ]);
    }

    /**
     * POST /api/v1/public/marketplace/leads
     */
    public function publicSubmitLead(StoreMarketplaceLeadRequest $request)
    {
        $lead = $this->leadService->submitLead($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Your request has been registered successfully. Our executive will reach out to you shortly.',
            'lead' => new MarketplaceLeadResource($lead)
        ], 201);
    }

    // ==========================================
    // TENANT BACK-OFFICE OPERATIONS (MANAGEMENT)
    // ==========================================

    /**
     * GET /api/v1/tenant/marketplace/developer-profile
     */
    public function getDeveloperProfile(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        
        $profile = DeveloperProfile::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'id' => Str::uuid()->toString(),
                'company_name' => 'BhoomiOne Certified Partner Developer',
                'rera_number' => 'PENDING',
                'office_address' => 'Corporate Office Address',
                'phone' => '+9100000000',
                'email' => 'partner@bhoomione.com',
                'seo_slug' => 'developer-' . strtolower(Str::random(6)),
                'public_visibility' => true
            ]
        );

        return new DeveloperProfileResource($profile);
    }

    /**
     * POST /api/v1/tenant/marketplace/developer-profile
     */
    public function updateDeveloperProfile(UpdateDeveloperProfileRequest $request)
    {
        $tenantId = $this->getTenantId($request);
        $profile = DeveloperProfile::where('tenant_id', $tenantId)->firstOrFail();

        $old = $profile->toArray();
        $profile->update($request->validated());

        // Invalidate Home Feed Cache
        MarketplaceService::invalidateHomeFeedCache();

        $this->logAudit(
            'UPDATE_DEVELOPER_PROFILE',
            'DeveloperProfile',
            $profile->id,
            $old,
            $profile->fresh()->toArray()
        );

        return new DeveloperProfileResource($profile);
    }

    /**
     * POST /api/v1/tenant/marketplace/projects/{id}/publish
     */
    public function publishProject(PublishProjectRequest $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $project = Project::where('tenant_id', $tenantId)->findOrFail($id);
        $old = $project->toArray();

        $project->update([
            'publishing_status' => $request->input('status'),
            'is_featured' => ($request->input('status') === 'Featured') ? true : $project->is_featured,
            'publish_date' => $request->input('publish_date'),
            'unpublish_date' => $request->input('unpublish_date')
        ]);

        // Invalidate Home Feed Cache
        MarketplaceService::invalidateHomeFeedCache();

        $this->logAudit(
            'PUBLISH_PROJECT',
            'Project',
            $project->id,
            $old,
            $project->fresh()->toArray()
        );

        return new ProjectResource($project);
    }

    /**
     * POST /api/v1/tenant/marketplace/projects/{id}/seo
     */
    public function updateProjectSeo(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $project = Project::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'seo_settings' => 'required|array'
        ]);

        $old = $project->toArray();
        $project->update([
            'seo_settings' => $request->input('seo_settings')
        ]);

        // Invalidate Home Feed Cache
        MarketplaceService::invalidateHomeFeedCache();

        $this->logAudit(
            'UPDATE_PROJECT_SEO',
            'Project',
            $project->id,
            $old,
            $project->fresh()->toArray()
        );

        return new ProjectResource($project);
    }

    /**
     * POST /api/v1/tenant/marketplace/layouts/{id}/visibility
     */
    public function updateLayoutVisibility(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $layout = Layout::whereHas('project', function($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        $request->validate([
            'visibility' => 'required|string|in:Private,Public,Featured,Premium,Hidden',
            'price_range' => 'nullable|string|max:100'
        ]);

        $old = $layout->toArray();
        $layout->update([
            'visibility' => $request->input('visibility'),
            'price_range' => $request->input('price_range', $layout->price_range)
        ]);

        $this->logAudit(
            'UPDATE_LAYOUT_VISIBILITY',
            'Layout',
            $layout->id,
            $old,
            $layout->fresh()->toArray()
        );

        return new LayoutResource($layout);
    }

    /**
     * POST /api/v1/tenant/marketplace/plots/{id}/visibility
     */
    public function updatePlotVisibility(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $plot = Plot::whereHas('layout.project', function($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        $request->validate([
            'marketplace_visible' => 'required|boolean',
            'price' => 'required|numeric|min:0',
            'booking_status' => 'required|string|in:AVAILABLE,SOLD,RESERVED'
        ]);

        $old = $plot->toArray();
        $plot->update([
            'marketplace_visible' => $request->input('marketplace_visible'),
            'price' => $request->input('price'),
            'booking_status' => $request->input('booking_status')
        ]);

        $this->logAudit(
            'UPDATE_PLOT_VISIBILITY',
            'Plot',
            $plot->id,
            $old,
            $plot->fresh()->toArray()
        );

        return new PlotResource($plot);
    }

    /**
     * GET /api/v1/tenant/marketplace/leads
     */
    public function getTenantLeads(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        
        $leads = MarketplaceLead::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return MarketplaceLeadResource::collection($leads);
    }

    /**
     * GET /api/v1/tenant/marketplace/dashboard-stats
     */
    public function getTenantDashboardStats(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $stats = $this->dashboardService->getTenantStats($tenantId);

        return new DashboardResource($stats);
    }

    // ==========================================
    // PLATFORM ADMINISTRATIVE CONTROLS (SUPERADMIN)
    // ==========================================

    /**
     * GET /api/v1/admin/marketplace/projects
     */
    public function adminProjects(Request $request)
    {
        $projects = Project::with(['tenant'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return ProjectResource::collection($projects);
    }

    /**
     * POST /api/v1/admin/marketplace/projects/{id}/moderate
     */
    public function adminModerateProject(ModerationRequest $request, $id)
    {
        $project = Project::findOrFail($id);
        
        $moderatedProject = $this->moderationService->moderateProject(
            $project,
            $request->input('status'),
            $request->input('reason'),
            'Central Platform Admin'
        );

        $this->logAudit(
            'ADMIN_MODERATE_PROJECT',
            'Project',
            $project->id,
            ['publishing_status' => $project->getOriginal('publishing_status')],
            ['publishing_status' => $moderatedProject->publishing_status, 'reason' => $request->input('reason')]
        );

        return new ProjectResource($moderatedProject);
    }

    /**
     * GET /api/v1/admin/marketplace/developers
     */
    public function adminDevelopers(Request $request)
    {
        $developers = DeveloperProfile::orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return DeveloperProfileResource::collection($developers);
    }

    /**
     * POST /api/v1/admin/marketplace/developers/{id}/moderate
     */
    public function adminModerateDeveloper(ModerationRequest $request, $id)
    {
        $developer = DeveloperProfile::findOrFail($id);

        $moderatedDev = $this->moderationService->moderateDeveloper(
            $developer,
            $request->input('status'),
            $request->input('reason'),
            'Central Platform Admin'
        );

        $this->logAudit(
            'ADMIN_MODERATE_DEVELOPER',
            'DeveloperProfile',
            $developer->id,
            ['verification_status' => $developer->getOriginal('verification_status')],
            ['verification_status' => $moderatedDev->verification_status, 'reason' => $request->input('reason')]
        );

        return new DeveloperProfileResource($moderatedDev);
    }
}
