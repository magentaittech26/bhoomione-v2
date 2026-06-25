# GIS & Georeference Architecture

BhoomiOne bridges Cartesian CAD vectors with real-world geodetic coordinate grids. This allows developers to overlay surveyors' structural layouts directly onto interactive maps without geographic distortion.

---

## 🌐 Coordinate Alignment Model

Raw CAD drawings utilize a local Cartesian grid $(x, y)$ mapped from an arbitrary local origin $(0,0)$. 
To project these elements on the spherical earth, BhoomiOne applies a **2D Conformal/Similarity Transformation (Affine Similitude Model)**.

This model preserves angular relationships and distances (up to a scaling factor), preventing distortion of surveyed plots.

```
       Local CAD Cartesian Grid                         Geodetic Spherical Grid
               (X, Y)                                        (Lng, Lat)
               
        +-------------------+                        +-------------------+
        |  P(150, 300)      |    Similarity Matrix   |  P'(-122.4, 37.7) |
        |                   |   ===================> |                   |
        |      A1(0,0)      |                        |     A1'(Lng,Lat)  |
        +-------------------+                        +-------------------+
```

---

## 📐 Affine Mathematical Formulas

The similarity transformation uses four parameters:
* $A$: Rotation/Scaling coefficient
* $B$: Rotation/Scaling coefficient
* $C_x$: Translation factor along the East-West axis (Longitude translation)
* $C_y$: Translation factor along the North-South axis (Latitude translation)

Using two non-collinear anchor points calibrated by a surveyor:
$$\text{Anchor 1 local: } (x_1, y_1) \implies \text{Anchor 1 geodetic: } (\lambda_1, \phi_1)$$
$$\text{Anchor 2 local: } (x_2, y_2) \implies \text{Anchor 2 geodetic: } (\lambda_2, \phi_2)$$

### Solving the Coefficients:
Let:
$$\Delta x = x_1 - x_2, \quad \Delta y = y_1 - y_2$$
$$\Delta \lambda = \lambda_1 - \lambda_2, \quad \Delta \phi = \phi_1 - \phi_2$$
$$D = \Delta x^2 + \Delta y^2$$

If $D = 0$ (collinear or singular anchor points), coordinates calibration fails to prevent division-by-zero errors.

The scaling/rotation parameters are resolved as:
$$A = \frac{\Delta \lambda \cdot \Delta x + \Delta \phi \cdot \Delta y}{D}$$
$$B = \frac{\Delta \phi \cdot \Delta x - \Delta \lambda \cdot \Delta y}{D}$$

The translation parameters are resolved as:
$$C_x = \lambda_1 - (A \cdot x_1 - B \cdot y_1)$$
$$C_y = \phi_1 - (B \cdot x_1 + A \cdot y_1)$$

---

## 🗄️ Spatial GeoJSON Compilation Pipeline

Once calibrated, any Cartesian coordinate point $(x, y)$ transforms to geodetic WGS84 point $(\lambda, \phi)$ via:
$$\lambda = A \cdot x - B \cdot y + C_x$$
$$\phi = B \cdot x + A \cdot y + C_y$$

The `GeoReferenceService` in Laravel executes these math operations, compiles all layout geometric elements, and packages them into a valid WGS84 GeoJSON `FeatureCollection` payload:

```json
{
  "type": "FeatureCollection",
  "features": [
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
        "layer_type": "PLOT_RESIDENTIAL"
      }
    }
  ]
}
```
*Note: The first and last coordinates of a projected polygon boundary ring must match exactly to ensure proper GeoJSON linear ring closures.*
