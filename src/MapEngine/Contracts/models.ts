/**
 * Database Models and Relationships for Map Intelligence Engine
 * Represents the layout_assets, geometry_layers, geometry_objects, layout_versions,
 * validation_logs, geometry_audit_logs, and editing_sessions schemas.
 */

export interface LayoutAsset {
  id: string;
  layout_id: string;
  asset_type: 'PDF' | 'IMAGE' | 'DXF' | 'SVG' | 'GIS';
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  metadata: Record<string, any>;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface GeometryLayer {
  id: string;
  layout_id: string;
  layer_name: 'BOUNDARY' | 'PLOTS' | 'ROADS' | 'PARK' | 'CA' | 'AMENITIES' | 'UTILITIES' | 'LABELS';
  display_name: string;
  is_visible: boolean;
  is_locked: boolean;
  display_order: number;
  style_config: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    dashArray?: string;
    [key: string]: any;
  };
  permissions: {
    viewRoles: string[];
    editRoles: string[];
    [key: string]: any;
  };
  created_at: Date | string;
  updated_at: Date | string;
}

export interface GeometryObject {
  id: string;
  layer_id: string; // References GeometryLayer.id
  layout_id: string;
  object_type: 'POLYGON' | 'POLYLINE' | 'POINT' | 'BOUNDARY' | 'LABEL';
  geometry_data: {
    coordinates: Array<[number, number]> | Array<Array<[number, number]>> | [number, number];
    srid?: number; // Spatial Reference System Identifier
    projection?: string;
  };
  label_text?: string;
  properties: {
    plot_id?: string; // Prepared relationship to the existing plots table
    plot_number?: string;
    area_value?: number;
    road_width?: number;
    amenity_type?: string;
    [key: string]: any;
  };
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface LayoutVersion {
  id: string;
  layout_id: string;
  version_number: string; // e.g. "v1.0"
  status: 'DRAFT' | 'APPROVED' | 'ROLLBACKED';
  snapshot_data: {
    layers: GeometryLayer[];
    objects: GeometryObject[];
  };
  created_by: string;
  approved_by?: string;
  approved_at?: Date | string;
  change_summary: string;
  created_at: Date | string;
}

export interface ValidationLog {
  id: string;
  layout_id: string;
  run_id: string;
  rule_name: 'OVERLAP' | 'DUPLICATE_PLOT' | 'DISCONNECTED_ROADS' | 'MISSING_BOUNDARY' | 'INVALID_NUMBERING';
  severity: 'INFO' | 'WARNING' | 'ERROR';
  is_passed: boolean;
  error_details: {
    message: string;
    affected_object_ids?: string[];
    context_data?: Record<string, any>;
  };
  executed_at: Date | string;
}

export interface GeometryAuditLog {
  id: string;
  layout_id: string;
  object_id?: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLLBACK';
  old_state?: Record<string, any>;
  new_state?: Record<string, any>;
  performed_by: string;
  performed_at: Date | string;
}

export interface EditingSession {
  id: string;
  layout_id: string;
  user_id: string;
  status: 'ACTIVE' | 'COMMITTED' | 'ABANDONED';
  started_at: Date | string;
  expires_at: Date | string;
  last_heartbeat: Date | string;
}
