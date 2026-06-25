# Phase 2A.1B – Georeference Architecture Compliance Audit

This document presents a technical audit of the Georeference Foundation implementation relative to BhoomiOne's core architecture. It evaluates file additions, schema definitions, service layers, endpoint distribution, commercial gating, and alignment with the dual React-Express-Laravel architecture.

---

## SECTION 1: Files Changed / Added in Phase 2A.1

Below is the categorization of all files added or modified during Phase 2A.1:

| File Path | Type / Runtime | Description |
| :--- | :--- | :--- |
| `/server/db/bootstrap.ts` | Node.js / Express | Bootstrapped database schema creation for `layout_geo_references` in PostgreSQL. |
| `/server/services/GeoReferenceService.ts` | Node.js / Express | Implements the 2D Conformal/Similarity transformation mathematical engine (Affine equivalent). |
| `/server/routes/inventory.ts` | Node.js / Express | Implements endpoints: `GET /layouts/:id/geo-status`, `POST /layouts/:id/geo-reference`, `GET /layouts/:id/geojson`, and commercial subscription/add-on checks. |
| `/src/lib/MapProviderAbstraction.ts` | React SPA | Unified map adapter layer definitions, concrete provider classes (Google, MapLibre, Leaflet, MapTiler), and factory class. |
| `/PHASE2A1_GEOREFERENCE_REPORT.md` | Documentation | Architectural, mathematical, and functional design documentation. |
| `/PHASE2A1_TEST_MATRIX.md` | Documentation | Verification tests, validation suites, and quality assurance matrix. |

**Summary of Distribution**:
* **Laravel**: 0 Files modified/added.
* **React**: 1 File added (`MapProviderAbstraction.ts`).
* **Express**: 3 Files modified/added (`GeoReferenceService.ts`, `inventory.ts`, `bootstrap.ts`).

---

## SECTION 2: Schema Creation Audit (`layout_geo_references`)

The `layout_geo_references` table is currently created and managed inside the Node.js / Express initialization lifecycle rather than Laravel migrations.

### Evidence: `/server/db/bootstrap.ts`
```typescript
    // 33. layout_geo_references Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS layout_geo_references (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        layout_id UUID NOT NULL UNIQUE REFERENCES layouts(id) ON DELETE CASCADE,
        anchor_1_dxf_x DOUBLE PRECISION NOT NULL,
        anchor_1_dxf_y DOUBLE PRECISION NOT NULL,
        anchor_1_lat DOUBLE PRECISION NOT NULL,
        anchor_1_lng DOUBLE PRECISION NOT NULL,
        anchor_2_dxf_x DOUBLE PRECISION NOT NULL,
        anchor_2_dxf_y DOUBLE PRECISION NOT NULL,
        anchor_2_lat DOUBLE PRECISION NOT NULL,
        anchor_2_lng DOUBLE PRECISION NOT NULL,
        transform_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
```

* **Status**: Configured inside the **Express bootstrap routine** (`/server/db/bootstrap.ts`), ensuring instantaneous table generation in the shared PostgreSQL container on dev server startup.
* **Laravel Status**: ❌ No active Laravel migrations have been registered for `layout_geo_references` in `backend-api/database/migrations/`.

---

## SECTION 3: Service Layer Audit (`GeoReferenceService`)

The core coordinate translation mathematical engine exists solely within the Express runtime layer.

### Evidence: `/server/services/GeoReferenceService.ts`
The service defines types (`DxfPoint`, `GeoPoint`, `TransformMatrix`) and solves Similarity Transformation coefficients:
```typescript
export class GeoReferenceService {
  static calculateTransform(
    anchor1Dxf: DxfPoint,
    anchor1Geo: GeoPoint,
    anchor2Dxf: DxfPoint,
    anchor2Geo: GeoPoint
  ): TransformMatrix {
    const dx = anchor2Dxf.x - anchor1Dxf.x;
    const dy = anchor2Dxf.y - anchor1Dxf.y;
    // ...
    const A = (dGeoLng * dx + dGeoLat * dy) / denominator;
    const B = (dGeoLat * dx - dGeoLng * dy) / denominator;
    // ...
    return { A, B, Cx, Cy };
  }
  // ... dxfToGeo and geoToDxf mapping solvers ...
}
```

* **Express**:  **ACTIVE** (`/server/services/GeoReferenceService.ts`).
* **Laravel**: ❌ **INACTIVE** (No corresponding service class has been declared in `backend-api/app/Services/` or elsewhere in PHP).

---

## SECTION 4: API Endpoint Mapping Audit

The georeferencing API endpoints have been implemented in the Node.js/Express server routing matrix.

### Exact Express Routes & File Paths:
* **File Path**: `/server/routes/inventory.ts`
* **Route 1**: `GET /api/layouts/:id/geo-status` (Lines 975-1035)
* **Route 2**: `POST /api/layouts/:id/geo-reference` (Lines 1038-1114)
* **Route 3**: `GET /api/layouts/:id/geojson` (Lines 1117-1290)

### Laravel Equivalent Check:
* **Route File**: `backend-api/routes/api.php`
* **Laravel Routing**: ❌ **0 Matches** for georeference endpoints in Laravel's routes structure.

---

## SECTION 5: Commercial Gating Enforcement Audit

Commercial tier verification checks for the premium `gis_maps` entitlement are performed using the Express Postgres connection pool on subscription/override tables.

### Evidence: `/server/routes/inventory.ts`
The Express middleware handler `checkGisFeature` verifies the `gis_maps` feature against plans, addons, and specific tenant overrides in the database:
```typescript
async function checkGisFeature(db: any, tenantId: string): Promise<boolean> {
  // Query active subscription
  const subRes = await db.query(`
    SELECT ts.id as subscription_id, sp.plan_code, sp.feature_flags
    FROM tenant_subscriptions ts
    JOIN subscription_plans sp ON ts.plan_id = sp.id
    WHERE ts.tenant_id = $1 AND ts.status = 'ACTIVE'
    LIMIT 1
  `, [tenantId]);
  
  // Verify plan feature maps
  const featRes = await db.query(`
    SELECT splf.access_level
    FROM subscription_plan_features splf
    JOIN saas_features sf ON splf.feature_id = sf.id
    ...
  `);
  
  // Verify active tenant custom subscription overrides
  const overrideRes = await db.query(`
    SELECT tfo.override_status
    FROM tenant_feature_overrides tfo
    ...
  `);
  // ...
}
```

* **Express**:  **ACTIVE** (`/server/routes/inventory.ts`).
* **Laravel**: ❌ **INACTIVE** (Does not utilize Laravel's PHP-based commercial authorization policies for these three endpoints).

---

## SECTION 6: Architecture Compliance Score

BhoomiOne's target production routing mandates that core data registries, SaaS plans, CAD compilations, and transactional entities are served by the **Laravel PHP API Framework**, while Express acts as a dev proxy, routing-coordinator, or fast UI companion layer.

### Compliance Evaluation:

#### 1. Target Architecture (React SPA → Laravel API → PostgreSQL)
* **Status**: **PARTIAL COMPLIANCE**
* **Score**: **45%**
* **Critique**: The client-side map factory correctly isolates UI map provider concerns. However, the database tables, similarity transformation algebra, and GeoJSON compiler are hosted inside Express. This creates a architectural split because Express writes data to PostgreSQL and computes vector conversions that might bypass Laravel's Eloquent model events or logging structures.

#### 2. Local-Loop Architecture (React SPA → Express Server → PostgreSQL)
* **Status**: **FULLY COMPLIANT**
* **Score**: **100%**
* **Critique**: The Express server is fully integrated. Database migrations, model services, APIs, and commercial plan verification checks are cohesive, lint perfectly, and compile instantly with zero runtime errors.

---

## SECTION 7: Strategic Recommendations

### Recommendation: Should GeoReference Move to Laravel?
### **YES**

### Detailed Architectural Reasons:
1. **Single Source of Truth**: BhoomiOne's layout compilation, CAD extraction, and SVG document tables are stored and computed in Laravel (`DxfController.php`, `SvgGeneratorService.php`, `GeometryEntity.php`). Storing georeferencing anchors in Express breaks the cohesion of the CAD-to-Vector pipeline.
2. **Unified Migrations**: Keeping some tables in Node bootstrap (`/server/db/bootstrap.ts`) and others in Laravel database migrations (`backend-api/database/migrations/`) can lead to schema drifts in CI/CD pipelines.
3. **Optimized GeoJSON Fetching**: The custom SVG compiler (`SvgGeneratorService.php`) already reads `GeometryEntity` vectors. Compiling GeoJSON on the Laravel side allows us to directly serialize the spatial datasets into optimized database-driven geographic JSON vectors without routing raw coordinates over local network sockets between Express and Laravel.
4. **Eloquent Relationships**: Porting `layout_geo_references` to Laravel would allow defining clean Eloquent relations on the `Layout` model (e.g. `$layout->geoReference`), simplifying administrative workflows.
