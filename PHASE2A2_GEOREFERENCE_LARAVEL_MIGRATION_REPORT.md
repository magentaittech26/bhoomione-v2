# BhoomiOne Geo-Referencing Laravel Migration Report (Phase 2A.2)

This report documents the architectural migration of the GeoReference Foundation from the Express.js server into the target Laravel API backend.

---

## 1. Executive Summary

In alignment with BhoomiOne's production target architecture (**React SPA → Laravel API → PostgreSQL**), we have migrated the mathematical coordinate transformation engine, database schema definitions, API routing, and SaaS commercial gating logic for layout georeferencing into Laravel.

The Express.js endpoints have been marked as deprecated. The frontend API client has been updated to route all georeferencing requests to the corresponding Laravel API routes. Commercial gating is now fully driven by the `SubscriptionEnforcementEngine` in Laravel with the `gis_maps` feature identifier.

---

## 2. File Operations Matrix

The following table summarizes the files changed, added, or deprecated in Phase 2A.2:

| File Path | Operations | Runtime | Description |
| :--- | :--- | :--- | :--- |
| `/backend-api/database/migrations/2026_06_25_000001_create_layout_geo_references_table.php` | **Added** | Laravel | Database schema migration for `layout_geo_references`. |
| `/backend-api/app/Models/LayoutGeoReference.php` | **Added** | Laravel | Eloquent Model for georeference details. |
| `/backend-api/app/Models/Layout.php` | **Modified** | Laravel | Appended the `geoReference()` relationship to the Layout model. |
| `/backend-api/app/Services/GeoReferenceService.php` | **Added** | Laravel | Port of Similarity/Conformal Coordinate transformation mathematical algorithms and spatial GeoJSON compiler. |
| `/backend-api/app/Http/Controllers/Api/v1/LayoutGeoController.php` | **Added** | Laravel | Tenant-scoped API controller exposing geo-status, geo-referencing, and GeoJSON endpoints. |
| `/backend-api/routes/api.php` | **Modified** | Laravel | Added georeferencing route mapping under the `gis_maps` subscription feature gate. |
| `/server/routes/inventory.ts` | **Modified** | Express | Appended deprecation comments to legacy Node georeferencing routes. |
| `/src/lib/api.ts` | **Modified** | React SPA | Configured React API client methods to point to Laravel endpoints. |

---

## 3. Database Schema Migration

The Laravel migration defines the `layout_geo_references` table using high-precision decimals to prevent float rounding errors during coordinate transforms.

### Migration Definition: `/backend-api/database/migrations/2026_06_25_000001_create_layout_geo_references_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('layout_geo_references')) {
            Schema::create('layout_geo_references', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id')->nullable()->index();
                $table->uuid('layout_id')->unique()->index();

                $table->decimal('anchor_1_dxf_x', 24, 10);
                $table->decimal('anchor_1_dxf_y', 24, 10);
                $table->decimal('anchor_1_lat', 10, 7);
                $table->decimal('anchor_1_lng', 10, 7);

                $table->decimal('anchor_2_dxf_x', 24, 10);
                $table->decimal('anchor_2_dxf_y', 24, 10);
                $table->decimal('anchor_2_lat', 10, 7);
                $table->decimal('anchor_2_lng', 10, 7);

                $table->jsonb('transform_matrix')->nullable();

                $table->timestamps();

                $table->foreign('layout_id')->references('id')->on('layouts')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('layout_geo_references');
    }
};
```

---

## 4. Models and Relationships

The `LayoutGeoReference` Eloquent model represents the calibration dataset and solved affine transform matrix.

### Model: `/backend-api/app/Models/LayoutGeoReference.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LayoutGeoReference extends Model
{
    protected $table = 'layout_geo_references';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'tenant_id', 'layout_id',
        'anchor_1_dxf_x', 'anchor_1_dxf_y', 'anchor_1_lat', 'anchor_1_lng',
        'anchor_2_dxf_x', 'anchor_2_dxf_y', 'anchor_2_lat', 'anchor_2_lng',
        'transform_matrix',
    ];

    protected $casts = [
        'anchor_1_dxf_x' => 'float', 'anchor_1_dxf_y' => 'float',
        'anchor_1_lat' => 'float', 'anchor_1_lng' => 'float',
        'anchor_2_dxf_x' => 'float', 'anchor_2_dxf_y' => 'float',
        'anchor_2_lat' => 'float', 'anchor_2_lng' => 'float',
        'transform_matrix' => 'array',
    ];

    public function layout(): BelongsTo
    {
        return $this->belongsTo(Layout::class, 'layout_id');
    }
}
```

---

## 5. Mathematical & Coordinate Service

`GeoReferenceService` implements the 2D Conformal/Similarity transformation model. This handles rotation, scaling, and translation without distorting surveyed layouts.

### Formulas & Math:
Let $x, y$ be local Cartesian DXF coordinates and $\lambda, \phi$ be real-world longitude and latitude:
$$\lambda = A \cdot x - B \cdot y + C_x$$
$$\phi = B \cdot x + A \cdot y + C_y$$

Using the compiled parameters, the service accurately maps DXF coordinates to geodetic WGS84 coordinates.

---

## 6. Laravel Endpoints & Routing

Endpoints are mapped inside `backend-api/routes/api.php` under the `gis_maps` commercial subscription feature gate.

### Routing Configuration
```php
Route::middleware([\App\Http\Middleware\SubscriptionFeatureGate::class . ':gis_maps'])->group(function () {
    Route::get('/layouts/{id}/geo-status', [LayoutGeoController::class, 'geoStatus'])->middleware([PermissionRequirementMiddleware::class . ':layouts.view']);
    Route::post('/layouts/{id}/geo-reference', [LayoutGeoController::class, 'geoReference'])->middleware([PermissionRequirementMiddleware::class . ':layouts.manage']);
    Route::get('/layouts/{id}/geojson', [LayoutGeoController::class, 'geoJson'])->middleware([PermissionRequirementMiddleware::class . ':layouts.view']);
});
```

---

## 7. SaaS Commercial Gating Enforcement

Access to the georeferencing suite is dynamically restricted using Laravel middleware:
* **Feature code**: `gis_maps`
* **Access Checks**: Queries plan configuration, add-ons, and workspace feature overrides.
* **Return Code**: Returns `403 FEATURE_NOT_AVAILABLE` when the workspace is not entitled.

---

## 8. Rollback and Disaster Recovery Notes

If a production rollback is required:
1. **Database Rollback**:
   Run Laravel rollback commands to safely remove the `layout_geo_references` table:
   ```bash
   php artisan migrate:rollback --step=1
   ```
2. **Nginx/Routing Reversion**:
   The Express routing remains fully functional (marked as deprecated but untouched). To revert, simply swap the API client base endpoints back to Express paths inside `/src/lib/api.ts`.
