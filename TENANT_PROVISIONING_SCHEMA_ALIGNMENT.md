# BhoomiOne V2 – Tenant Provisioning Schema Alignment

## Objective
The objective of this sprint was to align the `tenants` table schema with the tenant provisioning insertion logic to resolve a database mismatch where columns `infrastructure_tier`, `database_host`, `database_name`, and `database_port` were missing from the database schema despite being inserted during tenant provisioning.

---

## 1. Audited Insert / Provisioning Columns
During our audit of the `Tenant` model, the `TenantProvisioningController` validation, and the `TenantProvisioningService` insertion logic, we identified all columns actively written to the `tenants` table during workspace creation:

| Column Name | Data Type | Nullable | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Unique primary key identifier |
| `tenant_code` | `VARCHAR(100)` | No | N/A | Unique URL-friendly workspace code |
| `company_name` | `VARCHAR(255)` | No | N/A | Human-readable company/tenant name |
| `status` | `VARCHAR(50)` | No | `'PENDING'` | Main routing and availability status |
| `infrastructure_tier` | `VARCHAR(50)` | No | `'SHARED'` | Service tier (SHARED, DEDICATED, ENTERPRISE) |
| `database_host` | `VARCHAR(255)` | Yes | `NULL` | Host address of dedicated database (if applicable) |
| `database_name` | `VARCHAR(255)` | Yes | `NULL` | Database schema name of dedicated database (if applicable) |
| `database_port` | `INTEGER` | Yes | `NULL` | Connection port of dedicated database (if applicable) |

---

## 2. Identified Schema Gaps
The `tenants` table was missing the following 4 columns requested by the provisioning services:
1.  `infrastructure_tier` (Required default: `'SHARED'`)
2.  `database_host` (Nullable)
3.  `database_name` (Nullable)
4.  `database_port` (Nullable)

---

## 3. Implemented Safe, Non-Destructive Schema Migration
To address the gap without recreating the `tenants` table or disrupting any existing tenant metadata or platform data records, we added a safe alter migration:

**File Path:** `/backend-api/database/migrations/2026_06_29_000001_add_infrastructure_and_database_columns_to_tenants_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'infrastructure_tier')) {
                $table->string('infrastructure_tier', 50)->default('SHARED');
            }
            if (!Schema::hasColumn('tenants', 'database_host')) {
                $table->string('database_host', 255)->nullable();
            }
            if (!Schema::hasColumn('tenants', 'database_name')) {
                $table->string('database_name', 255)->nullable();
            }
            if (!Schema::hasColumn('tenants', 'database_port')) {
                $table->integer('database_port')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'infrastructure_tier',
                'database_host',
                'database_name',
                'database_port',
            ]);
        });
    }
};
```

### Safety Features of the Migration:
*   **Idempotent checks (`Schema::hasColumn`):** Ensures that the migration runs without throwing duplicate column errors, even if columns are partially added or modified.
*   **Non-destructive `Schema::table` update:** Does not clear, truncate, or recreate the table, preserving all existing sandbox and production tenant registry records.
*   **Full compatibility with Eloquent model:** Aligns with `$fillable` fields already present in `Tenant.php`.

---

## 4. Verification Results
*   **Tenant Eloquent Model:** Verified that the `Tenant` model in `App\Models\Tenant` correctly includes the newly added columns in its `$fillable` array.
*   **React App Build:** Completed and compiled successfully.
*   **TypeScript / React Linter:** Passed with 0 errors.
