# Georeference Calibration Math Manual

This document details the similarity transformation mathematics used within BhoomiOne to georeference local CAD grids to global coordinates without distorting surveyed elements.

---

## 📐 Mathematically Preserved Scale & Angle

When georeferencing CAD drafts, standard scaling models (like independent X/Y scaling) distort the survey, changing angles and areas.
BhoomiOne implements the **similarity transformation model (conformal coordinate mapping)**. It preserves:
* **True Angular Integrity**: All survey angles remain unchanged.
* **True Shape Proportionality**: Circles remain circles, and squares remain squares.
* **Uniform Scaling**: Scales both axes equally.

---

## 🔢 Transformation Parameters Formula

Let $(x, y)$ be local Cartesian coordinates and $(\lambda, \phi)$ be geodetic decimal longitudes and latitudes.

$$\lambda = A \cdot x - B \cdot y + C_x$$
$$\phi = B \cdot x + A \cdot y + C_y$$

### Solving coefficients $A, B, C_x, C_y$:

Using Anchor 1 $((x_1, y_1) \to (\lambda_1, \phi_1))$ and Anchor 2 $((x_2, y_2) \to (\lambda_2, \phi_2))$:

$$\Delta x = x_1 - x_2, \quad \Delta y = y_1 - y_2$$
$$\Delta \lambda = \lambda_1 - \lambda_2, \quad \Delta \phi = \phi_1 - \phi_2$$
$$D = \Delta x^2 + \Delta y^2$$

If $D = 0$ (singular coordinates layout), calculation terminates with an exception.

$$A = \frac{\Delta \lambda \cdot \Delta x + \Delta \phi \cdot \Delta y}{D}$$
$$B = \frac{\Delta \phi \cdot \Delta x - \Delta \lambda \cdot \Delta y}{D}$$
$$C_x = \lambda_1 - (A \cdot x_1 - B \cdot y_1)$$
$$C_y = \phi_1 - (B \cdot x_1 + A \cdot y_1)$$

These solved coefficients are saved into the `transform_matrix` JSONB column of the `layout_geo_references` table.
