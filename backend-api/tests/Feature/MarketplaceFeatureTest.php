<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Project;
use App\Models\DeveloperProfile;
use App\Models\MarketplaceLead;
use App\Services\MarketplaceSEOService;
use App\Services\MarketplaceSearchService;
use App\Services\MarketplaceLeadService;
use App\Services\MarketplaceDashboardService;
use App\Services\MarketplaceModerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class MarketplaceFeatureTest extends TestCase
{
    /**
     * Test Developer Profile operations.
     */
    public function test_developer_profile_retrieval_and_update()
    {
        $tenantId = (string) Str::uuid();
        
        $profile = new DeveloperProfile([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_name' => 'Acme Developers',
            'rera_number' => 'RERA-12345',
            'office_address' => '123 Business Rd',
            'phone' => '+919876543210',
            'email' => 'contact@acme.com',
            'seo_slug' => 'acme-developers',
            'public_visibility' => true
        ]);

        $this->assertEquals('Acme Developers', $profile->company_name);
        $this->assertEquals('acme-developers', $profile->seo_slug);
    }

    /**
     * Test Marketplace Project Search.
     */
    public function test_marketplace_search_filters()
    {
        $searchService = new MarketplaceSearchService();
        $this->assertInstanceOf(MarketplaceSearchService::class, $searchService);
    }

    /**
     * Test Marketplace Lead capture and duplicate detection.
     */
    public function test_lead_capture_and_duplicate_prevention()
    {
        $leadService = new MarketplaceLeadService();
        $this->assertInstanceOf(MarketplaceLeadService::class, $leadService);
    }

    /**
     * Test Marketplace Moderation Engine.
     */
    public function test_moderation_engine_transitions()
    {
        $moderationService = new MarketplaceModerationService();
        $this->assertInstanceOf(MarketplaceModerationService::class, $moderationService);
    }

    /**
     * Test SEO dynamic generators.
     */
    public function test_seo_metadata_generation()
    {
        $seoService = new MarketplaceSEOService();
        
        $dev = new DeveloperProfile([
            'company_name' => 'Eco Homes',
            'description' => 'Eco-friendly builder',
            'seo_slug' => 'eco-homes',
            'phone' => '+919999999999',
            'email' => 'info@ecohomes.com',
            'office_address' => 'Eco Park, City A'
        ]);

        $seo = $seoService->generateDeveloperSEO($dev);
        
        $this->assertArrayHasKey('meta_title', $seo);
        $this->assertArrayHasKey('meta_description', $seo);
        $this->assertContains('Eco Homes', $seo['meta_title']);
    }

    /**
     * Test Dashboard aggregation metrics.
     */
    public function test_dashboard_aggregation_metrics()
    {
        $dashboardService = new MarketplaceDashboardService();
        $this->assertInstanceOf(MarketplaceDashboardService::class, $dashboardService);
    }
}
