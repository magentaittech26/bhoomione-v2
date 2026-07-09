import {
  LayoutAsset,
  GeometryLayer,
  GeometryObject,
  LayoutVersion,
  ValidationLog,
  GeometryAuditLog,
  EditingSession
} from "./models.ts";

/**
 * Interface contract for Asset Manager module.
 * Administers physical design assets, wildcards, and GIS mappings.
 */
export interface IAssetManager {
  uploadAsset(
    layoutId: string,
    assetType: 'PDF' | 'IMAGE' | 'DXF' | 'SVG' | 'GIS',
    file: { name: string; size: number; content: string | Blob; mimeType: string },
    uploadedBy: string
  ): Promise<LayoutAsset>;
  getAssetsByLayout(layoutId: string): Promise<LayoutAsset[]>;
  getAssetDetail(assetId: string): Promise<LayoutAsset | null>;
  deleteAsset(assetId: string): Promise<boolean>;
}

/**
 * Interface contract for Geometry Engine.
 * Single source of truth for physical spatial boundaries, coordinates, and lines.
 */
export interface IGeometryEngine {
  createGeometry(
    layerId: string,
    objectType: 'POLYGON' | 'POLYLINE' | 'POINT' | 'BOUNDARY' | 'LABEL',
    geometryData: GeometryObject['geometry_data'],
    properties: GeometryObject['properties'],
    labelText?: string
  ): Promise<GeometryObject>;
  updateGeometry(id: string, updates: Partial<GeometryObject>): Promise<GeometryObject>;
  deleteGeometry(id: string): Promise<boolean>;
  getGeometryByLayer(layerId: string): Promise<GeometryObject[]>;
  getGeometryDetail(id: string): Promise<GeometryObject | null>;
  bulkSaveGeometries(geometries: Omit<GeometryObject, 'id' | 'created_at' | 'updated_at'>[]): Promise<GeometryObject[]>;
}

/**
 * Interface contract for Layer Engine.
 * Handles the state, arrangement, visual attributes, and access permissions of map layers.
 */
export interface ILayerEngine {
  createLayer(
    layoutId: string,
    layerName: GeometryLayer['layer_name'],
    displayName: string,
    displayOrder: number,
    styleConfig?: GeometryLayer['style_config'],
    permissions?: GeometryLayer['permissions']
  ): Promise<GeometryLayer>;
  getLayers(layoutId: string): Promise<GeometryLayer[]>;
  updateLayer(id: string, updates: Partial<GeometryLayer>): Promise<GeometryLayer>;
  deleteLayer(id: string): Promise<boolean>;
  reorderLayers(layoutId: string, orderMap: Record<string, number>): Promise<GeometryLayer[]>;
}

/**
 * Abstraction for Map Rendering interfaces.
 * Decouples the application code from specific mapping technology runtimes.
 * Implementations will bind specific rendering libraries (e.g. Leaflet, Mapbox, Google Maps).
 */
export interface IRenderingInterface {
  initialize(containerId: string, options?: Record<string, any>): void;
  setLayers(layers: GeometryLayer[]): void;
  setGeometries(geometries: GeometryObject[]): void;
  zoomToExtent(boundingBox: [[number, number], [number, number]]): void;
  clear(): void;
  onSelect(callback: (selectedObjectId: string) => void): void;
  destroy(): void;
}

/**
 * Interface contract for Version Engine.
 * Guarantees immutability and compliance trace tracking for layout modifications.
 */
export interface IVersionEngine {
  createVersionDraft(layoutId: string, userId: string, summary: string): Promise<LayoutVersion>;
  approveVersionDraft(versionId: string, approverId: string): Promise<LayoutVersion>;
  getVersionsByLayout(layoutId: string): Promise<LayoutVersion[]>;
  rollbackToVersion(layoutId: string, versionId: string, userId: string): Promise<LayoutVersion>;
}

/**
 * Interface contract for Validation Engine.
 * Run rules ensuring the correctness and spatial alignment of layout changes.
 */
export interface IValidationEngine {
  runValidationSuite(layoutId: string, runId: string): Promise<ValidationLog[]>;
  getValidationHistory(layoutId: string): Promise<ValidationLog[]>;
}

/**
 * Interface contract for Search Engine.
 * Spatial search query architecture across the layouts and objects.
 */
export interface ISearchEngine {
  searchSpatial(
    layoutId: string,
    query: string,
    filters?: {
      layerName?: GeometryLayer['layer_name'];
      objectType?: GeometryObject['object_type'];
    }
  ): Promise<GeometryObject[]>;
}
