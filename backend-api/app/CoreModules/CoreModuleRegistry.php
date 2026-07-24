<?php

namespace App\CoreModules;

use App\Contracts\CoreModuleProviderInterface;
use App\CoreModules\Providers\MeasurementUnitCoreModuleProvider;
use App\Models\SaasModule;
use App\Models\Tenant;
use Illuminate\Support\Str;

class CoreModuleRegistry
{
    /**
     * Registered provider instances indexed by module code.
     * @var array<string, CoreModuleProviderInterface>
     */
    protected static array $providers = [];

    /**
     * Initialize and register all core module providers.
     */
    public static function registerProviders(): void
    {
        if (!empty(self::$providers)) {
            return; // Already registered
        }

        $allProviders = [
            new MeasurementUnitCoreModuleProvider(),
            // Future Core MDM Providers (e.g. LocationMasterCoreModuleProvider, CurrencyCoreModuleProvider) register here seamlessly
        ];

        foreach ($allProviders as $provider) {
            self::$providers[$provider->getModuleCode()] = $provider;
        }
    }

    /**
     * Get all registered providers.
     * @return array<string, CoreModuleProviderInterface>
     */
    public static function getProviders(): array
    {
        self::registerProviders();
        return self::$providers;
    }

    /**
     * Get provider by module code.
     */
    public static function getProvider(string $code): ?CoreModuleProviderInterface
    {
        self::registerProviders();
        return self::$providers[$code] ?? null;
    }

    /**
     * Ensure all registered core modules exist in the `saas_modules` database table.
     */
    public static function syncDatabaseRegistry(bool $dryRun = false): array
    {
        self::registerProviders();
        $synced = [];

        foreach (self::$providers as $code => $provider) {
            $meta = $provider->getModuleMetadata();

            $module = SaasModule::where('code', $code)->first();

            if (!$module) {
                if (!$dryRun) {
                    $module = SaasModule::create([
                        'id' => (string) Str::uuid(),
                        'code' => $code,
                        'name' => $meta['name'],
                        'group' => $meta['group'] ?? 'Master Data Management',
                        'description' => $meta['description'] ?? '',
                        'status' => 'ACTIVE',
                        'is_core' => $meta['is_core'] ?? true,
                        'is_billable' => $meta['is_billable'] ?? false,
                        'sort_order' => $meta['display_order'] ?? 10,
                    ]);
                }
                $synced[] = ['code' => $code, 'action' => 'CREATED', 'name' => $meta['name']];
            } else {
                if (!$dryRun) {
                    $module->update([
                        'name' => $meta['name'],
                        'group' => $meta['group'] ?? 'Master Data Management',
                        'description' => $meta['description'] ?? '',
                        'is_core' => $meta['is_core'] ?? true,
                        'is_billable' => $meta['is_billable'] ?? false,
                        'sort_order' => $meta['display_order'] ?? 10,
                    ]);
                }
                $synced[] = ['code' => $code, 'action' => 'VERIFIED', 'name' => $meta['name']];
            }
        }

        return $synced;
    }

    /**
     * Provision all registered core modules for a given tenant.
     */
    public static function provisionTenant(Tenant $tenant, bool $dryRun = false): array
    {
        self::registerProviders();
        $results = [];

        foreach (self::$providers as $code => $provider) {
            $results[$code] = $provider->provisionTenant($tenant, $dryRun);
        }

        return $results;
    }

    /**
     * Backfill all registered core modules across all tenants in the system.
     */
    public static function backfillAllTenants(bool $dryRun = false): array
    {
        self::registerProviders();
        self::syncDatabaseRegistry($dryRun);

        $tenants = Tenant::all();
        $summary = [
            'tenants_scanned' => $tenants->count(),
            'modules_scanned' => count(self::$providers),
            'tenant_results' => [],
        ];

        foreach ($tenants as $tenant) {
            $tenantSummary = ['tenant_id' => $tenant->id, 'tenant_name' => $tenant->name ?? 'Tenant', 'modules' => []];
            foreach (self::$providers as $code => $provider) {
                $tenantSummary['modules'][$code] = $provider->backfillTenant($tenant, $dryRun);
            }
            $summary['tenant_results'][] = $tenantSummary;
        }

        return $summary;
    }

    /**
     * Audit data integrity across all core module providers.
     */
    public static function auditAll(bool $dryRun = true): array
    {
        self::registerProviders();
        $auditResults = [];

        foreach (self::$providers as $code => $provider) {
            $auditResults[$code] = [
                'metadata' => $provider->getModuleMetadata(),
                'validation' => $provider->validate($dryRun),
                'audit' => $provider->audit(),
            ];
        }

        return $auditResults;
    }
}
