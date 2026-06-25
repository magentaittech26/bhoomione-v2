# GeoJSON Compilation Specifications

This document outlines the RFC-7946 compliance requirements and polygon closure mathematical rules used when compiling drawing entities into standard GeoJSON coordinates streams.

---

## 📐 GeoJSON Ring Closure Mathematical Requirement

Per the official GeoJSON (RFC-7946) standard, coordinate coordinates representing closed polygon surfaces (linear rings) must contain matching first and last coordinates:

* **Formula**: Let a polygon's vertices array be $V = [v_1, v_2, \dots, v_n]$.
* **Rule**: To construct a valid linear ring, the collection must assert that:
  $$v_1 \equiv v_n$$
* **Compilation Enforcement**: The `GeoReferenceService` in Laravel verifies this boundary match during calculations. If the first and last coordinates do not match, the compiler duplicates the first coordinate, appending it to the end of the array before outputting the GeoJSON object.

---

## 🗄️ Standard Feature Schema

GeoJSON objects compiled by BhoomiOne represent parcel plots as distinct spatial Features:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [103.8213, 1.3521],
        [103.8225, 1.3525],
        [103.8229, 1.3512],
        [103.8213, 1.3521]
      ]
    ]
  },
  "properties": {
    "plot_id": "9a38f38d-0aef-4b47-862c-80ee0e8f8fe3",
    "plot_no": "A-42",
    "area_sqft": 4500.0,
    "status": "AVAILABLE"
  }
}
```
*Note: Geometries are formatted with coordinates in `[Longitude, Latitude]` format.*
