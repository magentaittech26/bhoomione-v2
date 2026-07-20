export type PlotType =
  | "Residential"
  | "Commercial"
  | "Industrial"
  | "Civic"
  | "Institutional"
  | "Mixed Use"
  | "Villa"
  | "Farm Plot"
  | "Custom";

export type PlotShapeType =
  | "Rectangle"
  | "Square"
  | "Trapezoid"
  | "Irregular polygon"
  | "Corner plot"
  | "Multi-road-facing plot"
  | "End plot"
  | "Internal plot";

export type PlotStatus =
  | "Draft"
  | "Validated"
  | "Approved"
  | "Published"
  | "Reserved"
  | "Available"
  | "Blocked";

export interface PlotProperties {
  plot_id: string;
  plot_number: string;
  plot_name: string;
  area_sqft: number;
  area_sqm: number;
  area_acres: number;
  area_guntas: number;
  area_cents: number;
  perimeter: number;
  frontage: number; // primary frontage in meters or feet
  depth: number;     // effective depth in meters or feet
  dimensions: {
    north?: number;
    south?: number;
    east?: number;
    west?: number;
    sides?: number[];
    methodDescription?: string;
  };
  facing: string; // North, East, South, West, etc.
  corner_status: {
    is_corner_plot: boolean;
    corner_type: "two-road corner" | "three-road corner" | "end plot" | "internal plot" | "irregular corner" | "none";
    connected_road_ids: string[];
    corner_confidence: number; // 0 to 1
  };
  road_ids: string[];
  road_names: string[];
  block?: string;
  sector?: string;
  phase?: string;
  plot_type: PlotType;
  shape_type: PlotShapeType;
  status: PlotStatus;
  validation_status: "Validated" | "Errors" | "Warnings" | "Pending";
  validation_messages?: Array<{
    severity: "ERROR" | "WARNING" | "RECOMMENDATION";
    message: string;
  }>;
  parent_plot_id?: string;
  split_operation_id?: string;
  split_timestamp?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  module_version: string;
}

export interface PlanningProfile {
  id: string;
  name: string;
  defaultPlotType: PlotType;
  defaultFrontage: number; // meters
  defaultDepth: number;    // meters
  minArea: number;        // sqm
  minFrontage: number;    // meters
  minDepth: number;       // meters
  maxAspectRatio: number; // e.g. 3 (depth to width)
  legalNotice: string;
}

export interface RowGeneratorInput {
  roadId: string;
  startPoint: [number, number];
  endPoint: [number, number];
  standardFrontage: number;
  standardDepth: number;
  plotCount: number;
  gap: number;
  startingNumber: number;
  numberingDirection: "asc" | "desc";
  sideOfRoad: "left" | "right";
  cornerTreatment: "none" | "larger-first" | "larger-last";
  remainderHandling: "distribute" | "irregular-final" | "open-remainder" | "cancel";
}

export interface GridGeneratorInput {
  targetPolygon: Array<[number, number]>;
  plotWidth: number;
  plotDepth: number;
  rowSpacing: number;
  columnSpacing: number;
  rotation: number; // degrees
  roadFacingDirection: "N" | "E" | "S" | "W";
  numberingScheme: string;
  minRemainderArea: number;
}
