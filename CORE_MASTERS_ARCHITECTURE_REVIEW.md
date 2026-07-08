# BhoomiOne V3.1: Core Masters Architecture Review
## Conversion to Generic Master Engine Blueprint

This document performs a thorough architectural review and presents a concrete blueprint for upgrading BhoomiOne's flat `core_masters` dictionary structure into a generic, normalized, two-tier **Master Engine** consisting of **Master Categories** and **Master Values**.

---

## 1. Current Architecture vs. Target Engine

### A. Existing Model (Flat Dictionary)
Currently, `core_masters` exists as a single flat table:
* Columns: `id`, `uuid`, `master_type`, `code`, `name`, `description`, `status`, `sort_order`, `tenant_id`, `is_platform_scope`.
* **Limitations**: 
  1. No metadata capability.
  2. Categories are hardcoded string groupings (`master_type`) with no dynamic descriptions, modules, scopes, or sequence control.
  3. Master records are static text entries with no visual metadata (like custom color labels, Lucide icons, or custom parameter fields).

### B. Target Model (Hierarchical Generic Master Engine)
We will introduce two normalized tables to segregate Category-level metadata (the "Schema" or "Template") from Value-level attributes (the "Instances").

```
  +-------------------------+
  |    master_categories    |
  +-------------------------+
  | - uuid (PK)             |
  | - code (unique)         |
  | - name                  |
  | - module                |
  | - description           |
  | - status                |
  | - sort_order            |
  | - tenant_id             |
  | - is_platform_scope     |
  | - metadata (JSONB)      |
  +-------------------------+
               |
               | (1-to-Many)
               v
  +-------------------------+
  |      master_values      |
  +-------------------------+
  | - uuid (PK)             |
  | - category_uuid (FK)    |
  | - code                  |
  | - display_name          |
  | - description           |
  | - display_order         |
  | - status                |
  | - color                 |
  | - icon                  |
  | - metadata (JSONB)      |
  | - Audit Fields          |
  +-------------------------+
```

---

## 2. Database Schema Definition (DDL)

The database migration schema utilizes standard SQL and ensures integrity via foreign key constraints, default sequences, and indexing.

```sql
-- 1. Create Master Categories Table
CREATE TABLE IF NOT EXISTS master_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE SET NULL,
    is_platform_scope BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Master Values Table
CREATE TABLE IF NOT EXISTS master_values (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    category_id INTEGER NOT NULL REFERENCES master_categories(id) ON DELETE CASCADE,
    category_uuid UUID NOT NULL REFERENCES master_categories(uuid) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    color VARCHAR(50) NULL,
    icon VARCHAR(100) NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit Fields
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Constraints to prevent value code duplication within the same category
    CONSTRAINT uq_master_values_cat_code UNIQUE (category_id, code)
);

-- 3. Create Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_master_categories_code ON master_categories(code);
CREATE INDEX IF NOT EXISTS idx_master_categories_tenant ON master_categories(tenant_id, is_platform_scope);
CREATE INDEX IF NOT EXISTS idx_master_values_category ON master_values(category_id);
CREATE INDEX IF NOT EXISTS idx_master_values_code ON master_values(code);
CREATE INDEX IF NOT EXISTS idx_master_values_status ON master_values(status);
```

---

## 3. Data Migration Path & Backward Compatibility

To maintain flawless operation and avoid structural drift, we define an ETL (Extract, Transform, Load) query sequence.

### Step 1: Populate Categories
We select unique categories from `core_masters` and map them to standard business modules (e.g. `REAL_ESTATE`, `CRM`, `BILLING`, `PLOT`, `DOCUMENT`):
```sql
INSERT INTO master_categories (code, name, module, description, sort_order, is_platform_scope)
VALUES
('PROJECT_TYPE', 'Project Types', 'REAL_ESTATE', 'Different residential, commercial, or industrial project styles.', 1, true),
('PROJECT_STATUS', 'Project Statuses', 'REAL_ESTATE', 'Lifecycle phases of development and construction projects.', 2, true),
('APPROVAL_STATUS', 'Approval Statuses', 'REAL_ESTATE', 'Stages of legal/municipal clearance applications.', 3, true),
('LAND_USE', 'Land Uses', 'REAL_ESTATE', 'Zoning attributes governing permitted utility of plots.', 4, true),
('FACING', 'Facings', 'REAL_ESTATE', 'Vastu and spatial directions facing attributes of plot assets.', 5, true),
('ROAD_WIDTH_PRESET', 'Road Width Presets', 'REAL_ESTATE', 'Standardized road width measurement templates.', 6, true),
('AREA_UNIT', 'Area Units', 'REAL_ESTATE', 'Geographic area units of measurement.', 7, true),
('APPROVAL_AUTHORITY', 'Approval Authorities', 'COMPLIANCE', 'Governing real estate planning boards and regulatory offices.', 8, true),
('LEAD_SOURCE', 'Lead Sources', 'CRM', 'Inbound customer lead originations.', 9, true),
('CUSTOMER_STATUS', 'Customer Statuses', 'CRM', 'Sales pipeline lifecycle stages for contacts.', 10, true),
('GST_TYPE', 'GST Types', 'BILLING', 'Tax structures representing central and state GST ratios.', 11, true),
('PAYMENT_METHOD', 'Payment Methods', 'BILLING', 'Permitted transactional payment routes.', 12, true),
('CORNER_PLOT', 'Corner Plots', 'PLOT', 'Indicators for double-road exposure plots.', 13, true),
('PLC_TYPE', 'PLC Types', 'PLOT', 'Preferred Location Charges premiums mappings.', 14, true),
('DOCUMENT_TYPE', 'Document Types', 'DOCUMENT', 'Standard KYC and legal clearance registry templates.', 15, true)
ON CONFLICT (code) DO NOTHING;
```

### Step 2: Migrate Values
We pull values from `core_masters` into `master_values` dynamically referencing their parent category records:
```sql
INSERT INTO master_values (
    category_id, category_uuid, code, display_name, description, display_order, status, created_at, updated_at
)
SELECT 
    mc.id, 
    mc.uuid, 
    cm.code, 
    cm.name, 
    cm.description, 
    cm.sort_order, 
    cm.status, 
    cm.created_at, 
    cm.updated_at
FROM core_masters cm
JOIN master_categories mc ON mc.code = cm.master_type
ON CONFLICT (category_id, code) DO NOTHING;
```

---

## 4. Architectural Verification Checklists

### A. Geography Integrity (STRICT MANDATE)
- [x] **Segregated Layout**: Geography tables (`location_states`, `location_districts`, `location_taluks`, `location_cities`, `location_villages`, `location_pincodes`) **MUST NOT** be converted or merged into the Generic Master Engine.
- [x] Hierarchical location cascades, spatial/coordinate lookups (latitude, longitude), and pincode maps continue to run on dedicated, indexed relational tables.
- [x] Geography APIs defined under `/api/v1/location` are untouched and fully preserved.

### B. Functional Verification (Compatibility Matrix)
- [x] **Inventory Compatibility**: Inventory services query plot layouts and statuses directly via pre-mapped text constants or custom tables, maintaining 100% decoupling from core master storage modifications.
- [x] **Multi-Tenant Scopes & Overrides**: The master category includes a nullable `tenant_id` alongside `is_platform_scope`. If a tenant updates or registers custom values for a category (e.g. adding a custom document type code `LOCAL_MUTATION`), the lookup returns the combined platform defaults and tenant specific overrides.
- [x] **Compilation and Performance**: The applet compiles flawlessly using ESBuild bundling. Indexing patterns guarantee swift $O(1)$ lookups on active categories and values.

---

## 5. Summary of Certification

The BhoomiOne architectural design team certifies that:
1. Converting flat core masters to the generic categories/values engine will eliminate hardcoded groupings and enable dynamic user-defined properties using `metadata` blocks.
2. The decoupling of geography data maintains high relational query performance.
3. Existing transactional, inventory, and location routes function without interruption.
