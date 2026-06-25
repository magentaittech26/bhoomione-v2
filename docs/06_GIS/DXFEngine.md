# DXF Parsing & Geometry Extraction Pipeline

This document outlines the three-stage CAD parsing engine used within BhoomiOne to convert raw drawings into lightweight web vectors.

---

## 🏗️ The Three-Stage Parsing Pipeline

```
  +------------------+     1. Raw Text Scan     +-------------------------+
  |  Raw DXF Upload  | =======================> |  Group Codes & Values   |
  +------------------+                          +-------------------------+
                                                             ||
                                                    2. Geometries Scan
                                                             ||
                                                             \/
  +------------------+     3. Relational Bind   +-------------------------+
  |  Render SVG UI   | <======================= |   geometry_entities DB  |
  +------------------+                          +-------------------------+
```

### Stage 1: Group Codes Parsing
The DXF file format stores data in repetitive "group code" and "value" text lines. The platform scans this format, parses coordinate strings into structured JavaScript objects, and organizes elements by CAD drawing layers.

### Stage 2: Geometric Entity Scanner
The parser extracts specific geometric boundaries:
* **`LWPOLYLINE` / `POLYLINE`**: Extracted as arrays of 2D Cartesian vertices $[x, y]$ used to plot boundaries.
* **`CIRCLE`**: Extracted as center point coordinate $(x_c, y_c)$ and radial unit value, mapped to SVG circle paths.
* **`TEXT` / `MTEXT`**: Scanned to extract numeric parcel plot numbers and text values.

### Stage 3: Dynamic SVG Document Builder
The parsed entities map directly to standard XML elements to render on-screen:
* Polylines map to SVG `<polyline>` or closed `<path d="M...Z">` shapes.
* Circle entities map to SVG `<circle>` vectors.
* Layers are mapped inside grouped SVG elements (`<g id="layer_name">`), allowing quick canvas visibility toggling.
