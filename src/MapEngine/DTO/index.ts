import { GeometryLayer, GeometryObject } from "../Contracts/models.ts";

/**
 * Data Transfer Objects for the Map Intelligence Engine
 */

export interface UploadAssetDTO {
  layoutId: string;
  assetType: 'PDF' | 'IMAGE' | 'DXF' | 'SVG' | 'GIS';
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  customMetadata?: Record<string, any>;
}

export interface CreateLayerDTO {
  layoutId: string;
  layerName: GeometryLayer['layer_name'];
  displayName: string;
  displayOrder: number;
  styleConfig?: GeometryLayer['style_config'];
  permissions?: GeometryLayer['permissions'];
}

export interface CreateGeometryDTO {
  layerId: string;
  layoutId: string;
  objectType: 'POLYGON' | 'POLYLINE' | 'POINT' | 'BOUNDARY' | 'LABEL';
  geometryData: GeometryObject['geometry_data'];
  properties: GeometryObject['properties'];
  labelText?: string;
}

export interface CreateVersionDTO {
  layoutId: string;
  changeSummary: string;
  createdBy: string;
}

export interface RunValidationDTO {
  layoutId: string;
  userId: string;
}

export interface SearchQueryDTO {
  layoutId: string;
  queryString: string;
  layerName?: GeometryLayer['layer_name'];
  objectType?: GeometryObject['object_type'];
}
