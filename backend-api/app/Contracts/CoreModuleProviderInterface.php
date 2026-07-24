<?php

namespace App\Contracts;

use App\Models\Tenant;

interface CoreModuleProviderInterface
{
    /**
     * Unique module registration code (e.g. 'core.mdm.measurement_units').
     */
    public function getModuleCode(): string;

    /**
     * Module metadata specification for registry registration & RBAC generation.
     */
    public function getModuleMetadata(): array;

    /**
     * Provision tenant with default settings and system records.
     */
    public function provisionTenant(Tenant $tenant, bool $dryRun = false): array;

    /**
     * Backfill tenant configuration for existing tenants.
     */
    public function backfillTenant(Tenant $tenant, bool $dryRun = false): array;

    /**
     * Synchronize system defaults for tenant.
     */
    public function syncDefaults(Tenant $tenant, bool $dryRun = false): array;

    /**
     * Validate data integrity and schema compliance for module.
     */
    public function validate(bool $dryRun = true): array;

    /**
     * Audit module distribution, orphan records, and configuration health.
     */
    public function audit(): array;

    /**
     * Repair data inconsistencies or missing settings.
     */
    public function repair(bool $dryRun = false): array;
}
