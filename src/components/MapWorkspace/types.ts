import { GeometryLayer, GeometryObject, LayoutAsset, LayoutVersion } from "../../MapEngine/Contracts/models.ts";

export type WorkspaceTool = 
  | "select" 
  | "pan" 
  | "boundary" 
  | "road" 
  | "plot" 
  | "park" 
  | "amenity" 
  | "utility" 
  | "label" 
  | "measure";

export interface WorkspaceState {
  selectedProjectId: string | null;
  selectedLayoutId: string | null;
  selectedVersionId: string | null;
  selectedLayerId: string | null;
  zoomLevel: number; // e.g., 100
  selectedTool: WorkspaceTool;
  selectedObjectId: string | null;
  canvasPosition: { x: number; y: number };
  theme: "light" | "engineering" | "satellite";
  isGridVisible: boolean;
  isSnapToGrid: boolean;
}

export interface MockGeometry extends GeometryObject {
  id: string;
  layerName: GeometryLayer["layer_name"];
  name: string;
  style_config?: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    dashArray?: string;
    [key: string]: any;
  };
  properties: {
    plot_id?: string;
    plot_number?: string;
    area_value?: number;
    road_width?: number;
    amenity_type?: string;
    facing?: string;
    zoning?: string;
    owner?: string;
    [key: string]: any;
  };
}
