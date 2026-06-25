# Project Vision

## 1. Platform Philosophy
BhoomiOne transforms raw surveyor drawings into direct, transactable assets. Historically, real estate land subdivision occurred across disconnected physical stages: 
* Surveyors drafted DXF CAD documents on local Cartesian planes.
* Sales departments manually managed Excel sheets tracking availability.
* Management struggled to evaluate real-time sales progress.
* Buyers lacked visual context when selecting plots.

BhoomiOne bridges these silos into a singular unified SaaS workspace. It provides surveyors with automatic cad boundary imports, calculates precise pricing for sales representatives, renders interactive maps for buyers, and gives administrators complete SaaS plan telemetry.

---

## 2. Customer & User Segments

### 2.1 Land Developers & Promoters
* **Core Pain Point**: Slow sales pipelines and manual plot availability coordination.
* **BhoomiOne Solution**: Instant plot catalogs parsed directly from CAD, dynamic price sheets, real-time booking engines, and interactive customer portals.

### 2.2 Surveyors & Civil Engineers
* **Core Pain Point**: Georeferencing drafts on national grids and dealing with scaling distortions.
* **BhoomiOne Solution**: Programmatic 2D conformal similarity matrices projecting arbitrary drawing planes onto geodetic longitudes and latitudes.

### 2.3 Sales Representatives & Brokers
* **Core Pain Point**: Double-bookings of high-value plots and delayed customer document collections.
* **BhoomiOne Solution**: Live availability status panels, instant payment receipts recording, and transactional logs.

---

## 3. Core Milestones & Scale Metrics

```
+-----------------------------------+
|  1. CAD & SVG Extraction Engine    | ---> COMPLETE (Sprint 3)
+-----------------------------------+
                  ||
                  \/
+-----------------------------------+
|  2. Multi-Tenant Billing Lifecycle| ---> COMPLETE (Phase 1F)
+-----------------------------------+
                  ||
                  \/
+-----------------------------------+
|  3. Real-World GIS Coordinate Port| ---> COMPLETE (Phase 2A.2)
+-----------------------------------+
                  ||
                  \/
+-----------------------------------+
|  4. Public Marketplace & Bookings  | ---> IN DEVELOPMENT
+-----------------------------------+
```

* **Target Speed**: CAD-to-SVG compilation in under 3.5 seconds.
* **Geospatial Precision**: Similitude calculations precision within $\le 10^{-12}$ decimal degrees.
* **Multi-tenant Security**: Absolute zero cross-tenant database leakage via strict middleware queries interceptors.
