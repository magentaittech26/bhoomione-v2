# Database Architecture

BhoomiOne utilizes PostgreSQL as its singular, high-performance transactional database. This document specifies the database parameters, key systems, index strategies, and data preservation models.

---

## 🔑 Database Key Strategies

### 1. Universally Unique Identifiers (UUID)
To facilitate seamless multi-tenant database migrations and prevent enumerative scraping attacks, all tables utilize UUID v4 primary keys.
* **Database Driver**: `gen_random_uuid()` is configured directly within table migrations.
* **Foreign Keys**: Linked using strict Cascade Delete rules to prevent database row corruption when deleting layout structures.

### 2. High-Precision Coordinate Decimals
For geographic coordinate parameters (local drawing and geodetic coordinates), floating-point variables are rejected to prevent rounding errors. Instead, high-precision decimals are standard:
* **CAD coordinate Cartesian floats**: `DECIMAL(24, 10)` (Allows precision down to microscopic fractions of drawing units).
* **Geodetic Latitudes/Longitudes**: `DECIMAL(10, 7)` / `DECIMAL(10, 7)` (Allows sub-centimeter accuracy anywhere on the globe).

---

## ⚡ Indexing Configurations

To optimize multi-tenant query speeds, database indexes are constructed on frequently joined attributes:

```sql
-- Dynamic Workspace Isolation Indexing
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_layouts_tenant_id ON layout_geo_references(tenant_id);

-- Layout Coordinate Queries Indexing
CREATE UNIQUE INDEX IF NOT EXISTS idx_layout_geo_layout_id ON layout_geo_references(layout_id);
```

---

## 📊 Database JSONB Structures

Complex geometry coordinate arrays (vertices and coordinates groupings) are stored directly inside PostgreSQL using binary JSON (`jsonb`). This model:
* Allows storage of complex cad drawings data without needing postGIS dependencies on minimal hosting models.
* Optimizes JSON retrieval times, converting raw coordinates arrays directly to GeoJSON in milliseconds.
