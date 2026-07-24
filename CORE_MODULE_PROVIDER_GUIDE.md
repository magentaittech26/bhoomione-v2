# BhoomiOne V3 — Core Module Provider Implementation Guide

## Overview
To add a new mandatory core module (e.g., `core.mdm.currencies`, `core.mdm.tax_types`, or `core.mdm.amenity_types`), developers implement `App\Contracts\CoreModuleProviderInterface` and register the class in `App\CoreModules\CoreModuleRegistry`.

---

## Step-by-Step Provider Implementation

### 1. Contract Definition
Your provider class must implement `App\Contracts\CoreModuleProviderInterface`:

```php
namespace App\CoreModules\Providers;

use App\Contracts\CoreModuleProviderInterface;
use App\Models\Tenant;

class CurrencyCoreModuleProvider implements CoreModuleProviderInterface
{
    public function getModuleCode(): string
    {
        return 'core.mdm.currencies';
    }

    public function getModuleMetadata(): array
    {
        return [
            'code' => 'core.mdm.currencies',
            'name' => 'Currencies & Exchange Standards',
            'category' => 'Master Data Management',
            'group' => 'Master Data Management',
            'description' => 'Mandatory MDM module for multi-currency transactions',
            'is_core' => true,
            'is_required' => true,
            'default_enabled' => true,
            'billing_required' => false,
            'tenant_can_disable' => false,
            'version' => '3.0.0',
            'display_order' => 15,
            'rbac_permissions' => [
                'platform' => [
                    'view' => 'platform.masters.currencies.view',
                    'create' => 'platform.masters.currencies.create',
                    'edit' => 'platform.masters.currencies.edit',
                ],
                'tenant' => [
                    'view' => 'tenant.masters.currencies.view',
                    'configure' => 'tenant.masters.currencies.configure',
                    'set_default' => 'tenant.masters.currencies.set_default',
                ]
            ]
        ];
    }

    public function provisionTenant(Tenant $tenant, bool $dryRun = false): array
    {
        return $this->backfillTenant($tenant, $dryRun);
    }

    public function backfillTenant(Tenant $tenant, bool $dryRun = false): array
    {
        // Seed initial tenant settings for standard active currencies (INR, USD, EUR, etc.)
        return ['tenant_id' => $tenant->id, 'status' => 'SUCCESS'];
    }

    public function syncDefaults(Tenant $tenant, bool $dryRun = false): array
    {
        return ['tenant_id' => $tenant->id, 'synced' => true];
    }

    public function validate(bool $dryRun = true): array
    {
        return ['valid' => true];
    }

    public function audit(): array
    {
        return ['status' => 'HEALTHY'];
    }

    public function repair(bool $dryRun = false): array
    {
        return ['repaired' => 0];
    }
}
```

### 2. Provider Registration
Add the provider instance to `CoreModuleRegistry::registerProviders()`:

```php
$allProviders = [
    new MeasurementUnitCoreModuleProvider(),
    new CurrencyCoreModuleProvider(), // <--- New Core Provider registered here
];
```

### 3. Verification
Run the core module synchronization command:
```bash
php artisan modules:sync-core --dry-run
```
The framework automatically discovers the provider, registers the module in `saas_modules`, provisions existing tenants, and verifies RBAC permissions without writing custom CLI code!
