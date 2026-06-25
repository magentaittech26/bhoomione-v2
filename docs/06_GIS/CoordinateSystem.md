# Geodetic Coordinate Systems Standard

This document outlines the coordinate systems, geodetic parameters, and measurement models of the BhoomiOne platform.

---

## 🌎 WGS84 Geodetic Reference Frame

All georeferenced coordinates within BhoomiOne adhere strictly to the **World Geodetic System 1984 (WGS 84)**:
* **EPSG Code**: `EPSG:4326` (WGS 84 / Geographic coordinate systems)
* **Coordinates Unit**: Decimal degrees.
* **Precision Parameters**: Latitudes/longitudes are mapped to seven decimal places (`DECIMAL(10, 7)`), yielding sub-centimeter spatial accuracy:
  $$0.0000001^{\circ} \approx 1.11 \text{ cm at the equator}$$

---

## 📏 Measurement Conversion Standards

* **Standard Unit**: International meters.
* **Imperial Fallbacks**: If localized tenant profiles require imperial feet, Conversions are executed on the React UI layer to keep database records standardized in metric.
* **Area Estimations**: Programmatic area calculations utilize spherical polygon area calculations on projected geodetic vectors to ensure real-world acreage matches surveyors' property deeds.
