# BhoomiOne Geo-Referencing Foundation Report (Phase 2A.1)

This report details the architectural design, mathematical foundation, database schema, service logic, and API endpoints developed to transform BhoomiOne from CAD Coordinate Space into Real-World Geospatial Space.

---

## 1. Executive Summary

BhoomiOne historically operated within local Cartesian 2D grids (CAD drawings) which were relative to arbitrary local anchor points. To achieve professional GIS standards, we have implemented an **Affine/Similarity Coordinate Transformation Layer** that maps local CAD Cartesian coordinates $(x, y)$ onto ellipsoidal global geodetic coordinates $(\text{longitude}, \text{latitude})$ using the WGS84 projection system.

This foundation remains non-intrusive to the existing DXF parser while enabling high-fidelity GIS capabilities, standards-compliant GeoJSON generation, multi-vendor map provider abstraction, and robust SaaS commercial tiering.

---

## 2. Database Schema: `layout_geo_references`

The `layout_geo_references` table persists the anchor points and the solved affine transformation matrix coefficients for each subdivision layout.

### Table Definition SQL
```sql
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
);
```

---

## 3. Mathematical Engine: 2D Conformal Similarity Transformation

The **GeoReferenceService** uses a 2D conformal similarity transformation. This transformation model handles translation, rotation, and uniform scale changes, preserving shapes and angles (critical for surveying and plot dimensions).

### 3.1 Mathematical Formulas

Given two anchor points:
* Anchor 1: DXF $(x_1, y_1)$ $\rightarrow$ Geo $(\lambda_1, \phi_1)$
* Anchor 2: DXF $(x_2, y_2)$ $\rightarrow$ Geo $(\lambda_2, \phi_2)$

Where $\lambda$ represents Longitude and $\phi$ represents Latitude.

#### Step 1: Compute Deltas
$$\Delta x = x_2 - x_1, \quad \Delta y = y_2 - y_1$$
$$\Delta \lambda = \lambda_2 - \lambda_1, \quad \Delta \phi = \phi_2 - \phi_1$$

#### Step 2: Calculate Scale & Rotation Coefficients (A, B)
The coefficients $A$ and $B$ are calculated by solving:
$$A = \frac{\Delta \lambda \cdot \Delta x + \Delta \phi \cdot \Delta y}{\Delta x^2 + \Delta y^2}$$
$$B = \frac{\Delta \phi \cdot \Delta x - \Delta \lambda \cdot \Delta y}{\Delta x^2 + \Delta y^2}$$

#### Step 3: Calculate Translations (Cx, Cy)
Using the resolved coefficients and Anchor 1:
$$C_x = \lambda_1 - (A \cdot x_1 - B \cdot y_1)$$
$$C_y = \phi_1 - (B \cdot x_1 + A \cdot y_1)$$

### 3.2 Coordinate Transformations

#### Forward Mapping: DXF $(x, y)$ to Geo $(\text{Latitude}, \text{Longitude})$
$$\text{Longitude } (\text{lng}) = A \cdot x - B \cdot y + C_x$$
$$\text{Latitude } (\text{lat}) = B \cdot x + A \cdot y + C_y$$

#### Inverse Mapping: Geo $(\text{Latitude}, \text{Longitude})$ to DXF $(x, y)$
Let $M = A^2 + B^2$.
$$x = \frac{A \cdot (\text{lng} - C_x) + B \cdot (\text{lat} - C_y)}{M}$$
$$y = \frac{-B \cdot (\text{lng} - C_x) + A \cdot (\text{lat} - C_y)}{M}$$

---

## 4. API Endpoints

### 4.1 `GET /layouts/{id}/geo-status`
Retrieves layout georeferencing state, active coordinates, and the solved transform matrix.
* **Headers**: `Authorization: Bearer <token>`, `x-tenant-id: <tenant-code>`
* **Status Codes**:
  * `200 OK`: Layout status returned successfully.
  * `403 Forbidden`: Subscription tier has no active `gis_maps` feature.
  * `444 Not Found`: Layout does not exist or access denied.

### 4.2 `POST /layouts/{id}/geo-reference`
Configures or updates layout georeference anchors. Solves and registers the transformation matrix.
* **Payload Format**:
  ```json
  {
    "anchor_1_dxf_x": 12.34,
    "anchor_1_dxf_y": 56.78,
    "anchor_1_lat": 13.08268,
    "anchor_1_lng": 80.27072,
    "anchor_2_dxf_x": 112.34,
    "anchor_2_dxf_y": 156.78,
    "anchor_2_lat": 13.08542,
    "anchor_2_lng": 80.27315
  }
  ```
* **Status Codes**:
  * `200 OK`: Matrix computed and saved.
  * `400 Bad Request`: Validation failure or parallel anchor locations (singular matrix).

### 4.3 `GET /layouts/{id}/geojson`
Exports standard WGS84 GeoJSON features.
* **Format**:
  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": "geom-uuid",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [80.27072, 13.08268],
              [80.27315, 13.08542],
              [80.27512, 13.08412],
              [80.27072, 13.08268]
            ]
          ]
        },
        "properties": {
          "id": "geom-uuid",
          "layer_name": "PARCEL_OUTLINE",
          "layer_type": "PLOT",
          "geometry_type": "LWPOLYLINE"
        }
      }
    ]
  }
  ```

---

## 5. Map Provider Abstraction Layer

The application utilizes a unified interface **`IBhoomiMapInstance`** that abstracts away client-side rendering engines. 

```typescript
export interface IBhoomiMapInstance {
  initialize(config: MapProviderConfig): Promise<void>;
  setCenter(coords: MapCoordinates): void;
  setZoom(zoom: number): void;
  fitBounds(northEast: MapCoordinates, southWest: MapCoordinates): void;
  addLayer(config: MapLayerConfig, data?: any): void;
  removeLayer(layerId: string): void;
  updateLayerVisibility(layerId: string, visible: boolean): void;
  destroy(): void;
}
```

This interface is implemented by modular, isolated adapters:
* **`GoogleMapsAdapter`**: Handles interaction with `@googlemaps/js-api-loader`.
* **`MapLibreAdapter`**: Integrates with `maplibre-gl` for vector tiles.
* **`OpenStreetMapAdapter`**: Controls `leaflet` tiled maps.
* **`MapTilerAdapter`**: Uses `@maptiler/sdk`.

Map initiation is decoupled via `BhoomiMapFactory.createAdapter(provider)`.

---

## 6. SaaS Commercial Enforcement

Access to GIS and Geo-referencing is gated securely at the API router layer using the `gis_maps` feature identifier. 
1. **Subscription Plans**: Starter plans have `feature_gis = false`. Growth, Professional, and Enterprise plans default to `true`.
2. **Add-ons & Overrides**: The system checks explicit overrides in `tenant_feature_overrides` and plan feature records in `subscription_plan_features` before granting access. Non-entitled requests receive an immediate `403 Forbidden` response.
