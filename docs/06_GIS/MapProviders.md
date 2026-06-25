# Map Providers Abstraction Layer

BhoomiOne decouples map rendering components from vendor-specific dependencies, allowing tenants to switch providers dynamically based on subscription tiers or geographic region requirements.

---

## 🎨 Map Providers Abstraction Model

The system utilizes a custom React factory model (`MapProviderAbstraction`) to wrap underlying map libraries:

```
                  +--------------------------------+
                  |     MapProviderAbstraction     |
                  |     (Unified React Canvas)     |
                  +--------------------------------+
                                  ||
                  +---------------+---------------+
                  |                               |
                  \/                              \/
       +--------------------+            +--------------------+
       | GoogleMapsAdapter  |            |  MapLibreAdapter   |
       | (Premium Satellites)            |  (OpenStreetMap)   |
       +--------------------+            +--------------------+
```

---

## 📋 Vendor Implementations Directory

1. **`GoogleMapsAdapter`**: Loaded dynamically via `@googlemaps/js-api-loader`. Selected for high-definition aerial imagery and global mapping accuracy.
2. **`MapLibreAdapter` / `MapTilerAdapter`**: Loaded using vector webGL tiles. Selected by default for region-specific map overlays, providing cost-effective vectors tracking.
3. **`LeafletAdapter`**: Fallback raster map canvas used on low-tier mobile devices to preserve graphics memory resources.
