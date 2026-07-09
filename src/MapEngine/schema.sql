-- ============================================================================
-- Map Intelligence Engine DB Schema Blueprint (PostgreSQL / GIS Ready)
-- ============================================================================
-- Prepared relational database models, structures, and relationships for:
-- layout_assets, geometry_layers, geometry_objects, layout_versions,
-- validation_logs, geometry_audit_logs, editing_sessions
-- ============================================================================

-- Enable PostGIS extension for spatial index supports (optional but recommended for future GIS scaling)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. layout_assets Table
-- Manages physical master file uploads, Wildcards, DXFs, PDFs, and CAD designs.
CREATE TABLE IF NOT EXISTS layout_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL, -- References layouts(id) in existing ERP
    asset_type VARCHAR(50) NOT NULL, -- 'PDF', 'IMAGE', 'DXF', 'SVG', 'GIS'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL, -- References users(id) in existing ERP
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Custom resolution, scale factor, or GIS projections
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_layout_assets_layout_id ON layout_assets(layout_id);
CREATE INDEX IF NOT EXISTS idx_layout_assets_type ON layout_assets(asset_type);

-- 2. geometry_layers Table
-- Represents layer groups for layouts with visiblity, locked states, ordering, styles, and permissions.
CREATE TABLE IF NOT EXISTS geometry_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL, -- References layouts(id)
    layer_name VARCHAR(100) NOT NULL, -- 'BOUNDARY', 'PLOTS', 'ROADS', 'PARK', 'CA', 'AMENITIES', 'UTILITIES', 'LABELS'
    display_name VARCHAR(255) NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    style_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Color hex codes, stroke widths, opacity settings
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Custom view roles / edit roles configurations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(layout_id, layer_name) -- A layout cannot have duplicated layer categories
);

CREATE INDEX IF NOT EXISTS idx_geometry_layers_layout_id ON geometry_layers(layout_id);

-- 3. geometry_objects Table
-- Central vector storage table representing polygons, points, coordinates, and boundaries.
CREATE TABLE IF NOT EXISTS geometry_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id UUID NOT NULL REFERENCES geometry_layers(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL, -- References layouts(id) for rapid global queries
    object_type VARCHAR(50) NOT NULL, -- 'POLYGON', 'POLYLINE', 'POINT', 'BOUNDARY', 'LABEL'
    geometry_data JSONB NOT NULL, -- Coordinates trace payload fallback: coordinates: [ [x, y], ... ]
    geom GEOMETRY, -- Future GIS optimization slot
    label_text VARCHAR(255) NULL, -- Optional text annotation for labels layer
    properties JSONB NOT NULL DEFAULT '{}'::jsonb, -- Prepared relationship pointers: plot_id, road_width, corner_plot, status, rera_registered
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geometry_objects_layer_id ON geometry_objects(layer_id);
CREATE INDEX IF NOT EXISTS idx_geometry_objects_layout_id ON geometry_objects(layout_id);
CREATE INDEX IF NOT EXISTS idx_geometry_objects_plot_id ON geometry_objects(((properties->>'plot_id')::uuid)) WHERE (properties->>'plot_id') IS NOT NULL; -- Index for plot relationship lookup
CREATE INDEX IF NOT EXISTS idx_geometry_objects_active ON geometry_objects(is_active);

-- 4. layout_versions Table
-- Complete immutable snapshots of layouts upon approval. Used for history tracking, draft stages, and rollback operations.
CREATE TABLE IF NOT EXISTS layout_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL, -- References layouts(id)
    version_number VARCHAR(50) NOT NULL, -- e.g., 'v1.0'
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'APPROVED', 'ROLLBACKED'
    snapshot_data JSONB NOT NULL, -- Frozen states of all active geometry layers and objects
    created_by UUID NOT NULL, -- References users(id)
    approved_by UUID, -- References users(id)
    approved_at TIMESTAMP WITH TIME ZONE,
    change_summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_layout_versions_layout_id ON layout_versions(layout_id);

-- 5. validation_logs Table
-- Retains executed alignment rules diagnostic history, warning logs, and error outputs.
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL, -- References layouts(id)
    run_id UUID NOT NULL, -- Correlates validation tests executed in a single run session
    rule_name VARCHAR(100) NOT NULL, -- 'OVERLAP', 'DUPLICATE_PLOT', 'DISCONNECTED_ROADS', 'MISSING_BOUNDARY', 'INVALID_NUMBERING'
    severity VARCHAR(50) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARNING', 'ERROR'
    is_passed BOOLEAN NOT NULL DEFAULT TRUE,
    error_details JSONB NOT NULL DEFAULT '{}'::jsonb, -- Descriptive failure messages and affected geometry object UUID lists
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_validation_logs_layout_id ON validation_logs(layout_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_run_id ON validation_logs(run_id);

-- 6. geometry_audit_logs Table
-- High-frequency mutation tracking of spatial objects for audit trails.
CREATE TABLE IF NOT EXISTS geometry_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL, -- References layouts(id)
    object_id UUID, -- References geometry_objects(id) NULLable in case of deletions
    action_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ROLLBACK'
    old_state JSONB, -- Previous coordinates and properties
    new_state JSONB, -- Current coordinates and properties
    performed_by UUID NOT NULL, -- References users(id)
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geometry_audit_logs_layout_id ON geometry_audit_logs(layout_id);

-- 7. editing_sessions Table
-- Manages multi-user editing lock prevention, drafting isolation states, and heartbeat timers.
CREATE TABLE IF NOT EXISTS editing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL, -- References layouts(id)
    user_id UUID NOT NULL, -- References users(id)
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMMITTED', 'ABANDONED'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_editing_sessions_layout_id ON editing_sessions(layout_id);
CREATE INDEX IF NOT EXISTS idx_editing_sessions_user_id ON editing_sessions(user_id);
