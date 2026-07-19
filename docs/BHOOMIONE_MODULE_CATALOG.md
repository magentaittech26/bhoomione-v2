# BhoomiOne Module Catalog

This catalog outlines the formal list of licensed SaaS modules registered in the BhoomiOne platform. Each module can be sold, enabled, disabled, upgraded, or restricted independently.

---

## 1. Boundary Engine Module
* **Module ID**: `mod-boundary`
* **Entitlement Key**: `maps.boundary`
* **Module Group**: `core`
* **Dependency**: `maps.workspace`
* **Description**: Coordinates primary master-layout perimeter drawing, land acreage calculations, and acts as the structural container for all layout objects.
* **Capabilities**:
  * Perimeter polyline construction
  * Real-time boundary area metrics
  * Primary containment validation bounds

---

## 2. Road Engine Module
* **Module ID**: `mod-roads`
* **Entitlement Key**: `maps.roads`
* **Module Group**: `spatial`
* **Dependency**: `maps.workspace`
* **Description**: Translates polylines into real-world double-sided carriageway polygons, aligning road widths, calculate frontage lengths, and mapping directional bearings.
* **Capabilities**:
  * Carriageway buffer generation
  * Proximity snapping & intersection alignment
  * Directional bearing parsing (e.g., North-South, East-West)

---

## 3. Park Engine Module
* **Module ID**: `mod-parks`
* **Entitlement Key**: `maps.parks`
* **Module Group**: `spatial`
* **Dependency**: `maps.workspace`
* **Description**: Spatial management of green zones, community parks, open spaces, and ecological buffer segments.
* **Capabilities**:
  * Closed green park drawing
  * Perimeter calculation
  * Overlap validation against roads, utility corridors, and plots

---

## 4. Amenity Engine Module
* **Module ID**: `mod-amenities`
* **Entitlement Key**: `maps.amenities`
* **Module Group**: `spatial`
* **Dependency**: `maps.workspace`
* **Description**: Handles municipal and structural facility objects such as electrical sub-stations, community halls, playgrounds, and medical dispensaries. Supports both Point and Polygon geometry nodes.
* **Capabilities**:
  * Point/Polygon drawing selection
  * Proximity validation (requires road frontage/access)
  * Duplicate facility naming verification

---

## 5. Utility Network Engine Module
* **Module ID**: `mod-utilities`
* **Entitlement Key**: `maps.utilities`
* **Module Group**: `utilities`
* **Dependency**: `maps.workspace`
* **Description**: Engineering layout tool for water supply systems, sewer network pipelines, overhead water lines, raw water connections, and underground water mains.
* **Capabilities**:
  * Network flow directional lines
  * Pipe diameter and engineering material attribute management
  * Utility-to-amenity overlap and collision safety checking

---

## 6. Plots Engine Module
* **Module ID**: `mod-plots`
* **Entitlement Key**: `maps.plots`
* **Module Group**: `spatial`
* **Dependency**: `maps.workspace`
* **Description**: Manages residential, commercial, and industrial subdivision plot layouts, automatic plot numbering, facing calculation, and zoning parameters.
* **Capabilities**:
  * Auto-incrementing plot naming sequence
  * Boundary road-frontage facing calculations (e.g., East-Facing plot)
  * Corners classification (e.g., North-West Corner Plot)
