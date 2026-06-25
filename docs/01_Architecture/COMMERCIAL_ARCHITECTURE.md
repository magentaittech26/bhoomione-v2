# Commercial Architecture & Subscription Enforcement

BhoomiOne integrates a high-fidelity commercial gating engine. This ensures that access to premium technical pipelines (like CAD parsing, SVG generation, and GIS georeferencing) is dynamically tied to the tenant's commercial tier, active add-ons, or explicit admin-granted overrides.

---

## 💰 Commercial Decision Pipeline

```
                     +----------------------------+
                     |  Incoming Resource Request  |
                     |     (e.g., /geojson)       |
                     +----------------------------+
                                   ||
                                   \/
                     +----------------------------+
                     |  SubscriptionFeatureGate   |
                     |    Middleware Intercept    |
                     +----------------------------+
                                   ||
                                   \/
                     +----------------------------+
                     |   1. Active Overrides?     | === (YES) ===> [PERMIT ACCESS]
                     +----------------------------+
                                   || (NO)
                                   \/
                     +----------------------------+
                     |  2. Plan Catalog Support?  | === (YES) ===> [PERMIT ACCESS]
                     +----------------------------+
                                   || (NO)
                                   \/
                     +----------------------------+
                     | 3. Active Feature Add-on?  | === (YES) ===> [PERMIT ACCESS]
                     +----------------------------+
                                   || (NO)
                                   \/
                     +----------------------------+
                     |   Access Blocked (403)     |
                     |  FEATURE_NOT_AVAILABLE     |
                     +----------------------------+
```

---

## ⚙️ Core Subscription Plans Matrix

The platform supports three standard subscription tiers:

1. **Starter**: Core projects, basic tabular listings, manual plot updates. (No CAD upload or GIS map support).
2. **Growth**: Unlocks multi-stage DXF uploads, custom layer mapping studio, dynamic SVG rendering, and auto-plot boundaries division algorithms.
3. **Enterprise**: Unlocks high-precision global georeferencing, satellite imagery overlays, custom map provider selections (Google, MapLibre), and custom domain configurations.

---

## 🔒 Subscription Enforcement Middleware

Access is strictly enforced on the server-side via `SubscriptionFeatureGate` middleware inside Laravel:

```php
Route::middleware([\App\Http\Middleware\SubscriptionFeatureGate::class . ':gis_maps'])->group(function () {
    Route::get('/layouts/{id}/geojson', [LayoutGeoController::class, 'geoJson']);
});
```

* **Access Granting**:
  * If the active tenant workspace has the plan configured, access is granted.
  * If the tenant has purchased the specific standalone add-on, access is granted.
  * If an explicit override `gis_maps = ENABLED` is recorded, access is granted.
* **Access Denied**:
  * If no matches are found, the middleware returns `403 FEATURE_NOT_AVAILABLE` with structured upgrade prompts.
