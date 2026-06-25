# Google Maps Platform Integration

This document outlines the design configurations and overlay layers used when displaying dynamic cadastral vector boundaries over high-definition Google Maps aerial views.

---

## 📍 Map Initialization & Setup

* **API Client**: React components load maps asynchronously via the standard `@googlemaps/js-api-loader` library.
* **Map Configurations**:
  * Default View Style: `SATELLITE` or `HYBRID` (combines aerial views with major road naming lines).
  * Gestures Configuration: Multi-touch zoom, single-pointer panning.

---

## 📐 Vector Overlay Projections

Once a layout resolves its similarity matrix, its polygons compile to a GeoJSON data layer. We load these boundaries on the map using:

```javascript
// Example Client-side Data Layer Overlay Loading
map.data.addGeoJson(geoJsonPayload);

map.data.setStyle({
  fillColor: '#10B981',
  strokeColor: '#047857',
  strokeWeight: 2,
  fillOpacity: 0.35
});
```

* **Availability Coloring**: Styling rules apply color accents dynamically based on database plot states:
  * `AVAILABLE`: Soft transparent Emerald green (`#10B981`).
  * `RESERVED`: Soft transparent Amber yellow (`#F59E0B`).
  * `SOLD`: Soft transparent Crimson red (`#EF4444`).
