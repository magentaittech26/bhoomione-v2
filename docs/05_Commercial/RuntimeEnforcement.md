# Runtime Subscription Enforcement

This document specifies how subscription gating is enforced at runtime across the network, server, and client boundaries.

---

## 🔒 Server-Side Gating Intercepts

The `SubscriptionFeatureGate` middleware inside Laravel blocks unentitled requests before they can query database controllers:

```php
// Route mapping gated by feature flag
Route::middleware([\App\Http\Middleware\SubscriptionFeatureGate::class . ':gis_maps'])->group(function () {
    Route::get('/layouts/{id}/geojson', [LayoutGeoController::class, 'geoJson']);
});
```

* If evaluation returns unauthorized, the middleware returns HTTP `403 FEATURE_NOT_AVAILABLE` with structured upgrade prompts.

---

## ⚛️ Client-Side Visibility Toggling

The React SPA utilizes subscription state context to prevent visual clutter and guide upgrade prompts:

* **Conditional Menus Rendering**: Component arrays inspect features list and toggle accessibility of premium menus (e.g. Georeferencing calibrator button is grayed out or replaced with an upgrade banner if `gis_maps` is missing).
* **Graceful Degradation**: If an API request fails with a `403 FEATURE_NOT_AVAILABLE` code, the client-side API layer catches the error and pops open a pricing overlay window instead of crashing.
