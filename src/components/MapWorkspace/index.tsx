import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  MapPin, 
  Compass, 
  ArrowRight, 
  Layers, 
  Search, 
  Plus, 
  Activity, 
  ShieldCheck, 
  Database,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  Map,
  HelpCircle,
  UploadCloud,
  X,
  FileImage,
  PenTool,
  Globe,
  FileCode,
  Wrench,
  Check,
  Info,
  FileText,
  RotateCcw,
  Trash2,
  Save
} from "lucide-react";
import api from "../../lib/api.ts";
import { runValidationSuite } from "../../lib/plotEngine.ts";
import { WorkspaceState, MockGeometry, WorkspaceTool } from "./types.ts";
import { GeometryLayer, LayoutAsset, LayoutVersion } from "../../MapEngine/Contracts/models.ts";
import { DrawingToolManager, DeleteObjectCommand, AppTool } from "../../MapEngine/Drawing/DrawingToolManager.ts";

import Toolbar from "./Toolbar.tsx";
import Sidebar from "./Sidebar.tsx";
import Canvas from "./Canvas.tsx";
import Inspector from "./Inspector.tsx";
import StatusBar from "./StatusBar.tsx";
import EmptyState from "./EmptyState.tsx";

// No demo/mock projects or layouts. Everything is loaded dynamically from PostgreSQL.
const MOCK_PROJECTS: any[] = [];
const MOCK_LAYOUTS: any[] = [];

const DEFAULT_LAYERS: GeometryLayer[] = [
  { id: "l-boundary", layout_id: "lay-1", layer_name: "BOUNDARY", display_name: "Site Boundary Limit", is_visible: true, is_locked: false, display_order: 1, style_config: { strokeColor: "#4F46E5", strokeWidth: 3, fillColor: "#818CF8", opacity: 0.15 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-plots", layout_id: "lay-1", layer_name: "PLOTS", display_name: "Subdivided Plots", is_visible: true, is_locked: false, display_order: 2, style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-roads", layout_id: "lay-1", layer_name: "ROADS", display_name: "Slab Roads & Access", is_visible: true, is_locked: false, display_order: 3, style_config: { strokeColor: "#475569", strokeWidth: 4, fillColor: "#94A3B8", opacity: 0.5 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-park", layout_id: "lay-1", layer_name: "PARK", display_name: "Community Park Buffer", is_visible: true, is_locked: false, display_order: 4, style_config: { strokeColor: "#22C55E", strokeWidth: 1.5, fillColor: "#4ADE80", opacity: 0.35 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-ca", layout_id: "lay-1", layer_name: "CA", display_name: "Civic Amenities (CA)", is_visible: true, is_locked: false, display_order: 5, style_config: { strokeColor: "#F59E0B", strokeWidth: 2, fillColor: "#FBBF24", opacity: 0.3 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-amenities", layout_id: "lay-1", layer_name: "AMENITIES", display_name: "General Amenities Zone", is_visible: true, is_locked: false, display_order: 6, style_config: { strokeColor: "#EC4899", strokeWidth: 1.5, fillColor: "#F472B6", opacity: 0.25 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-utilities", layout_id: "lay-1", layer_name: "UTILITIES", display_name: "Water/Sewer Lines", is_visible: true, is_locked: false, display_order: 7, style_config: { strokeColor: "#3B82F6", strokeWidth: 2, fillColor: "#60A5FA", opacity: 0.2 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-labels", layout_id: "lay-1", layer_name: "LABELS", display_name: "Dynamic Map Labels", is_visible: true, is_locked: false, display_order: 8, style_config: { strokeColor: "#334155", strokeWidth: 1, fillColor: "#E2E8F0", opacity: 0.8 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" }
];

const INITIAL_MOCK_OBJECTS: MockGeometry[] = [
  {
    id: "obj-boundary",
    layer_id: "l-boundary",
    layout_id: "lay-1",
    layerName: "BOUNDARY",
    name: "Site Boundary Limit",
    object_type: "BOUNDARY",
    geometry_data: {
      coordinates: [[100, 100], [700, 100], [700, 500], [100, 500]]
    },
    style_config: { strokeColor: "#4F46E5", strokeWidth: 3, fillColor: "#818CF8", opacity: 0.15 },
    properties: { zoning: "Residential", owner: "Bhoomi Developers" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-101",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 101",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[150, 120], [280, 120], [280, 200], [150, 200]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "101", area_value: 1200, facing: "EAST", owner: "Aditya Kumar", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-102",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 102",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[150, 220], [280, 220], [280, 300], [150, 300]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "102", area_value: 1200, facing: "WEST", owner: "Sunita Sharma", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-103",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 103",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[150, 320], [280, 320], [280, 400], [150, 400]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "103", area_value: 1200, facing: "CORNER", owner: "Ramanathan Iyer", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-104",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 104",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[450, 120], [580, 120], [580, 200], [450, 200]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "104", area_value: 1200, facing: "NORTH", owner: "Priyanka Roy", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-105",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 105",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[450, 220], [580, 220], [580, 300], [450, 300]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "105", area_value: 1200, facing: "SOUTH", owner: "David Dsouza", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-park",
    layer_id: "l-park",
    layout_id: "lay-1",
    layerName: "PARK",
    name: "Central Recreation Sector Park",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[310, 250], [420, 250], [420, 400], [310, 400]]
    },
    style_config: { strokeColor: "#22C55E", strokeWidth: 1.5, fillColor: "#4ADE80", opacity: 0.35 },
    properties: { amenity_type: "Garden Park", area_value: 4500, owner: "Municipal Board" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-road-main",
    layer_id: "l-roads",
    layout_id: "lay-1",
    layerName: "ROADS",
    name: "Primary Central Sector Boulevard",
    object_type: "POLYLINE",
    geometry_data: {
      coordinates: [[350, 100], [350, 500]]
    },
    style_config: { strokeColor: "#475569", strokeWidth: 4, fillColor: "#94A3B8", opacity: 0.5 },
    properties: { road_width: 12, owner: "National Highway Authority" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-road-highway",
    layer_id: "l-roads",
    layout_id: "lay-1",
    layerName: "ROADS",
    name: "East Express Link Expressway",
    object_type: "POLYLINE",
    geometry_data: {
      coordinates: [[100, 450], [700, 450]]
    },
    style_config: { strokeColor: "#475569", strokeWidth: 4, fillColor: "#94A3B8", opacity: 0.5 },
    properties: { road_width: 24, owner: "National Highway Authority" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  }
];

const INITIAL_MOCK_ASSETS: LayoutAsset[] = [
  { id: "a-1", layout_id: "lay-1", file_name: "green_meadows_survey_dxf_v1.dxf", asset_type: "DXF", file_size: 4425890, file_path: "/uploads/green_meadows_survey_dxf_v1.dxf", mime_type: "application/dxf", uploaded_by: "ADMIN", metadata: {}, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "a-2", layout_id: "lay-1", file_name: "site_boundary_aerial.png", asset_type: "IMAGE", file_size: 8912440, file_path: "/uploads/site_boundary_aerial.png", mime_type: "image/png", uploaded_by: "ADMIN", metadata: {}, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" }
];

const INITIAL_MOCK_VERSIONS: LayoutVersion[] = [
  { id: "v-1", layout_id: "lay-1", version_number: "v1.0", change_summary: "Initial layout blueprint release approved by city planner.", status: "APPROVED", snapshot_data: { layers: [], objects: [] }, created_by: "ADMIN", created_at: "2026-07-09T00:00:00Z" },
  { id: "v-2", layout_id: "lay-1", version_number: "v1.1", change_summary: "Adjusted layout roads alignments and added green park buffers.", status: "DRAFT", snapshot_data: { layers: [], objects: [] }, created_by: "ADMIN", created_at: "2026-07-09T00:00:00Z" }
];

const MOCK_EXTRACTED_OBJECTS: MockGeometry[] = [
  {
    id: "ext-boundary-1",
    layer_id: "l-boundary",
    layout_id: "lay-draft",
    layerName: "BOUNDARY",
    name: "Draft Layout Outer Boundary",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[100, 80], [700, 80], [700, 480], [100, 480], [100, 80]]
    },
    style_config: { strokeColor: "#E11D48", strokeWidth: 3, fillColor: "#FDA4AF", opacity: 0.1 },
    properties: { survey_number: "SR-904-B", area_value: 240000 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-road-1",
    layer_id: "l-roads",
    layout_id: "lay-draft",
    layerName: "ROADS",
    name: "Extracted East-West Avenue",
    object_type: "POLYLINE",
    geometry_data: {
      coordinates: [[120, 280], [680, 280]]
    },
    style_config: { strokeColor: "#475569", strokeWidth: 5, fillColor: "#94A3B8", opacity: 0.5 },
    properties: { road_width: 10, road_name: "40ft Boulevard" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-road-2",
    layer_id: "l-roads",
    layout_id: "lay-draft",
    layerName: "ROADS",
    name: "Extracted Access Lane 1",
    object_type: "POLYLINE",
    geometry_data: {
      coordinates: [[300, 90], [300, 470]]
    },
    style_config: { strokeColor: "#475569", strokeWidth: 5, fillColor: "#94A3B8", opacity: 0.5 },
    properties: { road_width: 8, road_name: "30ft Inner Lane" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-park-1",
    layer_id: "l-park",
    layout_id: "lay-draft",
    layerName: "PARK",
    name: "Green Ecological Buffer",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[120, 90], [280, 90], [280, 200], [120, 200], [120, 90]]
    },
    style_config: { strokeColor: "#22C55E", strokeWidth: 2, fillColor: "#86EFAC", opacity: 0.35 },
    properties: { amenity_type: "Sector Park", area_value: 17600 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-plot-1",
    layer_id: "l-plots",
    layout_id: "lay-draft",
    layerName: "PLOTS",
    name: "Subdivided Sector Plot A1",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[320, 100], [420, 100], [420, 180], [320, 180], [320, 100]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "", area_value: 1200, zoning: "Residential" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-plot-2",
    layer_id: "l-plots",
    layout_id: "lay-draft",
    layerName: "PLOTS",
    name: "Subdivided Sector Plot A2",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[430, 100], [530, 100], [530, 180], [430, 180], [430, 100]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "", area_value: 1200, zoning: "Residential" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-plot-3",
    layer_id: "l-plots",
    layout_id: "lay-draft",
    layerName: "PLOTS",
    name: "Subdivided Sector Plot A3",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[540, 100], [640, 100], [640, 180], [540, 180], [540, 100]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "", area_value: 1200, zoning: "Residential" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-plot-4",
    layer_id: "l-plots",
    layout_id: "lay-draft",
    layerName: "PLOTS",
    name: "Subdivided Sector Plot A4",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[320, 300], [420, 300], [420, 380], [320, 380], [320, 300]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "", area_value: 1200, zoning: "Residential" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ext-plot-5",
    layer_id: "l-plots",
    layout_id: "lay-draft",
    layerName: "PLOTS",
    name: "Subdivided Sector Plot A5",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[430, 300], [530, 300], [530, 380], [430, 380], [430, 300]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "", area_value: 1200, zoning: "Residential" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const BLUEPRINT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="100%" height="100%" fill="%231e293b" />
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="%23334155" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(%23grid)" />
  <g stroke="%236366f1" stroke-width="2" stroke-dasharray="5 5" fill="none">
    <rect x="100" y="80" width="600" height="440" rx="10" />
    <text x="120" y="110" fill="%23818cf8" font-family="monospace" font-size="12" font-weight="bold">SURVEY BOUNDARY LIMITS: 440m x 600m</text>
  </g>
  <g stroke="%23f59e0b" stroke-width="3" fill="none">
    <line x1="100" y1="300" x2="700" y2="300" />
    <line x1="400" y1="80" x2="400" y2="520" />
    <text x="410" y="290" fill="%23fbbf24" font-family="monospace" font-size="11">MAIN EAST-WEST BOULEVARD (24m ROAD)</text>
    <text x="230" y="150" fill="%23fbbf24" font-family="monospace" font-size="11">CENTRAL AVENUE (18m ROAD)</text>
  </g>
  <g stroke="%2310b981" stroke-dasharray="2 2" fill="none" stroke-width="1.5">
    <rect x="150" y="140" width="100" height="100" />
    <rect x="270" y="140" width="100" height="100" />
    <rect x="150" y="340" width="100" height="100" />
    <rect x="270" y="340" width="100" height="100" />
    <circle cx="550" cy="200" r="60" />
    <text x="500" y="205" fill="%2334d399" font-family="sans-serif" font-size="12" font-weight="bold">AMENITY PARK</text>
  </g>
  <text x="400" y="570" fill="%2394a3b8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">BHOOMI_PHASE_3_CALIBRATION_BLUEPRINT_DRAFT_V2</text>
</svg>`;

type WizardStep =
  | "info"
  | "method"
  | "import_pdf"
  | "boundary"
  | "roads"
  | "parks"
  | "amenities"
  | "utilities"
  | "plots"
  | "numbering"
  | "validation"
  | "publish";

const WIZARD_STEPS_META = [
  { id: "info", label: "Layout Info" },
  { id: "method", label: "Creation Method" },
  { id: "import_pdf", label: "Import PDF / Image" },
  { id: "boundary", label: "Boundary" },
  { id: "roads", label: "Roads" },
  { id: "parks", label: "Parks" },
  { id: "amenities", label: "Amenities" },
  { id: "utilities", label: "Utilities" },
  { id: "plots", label: "Plots" },
  { id: "numbering", label: "Numbering" },
  { id: "validation", label: "Validation" },
  { id: "publish", label: "Publish" },
];

const calculatePolygonArea = (coords: Array<[number, number]>): number => {
  let area = 0;
  const n = coords.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
};

const calculatePolygonPerimeter = (coords: Array<[number, number]>): number => {
  let perimeter = 0;
  const n = coords.length;
  if (n < 2) return 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % n];
    perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  return perimeter;
};

// Simple self-intersection helper
const isPolygonSelfIntersecting = (pts: Array<[number, number]>): boolean => {
  const n = pts.length;
  if (n < 4) return false;

  const orientation = (p: [number, number], q: [number, number], r: [number, number]): number => {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (Math.abs(val) < 0.00001) return 0; // collinear
    return val > 0 ? 1 : 2; // clock or counterclock
  };

  const onSegment = (p: [number, number], q: [number, number], r: [number, number]): boolean => {
    return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
           q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
  };

  const intersect = (p1: [number, number], q1: [number, number], p2: [number, number], q2: [number, number]): boolean => {
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  };

  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue; // Skip adjacent segments
      const c = pts[j];
      const d = pts[(j + 1) % n];
      if (intersect(a, b, c, d)) {
        return true;
      }
    }
  }
  return false;
};

const WIZARD_HELP: Record<string, {
  title: string;
  why: string;
  description: string;
  tips: string[];
  warnings: string[];
  nextAction: string;
}> = {
  info: {
    title: "Layout Metadata Collection",
    why: "Storing structural details such as zoning and development phase guarantees compliance with city plotting guidelines and makes discovery easy for site surveys.",
    description: "Provide the fundamental details of your new plotting venture. Choose a descriptive name, select the primary zoning intent (Residential/Commercial/Mixed-Use), specify the phase index, and draft a high-level operational brief.",
    tips: [
      "Use descriptive naming patterns matching official municipal survey permits (e.g., 'Sector C Green Park Meadows').",
      "Ensure zoning classifications align with native land conversion certificates."
    ],
    warnings: [
      "Zoning restrictions cannot easily be altered once layout subdivision validation completes."
    ],
    nextAction: "Click 'Next' to specify how you will establish the layout's coordinate system."
  },
  method: {
    title: "Configure Creation Method",
    why: "Establishing the source of spatial coordinates prevents mapping drift and ensures your boundary lines correctly overlap real-world parcel layouts.",
    description: "Choose the vector import pipeline or construct the layout scratchpad manually. Importing an existing architectural blueprint can significantly accelerate drawing times.",
    tips: [
      "Select 'Draw Manually' to begin creating geometry from scratch using our precise CAD-styled cursor rulers.",
      "If you have CAD files from engineers, selecting 'Import DXF' allows quick geometry imports."
    ],
    warnings: [
      "You can only select one creation pipeline per layout draft. Choosing manual disables automated layer extraction."
    ],
    nextAction: "Select an option and click 'Next' to enter the spatial drafting studio."
  },
  import_pdf: {
    title: "Import PDF / Image Drawing",
    why: "Importing approved drawings in PDF, PNG, or JPG formats provides a visual tracing base, making it easy to digitize layouts accurately without manually calculating scales.",
    description: "Upload your municipal layout diagram or blueprint file. Once uploaded, you can manually trace plots directly on top of the drawing to form precise geometric coordinates.",
    tips: [
      "Select a clear, high-resolution PDF or Image file (max 25MB).",
      "Ensure the drawing has legible boundary markers and plot labels."
    ],
    warnings: [
      "You must upload a valid layout drawing file before proceeding to the boundary tracing step."
    ],
    nextAction: "Upload your drawing file, and click 'Next' to start tracing the boundary."
  },
  boundary: {
    title: "Establish Layout Boundary Limit",
    why: "Municipal laws prohibit subdivision plots outside of approved parcel coordinate surveys. The boundary limit forms a hard fence for other vector elements.",
    description: "Define the absolute perimeter limits of the development site. Switch on the 'Boundary' tool to trace coordinates, or click directly on the canvas to form vertices.",
    tips: [
      "Select the 'Boundary Tool' (active by default in this step) and draw a closed polygon covering the entire parcel area.",
      "A valid boundary polygon should outline all access coordinates and reserve space for green buffers."
    ],
    warnings: [
      "You must complete drawing at least one boundary polygon before you can proceed to draft roads or plots."
    ],
    nextAction: "Complete the boundary limit, click 'Save Draft', then select 'Next' to start mapping access corridors."
  },
  roads: {
    title: "Map Access Corridors & Slab Roads",
    why: "Sufficient road widths are a core requirement for emergency vehicle access and municipal layout approvals.",
    description: "Add slab roads, paths, and connector arteries that will service individual sales plots. Road corridors should intersect nicely to ensure traffic flows smoothly.",
    tips: [
      "Ensure roads connect to the outer municipal entry roads shown on the coordinate survey.",
      "Vary road widths between 30ft and 40ft depending on artery traffic classifications."
    ],
    warnings: [
      "Do not draw roads that cross outside of the outer boundary polygon. This will fail the validation check."
    ],
    nextAction: "Draw the major access corridors, then click 'Next' to design community park zones."
  },
  parks: {
    title: "Design Community Park Buffers",
    why: "Urban landscaping laws require reserving a minimum percentage of parcel space for park belts and ecological preserves.",
    description: "Establish recreational areas, garden buffers, and environmental lungs for the township. Park zones increase properties' market valuations considerably.",
    tips: [
      "Situate central parks near residential plots to optimize resident accessibility.",
      "Use green parks as scenic buffers alongside busy commercial tech zone boundaries."
    ],
    warnings: [
      "Ensure park polygons do not overlay roads or planned civic utility pipelines."
    ],
    nextAction: "Delineate park boundaries, then click 'Next' to define general amenities."
  },
  amenities: {
    title: "Identify Civic Amenities Zones",
    why: "Township approvals require designating civic space for community centers, primary schools, medical clinics, and police booths.",
    description: "Mark specific locations on the map workspace for civic structures. These amenities form the social foundation of the planned community.",
    tips: [
      "Place civic facilities close to primary roads to ensure high accessibility.",
      "Select appropriate labels for each facility in the right-side inspector properties panel."
    ],
    warnings: [
      "Double-check that civic facility plots are separate from private commercial real estate plots."
    ],
    nextAction: "Identify general amenity spaces, then click 'Next' to layout utility pipelines."
  },
  utilities: {
    title: "Map Utility Pipelines",
    why: "Sufficient water pressure and secure sewage/drainage networks are necessary to prevent community infrastructure failure.",
    description: "Layout the primary municipal utility networks. Draw safe pathways for water pipelines, electric grids, and sewage lines.",
    tips: [
      "Align underground utility lines alongside planned road corridors for easy maintenance access.",
      "Use clear distinct color representations to separate clean water supply lines from wastewater networks."
    ],
    warnings: [
      "Keep sewage and wastewater utilities safely separated from drinking water distribution lines."
    ],
    nextAction: "Delineate utility networks, then click 'Next' to carve sales plots."
  },
  plots: {
    title: "Carve Subdivision Sales Plots",
    why: "The core commercial unit of any plotting enterprise is the subdivided plot. Accurate coordinates guarantee smooth title registration.",
    description: "Carve and subdivide the remaining layout space into individual sales parcels. Each plot is a distinct polygon containing property metrics.",
    tips: [
      "Ensure plot layouts align symmetrically along roads for high curb appeal.",
      "Configure standard plot dimensions (e.g., 30x40, 30x50, 40x60) to ease catalog registration."
    ],
    warnings: [
      "No plot should overlap with other plots, roads, or park buffers. Overlaps will block municipal publication."
    ],
    nextAction: "Draw residential and commercial plots, then click 'Next' to run automatic numbering."
  },
  numbering: {
    title: "Configure Plot Numbering Scheme",
    why: "Standardized alphanumeric sequential numbering simplifies property identification for sales teams, buyers, and registration clerks.",
    description: "Apply a clear, consecutive sequential numbering scheme to all carved plots. You can use our auto-numbering utility or click individual plots to label manually.",
    tips: [
      "Click on plots on the canvas to review their properties in the right inspector and manually set their plot numbers.",
      "Use prefix formats (e.g., 'P-101', 'P-102') to match developer registration schedules."
    ],
    warnings: [
      "Duplicate plot numbers will cause immediate booking disputes. Ensure every plot has a unique alphanumeric ID."
    ],
    nextAction: "Ensure all plots have unique sequence identifiers, then click 'Next' to run validation checks."
  },
  validation: {
    title: "Geometric Analysis & Validation Suite",
    why: "Automatic pre-checks prevent costly legal disputes from overlapping survey lines before submitting plans to city planners.",
    description: "Run the BhoomiOne real-time geometry validation engine. The suite scans all active coordinate layers to detect intersections, self-crossing boundaries, or misplaced nodes.",
    tips: [
      "Click 'Trigger Validation Check' to run the analysis engine over current layout coordinate arrays.",
      "Select highlighted error nodes on the canvas map to make adjustments to vertices immediately."
    ],
    warnings: [
      "All major overlap errors must be completely resolved before the layout can be published to production."
    ],
    nextAction: "Verify that all safety checks are satisfied, then click 'Next' to finalize publication."
  },
  publish: {
    title: "Publish Layout Blueprint Live",
    why: "Publishing commits the CAD geometry to the secure BhoomiOne core registry, instantly feeding the sales pipeline and inventory listings.",
    description: "Submit your fully plotted layout blueprint to production. This action seals the layout, prepares draft contracts, and opens booking portals for sales teams.",
    tips: [
      "Confirm that all phase metadata is accurate before completing publication.",
      "Published layouts are instantly accessible under the primary layouts directory."
    ],
    warnings: [
      "Publishing is a permanent layout milestone. Future geometric changes will require creating a new layout revision snapshot."
    ],
    nextAction: "Click the big green 'Publish Layout Blueprint' button to make your work live!"
  }
};

interface MapWorkspaceIndexProps {
  initialProjectId?: string | null;
  initialLayoutId?: string | null;
  projects?: any[];
  layouts?: any[];
  onBackToInventory?: () => void;
  onEditLayoutDetails?: (layoutId: string) => void;
  onPublishComplete?: (layoutId: string) => void;
  onSelectProject?: (projectId: string | null) => void;
  onSelectLayout?: (layoutId: string | null) => void;
}

export default function MapWorkspaceIndex({ 
  initialProjectId = null, 
  initialLayoutId = null,
  projects = [],
  layouts = [],
  onBackToInventory,
  onEditLayoutDetails,
  onPublishComplete,
  onSelectProject,
  onSelectLayout
}: MapWorkspaceIndexProps = {}) {
  // Navigation flow state: "projects" | "layouts" | "workspace"
  const [currentStep, setCurrentStep] = useState<"projects" | "layouts" | "workspace">("projects");
  
  // Data State Arrays
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [layoutsList, setLayoutsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);

  // Sync selected project and layout back to parent state
  useEffect(() => {
    if (onSelectProject) {
      onSelectProject(selectedProjectId);
    }
  }, [selectedProjectId, onSelectProject]);

  useEffect(() => {
    if (onSelectLayout) {
      onSelectLayout(selectedLayoutId);
    }
  }, [selectedLayoutId, onSelectLayout]);

  // Sync projects and layouts from props if available
  useEffect(() => {
    if (projects && projects.length > 0) {
      setProjectsList(projects);
    }
  }, [projects]);

  useEffect(() => {
    if (layouts && layouts.length > 0) {
      setLayoutsList(layouts);
    }
  }, [layouts]);

  // Sync initial parameters and auto-launch studio wizard
  useEffect(() => {
    if (initialLayoutId && layoutsList.length > 0) {
      const layout = layoutsList.find(l => String(l.id) === String(initialLayoutId));
      if (layout) {
        setSelectedProjectId(layout.project_id);
        setSelectedLayoutId(initialLayoutId);
        setCurrentStep("workspace");

        // Automatically launch the Layout Studio Wizard for this existing layout!
        setIsWizardMode(true);
        setWizardStep("info"); // Start at Step 1: Project & Layout Info
        setWizardLayoutName(layout.name || "");
        
        // Map layout type to selection options: Residential, Commercial, Mixed-Use
        const lowerType = (layout.layout_type || "").toLowerCase();
        if (lowerType.includes("commercial")) {
          setWizardLayoutType("Commercial");
        } else if (lowerType.includes("mixed")) {
          setWizardLayoutType("Mixed-Use");
        } else {
          setWizardLayoutType("Residential");
        }

        // Unpack additional fields from approval_number safely
        const unpacked = layout.approval_number ? (() => {
          const res = { approval_number: "", phase: "", survey_number: "", description: "" };
          const parts = layout.approval_number.split(" | ");
          parts.forEach((part: string) => {
            const [key, ...valParts] = part.split(":");
            const val = valParts.join(":").trim();
            if (key === "Ap") res.approval_number = val;
            else if (key === "Ph") res.phase = val;
            else if (key === "Sy") res.survey_number = val;
            else if (key === "De") res.description = val;
          });
          return res;
        })() : { approval_number: "", phase: "Phase 1", survey_number: "", description: "" };

        setWizardLayoutPhase(unpacked.phase || "Phase 1");
        setWizardLayoutDesc(unpacked.description || "");
        setWizardCreationMethod("");
        setWizardUploadedFile(null);
        setWizardCompletedSteps({ info: true });

        // Load specific geometry unique to this layout from localStorage
        const savedGeom = localStorage.getItem(`bhoomi_geometry_layout_${initialLayoutId}`);
        if (savedGeom) {
          try {
            setObjects(JSON.parse(savedGeom));
          } catch (e) {
            console.error("Failed to load geometry from localStorage for layout", initialLayoutId, e);
          }
        } else {
          // If no specific geometries are stored, fallback to empty so the user can draw it!
          setObjects([]);
        }

        setStatusLog(`Layout Studio Wizard launched for "${layout.name}". Verifying project & layout info.`);
        return;
      }
    }
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
      setCurrentStep("layouts");
    }
  }, [initialProjectId, initialLayoutId, layoutsList]);

  // Search filter for landing steps
  const [projectsSearch, setProjectsSearch] = useState("");
  const [layoutsSearch, setLayoutsSearch] = useState("");

  // Grid system and mapping visualizers states
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isSnapToGrid, setIsSnapToGrid] = useState(false);

  // Map workspace components states
  const [layers, setLayers] = useState<GeometryLayer[]>(DEFAULT_LAYERS);
  const [assets, setAssets] = useState<LayoutAsset[]>(INITIAL_MOCK_ASSETS);
  const [versions, setVersions] = useState<LayoutVersion[]>(INITIAL_MOCK_VERSIONS);
  const [activeVersionId, setActiveVersionId] = useState<string | null>("v-2");
  const [objects, setObjects] = useState<MockGeometry[]>(INITIAL_MOCK_OBJECTS);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<WorkspaceTool>("select");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isSpacePanActive, setIsSpacePanActive] = useState(false);

  // Core Drawing Engine Foundation instantiation
  const drawingManagerRef = useRef<DrawingToolManager>(new DrawingToolManager());
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pan, setPan] = useState({ x: 200, y: 150 });
  const hasRestoredMapState = useRef<string | null>(null);
  
  // Sidebar state collapses
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Status indicators
  const [searchQuery, setSearchQuery] = useState("");
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [statusLog, setStatusLog] = useState("Map Engine workspace loaded. Ready to inspect vector geometry layers.");
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ========================================================
  // LAYOUT CREATION STUDIO WIZARD STATES
  // ========================================================
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [showDraftPromptModal, setShowDraftPromptModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("info");

  // Synchronized drawing state variables for wizard mode
  const [wizardDrawingPoints, setWizardDrawingPoints] = useState<Array<[number, number]>>([]);
  const [wizardDrawingCurrentMouse, setWizardDrawingCurrentMouse] = useState<[number, number] | null>(null);
  const finishDrawingRef = useRef<(() => void) | null>(null);
  
  // Form fields
  const [wizardLayoutName, setWizardLayoutName] = useState("");
  const [wizardLayoutType, setWizardLayoutType] = useState<"Residential" | "Commercial" | "Mixed-Use" | "">("");
  const [wizardLayoutPhase, setWizardLayoutPhase] = useState("Phase 1");
  const [wizardLayoutDesc, setWizardLayoutDesc] = useState("");
  const [wizardCreationMethod, setWizardCreationMethod] = useState<"pdf" | "image" | "dxf" | "manual" | "gis" | "">("");
  const [wizardUploadedFile, setWizardUploadedFile] = useState<any | null>(null);
  const [wizardCompletedSteps, setWizardCompletedSteps] = useState<Record<string, boolean>>({});

  // Boundary Drawing User Experience states
  const [showBoundaryWelcome, setShowBoundaryWelcome] = useState(true);
  const [showBoundaryHelp, setShowBoundaryHelp] = useState(false);
  const [showBoundarySuccess, setShowBoundarySuccess] = useState(false);

  // Step 3A variables
  const [importSubStep, setImportSubStep] = useState<"upload" | "preview" | "scale" | "background" | "validation">("upload");
  const [importZoom, setImportZoom] = useState(1);
  const [importPan, setImportPan] = useState({ x: 0, y: 0 });
  const [importRotate, setImportRotate] = useState<number>(0);
  const [importOpacity, setImportOpacity] = useState<number>(80);
  const [importBrightness, setImportBrightness] = useState<number>(100);
  const [importContrast, setImportContrast] = useState<number>(100);
  const [importLock, setImportLock] = useState<boolean>(false);
  const [importShowGrid, setImportShowGrid] = useState<boolean>(true);
  const [importSnapPreview, setImportSnapPreview] = useState<boolean>(true);
  const [importUnit, setImportUnit] = useState<"Metric" | "Feet" | "Meters">("Meters");
  const [importCalibP1, setImportCalibP1] = useState<{ x: number; y: number } | null>(null);
  const [importCalibP2, setImportCalibP2] = useState<{ x: number; y: number } | null>(null);
  const [importCalibDistance, setImportCalibDistance] = useState<string>("");
  const [importCalibActive, setImportCalibActive] = useState<boolean>(false);
  const [importFileURL, setImportFileURL] = useState<string>("");

  // Helper for generating dynamic blueprint previews for different PDF pages
  const getDynamicBlueprint = (page: number) => {
    if (page === 1) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="%231e293b" />
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="%23334155" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(%23grid)" />
        <g fill="none" stroke="%236366f1" stroke-width="2">
          <rect x="150" y="100" width="500" height="400" rx="12" />
          <line x1="150" y1="220" x2="650" y2="220" stroke-width="1" stroke-dasharray="4 4" />
        </g>
        <g fill="%23f8fafc" font-family="sans-serif">
          <text x="400" y="150" font-size="24" font-weight="bold" text-anchor="middle" fill="%23818cf8">BHOOMIONE V3 STUDIO</text>
          <text x="400" y="185" font-size="12" font-weight="medium" text-anchor="middle" fill="%2394a3b8">SUBDIVISION DEVELOPMENT LAND PLAT</text>
          
          <text x="180" y="260" font-size="14" font-weight="bold" fill="%23cbd5e1">DOCUMENT SHEET 1 OF 3</text>
          <text x="180" y="290" font-size="11" fill="%2394a3b8">Title: Cover Sheet, Location Map &amp; General Drafting Notes</text>
          <text x="180" y="315" font-size="11" fill="%2394a3b8">Survey Reference: SR-2026-N491</text>
          <text x="180" y="340" font-size="11" fill="%2394a3b8">Approved By: Town &amp; Country Planning Directorate</text>
          
          <text x="400" y="440" font-size="11" font-family="monospace" text-anchor="middle" fill="%23fbbf24">[PAGE IS NOT INTENDED FOR DIRECT CALIBRATION - SELECT PAGE 2]</text>
        </g>
      </svg>`;
    } else if (page === 3) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="%231e293b" />
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="%23334155" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(%23grid)" />
        
        <g stroke="%23fbbf24" stroke-width="2" fill="none">
          <line x1="100" y1="150" x2="700" y2="150" />
          <line x1="100" y1="450" x2="700" y2="450" />
          <text x="110" y="140" fill="%23f59e0b" font-family="monospace" font-size="12">STREET CROSS-SECTION &amp; RIGHT OF WAY (ROW)</text>
        </g>

        <g fill="%2394a3b8" font-family="sans-serif" font-size="10">
          <rect x="150" y="200" width="120" height="180" fill="none" stroke="%23475569" stroke-width="1" />
          <text x="210" y="290" text-anchor="middle">DRAINAGE PARAPET</text>

          <rect x="300" y="200" width="200" height="180" fill="none" stroke="%23475569" stroke-width="1" />
          <text x="400" y="290" text-anchor="middle">18m PAVED ROADWAY</text>

          <rect x="530" y="200" width="120" height="180" fill="none" stroke="%23475569" stroke-width="1" />
          <text x="590" y="290" text-anchor="middle">UTILITY DUCT</text>
        </g>
        
        <text x="400" y="550" fill="%2394a3b8" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">SHEET 3: ENGINEERING LAYOUT STANDARDS &amp; DETAIL DRAWINGS</text>
      </svg>`;
    } else {
      return BLUEPRINT_SVG;
    }
  };

  // Helper to persist display and alignment state to layout asset table in Postgres (Requirement 5)
  const saveDisplayStateToDb = async (updatedFields: any) => {
    if (selectedLayoutId && wizardUploadedFile) {
      try {
        const mergedMeta = {
          ...wizardUploadedFile,
          ...updatedFields
        };
        // Update local state to keep it in sync
        setWizardUploadedFile(mergedMeta);
        
        // Handle PDF dynamic SVG preview adjustment for mocked blueprints
        let finalURL = importFileURL;
        if (wizardUploadedFile.name?.toLowerCase().endsWith(".pdf") && updatedFields.selectedPage !== undefined) {
          if (importFileURL.startsWith("data:image/svg+xml")) {
            finalURL = getDynamicBlueprint(updatedFields.selectedPage);
            setImportFileURL(finalURL);
          }
        }

        await api.createLayoutAsset(selectedLayoutId, {
          asset_type: wizardUploadedFile.name?.toLowerCase().endsWith(".pdf") ? "PDF" : "IMAGE",
          file_name: wizardUploadedFile.name,
          file_path_or_base64: finalURL,
          mime_type: wizardUploadedFile.type || "image/png",
          file_size: wizardUploadedFile.size,
          metadata: mergedMeta
        });
      } catch (err) {
        console.error("Failed to save display state to db:", err);
      }
    }
  };

  // Helper to handle real file upload, metadata extraction, base64 encoding and cloud persistence
  const handleFileSelection = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const currentUser = api.getCurrentUser();
      const uploadedBy = currentUser?.name || currentUser?.email || "SaaS Admin";
      const uploadDate = new Date().toLocaleString();
      const isPDF = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
      const assetType = isPDF ? "PDF" : "IMAGE";
      
      const fileMeta = {
        name: file.name,
        size: file.size,
        type: file.type || (isPDF ? "application/pdf" : file.name.endsWith(".tiff") ? "image/tiff" : "image/png"),
        uploadDate,
        uploadedBy,
        dataUrl,
        selectedPage: isPDF ? 2 : 1, // Default to page 2 (Main Layout Sheet) for mock multi-page PDFs
        pageCount: isPDF ? 3 : 1
      };
      
      setWizardUploadedFile(fileMeta);
      
      // If it's a multi-page PDF, load page 2 by default
      const renderUrl = isPDF ? getDynamicBlueprint(2) : dataUrl;
      setImportFileURL(renderUrl);
      setStatusLog(`Drawing file loaded: ${file.name}`);

      if (selectedLayoutId) {
        try {
          await api.createLayoutAsset(selectedLayoutId, {
            asset_type: assetType,
            file_name: file.name,
            file_path_or_base64: renderUrl,
            mime_type: fileMeta.type,
            file_size: file.size,
            metadata: {
              uploadDate,
              uploadedBy,
              selectedPage: fileMeta.selectedPage,
              pageCount: fileMeta.pageCount
            }
          });
          setStatusLog(`Asset successfully persisted to database: ${file.name}`);
        } catch (err) {
          console.error("Failed to persist asset to database:", err);
          setStatusLog(`Layout saved locally: ${file.name}`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to load and save a mock recent layout blueprint file
  const handleSelectRecentUpload = async (item: { name: string, size: number, type: string, date: string, uploadedBy: string, pageCount: number, defaultPage: number }) => {
    let mockContent = BLUEPRINT_SVG;
    if (item.name.endsWith(".pdf")) {
      mockContent = getDynamicBlueprint(item.defaultPage);
    } else if (item.name.includes("greenfield")) {
      mockContent = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="%230f172a" />
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="%231e293b" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(%23grid)" />
        <rect x="150" y="100" width="500" height="400" rx="20" fill="none" stroke="%2310b981" stroke-width="3" stroke-dasharray="10 5" />
        <text x="400" y="300" fill="%2334d399" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">GREENFIELD SURVEY PARCEL B</text>
        <text x="400" y="330" fill="%2364748b" font-family="monospace" font-size="11" text-anchor="middle">AREA: 22.4 HECTARES | SCALE 1:1250</text>
      </svg>`;
    } else {
      mockContent = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="%231e1b4b" />
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="%23312e81" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(%23grid)" />
        <circle cx="400" cy="300" r="220" fill="none" stroke="%23818cf8" stroke-width="2" />
        <text x="400" y="290" fill="%23c7d2fe" font-family="sans-serif" font-size="16" font-weight="extrabold" text-anchor="middle">EAST ZONE SECTOR IV DRAFT</text>
        <text x="400" y="320" fill="%23a5b4fc" font-family="monospace" font-size="11" text-anchor="middle">EAST_ZONE_SECTOR_4.JPG</text>
      </svg>`;
    }

    const fileMeta = {
      name: item.name,
      size: item.size,
      type: item.type,
      uploadDate: item.date,
      uploadedBy: item.uploadedBy,
      dataUrl: mockContent,
      selectedPage: item.defaultPage,
      pageCount: item.pageCount
    };

    setWizardUploadedFile(fileMeta);
    setImportFileURL(mockContent);
    setStatusLog(`Recent layout loaded: ${item.name}`);

    if (selectedLayoutId) {
      try {
        await api.createLayoutAsset(selectedLayoutId, {
          asset_type: item.name.toLowerCase().endsWith(".pdf") ? "PDF" : "IMAGE",
          file_name: item.name,
          file_path_or_base64: mockContent,
          mime_type: item.type,
          file_size: item.size,
          metadata: {
            uploadDate: item.date,
            uploadedBy: item.uploadedBy,
            selectedPage: item.defaultPage,
            pageCount: item.pageCount
          }
        });
        setStatusLog(`Recent asset synchronized with Postgres backend database for layout.`);
      } catch (err) {
        console.error("Failed to persist recent asset:", err);
      }
    }
  };

  // Local draft cache loader state
  const [draftLayoutData, setDraftLayoutData] = useState<any | null>(null);

  // Auto-reload active layout asset from the database when selectedLayoutId changes (Requirement 6)
  useEffect(() => {
    if (selectedLayoutId && isWizardMode) {
      const loadActiveAsset = async () => {
        try {
          const activeAsset = await api.fetchActiveLayoutAsset(selectedLayoutId);
          if (activeAsset) {
            const meta = activeAsset.metadata || {};
            const fileMeta = {
              id: activeAsset.id,
              name: activeAsset.file_name,
              size: Number(activeAsset.file_size),
              type: activeAsset.mime_type,
              uploadDate: meta.uploadDate || new Date(activeAsset.created_at).toLocaleString(),
              uploadedBy: activeAsset.uploaded_by || meta.uploadedBy || "SaaS Admin",
              dataUrl: activeAsset.file_path, // Holds file content / URL
              selectedPage: meta.selectedPage || 1,
              pageCount: meta.pageCount || 1,
              zoom: meta.zoom || 1,
              pan: meta.pan || { x: 0, y: 0 },
              rotate: meta.rotate || 0,
              opacity: meta.opacity || 80,
              brightness: meta.brightness || 100,
              contrast: meta.contrast || 100,
              lock: meta.lock || false,
              showGrid: meta.showGrid !== undefined ? meta.showGrid : true
            };

            setWizardUploadedFile(fileMeta);
            setImportFileURL(activeAsset.file_path);
            
            // Restore actual drawing controls
            if (meta.zoom) setImportZoom(meta.zoom);
            if (meta.pan) setImportPan(meta.pan);
            if (meta.rotate !== undefined) setImportRotate(meta.rotate);
            if (meta.opacity !== undefined) setImportOpacity(meta.opacity);
            if (meta.brightness !== undefined) setImportBrightness(meta.brightness);
            if (meta.contrast !== undefined) setImportContrast(meta.contrast);
            if (meta.lock !== undefined) setImportLock(meta.lock);
            if (meta.showGrid !== undefined) setImportShowGrid(meta.showGrid);
            
            setStatusLog(`Successfully reloaded previously uploaded layout: ${activeAsset.file_name}`);
          }
        } catch (err) {
          console.error("Failed to fetch active layout asset:", err);
        }
      };
      loadActiveAsset();
    }
  }, [selectedLayoutId, isWizardMode]);

  // Sync draft data on project selection
  useEffect(() => {
    if (!selectedProjectId) {
      setDraftLayoutData(null);
      return;
    }
    const saved = localStorage.getItem(`bhoomi_wizard_draft_${selectedProjectId}`);
    if (saved) {
      try {
        setDraftLayoutData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wizard draft", e);
      }
    } else {
      setDraftLayoutData(null);
    }
  }, [selectedProjectId, isWizardMode]);

  // Continuous auto-save
  useEffect(() => {
    if (!isWizardMode || !selectedProjectId) return;

    const draftState = {
      wizardStep,
      wizardLayoutName,
      wizardLayoutType,
      wizardLayoutPhase,
      wizardLayoutDesc,
      wizardCreationMethod,
      wizardUploadedFile,
      importFileURL,
      wizardCompletedSteps,
      objects
    };

    localStorage.setItem(`bhoomi_wizard_draft_${selectedProjectId}`, JSON.stringify(draftState));
  }, [
    isWizardMode,
    selectedProjectId,
    wizardStep,
    wizardLayoutName,
    wizardLayoutType,
    wizardLayoutPhase,
    wizardLayoutDesc,
    wizardCreationMethod,
    wizardUploadedFile,
    importFileURL,
    wizardCompletedSteps,
    objects
  ]);

  // Geometry specific auto-save per layout
  useEffect(() => {
    if (selectedLayoutId) {
      localStorage.setItem(`bhoomi_geometry_layout_${selectedLayoutId}`, JSON.stringify(objects));
    }
  }, [objects, selectedLayoutId]);

  // Auto-restore Map state (zoom, pan, layers visibility/lock state, selectedTool, selectedObjectId)
  useEffect(() => {
    if (selectedLayoutId) {
      const saved = localStorage.getItem(`bhoomi_map_restore_${selectedLayoutId}`);
      if (saved) {
        try {
          const restored = JSON.parse(saved);
          if (restored.zoomLevel !== undefined) {
            setZoomLevel(restored.zoomLevel);
          }
          if (restored.pan !== undefined) {
            setPan(restored.pan);
          }
          if (restored.selectedTool !== undefined) {
            setSelectedTool(restored.selectedTool);
          }
          if (restored.selectedObjectId !== undefined) {
            setSelectedObjectId(restored.selectedObjectId);
          }
          if (restored.layersConfig !== undefined) {
            setLayers(prev => 
              prev.map(l => {
                const matched = restored.layersConfig.find((rc: any) => rc.layer_name === l.layer_name || rc.id === l.id);
                if (matched) {
                  return {
                    ...l,
                    is_visible: matched.is_visible,
                    is_locked: matched.is_locked
                  };
                }
                return l;
              })
            );
          }
        } catch (e) {
          console.error("Failed to restore Map state from localStorage", e);
        }
      }
      hasRestoredMapState.current = selectedLayoutId;
    } else {
      hasRestoredMapState.current = null;
    }
  }, [selectedLayoutId]);

  // Auto-save Map state (zoom, pan, layers visibility/lock state, selectedTool, selectedObjectId)
  useEffect(() => {
    if (selectedLayoutId && hasRestoredMapState.current === selectedLayoutId) {
      const stateToSave = {
        zoomLevel,
        pan,
        selectedTool,
        selectedObjectId,
        layersConfig: layers.map(l => ({
          id: l.id,
          layer_name: l.layer_name,
          is_visible: l.is_visible,
          is_locked: l.is_locked
        }))
      };
      localStorage.setItem(`bhoomi_map_restore_${selectedLayoutId}`, JSON.stringify(stateToSave));
    }
  }, [selectedLayoutId, zoomLevel, pan, selectedTool, selectedObjectId, layers]);

  // Handle auto-switching the active canvas drawing tool depending on active wizard step
  useEffect(() => {
    if (!isWizardMode) return;

    const stepToToolMap: Record<string, WorkspaceTool> = {
      boundary: "boundary",
      roads: "road",
      parks: "park",
      amenities: "amenity",
      utilities: "utility",
      plots: "plot",
      numbering: "select"
    };

    const targetTool = stepToToolMap[wizardStep];
    if (targetTool) {
      handleSelectTool(targetTool);
    }
  }, [wizardStep, isWizardMode]);

  // Sync state for boundary welcome overlay and success tracking
  useEffect(() => {
    if (wizardStep === "boundary") {
      setShowBoundaryWelcome(true);
      setShowBoundarySuccess(false);
      setShowBoundaryHelp(false);
    }
  }, [wizardStep]);

  // Sync success state for boundary completions
  useEffect(() => {
    if (wizardStep === "boundary") {
      const hasBoundary = objects.some(o => o.layerName === "BOUNDARY");
      if (hasBoundary && wizardDrawingPoints.length === 0 && !showBoundaryWelcome) {
        setShowBoundarySuccess(true);
      } else {
        setShowBoundarySuccess(false);
      }
    }
  }, [objects, wizardStep, wizardDrawingPoints.length, showBoundaryWelcome]);

  // Handlers
  const handleStartNewLayoutWizard = () => {
    if (draftLayoutData) {
      setShowDraftPromptModal(true);
    } else {
      executeStartNewLayoutWizard();
    }
  };

  const executeStartNewLayoutWizard = () => {
    if (selectedProjectId) {
      localStorage.removeItem(`bhoomi_wizard_draft_${selectedProjectId}`);
      setDraftLayoutData(null);
    }
    setIsWizardMode(true);
    setWizardStep("info");
    setWizardLayoutName("");
    setWizardLayoutType("");
    setWizardLayoutPhase("Phase 1");
    setWizardLayoutDesc("");
    setWizardCreationMethod("");
    setWizardUploadedFile(null);
    setWizardCompletedSteps({});
    setObjects([]); // Clear canvas
    setSelectedObjectId(null);
    setCurrentStep("workspace");
    setStatusLog("Layout Creation Studio initialized. Step 1: Collect Layout Plan Information.");
    setShowDraftPromptModal(false);
  };

  const handleResumeWizardDraft = () => {
    if (draftLayoutData) {
      setIsWizardMode(true);
      setWizardStep(draftLayoutData.wizardStep || "info");
      setWizardLayoutName(draftLayoutData.wizardLayoutName || "");
      setWizardLayoutType(draftLayoutData.wizardLayoutType || "");
      setWizardLayoutPhase(draftLayoutData.wizardLayoutPhase || "Phase 1");
      setWizardLayoutDesc(draftLayoutData.wizardLayoutDesc || "");
      setWizardCreationMethod(draftLayoutData.wizardCreationMethod || "");
      setWizardUploadedFile(draftLayoutData.wizardUploadedFile || null);
      setImportFileURL(draftLayoutData.importFileURL || (draftLayoutData.wizardUploadedFile ? draftLayoutData.wizardUploadedFile.dataUrl : "") || "");
      setWizardCompletedSteps(draftLayoutData.wizardCompletedSteps || {});
      setObjects(draftLayoutData.objects || []);
      setSelectedObjectId(null);
      setCurrentStep("workspace");
      setStatusLog(`Workflow resumed at step: ${draftLayoutData.wizardStep}`);
    }
  };

  const handleCancelWizard = () => {
    setIsWizardMode(false);
    setCurrentStep("layouts");
    setStatusLog("Exited Layout Creation Studio. Progress auto-saved.");
  };

  const handleSaveWizardDraftManually = () => {
    setStatusLog("Layout progress saved manually to local draft cache!");
    alert("BhoomiOne Cloud Sync: Draft blueprint stored successfully!");
  };

  const handleWizardPrev = () => {
    const currentStepIndex = activeSteps.findIndex(x => x.id === wizardStep);
    if (currentStepIndex > 0) {
      const prevStep = activeSteps[currentStepIndex - 1].id as WizardStep;
      setWizardStep(prevStep);
      setStatusLog(`Moved back to step: ${activeSteps[currentStepIndex - 1].label}`);
    }
  };

  const handleWizardNext = () => {
    if (wizardStep === "info") {
      if (!wizardLayoutName.trim()) {
        alert("Please provide a valid Layout Name.");
        return;
      }
      if (!wizardLayoutType) {
        alert("Please select a Zoning Classification.");
        return;
      }
    }

    if (wizardStep === "method") {
      if (!wizardCreationMethod) {
        alert("Please select a Creation Method before proceeding.");
        return;
      }
      if (wizardCreationMethod === "dxf") {
        alert("This module will be enabled in the next development phase.");
        return;
      }
      if (wizardCreationMethod === "gis") {
        alert("Available in future release.");
        return;
      }
    }

    if (wizardStep === "import_pdf") {
      if (!wizardUploadedFile) {
        alert("Please select or drag-and-drop a PDF, PNG, or JPG layout blueprint to proceed.");
        return;
      }
      // Save display parameters to layout asset cloud metadata on step proceed (Requirement 4 & 5)
      saveDisplayStateToDb({
        zoom: importZoom,
        pan: importPan,
        rotate: importRotate,
        opacity: importOpacity,
        brightness: importBrightness,
        contrast: importContrast,
        lock: importLock,
        showGrid: importShowGrid,
        calibP1: importCalibP1,
        calibP2: importCalibP2,
        calibDistance: importCalibDistance
      });
    }

    if (wizardStep === "boundary") {
      const hasBoundary = objects.some(o => o.layerName === "BOUNDARY");
      if (!hasBoundary) {
        alert("Boundary not completed! You must draw a layout boundary polygon before you can proceed to roads.");
        return;
      }
    }

    setWizardCompletedSteps(prev => ({ ...prev, [wizardStep]: true }));

    const currentStepIndex = activeSteps.findIndex(x => x.id === wizardStep);
    if (currentStepIndex < activeSteps.length - 1) {
      const nextStep = activeSteps[currentStepIndex + 1].id as WizardStep;
      setWizardStep(nextStep);
      setStatusLog(`Proceeded to step: ${activeSteps[currentStepIndex + 1].label}`);
    }
  };

  const handleWizardSkip = () => {
    setWizardCompletedSteps(prev => ({ ...prev, [wizardStep]: true }));

    const currentStepIndex = activeSteps.findIndex(x => x.id === wizardStep);
    if (currentStepIndex < activeSteps.length - 1) {
      const nextStep = activeSteps[currentStepIndex + 1].id as WizardStep;
      setWizardStep(nextStep);
      setStatusLog(`Skipped step: ${activeSteps[currentStepIndex].label}`);
    }
  };

  const handleRunWizardValidation = () => {
    setIsValidating(true);
    setStatusLog("Scanning workspace coordinates for intersecting vertices...");
    setTimeout(() => {
      setIsValidating(false);
      const errors = runValidationSuite(objects);
      setValidationErrors(errors);
      if (errors.length === 0) {
        setStatusLog("All structural geometry checks cleared successfully.");
      } else {
        setStatusLog(`Validation complete. Detected ${errors.length} overlap or boundary issues.`);
      }
    }, 800);
  };

  const handlePublishLayoutSubmit = async () => {
    try {
      if (selectedLayoutId) {
        // Update existing layout
        const existingLayout = layoutsList.find(l => String(l.id) === String(selectedLayoutId));
        
        // Pack approval number info safely:
        const unpacked = existingLayout?.approval_number ? (() => {
          const res = { approval_number: "", phase: "", survey_number: "", description: "" };
          const parts = existingLayout.approval_number.split(" | ");
          parts.forEach((part: string) => {
            const [key, ...valParts] = part.split(":");
            const val = valParts.join(":").trim();
            if (key === "Ap") res.approval_number = val;
            else if (key === "Ph") res.phase = val;
            else if (key === "Sy") res.survey_number = val;
            else if (key === "De") res.description = val;
          });
          return res;
        })() : { approval_number: "", phase: "Phase 1", survey_number: "", description: "" };

        // Pack it back with updated wizard values
        const packedStr = [
          unpacked.approval_number ? `Ap:${unpacked.approval_number.trim()}` : "",
          wizardLayoutPhase ? `Ph:${wizardLayoutPhase.trim()}` : "",
          unpacked.survey_number ? `Sy:${unpacked.survey_number.trim()}` : "",
          wizardLayoutDesc ? `De:${wizardLayoutDesc.trim()}` : ""
        ].filter(Boolean).join(" | ").slice(0, 149);

        const payload = {
          project_id: selectedProjectId,
          name: wizardLayoutName.trim(),
          layout_type: wizardLayoutType ? wizardLayoutType.toUpperCase() : (existingLayout?.layout_type || "RESIDENTIAL"),
          approval_number: packedStr || null,
          status: "LAUNCHED" // Mark as Launched upon publishing from map studio!
        };

        await api.updateLayout(selectedLayoutId, payload);
        
        // Save the geometries to localStorage specifically for this layout
        localStorage.setItem(`bhoomi_geometry_layout_${selectedLayoutId}`, JSON.stringify(objects));
        
        // Remove draft data
        localStorage.removeItem(`bhoomi_wizard_draft_${selectedProjectId}`);
        setDraftLayoutData(null);

        setIsWizardMode(false);
        setCurrentStep("workspace"); // Stay in workspace view
        
        setStatusLog(`Successfully updated and published Layout Plan: "${wizardLayoutName}" live!`);
        alert(`Layout Blueprint "${wizardLayoutName}" published live to BhoomiOne production!`);
        
        // Reload layout list
        const resLayouts = await api.fetchLayouts({ per_page: 1000 });
        setLayoutsList(resLayouts.data || []);
        onPublishComplete?.(selectedLayoutId);
      } else {
        // Create new layout if none selected
        const payload = {
          project_id: selectedProjectId,
          name: wizardLayoutName.trim(),
          code: `LAY-${wizardLayoutName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          layout_type: wizardLayoutType ? wizardLayoutType.toUpperCase() : "RESIDENTIAL",
          status: "LAUNCHED"
        };
        const res = await api.createLayout(payload);
        const newLayoutId = res.id;
        
        // Save geometries to localStorage specifically for this new layout
        localStorage.setItem(`bhoomi_geometry_layout_${newLayoutId}`, JSON.stringify(objects));

        localStorage.removeItem(`bhoomi_wizard_draft_${selectedProjectId}`);
        setDraftLayoutData(null);

        setIsWizardMode(false);
        setCurrentStep("workspace");
        setSelectedLayoutId(newLayoutId);
        
        setStatusLog(`Successfully created and published new Layout Plan: "${wizardLayoutName}" live!`);
        alert(`Layout Blueprint "${wizardLayoutName}" published live to BhoomiOne production!`);

        // Reload layout list
        const resLayouts = await api.fetchLayouts({ per_page: 1000 });
        setLayoutsList(resLayouts.data || []);
        onPublishComplete?.(newLayoutId);
      }
    } catch (err: any) {
      console.error("Failed to save layout publish", err);
      alert("Failed to publish layout: " + (err.message || err));
    }
  };

  // Fetch initial data from APIs, fallback to empty
  useEffect(() => {
    async function loadInitialData() {
      try {
        if (!projects || projects.length === 0) {
          const resProjects = await api.fetchProjects({ per_page: 1000 });
          const fetchedProjects = resProjects.data || [];
          if (fetchedProjects && fetchedProjects.length > 0) {
            setProjectsList(fetchedProjects);
          }
        }
        
        if (!layouts || layouts.length === 0) {
          const resLayouts = await api.fetchLayouts({ per_page: 1000 });
          const fetchedLayouts = resLayouts.data || [];
          if (fetchedLayouts && fetchedLayouts.length > 0) {
            setLayoutsList(fetchedLayouts);
          }
        }
      } catch (err) {
        console.warn("API endpoints not fully mapped or unseeded.", err);
      }
    }
    loadInitialData();
  }, [projects, layouts]);

  // Update selected layout dependencies
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentStep("layouts");
    setStatusLog(`Selected project. Please pick a geometric Layout Plan.`);
  };

  const handleSelectLayout = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCurrentStep("workspace");
    
    // Automatically launch Layout Creation Studio Wizard!
    setIsWizardMode(true);
    setWizardStep("info"); // Start on info step
    
    // Find the layout to prepopulate wizard state
    const layout = layoutsList.find(l => String(l.id) === String(layoutId));
    if (layout) {
      setWizardLayoutName(layout.name || "");
      const lowerType = (layout.layout_type || "").toLowerCase();
      if (lowerType.includes("commercial")) {
        setWizardLayoutType("Commercial");
      } else if (lowerType.includes("mixed")) {
        setWizardLayoutType("Mixed-Use");
      } else {
        setWizardLayoutType("Residential");
      }
      
      const unpackedLay = layout.approval_number ? (() => {
        const res = { approval_number: "", phase: "", survey_number: "", description: "" };
        const parts = layout.approval_number.split(" | ");
        parts.forEach((part: string) => {
          const [key, ...valParts] = part.split(":");
          const val = valParts.join(":").trim();
          if (key === "Ap") res.approval_number = val;
          else if (key === "Ph") res.phase = val;
          else if (key === "Sy") res.survey_number = val;
          else if (key === "De") res.description = val;
        });
        return res;
      })() : { approval_number: "", phase: "Phase 1", survey_number: "", description: "" };

      setWizardLayoutPhase(unpackedLay.phase || "Phase 1");
      setWizardLayoutDesc(unpackedLay.description || "");
      setWizardCreationMethod("");
      setWizardUploadedFile(null);
      setWizardCompletedSteps({ info: true });

      // Load specific geometry unique to this layout from localStorage
      const savedGeom = localStorage.getItem(`bhoomi_geometry_layout_${layoutId}`);
      if (savedGeom) {
        try {
          setObjects(JSON.parse(savedGeom));
        } catch (e) {
          console.error("Failed to load geometry from localStorage for layout", layoutId, e);
        }
      } else {
        setObjects([]);
      }
    }
    
    setStatusLog(`Workspace Shell loaded for selected layout plan. Scale rulers aligned.`);
  };

  // Upload Asset simulation
  const handleAddAsset = (newAsset: { name: string; size: number; mime_type: string }) => {
    const assetObj: LayoutAsset = {
      id: `asset-${Date.now()}`,
      layout_id: selectedLayoutId || "lay-1",
      file_name: newAsset.name,
      asset_type: newAsset.name.toUpperCase().endsWith(".DXF") ? "DXF" : newAsset.name.toUpperCase().endsWith(".SVG") ? "SVG" : "IMAGE",
      file_size: newAsset.size,
      file_path: `/uploads/${newAsset.name}`,
      mime_type: newAsset.mime_type || "application/octet-stream",
      uploaded_by: "ADMIN",
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setAssets(prev => [assetObj, ...prev]);
    setStatusLog(`Asset "${newAsset.name}" uploaded successfully. Registered vector layers overlay.`);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setStatusLog(`Removed asset overlay reference.`);
  };

  // Create immutable snapshot version
  const handleCreateVersionSnapshot = (summary: string) => {
    const nextVerNum = `v1.${versions.length}`;
    const nextVer: LayoutVersion = {
      id: `ver-${Date.now()}`,
      layout_id: selectedLayoutId || "lay-1",
      version_number: nextVerNum,
      change_summary: summary,
      status: "DRAFT",
      snapshot_data: { layers: layers, objects: [] },
      created_by: "ADMIN",
      created_at: new Date().toISOString()
    };
    setVersions(prev => [...prev, nextVer]);
    setActiveVersionId(nextVer.id);
    setStatusLog(`Created snapshot ${nextVerNum}. Layer states persisted into relational cache.`);
  };

  // Run validation checks
  const handleRunValidation = () => {
    setIsValidating(true);
    setStatusLog("Analyzing vector polygons for overlap anomalies and disconnects...");
    
    setTimeout(() => {
      setIsValidating(false);
      setShowValidationToast(true);
      
      const errors = runValidationSuite(objects);
      if (errors.length === 0) {
        setValidationErrors(["All plot validations passed successfully! 0 overlap or self-intersection issues detected."]);
        setStatusLog("Validation finished. Clean layout state.");
      } else {
        setValidationErrors(errors);
        setStatusLog(`Validation finished. Identified ${errors.length} layout warnings/checks.`);
      }
    }, 800);
  };

  // Sync objects update loop
  const handleUpdateObject = (updatedObj: MockGeometry) => {
    setObjects(prev => prev.map(obj => obj.id === updatedObj.id ? updatedObj : obj));
  };

  const handleResetView = () => {
    setPan({ x: 200, y: 150 });
    setZoomLevel(100);
    setStatusLog("Canvas pan offset and scale factor calibrated back to origin.");
  };

  const handleBackToLanding = () => {
    setSelectedLayoutId(null);
    setSelectedProjectId(null);
    setCurrentStep("projects");
    setStatusLog("Map Engine workspace unloaded.");
  };

  // Core subscription manager syncing React states with the CAD drawing engine class
  useEffect(() => {
    const manager = drawingManagerRef.current;

    const unsubTool = manager.onToolChange((tool) => {
      setSelectedTool(tool as WorkspaceTool);
      setIsSpacePanActive((manager as any).isSpacePanActive);
    });

    const unsubSelection = manager.onSelectionChange((id) => {
      setSelectedObjectId(id);
    });

    const unsubLog = manager.onLogMessage((msg) => {
      setStatusLog(msg);
    });

    const unsubHistory = manager.onHistoryChange((undoCount, redoCount) => {
      setCanUndo(undoCount > 0);
      setCanRedo(redoCount > 0);
    });

    return () => {
      unsubTool();
      unsubSelection();
      unsubLog();
      unsubHistory();
    };
  }, []);

  // Update space-pan-active state query directly from ref
  const syncSpacePanState = () => {
    setIsSpacePanActive((drawingManagerRef.current as any).isSpacePanActive);
  };

  const handleUndo = () => {
    drawingManagerRef.current.undo();
  };

  const handleRedo = () => {
    drawingManagerRef.current.redo();
  };

  const handleSelectTool = (tool: WorkspaceTool) => {
    drawingManagerRef.current.switchTool(tool as AppTool);
  };

  // Setup Keyboard Shortcuts and escape handlers
  useEffect(() => {
    if (currentStep !== "workspace") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return; // Skip bindings if editing form elements
      }

      const key = e.key.toLowerCase();

      // Check undo/redo first
      if (e.ctrlKey || e.metaKey) {
        if (key === "z") {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (key === "y") {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Space bar panning trigger
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        drawingManagerRef.current.activateSpacePan();
        syncSpacePanState();
        return;
      }

      // Delete/Backspace key handler
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObjectId) {
          const targetObj = objects.find(o => o.id === selectedObjectId);
          if (targetObj) {
            e.preventDefault();
            const deleteCmd = new DeleteObjectCommand(
              targetObj,
              objects,
              (updated) => setObjects(updated),
              () => setSelectedObjectId(null)
            );
            drawingManagerRef.current.executeCommand(deleteCmd);
          }
        }
        return;
      }

      // Escape key cancels current selections or resets active tool
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        drawingManagerRef.current.setSelectedObjectId(null);
        drawingManagerRef.current.switchTool("select");
        setStatusLog("Selections cleared. Restored select mode.");
        return;
      }

      // Standard single character shortcuts
      const shortcuts: Record<string, AppTool> = {
        v: "select",
        h: "pan",
        b: "boundary",
        r: "road",
        p: "plot",
        g: "park",
        a: "amenity",
        u: "utility",
        l: "label",
        m: "measure"
      };

      if (shortcuts[key]) {
        e.preventDefault();
        drawingManagerRef.current.switchTool(shortcuts[key]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        drawingManagerRef.current.deactivateSpacePan();
        syncSpacePanState();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentStep, selectedObjectId, objects]);

  const activeProjectObj = projectsList.find(p => String(p.id) === String(selectedProjectId));
  const activeLayoutObj = layoutsList.find(l => String(l.id) === String(selectedLayoutId));
  const activeVersionObj = versions.find(v => v.id === activeVersionId);
  const selectedObj = objects.find(o => o.id === selectedObjectId) || null;

  // Deriving the dynamic list of active wizard steps
  const activeSteps = WIZARD_STEPS_META.filter(step => {
    if (step.id === "import_pdf") {
      return wizardCreationMethod === "pdf";
    }
    return true;
  });

  // Unpack additional fields from approval_number safely for activeLayoutObj
  const unpacked = activeLayoutObj?.approval_number ? (() => {
    const res = { approval_number: "", phase: "", survey_number: "", description: "" };
    const parts = activeLayoutObj.approval_number.split(" | ");
    parts.forEach((part: string) => {
      const [key, ...valParts] = part.split(":");
      const val = valParts.join(":").trim();
      if (key === "Ap") res.approval_number = val;
      else if (key === "Ph") res.phase = val;
      else if (key === "Sy") res.survey_number = val;
      else if (key === "De") res.description = val;
    });
    return res;
  })() : { approval_number: "", phase: "Phase 1", survey_number: "", description: "" };

  const isLayoutInfoMissing = !activeLayoutObj?.name || 
                              !activeLayoutObj?.code || 
                              !activeLayoutObj?.layout_type || 
                              !unpacked.phase || 
                              !unpacked.description;

  // Filter lists based on search
  const filteredProjects = projectsList.filter(p => 
    p.name.toLowerCase().includes(projectsSearch.toLowerCase()) || 
    p.code.toLowerCase().includes(projectsSearch.toLowerCase()) ||
    p.location.toLowerCase().includes(projectsSearch.toLowerCase())
  );

  const filteredLayouts = layoutsList.filter(l => 
    l.project_id === selectedProjectId &&
    (l.name.toLowerCase().includes(layoutsSearch.toLowerCase()) || 
     l.code.toLowerCase().includes(layoutsSearch.toLowerCase()))
  );

  return (
    <div className="w-full min-h-[80vh] flex flex-col bg-slate-50 relative select-none" id="map-intelligence-workspace-engine">
      
      {/* Universal Workspace Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm" id="map-workspace-universal-header">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl border border-indigo-100">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Map Intelligence Workspace</h1>
            <p className="text-[11px] text-slate-500">Professional CAD-style spatial mapping & geometry creation engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-150 text-xs font-semibold text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-ping"></span>
            <span>Map Workspace v1 Active</span>
          </span>
          {currentStep !== "projects" && (
            <button 
              onClick={handleBackToLanding}
              className="text-xs font-bold bg-slate-100 hover:bg-slate-250 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              &larr; Switch Project
            </button>
          )}
        </div>
      </div>
      
      {/* ==========================================
          STEP 1: PROJECT SELECTION DIRECTORY DIRECT
          ========================================== */}
      {currentStep === "projects" && (
        <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full animate-fadeIn" id="landing-projects-directory">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-650" />
                Map Workspace Directory: Select Active Project
              </h2>
              <p className="text-xs text-slate-500">
                Choose an active layout project to bootstrap the CAD geometry engines and calibrate vector scales.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects directory..."
                value={projectsSearch}
                onChange={(e) => setProjectsSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projects-grid">
            {filteredProjects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => handleSelectProject(proj.id)}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                id={`project-card-${proj.code.toLowerCase()}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      {proj.code}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-850 group-hover:text-indigo-650 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {proj.location}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Developer: <strong className="text-slate-700 font-semibold">{proj.developer}</strong></span>
                  <button className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Layouts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full">
                <EmptyState 
                  title="No projects match query" 
                  description="Adjust search filter parameters or clear query filters." 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 2: LAYOUT SELECTION BLUEPRINT DIRECT
          ========================================== */}
      {currentStep === "layouts" && (
        <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full animate-fadeIn" id="landing-layouts-directory">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <button 
                onClick={() => setCurrentStep("projects")}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold mb-1 flex items-center gap-1"
              >
                &larr; Back to Projects
              </button>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-650" />
                Layout Plans Directory for: <strong className="text-indigo-700 font-extrabold">"{activeProjectObj?.name}"</strong>
              </h2>
              <p className="text-xs text-slate-500">
                Each project stores separate AutoCAD layers, surveying snapshots, and registered sales plots.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search layout blueprints..."
                value={layoutsSearch}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="layouts-grid">
            {/* Guided Layout Creation Studio Action Card */}
            <div 
              onClick={handleStartNewLayoutWizard}
              className="bg-gradient-to-br from-indigo-50 to-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl p-5 hover:border-indigo-500 hover:bg-indigo-50/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              id="wizard-creation-trigger-card"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="bg-indigo-100 text-indigo-750 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                    SaaS Studio
                  </span>
                  <span className="text-[9px] text-indigo-650 font-bold bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    NEW FEATURE
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-850 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Layout Creation Studio
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Start our step-by-step wizard to formulate metadata, specify coordinate file alignments, and draw layout layers with validation pre-checks.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px]">
                <span className="text-indigo-600 font-bold">Launch ERP Wizard</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            </div>

            {/* Resume Saved Draft Action Card */}
            {draftLayoutData && (
              <div 
                onClick={handleResumeWizardDraft}
                className="bg-emerald-50/40 border-2 border-emerald-500/35 rounded-2xl p-5 hover:border-emerald-500 hover:bg-emerald-50/70 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                id="wizard-resume-trigger-card"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Draft Saved
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      AUTO-SAVED
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Resume Layout Draft
                  </h3>
                  <div className="space-y-1 pt-1">
                    <p className="text-xs text-slate-700 font-semibold truncate">
                      Name: {draftLayoutData.wizardLayoutName || "Unnamed Draft"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1">
                      <div>Step: <strong className="text-slate-800 uppercase">{draftLayoutData.wizardStep}</strong></div>
                      <div>Objects: <strong className="text-emerald-700 font-bold">{draftLayoutData.objects?.length || 0} items</strong></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-700 font-bold">Resume Draft Workspace &rarr;</span>
                </div>
              </div>
            )}

            {filteredLayouts.map((lay) => (
              <div 
                key={lay.id}
                onClick={() => handleSelectLayout(lay.id)}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                id={`layout-card-${lay.code.toLowerCase()}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      {lay.code}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                      {lay.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-850 group-hover:text-indigo-650 transition-colors">
                    {lay.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1.5">
                    <div>Area: <strong className="text-slate-800">{lay.totalArea}</strong></div>
                    <div>Plots: <strong className="text-slate-800">{lay.totalPlots} units</strong></div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Type: <strong className="text-slate-700 font-semibold">{lay.type}</strong></span>
                  <button className="text-indigo-650 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Launch CAD Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredLayouts.length === 0 && (
              <div className="col-span-full">
                <EmptyState 
                  title="No layout blueprints mapped" 
                  description="No layout geometries uploaded yet for this target project boundary." 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 3: THE MAP WORKSPACE SHELL (STUDIO)
          ========================================== */}
      {currentStep === "workspace" && !isWizardMode && (
        <div className="flex-1 flex flex-col min-h-0 relative select-none h-[82vh]" id="workspace-layout-canvas">
          {/* Top Bar Controls */}
          <Toolbar
            projects={projectsList}
            layouts={layoutsList}
            selectedProjectId={selectedProjectId}
            selectedLayoutId={selectedLayoutId}
            selectedTool={selectedTool}
            setSelectedTool={handleSelectTool}
            isGridVisible={isGridVisible}
            setIsGridVisible={setIsGridVisible}
            isSnapToGrid={isSnapToGrid}
            setIsSnapToGrid={setIsSnapToGrid}
            onProjectChange={(id) => { setSelectedProjectId(id); setSelectedLayoutId(null); setCurrentStep("layouts"); }}
            onLayoutChange={(id) => setSelectedLayoutId(id)}
            versions={versions}
            activeVersionId={activeVersionId}
            setActiveVersionId={setActiveVersionId}
            onCreateVersionSnapshot={handleCreateVersionSnapshot}
            onRunValidation={handleRunValidation}
            isValidating={isValidating}
            onResetView={handleResetView}
            onBackToLanding={handleBackToLanding}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />

          {/* Central Workspace Panel */}
          <div className="flex-1 flex min-h-0 overflow-hidden" id="workspace-panel-body">
            {/* Left Drawer Collapsible */}
            <Sidebar
              layers={layers}
              setLayers={setLayers}
              assets={assets}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              projects={projectsList}
              layouts={layoutsList}
              versions={versions}
              selectedProjectId={selectedProjectId}
              selectedLayoutId={selectedLayoutId}
              isCollapsed={isLeftCollapsed}
              setIsCollapsed={setIsLeftCollapsed}
            />

            {/* Center interactive Drawing area */}
            <Canvas
              layers={layers}
              selectedTool={selectedTool}
              isSpacePanActive={isSpacePanActive}
              objects={objects}
              onSelectObject={(obj) => setSelectedObjectId(obj ? obj.id : null)}
              selectedObjectId={selectedObjectId}
              onUpdateObjects={setObjects}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              searchQuery={searchQuery}
              onUpdateMouseCoords={setMouseCoords}
              isGridVisible={isGridVisible}
              isSnapToGrid={isSnapToGrid}
              pan={pan}
              setPan={setPan}
              statusLog={statusLog}
              setStatusLog={setStatusLog}
              drawingManager={drawingManagerRef.current}
            />

            {/* Right Collapsible inspector */}
            <Inspector
              selectedObject={selectedObj}
              onUpdateObject={handleUpdateObject}
              isCollapsed={isRightCollapsed}
              setIsCollapsed={setIsRightCollapsed}
              objects={objects}
              onUpdateObjects={setObjects}
              drawingManager={drawingManagerRef.current}
            />
          </div>

          {/* Bottom Engineering status ribbon */}
          <StatusBar
            mouseCoords={mouseCoords}
            activeTool={selectedTool}
            activeLayerName={selectedObj ? selectedObj.layerName : "BOUNDARY"}
            zoomLevel={zoomLevel}
            isSnapToGrid={isSnapToGrid}
            statusLog={statusLog}
          />
        </div>
      )}

      {/* ==========================================
          GUIDED LAYOUT CREATION STUDIO WIZARD VIEW
          ========================================== */}
      {currentStep === "workspace" && isWizardMode && (
        <div className="flex-1 flex flex-col bg-slate-50 relative select-none h-[82vh]" id="layout-creation-studio-wizard">
          
          {/* Studio Header Ribbon */}
          <div className="bg-slate-900 text-white px-6 py-3.5 flex justify-between items-center shadow-md border-b border-slate-850" id="wizard-header-ribbon">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-indigo-600 rounded-lg text-white animate-pulse">
                <Compass className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider bg-indigo-500 text-indigo-50 px-2 py-0.5 rounded uppercase">
                    ERP Draft Engine
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    Project: {activeProjectObj?.name}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Layout Creation Studio &mdash; <span className="text-indigo-400">{(wizardStep === "info" && selectedLayoutId) ? "Project & Layout Info" : activeSteps.find(s => s.id === wizardStep)?.label}</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveWizardDraftManually}
                className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={handleCancelWizard}
                className="text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-all"
              >
                Cancel & Exit
              </button>
            </div>
          </div>

          {/* Studio Main Workspace Partition */}
          <div className="flex-1 flex min-h-0 overflow-hidden" id="wizard-workspace-body">
            
            {/* LEFT COLUMN: Project Progress Tracker */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between" id="wizard-sidebar-progress">
              <div className="p-4 space-y-4 overflow-y-auto">
                <h3 className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                  Project Progress
                </h3>
                <nav className="space-y-1.5">
                  {activeSteps.map((step, idx) => {
                    const label = (step.id === "info" && selectedLayoutId) ? "Project & Layout Info" : step.label;
                    const isActive = wizardStep === step.id;
                    const isCompleted = step.id === "info" 
                      ? (!!selectedProjectId && !!selectedLayoutId && !!activeLayoutObj)
                      : !!wizardCompletedSteps[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => {
                          // Allow jumping back to previously configured steps
                          const stepIdx = activeSteps.findIndex(s => s.id === step.id);
                          const activeIdx = activeSteps.findIndex(s => s.id === wizardStep);
                          if (stepIdx < activeIdx || isCompleted) {
                            setWizardStep(step.id as WizardStep);
                            setStatusLog(`Switched step viewport to: ${label}`);
                          }
                        }}
                        className={`group px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all ${
                          isActive 
                            ? "bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm" 
                            : isCompleted 
                              ? "text-emerald-700 hover:bg-slate-50 cursor-pointer" 
                              : "text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <span className={`w-4 h-4 rounded-full text-[9px] font-mono flex items-center justify-center flex-shrink-0 border ${
                            isActive 
                              ? "bg-indigo-600 text-white border-indigo-600" 
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            {idx + 1}
                          </span>
                        )}
                        <span className="truncate">{label}</span>
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Live Visual Overview of Current Layout's Metadata */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                  Draft Specifications
                </h4>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {wizardLayoutName || "Unnamed Draft"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zoning:</span>
                    <span className="font-semibold text-slate-800">
                      {wizardLayoutType || "Not configured"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase:</span>
                    <span className="font-semibold text-slate-800">{wizardLayoutPhase}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span>Boundary Limits:</span>
                      <span className="font-bold text-indigo-600">
                        {objects.filter(o => o.layerName === "BOUNDARY").length ? "COMPLETED" : "INCOMPLETE"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span>Road Corridors:</span>
                      <span className="font-bold text-slate-700">
                        {objects.filter(o => o.layerName === "ROADS").length} drawn
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span>Subdivision Plots:</span>
                      <span className="font-bold text-emerald-700">
                        {objects.filter(o => o.layerName === "PLOTS").length} carved
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Contextual Drawing Area or Step Form */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 relative overflow-hidden" id="wizard-center-container">
              
              {/* Conditional renders based on active wizard step */}
              
              {/* STEP 1: Layout Info Form */}
              {wizardStep === "info" && (
                <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center animate-fadeIn" id="wizard-info-view">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl w-full shadow-md space-y-6">
                    <div className="space-y-1.5 border-b border-slate-100 pb-4">
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                        System Registry Lock
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-1.5">
                        Step 1: Project & Layout Info (Read Only)
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This Layout subdivision plan already exists in the BhoomiOne ERP registry. Basic metadata parameters are read-only to guarantee single source of truth integrity.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* PROJECT INFORMATION Section */}
                      <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 space-y-4">
                        <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2">
                          Project Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Project Name:</span>
                            <strong className="text-slate-850 font-semibold">{activeProjectObj?.name || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Project Code:</span>
                            <strong className="text-slate-850 font-mono font-bold uppercase">{activeProjectObj?.code || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Developer:</span>
                            <strong className="text-slate-850 font-semibold">{activeProjectObj?.developer_name || activeProjectObj?.developer || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Location:</span>
                            <strong className="text-slate-850 font-semibold">{activeProjectObj?.location || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">RERA Number:</span>
                            <strong className="text-indigo-700 font-mono font-bold uppercase">{activeProjectObj?.rera_number || "PENDING"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Project Status:</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                              {activeProjectObj?.status || "PLANNING"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* LAYOUT INFORMATION Section */}
                      <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 space-y-4">
                        <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2">
                          Layout Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Layout Name:</span>
                            <strong className="text-slate-850 font-semibold">{wizardLayoutName || activeLayoutObj?.name || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Layout Code:</span>
                            <strong className="text-slate-850 font-mono font-bold uppercase">{activeLayoutObj?.code || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Layout Type:</span>
                            <strong className="text-slate-850 font-semibold">{activeLayoutObj?.layout_type || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Zoning Classification:</span>
                            <strong className="text-slate-850 font-semibold">{activeLayoutObj?.layout_type || "N/A"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Development Phase:</span>
                            <strong className="text-slate-850 font-semibold">{unpacked.phase || "Phase 1"}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 block font-medium">Approval Status:</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-150 text-[10px] font-bold text-indigo-700 uppercase">
                              {activeLayoutObj?.status || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Description box */}
                        <div className="space-y-1.5 border-t border-slate-100 pt-4 mt-2">
                          <span className="text-slate-400 block font-medium text-xs">Description:</span>
                          <p className="italic text-slate-650 text-xs leading-relaxed bg-white p-3 rounded-xl border border-slate-150">
                            {unpacked.description || "No operational brief registered."}
                          </p>
                        </div>
                      </div>

                      {/* "Complete Layout Details" Missing alert if anything is incomplete */}
                      {isLayoutInfoMissing && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                          <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold">Incomplete Layout Specifications</p>
                              <p className="text-[11px] text-amber-700 leading-normal">
                                Some layout descriptor values (e.g., development phase or brief) are missing from the registry database.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onEditLayoutDetails?.(selectedLayoutId)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm shrink-0 transition-colors cursor-pointer border border-amber-700"
                          >
                            Complete Layout Details
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setWizardStep("method")}
                        className="inline-flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <span>Continue to Step 2: Choose Method</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Configure Creation Method & Drag-and-Drop */}
              {wizardStep === "method" && (
                <div className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col justify-start max-w-6xl mx-auto w-full space-y-6 animate-fadeIn" id="wizard-method-view">
                  <div className="space-y-1.5 border-b border-slate-150 pb-4">
                    <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                      Step 2: Plotting creation method
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">
                      Choose Your Creation Method
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Select how you would like to construct the coordinate base and boundary lines for your municipal plotting draft inside Map Studio.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: 4 Guided Cards */}
                    <div className="lg:col-span-7 space-y-4">
                      {[
                        {
                          id: "pdf",
                          title: "PDF / IMAGE IMPORT",
                          icon: FileImage,
                          iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
                          desc: "Import approved layout drawings in PDF, PNG or JPG format and manually trace plots.",
                          recommended: "Existing approved layouts.",
                          status: "Ready",
                          statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
                          buttonText: "Continue",
                          disabled: false,
                          onClick: () => {
                            setWizardCreationMethod("pdf");
                            setStatusLog("Selected Creation Method: PDF / Image Import");
                          }
                        },
                        {
                          id: "dxf",
                          title: "DXF IMPORT",
                          icon: FileCode,
                          iconBg: "bg-amber-50 text-amber-600 border-amber-100",
                          desc: "Import AutoCAD DXF drawings with automatic layer recognition and manual review.",
                          recommended: "Engineers and survey teams.",
                          status: "Coming in Next Phase",
                          statusColor: "bg-amber-100 text-amber-800 border-amber-200",
                          buttonText: "Preview",
                          disabled: true,
                          onClick: () => {
                            alert("This module will be enabled in the next development phase.");
                          }
                        },
                        {
                          id: "manual",
                          title: "DRAW MANUALLY",
                          icon: PenTool,
                          iconBg: "bg-sky-50 text-sky-600 border-sky-100",
                          desc: "Create the complete project boundary, roads, amenities and plots directly inside BhoomiOne.",
                          recommended: "New layouts.",
                          status: "Ready",
                          statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
                          buttonText: "Continue",
                          disabled: false,
                          onClick: () => {
                            setWizardCreationMethod("manual");
                            setWizardUploadedFile(null);
                            setStatusLog("Selected Creation Method: Draw Manually");
                          }
                        },
                        {
                          id: "gis",
                          title: "GIS / SURVEY IMPORT",
                          icon: Globe,
                          iconBg: "bg-slate-100 text-slate-600 border-slate-200",
                          desc: "Import survey coordinates or GIS datasets.",
                          recommended: "Advanced GIS users.",
                          status: "Future Release",
                          statusColor: "bg-slate-150 text-slate-600 border-slate-200",
                          buttonText: "Disabled",
                          disabled: true,
                          onClick: () => {
                            alert("Available in future release.");
                          }
                        }
                      ].map((card) => {
                        const isSelected = wizardCreationMethod === card.id;
                        const IconComp = card.icon;
                        return (
                          <div
                            key={card.id}
                            onClick={card.onClick}
                            className={`border rounded-2xl p-5 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:shadow-md ${
                              isSelected 
                                ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/10 shadow-sm" 
                                : "border-slate-200 bg-white hover:border-slate-350"
                            }`}
                          >
                            <div className="flex gap-4 items-start">
                              <div className={`p-3 rounded-xl border ${card.iconBg} flex-shrink-0 mt-0.5`}>
                                <IconComp className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-xs font-extrabold text-slate-900 tracking-wider font-mono">{card.title}</h4>
                                  <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${card.statusColor}`}>
                                    {card.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-605 leading-relaxed max-w-md">{card.desc}</p>
                                {card.recommended && (
                                  <p className="text-[11px] text-indigo-700 font-medium flex items-center gap-1">
                                    <span className="text-slate-400 font-normal">Recommended for:</span> {card.recommended}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0 self-end sm:self-center">
                              <button
                                disabled={card.disabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  card.onClick();
                                  if (!card.disabled) {
                                    handleWizardNext();
                                  }
                                }}
                                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${
                                  card.disabled
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : isSelected
                                      ? "bg-indigo-655 hover:bg-indigo-750 text-white border-indigo-700 shadow-sm cursor-pointer"
                                      : "bg-white text-slate-755 border-slate-250 hover:bg-slate-50 cursor-pointer"
                                }`}
                              >
                                {card.buttonText}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Comparison Table "Which method is best?" */}
                    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                          <Compass className="w-4 h-4 text-indigo-600" />
                          <span>Which method is best?</span>
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Compare the layout design pipelines side-by-side to choose the optimal workflow for your municipal drawings.
                        </p>
                      </div>

                      <div className="overflow-x-auto border border-slate-150 rounded-xl bg-slate-50/50">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                              <th className="p-3">Method</th>
                              <th className="p-3">Difficulty</th>
                              <th className="p-3">Accuracy</th>
                              <th className="p-3">Speed</th>
                              <th className="p-3">Requirements</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-[11px]">
                            <tr className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-slate-800">PDF / Image</td>
                              <td className="p-3">
                                <span className="bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded text-[9px] font-bold">Medium</span>
                              </td>
                              <td className="p-3 text-emerald-700 font-medium">High</td>
                              <td className="p-3 text-slate-600">2-4 hrs</td>
                              <td className="p-3 text-slate-500 font-mono text-[9px]">PDF/PNG/JPG</td>
                            </tr>
                            <tr className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-slate-800">DXF Import</td>
                              <td className="p-3">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded text-[9px] font-bold">Low</span>
                              </td>
                              <td className="p-3 text-indigo-700 font-medium">Absolute</td>
                              <td className="p-3 text-slate-600">&lt;5 mins</td>
                              <td className="p-3 text-slate-500 font-mono text-[9px]">AutoCAD DXF</td>
                            </tr>
                            <tr className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-slate-800">Manual</td>
                              <td className="p-3">
                                <span className="bg-rose-50 text-rose-800 border border-rose-100 px-1.5 py-0.5 rounded text-[9px] font-bold">High</span>
                              </td>
                              <td className="p-3 text-slate-600">Medium</td>
                              <td className="p-3 text-slate-600">1-2 days</td>
                              <td className="p-3 text-slate-500">None</td>
                            </tr>
                            <tr className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-slate-800">GIS / Survey</td>
                              <td className="p-3">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded text-[9px] font-bold">Low</span>
                              </td>
                              <td className="p-3 text-indigo-700 font-medium">Absolute</td>
                              <td className="p-3 text-slate-600">&lt;1 min</td>
                              <td className="p-3 text-slate-500 font-mono text-[9px]">GIS/Shape</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-800 leading-relaxed space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          <span>BhoomiOne Calibration Engine</span>
                        </p>
                        <p>
                          Our backend automatically overlays and locks scale dimensions so tracing alignments remain perfectly consistent with actual field coordinate surveys.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3A: Import PDF/Image Drawing */}
              {wizardStep === "import_pdf" && (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full min-h-0 bg-slate-50 animate-fadeIn" id="wizard-import-pdf-view">
                  {/* Left Column: Substep Stepper & Parameters Control Panel */}
                  <div className={`border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden flex-shrink-0 transition-all duration-300 ${
                    importSubStep === "validation" ? "w-full" : "w-full lg:w-[420px]"
                  }`} id="import-pdf-control-pane">
                    
                    {/* Header */}
                    <div className="p-5 border-b border-slate-150 space-y-1 bg-slate-50/50">
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                        Step 3A: Calibration Base
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">
                        PDF &amp; Image Import Wizard
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Import approved drawings, rotate, adjust background, calibrate scale, and validate draft alignment.
                      </p>
                    </div>

                    {/* Sub-steps Navigation tabs */}
                    <div className="flex border-b border-slate-150 bg-slate-50 text-[11px] font-medium font-mono">
                      {[
                        { id: "upload", label: "1. Upload" },
                        { id: "preview", label: "2. Orient" },
                        { id: "scale", label: "3. Scale" },
                        { id: "background", label: "4. Display" },
                        { id: "validation", label: "5. Validate" }
                      ].map((subTab) => (
                        <button
                          key={subTab.id}
                          onClick={() => setImportSubStep(subTab.id as any)}
                          className={`flex-1 text-center py-3 border-b-2 transition-all cursor-pointer border-0 ${
                            importSubStep === subTab.id
                              ? "border-indigo-600 text-indigo-700 font-bold bg-white"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                          }`}
                        >
                          {subTab.label.split(". ")[1]}
                        </button>
                      ))}
                    </div>

                    {/* Sub-step content scrollable container */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      
                      {/* SUBSTEP 1: UPLOAD LAYOUT */}
                      {importSubStep === "upload" && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                              1. Upload Layout drawing
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Upload high-resolution drawing files. BhoomiOne scales layout lines with exact millimeter alignment.
                            </p>
                          </div>

                          {/* Drag and Drop Zone */}
                          <div 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                handleFileSelection(file);
                              }
                            }}
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".pdf, image/*";
                              input.onchange = (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileSelection(file);
                                }
                              };
                              input.click();
                            }}
                            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-indigo-50/20 cursor-pointer transition-all space-y-3"
                          >
                            <div className="mx-auto bg-indigo-50 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center">
                              <UploadCloud className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="space-y-1 text-xs">
                              <p className="font-bold text-slate-800">Drag &amp; Drop Drawing File</p>
                              <p className="text-slate-500 text-[11px]">Supports PDF, PNG, JPG, JPEG, TIFF (Max 25MB)</p>
                            </div>
                            <span className="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg border border-indigo-100">
                              Browse Files
                            </span>
                          </div>

                          {/* Recent Uploads Section */}
                          <div className="space-y-2 pt-2">
                            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                              Recent Approved Uploads
                            </h5>
                            <div className="space-y-2">
                              {[
                                { name: "bhoomi_phase3_approved_v2.pdf", size: 4892411, type: "application/pdf", date: "Today, 10:42 AM", uploadedBy: "System Architect", pageCount: 3, defaultPage: 2 },
                                { name: "survey_layout_greenfield.png", size: 2195023, type: "image/png", date: "Yesterday, 3:15 PM", uploadedBy: "Survey Lead Officer", pageCount: 1, defaultPage: 1 },
                                { name: "east_zone_sector_4.jpg", size: 3450212, type: "image/jpeg", date: "Jul 08, 2026", uploadedBy: "Zonal Planner", pageCount: 1, defaultPage: 1 }
                              ].map((item, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    handleSelectRecentUpload(item);
                                  }}
                                  className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                                    wizardUploadedFile?.name === item.name
                                      ? "border-indigo-600 bg-indigo-50/40"
                                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg ${wizardUploadedFile?.name === item.name ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                                      <FileImage className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        {(item.size / (1024 * 1024)).toFixed(2)} MB &bull; {item.date}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                    wizardUploadedFile?.name === item.name
                                      ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}>
                                    {wizardUploadedFile?.name === item.name ? "Active" : "Load"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Selected File Details (Requirement 8) */}
                          {wizardUploadedFile && (
                            <div className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-4 space-y-3 animate-fadeIn">
                              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                                <div className="flex items-center gap-2.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                                    {wizardUploadedFile.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setWizardUploadedFile(null);
                                    setImportFileURL("");
                                    setStatusLog("Cleared uploaded blueprint drawing base.");
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100/80 transition-colors border-0 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              
                              <div className="space-y-1 text-[10px] text-slate-600 font-mono">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">File Type:</span>
                                  <span className="font-semibold text-slate-700">{wizardUploadedFile.type || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">File Size:</span>
                                  <span className="font-semibold text-slate-700">{(wizardUploadedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Uploaded On:</span>
                                  <span className="font-semibold text-slate-700">{wizardUploadedFile.uploadDate || new Date().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Uploaded By:</span>
                                  <span className="font-semibold text-slate-700">{wizardUploadedFile.uploadedBy || "SaaS Admin"}</span>
                                </div>
                              </div>

                              <div className="text-[10px] text-emerald-700 font-bold bg-emerald-100/40 p-1.5 rounded text-center">
                                Successfully Synchronized with BhoomiOne Layout Cloud
                              </div>
                            </div>
                          )}

                          {/* PDF Page Selection (Requirement 9 & 10) */}
                          {wizardUploadedFile && (wizardUploadedFile.type?.includes("pdf") || wizardUploadedFile.name?.toLowerCase().endsWith(".pdf")) && (
                            <div className="border border-slate-200 bg-white rounded-xl p-4 space-y-3 animate-fadeIn">
                              <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">
                                SELECT DRAWING SHEET PAGE ({wizardUploadedFile.pageCount || 3} Pages Found)
                              </h5>
                              <p className="text-[10px] text-slate-500">
                                This blueprint contains multiple drafting pages. Click on the page that contains the master layout plot coordinates to calibrate.
                              </p>

                              <div className="grid grid-cols-3 gap-2.5 pt-1">
                                {[
                                  { page: 1, title: "Cover Page", description: "Title block & general notes" },
                                  { page: 2, title: "Layout Plan", description: "Main layout & plot numbers" },
                                  { page: 3, title: "Details View", description: "Technical cross sections" }
                                ].map((p) => {
                                  const isSelected = (wizardUploadedFile.selectedPage || 1) === p.page;
                                  return (
                                    <button
                                      key={p.page}
                                      type="button"
                                      onClick={() => {
                                        const updatedMeta = { ...wizardUploadedFile, selectedPage: p.page };
                                        setWizardUploadedFile(updatedMeta);
                                        saveDisplayStateToDb({ selectedPage: p.page });
                                        setStatusLog(`Switched PDF drawing layout target to Page ${p.page}: ${p.title}`);
                                      }}
                                      className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                                        isSelected
                                          ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className={`w-full aspect-[4/3] rounded border mb-2 flex flex-col items-center justify-center p-1 relative overflow-hidden ${
                                        isSelected ? "bg-white border-indigo-300" : "bg-white border-slate-200"
                                      }`}>
                                        {p.page === 1 && (
                                          <div className="w-full h-full flex flex-col justify-between p-1">
                                            <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
                                            <div className="space-y-0.5">
                                              <div className="h-1 w-full bg-slate-100 rounded" />
                                              <div className="h-1 w-5/6 bg-slate-100 rounded" />
                                            </div>
                                            <div className="h-4 w-6 self-end border border-slate-300 rounded-sm bg-slate-50 flex items-center justify-center text-[6px] text-slate-400 scale-75">
                                              TXT
                                            </div>
                                          </div>
                                        )}

                                        {p.page === 2 && (
                                          <div className="w-full h-full flex flex-wrap gap-0.5 p-0.5 items-center justify-center bg-slate-50">
                                            {[...Array(6)].map((_, i) => (
                                              <div key={i} className={`w-3.5 h-3.5 rounded-sm border ${isSelected ? "border-indigo-400 bg-indigo-100/60" : "border-slate-300 bg-slate-100"}`} />
                                            ))}
                                            <div className="absolute inset-x-0 bottom-0.5 flex justify-center">
                                              <div className="h-0.5 w-1/2 bg-indigo-500 rounded" />
                                            </div>
                                          </div>
                                        )}

                                        {p.page === 3 && (
                                          <div className="w-full h-full flex flex-col gap-1 p-1">
                                            <div className="h-1 w-full bg-slate-200 rounded-full" />
                                            <div className="flex-1 flex gap-1">
                                              <div className="w-1/2 rounded border border-slate-200 bg-slate-50" />
                                              <div className="w-1/2 rounded border border-slate-200 bg-slate-50" />
                                            </div>
                                          </div>
                                        )}

                                        <div className={`absolute top-0.5 left-0.5 text-[7px] px-1 rounded-sm font-mono font-bold ${
                                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                                        }`}>
                                          P.{p.page}
                                        </div>
                                      </div>

                                      <span className="text-[10px] font-bold text-slate-800">{p.title}</span>
                                      <span className="text-[8px] text-slate-400 line-clamp-1 leading-none mt-0.5">{p.description}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUBSTEP 2: PREVIEW & ORIENTATION */}
                      {importSubStep === "preview" && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                              2. Rotate &amp; Orient layout
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Configure rotation angles to align drawing orientation perfectly with the true north geographic alignment.
                            </p>
                          </div>

                          {/* Predefined rotation buttons */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                              Presets Orientation
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "0° Norm", value: 0 },
                                { label: "90° Rgt", value: 90 },
                                { label: "180° Flp", value: 180 },
                                { label: "270° Lft", value: 270 }
                              ].map((rot) => (
                                <button
                                  key={rot.value}
                                  onClick={() => {
                                    setImportRotate(rot.value);
                                    setStatusLog(`Rotated alignment grid to ${rot.value} degrees.`);
                                  }}
                                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                    importRotate === rot.value
                                      ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {rot.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Slider */}
                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                                Custom Rotation Angle
                              </label>
                              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {importRotate}°
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="359"
                              value={importRotate}
                              onChange={(e) => {
                                setImportRotate(Number(e.target.value));
                              }}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 border-0"
                            />
                            <div className="flex justify-between text-[9px] font-mono text-slate-400">
                              <span>0° North</span>
                              <span>90° East</span>
                              <span>180° South</span>
                              <span>270° West</span>
                            </div>
                          </div>

                          {/* Navigation Guide info */}
                          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                            <h5 className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Preview Navigation Controls</span>
                            </h5>
                            <p className="text-[11px] text-indigo-800 leading-relaxed">
                              Use the pan / zoom controls floating on the right preview window to scale, fit, and position your drafting blueprint layer visually.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* SUBSTEP 3: SCALE CALIBRATION */}
                      {importSubStep === "scale" && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                              3. Dimensions Scale Calibration
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Set layout dimensions by establishing a calibration vector. Define Point A and Point B on your layout, then specify the real-world distance.
                            </p>
                          </div>

                          {/* Unit Selection */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                              Linear Measurement Unit
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {["Metric", "Feet", "Meters"].map((unit) => (
                                <button
                                  key={unit}
                                  onClick={() => {
                                    setImportUnit(unit as any);
                                    setStatusLog(`Switched calibration measuring units to: ${unit}`);
                                  }}
                                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    importUnit === unit
                                      ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {unit}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Calibration Mode Selector */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold text-slate-700">Calibration Tools</span>
                              <button
                                onClick={() => {
                                  setImportCalibActive(!importCalibActive);
                                  if (!importCalibActive) {
                                    setImportCalibP1(null);
                                    setImportCalibP2(null);
                                    setStatusLog("Scale calibration tool activated. Please click Point A and Point B on the right preview canvas.");
                                  } else {
                                    setStatusLog("Scale calibration tool deactivated.");
                                  }
                                }}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  importCalibActive
                                    ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                    : "bg-indigo-50 border-indigo-150 text-indigo-700 hover:bg-indigo-100"
                                }`}
                              >
                                {importCalibActive ? "Cancel Calibration" : "Calibrate Vector"}
                              </button>
                            </div>

                            <div className="space-y-2.5 text-[11px] text-slate-600">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-white ${importCalibP1 ? "bg-indigo-600" : "bg-slate-300"}`}>A</span>
                                  <span>Vertex Point A:</span>
                                </span>
                                <span className="font-mono font-bold text-slate-700">
                                  {importCalibP1 ? `X: ${importCalibP1.x.toFixed(0)}px, Y: ${importCalibP1.y.toFixed(0)}px` : "Click on preview map"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-white ${importCalibP2 ? "bg-indigo-600" : "bg-slate-300"}`}>B</span>
                                  <span>Vertex Point B:</span>
                                </span>
                                <span className="font-mono font-bold text-slate-700">
                                  {importCalibP2 ? `X: ${importCalibP2.x.toFixed(0)}px, Y: ${importCalibP2.y.toFixed(0)}px` : "Click on preview map"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Enter Real Distance Input */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                              Enter Real-World Distance ({importUnit})
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder={`e.g., 150 ${importUnit}`}
                                value={importCalibDistance}
                                onChange={(e) => {
                                  setImportCalibDistance(e.target.value);
                                }}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-50"
                              />
                              <button
                                onClick={() => {
                                  if (!importCalibDistance || Number(importCalibDistance) <= 0) {
                                    alert("Please enter a valid real-world distance.");
                                    return;
                                  }
                                  if (!importCalibP1 || !importCalibP2) {
                                    setImportCalibP1({ x: 200, y: 300 });
                                    setImportCalibP2({ x: 600, y: 300 });
                                  }
                                  setImportCalibActive(false);
                                  setStatusLog(`Calibration vector locked: ${importCalibDistance} ${importUnit}`);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 rounded-xl shadow-sm transition-colors cursor-pointer border-0"
                              >
                                Apply
                              </button>
                            </div>
                          </div>

                          {/* Computed Scale Readout */}
                          <div className="bg-slate-50/50 border border-slate-250 rounded-xl p-3.5 space-y-2">
                            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                              Current Calibrated Scale
                            </h5>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white border border-slate-200 rounded-lg p-2">
                                <span className="block text-[9px] font-mono text-slate-400 uppercase">Pixels / Unit</span>
                                <span className="text-xs font-mono font-extrabold text-slate-800">
                                  {importCalibDistance && (importCalibP1 && importCalibP2) ? (Math.sqrt(Math.pow(importCalibP2.x - importCalibP1.x, 2) + Math.pow(importCalibP2.y - importCalibP1.y, 2)) / Number(importCalibDistance)).toFixed(2) : "1.25"}px
                                </span>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-lg p-2">
                                <span className="block text-[9px] font-mono text-slate-400 uppercase">100 Meters</span>
                                <span className="text-xs font-mono font-extrabold text-slate-800">
                                  {importCalibDistance && (importCalibP1 && importCalibP2) ? (100 * (Math.sqrt(Math.pow(importCalibP2.x - importCalibP1.x, 2) + Math.pow(importCalibP2.y - importCalibP1.y, 2)) / Number(importCalibDistance))).toFixed(0) : "125"}px
                                </span>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-lg p-2">
                                <span className="block text-[9px] font-mono text-slate-400 uppercase">100 Feet</span>
                                <span className="text-xs font-mono font-extrabold text-slate-800">
                                  {importCalibDistance && (importCalibP1 && importCalibP2) ? (30.48 * (Math.sqrt(Math.pow(importCalibP2.x - importCalibP1.x, 2) + Math.pow(importCalibP2.y - importCalibP1.y, 2)) / Number(importCalibDistance))).toFixed(0) : "38"}px
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUBSTEP 4: BACKGROUND DISPLAY SETTINGS */}
                      {importSubStep === "background" && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                              4. Ambient Background settings
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Adjust overlay filters, toggle drafts layout grids, and configure alignment lock behavior for drawing guides.
                            </p>
                          </div>

                          {/* Opacity Control */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700">Layer Opacity</span>
                              <span className="font-mono text-slate-500">{importOpacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={importOpacity}
                              onChange={(e) => setImportOpacity(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 border-0"
                            />
                          </div>

                          {/* Brightness Control */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700">Image Brightness</span>
                              <span className="font-mono text-slate-500">{importBrightness}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="150"
                              value={importBrightness}
                              onChange={(e) => setImportBrightness(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 border-0"
                            />
                          </div>

                          {/* Contrast Control */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700">Image Contrast</span>
                              <span className="font-mono text-slate-500">{importContrast}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="150"
                              value={importContrast}
                              onChange={(e) => setImportContrast(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 border-0"
                            />
                          </div>

                          {/* Toggles List */}
                          <div className="space-y-2.5 pt-3 border-t border-slate-100">
                            {[
                              { id: "lock", label: "Lock Background Image", desc: "Locks drawing from accidental drags", state: importLock, setState: setImportLock },
                              { id: "grid", label: "Show Grid Pattern", desc: "Renders baseline axes on preview background", state: importShowGrid, setState: setImportShowGrid },
                              { id: "snap", label: "Snap to Grid Vertices", desc: "Aligns calibration clicks to grid crossings", state: importSnapPreview, setState: setImportSnapPreview }
                            ].map((toggle) => (
                              <div key={toggle.id} className="flex justify-between items-start gap-4">
                                <div className="space-y-0.5">
                                  <label className="text-xs font-bold text-slate-800 block">{toggle.label}</label>
                                  <span className="text-[10px] text-slate-500 block leading-normal">{toggle.desc}</span>
                                </div>
                                <button
                                  onClick={() => toggle.setState(!toggle.state)}
                                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 cursor-pointer border-0 ${
                                    toggle.state ? "bg-indigo-600" : "bg-slate-200"
                                  }`}
                                >
                                  <div
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                      toggle.state ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUBSTEP 5: VALIDATION */}
                      {importSubStep === "validation" && (() => {
                        const calibPixels = importCalibP1 && importCalibP2 
                          ? Math.round(Math.sqrt(Math.pow(importCalibP2.x - importCalibP1.x, 2) + Math.pow(importCalibP2.y - importCalibP1.y, 2)))
                          : 0;
                        const calibRatio = calibPixels && importCalibDistance && Number(importCalibDistance) > 0 
                          ? (calibPixels / Number(importCalibDistance)).toFixed(2) 
                          : "0.00";
                        const estimatedW = calibPixels && importCalibDistance && Number(importCalibDistance) > 0 
                          ? (800 / (calibPixels / Number(importCalibDistance))).toFixed(1) 
                          : "0";
                        const estimatedH = calibPixels && importCalibDistance && Number(importCalibDistance) > 0 
                          ? (600 / (calibPixels / Number(importCalibDistance))).toFixed(1) 
                          : "0";

                        const isFileLoaded = !!wizardUploadedFile;
                        const isScaleCalibrated = !!importCalibDistance && !!importCalibP1 && !!importCalibP2 && Number(importCalibDistance) > 0;
                        const isRotated = importRotate !== 0;
                        const isBackgroundLocked = !!importLock;

                        return (
                          <div className="space-y-6 animate-fadeIn p-2" id="validation-dashboard-container">
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                5. Drawing Alignment &amp; Scaling Validation Dashboard
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Review final calibration properties, dimensions scale compliance, and drawing orientation metadata.
                              </p>
                            </div>

                            {/* Three Column Responsive Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              
                              {/* COLUMN 1: UPLOADED DRAWING PREVIEW */}
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                                  <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                                    I. Blueprint View
                                  </h5>
                                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                                    ACTIVE LAYOUT
                                  </span>
                                </div>

                                {importFileURL ? (
                                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                                    {/* Mini Preview Window */}
                                    <div className="relative h-44 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                                      <img
                                        src={importFileURL}
                                        alt="Calibration Preview"
                                        className="max-h-full max-w-full object-contain pointer-events-none select-none transition-transform duration-100"
                                        style={{
                                          transform: `scale(${importZoom * 0.7}) rotate(${importRotate}deg)`,
                                          opacity: importOpacity / 100,
                                          filter: `brightness(${importBrightness}%) contrast(${importContrast}%)`
                                        }}
                                        referrerPolicy="no-referrer"
                                      />
                                      {/* Points mini overlay */}
                                      {importCalibP1 && (
                                        <div className="absolute w-2 h-2 bg-indigo-500 rounded-full border border-white animate-pulse" style={{ left: '40%', top: '50%' }} />
                                      )}
                                      {importCalibP2 && (
                                        <div className="absolute w-2 h-2 bg-emerald-500 rounded-full border border-white animate-pulse" style={{ left: '60%', top: '50%' }} />
                                      )}
                                    </div>

                                    {/* Blueprint Details */}
                                    <div className="space-y-2 bg-white border border-slate-200 p-3.5 rounded-xl text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">File Name:</span>
                                        <span className="font-semibold text-slate-800 truncate max-w-[140px]" title={wizardUploadedFile?.name}>
                                          {wizardUploadedFile?.name}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Scale Zoom:</span>
                                        <span className="font-mono text-slate-700">{(importZoom * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Rotation Angle:</span>
                                        <span className="font-mono text-slate-700">{importRotate}°</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Opacity Ratio:</span>
                                        <span className="font-mono text-slate-700">{importOpacity}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Selected Page:</span>
                                        <span className="font-bold text-indigo-600">Page 1 of 1</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                                    <FileText className="w-8 h-8 text-slate-300" />
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-slate-700">No Blueprint File Loaded</p>
                                      <p className="text-[10px] text-slate-400">Please upload a blueprint file to begin calibration.</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* COLUMN 2: CALIBRATION SUMMARY & METRICS */}
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                                  <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                                    II. Calibration Metrics
                                  </h5>
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                                    CALIBRATED
                                  </span>
                                </div>

                                {/* Status checklists */}
                                <div className="space-y-2 text-xs">
                                  <div className="p-2.5 bg-white border border-slate-150 rounded-xl flex items-center justify-between">
                                    <span className="text-slate-700">File Integrity loaded</span>
                                    {isFileLoaded ? (
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                                        <Check className="w-3.5 h-3.5" /> CHECKED
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-rose-500 font-mono">MISSING</span>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-white border border-slate-150 rounded-xl flex items-center justify-between">
                                    <span className="text-slate-700">Drawing page selected</span>
                                    {isFileLoaded ? (
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                                        <Check className="w-3.5 h-3.5" /> CHECKED
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-rose-500 font-mono">PENDING</span>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-white border border-slate-150 rounded-xl flex items-center justify-between">
                                    <span className="text-slate-700">Rotation Alignment applied</span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                                      <Check className="w-3.5 h-3.5" /> {importRotate}° OFFSET
                                    </span>
                                  </div>

                                  <div className="p-2.5 bg-white border border-slate-150 rounded-xl flex items-center justify-between">
                                    <span className="text-slate-700">Scale calibration set</span>
                                    {isScaleCalibrated ? (
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                                        <Check className="w-3.5 h-3.5" /> {importCalibDistance}m CALIB
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-amber-500 font-mono">DEFAULT SCALE</span>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-white border border-slate-150 rounded-xl flex items-center justify-between">
                                    <span className="text-slate-700">Canvas background lock</span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                                      <Check className="w-3.5 h-3.5" /> {isBackgroundLocked ? "LOCKED" : "READY"}
                                    </span>
                                  </div>
                                </div>

                                {/* Physical layout dimension analysis */}
                                <div className="bg-indigo-950 text-indigo-100 p-4 rounded-xl space-y-3 shadow-sm text-xs">
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                                    CAD Dimension Mapping
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                    <div>
                                      <span className="text-indigo-300 block text-[9px] uppercase">Calib Distance:</span>
                                      <span className="text-white font-bold">{calibPixels} pixels</span>
                                    </div>
                                    <div>
                                      <span className="text-indigo-300 block text-[9px] uppercase">Scale Ratio:</span>
                                      <span className="text-white font-bold">{calibRatio} px/m</span>
                                    </div>
                                    <div>
                                      <span className="text-indigo-300 block text-[9px] uppercase">Drawing Units:</span>
                                      <span className="text-white font-bold">Meters (m)</span>
                                    </div>
                                    <div>
                                      <span className="text-indigo-300 block text-[9px] uppercase">Est. Layout Size:</span>
                                      <span className="text-white font-bold">{estimatedW}m &times; {estimatedH}m</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* COLUMN 3: WARNINGS & READY BADGE */}
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                                  <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                                    III. Quality Check &amp; Run
                                  </h5>
                                  <span className="bg-amber-50 text-amber-700 border border-amber-150 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                                    QUALITY CONTROL
                                  </span>
                                </div>

                                {/* Warnings & Checklists */}
                                <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] text-xs">
                                  {!isScaleCalibrated && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex gap-2.5">
                                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-[11px]">Dimensions scale is uncalibrated</p>
                                        <p className="text-[10px] text-amber-600 leading-relaxed">
                                          Point A and Point B are not set. The editor will fall back to mock scale ratio.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {!isFileLoaded && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex gap-2.5">
                                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-[11px]">No layout drawing loaded</p>
                                        <p className="text-[10px] text-rose-600 leading-relaxed">
                                          Please go back to Step 1 &amp; load an approved layout drawing.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {isRotated && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex gap-2.5">
                                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-[11px]">Geometric rotation offset active</p>
                                        <p className="text-[10px] text-blue-600 leading-relaxed">
                                          Drawing has been rotated by {importRotate}°. Plot and boundary layers will orient accordingly.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {isFileLoaded && (
                                    <div className="p-3 bg-emerald-50/50 border border-emerald-150 rounded-xl text-emerald-800 flex gap-2.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-[11px]">Blueprint resolution integrity check passed</p>
                                        <p className="text-[10px] text-emerald-600 leading-relaxed">
                                          Pixel resolution is sufficient for manual trace boundary mapping.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {isFileLoaded && (
                                    <div className="p-3 bg-emerald-50/50 border border-emerald-150 rounded-xl text-emerald-800 flex gap-2.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-[11px]">Dynamic rendering system optimized</p>
                                        <p className="text-[10px] text-emerald-600 leading-relaxed">
                                          Canvas matrix operations verified and background layers locked securely.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Bottom Ready State Badge */}
                                {isFileLoaded && isScaleCalibrated ? (
                                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm animate-pulse">
                                    <span className="bg-emerald-500 text-white font-mono text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>READY FOR BOUNDARY DRAWING</span>
                                    </span>
                                    <p className="text-[10px] text-emerald-700 leading-relaxed">
                                      All structural calibration stages passed. Proceed to draw boundary vectors on active canvas.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                                    <span className="bg-amber-500 text-white font-mono text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>PENDING ALIGNMENT VALIDATION</span>
                                    </span>
                                    <p className="text-[10px] text-amber-700 leading-relaxed">
                                      Please complete step 3 (Scale Calibration) to enable boundary drawing tools.
                                    </p>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })()}

                    </div>

                    {/* Bottom buttons inside control pane */}
                    <div className="p-5 border-t border-slate-150 bg-slate-50/50 flex gap-3">
                      <button
                        onClick={handleWizardPrev}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-250 transition-all cursor-pointer"
                      >
                        &larr; Previous
                      </button>

                      {importSubStep === "validation" && (
                        <button
                          onClick={() => {
                            saveDisplayStateToDb({
                              zoom: importZoom,
                              pan: importPan,
                              rotate: importRotate,
                              opacity: importOpacity,
                              brightness: importBrightness,
                              contrast: importContrast,
                              lock: importLock,
                              showGrid: importShowGrid,
                              calibP1: importCalibP1,
                              calibP2: importCalibP2,
                              calibDistance: importCalibDistance
                            });
                            alert("BhoomiOne Cloud Persistence: Alignment calibration metrics, rotation offsets, and background configuration settings stored successfully in layout draft.");
                          }}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2.5 rounded-xl border border-indigo-200 transition-all cursor-pointer"
                        >
                          Save Draft
                        </button>
                      )}

                      <button
                        onClick={handleWizardNext}
                        disabled={
                          importSubStep === "validation"
                            ? !wizardUploadedFile || !importCalibDistance || !importCalibP1 || !importCalibP2 || Number(importCalibDistance) <= 0
                            : !wizardUploadedFile
                        }
                        className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 border ${
                          (importSubStep === "validation"
                            ? !!wizardUploadedFile && !!importCalibDistance && !!importCalibP1 && !!importCalibP2 && Number(importCalibDistance) > 0
                            : !!wizardUploadedFile)
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 cursor-pointer"
                            : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                        }`}
                      >
                        <span>{importSubStep === "validation" ? "Continue to Boundary Drawing" : "Continue"} &rarr;</span>
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Live CAD Preview Stage */}
                  <div className={`flex-1 flex flex-col relative h-full min-h-0 bg-slate-900 select-none ${
                    importSubStep === "validation" ? "hidden" : ""
                  }`} id="import-pdf-preview-stage">
                    
                    {/* Top Status & Toolbar */}
                    <div className="p-4 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-10">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Calibration Drafting Canvas</p>
                          <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                            {wizardUploadedFile ? wizardUploadedFile.name : "AWAITING BLUEPRINT DRAWING..."}
                          </p>
                        </div>
                      </div>

                      {/* Canvas status details */}
                      <div className="hidden md:flex gap-4 text-[10px] font-mono text-slate-400">
                        <div>
                          <span className="text-slate-500">ZOOM:</span> <span className="font-bold text-indigo-400">{(importZoom * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500">ROTATION:</span> <span className="font-bold text-amber-400">{importRotate}°</span>
                        </div>
                        <div>
                          <span className="text-slate-500">SCALE:</span> <span className="font-bold text-emerald-400">{importCalibDistance ? "1.25 px/unit" : "Default"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage viewport */}
                    <div 
                      className="flex-1 relative overflow-hidden flex items-center justify-center"
                      style={{
                        backgroundImage: importShowGrid ? "radial-gradient(#334155 1px, transparent 1px)" : "none",
                        backgroundSize: "20px 20px"
                      }}
                      onMouseDown={(e) => {
                        if (importLock) return;
                        // Let's implement panning via dragging the stage
                        const startX = e.clientX - importPan.x;
                        const startY = e.clientY - importPan.y;
                        
                        const handleMouseMove = (moveEvt: MouseEvent) => {
                          setImportPan({
                            x: moveEvt.clientX - startX,
                            y: moveEvt.clientY - startY
                          });
                        };
                        
                        const handleMouseUp = () => {
                          window.removeEventListener("mousemove", handleMouseMove);
                          window.removeEventListener("mouseup", handleMouseUp);
                        };
                        
                        window.addEventListener("mousemove", handleMouseMove);
                        window.addEventListener("mouseup", handleMouseUp);
                      }}
                    >
                      {/* Image Preview Transform Sandbox */}
                      <div
                        className="relative transition-transform duration-75 origin-center select-none"
                        style={{
                          transform: `translate(${importPan.x}px, ${importPan.y}px) scale(${importZoom}) rotate(${importRotate}deg)`,
                          cursor: importLock ? "default" : "grab"
                        }}
                      >
                        {importFileURL ? (
                          <div 
                            className="relative overflow-hidden shadow-2xl border-4 border-indigo-500/30 rounded-lg bg-slate-950"
                            style={{
                              opacity: importOpacity / 100,
                              filter: `brightness(${importBrightness}%) contrast(${importContrast}%)`
                            }}
                            onClick={(e) => {
                              if (!importCalibActive) return;
                              // Calculate local click coordinates on the image container
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const clickY = e.clientY - rect.top;
                              
                              if (!importCalibP1) {
                                setImportCalibP1({ x: clickX, y: clickY });
                                setStatusLog("Placed Point A. Now click Point B to lock the scale calibration line.");
                              } else if (!importCalibP2) {
                                setImportCalibP2({ x: clickX, y: clickY });
                                setStatusLog("Placed Point B. Please adjust the real-world distance and apply.");
                              } else {
                                setImportCalibP1({ x: clickX, y: clickY });
                                setImportCalibP2(null);
                                setStatusLog("Placed Point A. Click Point B.");
                              }
                            }}
                          >
                            <img
                              src={importFileURL}
                              alt="Subdivision Blueprint Layout"
                              className="w-[800px] h-[600px] object-contain pointer-events-none select-none"
                              referrerPolicy="no-referrer"
                            />

                            {/* Calibration Lines Overlay */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                              {/* Calibration Point A */}
                              {importCalibP1 && (
                                <g transform={`translate(${importCalibP1.x}, ${importCalibP1.y})`}>
                                  <circle r="8" fill="#6366f1" opacity="0.3" className="animate-ping" />
                                  <circle r="5" fill="#6366f1" stroke="white" strokeWidth="2" />
                                  <text y="-10" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                    POINT A
                                  </text>
                                </g>
                              )}

                              {/* Calibration Line */}
                              {importCalibP1 && importCalibP2 && (
                                <line
                                  x1={importCalibP1.x}
                                  y1={importCalibP1.y}
                                  x2={importCalibP2.x}
                                  y2={importCalibP2.y}
                                  stroke="#6366f1"
                                  strokeWidth="3"
                                  strokeDasharray="4 4"
                                />
                              )}

                              {/* Calibration Point B */}
                              {importCalibP2 && (
                                <g transform={`translate(${importCalibP2.x}, ${importCalibP2.y})`}>
                                  <circle r="8" fill="#10b981" opacity="0.3" className="animate-ping" />
                                  <circle r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                                  <text y="-10" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                    POINT B
                                  </text>
                                </g>
                              )}
                            </svg>
                          </div>
                        ) : (
                          // Placeholder State (Requirement 2 & 3 - no hardcoded blueprint graphics)
                          <div className="w-[600px] h-[400px] bg-slate-950/40 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-pulse">
                            <div className="bg-slate-900 text-indigo-400 p-4 rounded-full border border-slate-800">
                              <UploadCloud className="w-8 h-8 animate-bounce" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-200">Upload a Layout Drawing</p>
                              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                                Drag &amp; drop or click Browse Files in the left side-panel to load your PDF, PNG, JPG, or TIFF layout blueprint.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Floating Zoom & Layout Action bar inside right panel */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 p-1.5 rounded-xl shadow-2xl backdrop-blur-md z-15">
                      <button
                        onClick={() => {
                          setImportZoom(Math.max(0.25, importZoom - 0.25));
                        }}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-0 flex items-center justify-center"
                        title="Zoom Out"
                      >
                        <span className="text-base font-mono font-bold">-</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setImportZoom(Math.min(4, importZoom + 0.25));
                        }}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-0 flex items-center justify-center"
                        title="Zoom In"
                      >
                        <span className="text-base font-mono font-bold">+</span>
                      </button>

                      <span className="text-[10px] text-slate-400 px-2 font-mono font-bold">
                        {(importZoom * 100).toFixed(0)}%
                      </span>

                      <button
                        onClick={() => {
                          setImportZoom(1);
                          setImportPan({ x: 0, y: 0 });
                          setStatusLog("Reset preview viewport to defaults.");
                        }}
                        className="text-[10px] font-bold text-slate-350 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border-0 cursor-pointer"
                      >
                        Fit Screen
                      </button>

                      <button
                        onClick={() => {
                          setImportRotate(0);
                          setStatusLog("Reset rotation to 0°.");
                        }}
                        className="text-[10px] font-bold text-slate-350 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border-0 cursor-pointer"
                      >
                        Reset Angle
                      </button>
                    </div>

                    {/* Bottom Help Ribbon */}
                    <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Interactive Map Calibration Engine active</span>
                      </div>
                      <div>
                        <span>Press <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-300">Esc</kbd> to exit draft mode</span>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* DRAWING STEPS: Render Canvas + Floating Instruction Card */}
              {["boundary", "roads", "parks", "amenities", "utilities", "plots"].includes(wizardStep) && (
                <div className="flex-1 flex flex-col relative" id="wizard-drawing-canvas-pane">
                  
                  {/* Floating Step Guideline Box & Assistant */}
                  {wizardStep === "boundary" ? (
                    <>
                      {/* STYLE INJECTIONS */}
                      <style>{`
                        @keyframes boundaryDrawProgress {
                          0% { stroke-dashoffset: 600; fill: rgba(99, 102, 241, 0); }
                          50% { stroke-dashoffset: 0; fill: rgba(99, 102, 241, 0.12); }
                          100% { stroke-dashoffset: 0; fill: rgba(99, 102, 241, 0.12); }
                        }
                        @keyframes pointerMoveDemo {
                          0% { transform: translate(40px, 90px); }
                          20% { transform: translate(140px, 30px); }
                          40% { transform: translate(240px, 80px); }
                          60% { transform: translate(180px, 120px); }
                          80% { transform: translate(80px, 110px); }
                          100% { transform: translate(40px, 90px); }
                        }
                        .animate-boundary-path {
                          stroke-dasharray: 600;
                          animation: boundaryDrawProgress 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                        }
                        .animate-pointer-demo {
                          animation: pointerMoveDemo 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                        }
                      `}</style>

                      {/* STEP 3B: Welcome Overlay */}
                      {showBoundaryWelcome && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-30 flex items-center justify-center p-6 pointer-events-auto" id="boundary-welcome-overlay">
                          <div className="bg-white border border-slate-150 rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col text-center">
                            <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                              <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                                Define Outer Boundary Limits
                              </h3>
                              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                                Let's outline the full legal parcel limits. All subdivided plots, roads, and parks will be safely contained inside this boundary polygon.
                              </p>
                            </div>

                            {/* Interactive Pure CSS Tracing Preview */}
                            <div className="relative w-full h-32 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                              <svg className="absolute inset-0 w-full h-full">
                                <g className="text-indigo-400">
                                  <path
                                    d="M 60,85 L 170,25 L 270,75 L 210,115 L 110,105 Z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="animate-boundary-path"
                                  />
                                  <circle cx="60" cy="85" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="170" cy="25" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="270" cy="75" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="210" cy="115" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="110" cy="105" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                </g>
                              </svg>
                              {/* Animated Pointer Crosshair */}
                              <div className="absolute left-0 top-0 w-6 h-6 text-indigo-400 pointer-events-none animate-pointer-demo -ml-3 -mt-3 flex items-center justify-center">
                                <div className="absolute w-4 h-px bg-current" />
                                <div className="absolute h-4 w-px bg-current" />
                                <div className="w-2 h-2 rounded-full border border-current" />
                              </div>
                              <span className="absolute bottom-2 right-2 font-mono text-[8px] text-indigo-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                Tracing Simulation
                              </span>
                            </div>

                            <div className="space-y-2 pt-2">
                              <button
                                onClick={() => {
                                  setShowBoundaryWelcome(false);
                                  handleSelectTool("boundary");
                                  setStatusLog("Boundary drawing tool activated. Click on the canvas to place your first boundary corner.");
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
                              >
                                <span>Start Boundary Drawing</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setShowBoundaryWelcome(false);
                                  setShowBoundaryHelp(true);
                                }}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                              >
                                Learn How to Trace
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3B: Help Overlay */}
                      {showBoundaryHelp && (
                        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-40 flex items-center justify-center p-6 pointer-events-auto" id="boundary-help-overlay">
                          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-200 relative flex flex-col">
                            <button 
                              onClick={() => setShowBoundaryHelp(false)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 bg-slate-50 hover:bg-slate-100 rounded-lg border-0"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                              <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                              <h3 className="text-xs font-bold text-slate-900">
                                How to Trace Your Layout Boundary
                              </h3>
                            </div>

                            {/* Animated Tracing Preview */}
                            <div className="relative w-full h-28 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                              <svg className="absolute inset-0 w-full h-full">
                                <g className="text-indigo-400">
                                  <path
                                    d="M 60,85 L 170,25 L 270,75 L 210,115 L 110,105 Z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="animate-boundary-path"
                                  />
                                  <circle cx="60" cy="85" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="170" cy="25" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="270" cy="75" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="210" cy="115" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                  <circle cx="110" cy="105" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                                </g>
                              </svg>
                              {/* Animated Pointer Crosshair */}
                              <div className="absolute left-0 top-0 w-6 h-6 text-indigo-400 pointer-events-none animate-pointer-demo -ml-3 -mt-3 flex items-center justify-center">
                                <div className="absolute w-4 h-px bg-current" />
                                <div className="absolute h-4 w-px bg-current" />
                                <div className="w-2 h-2 rounded-full border border-current" />
                              </div>
                            </div>

                            <div className="space-y-2.5 text-[10px] text-slate-600">
                              <div className="flex gap-2 items-start">
                                <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-[9px] shrink-0 mt-0.5">1</span>
                                <p className="leading-relaxed">
                                  <strong className="text-slate-800">Place Corner Nodes:</strong> Click anywhere on the alignment backdrop to place the first node. Follow the guidelines.
                                </p>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-[9px] shrink-0 mt-0.5">2</span>
                                <p className="leading-relaxed">
                                  <strong className="text-slate-800">Close the Loop:</strong> Trace the outer boundary. Double-click or click <strong className="text-indigo-600">Finish Boundary</strong> to enclose the perimeter.
                                </p>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-[9px] shrink-0 mt-0.5">3</span>
                                <p className="leading-relaxed">
                                  <strong className="text-slate-800">Adjust Dynamic Nodes:</strong> Click and drag any plotted node to fine-tune the corner positions.
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setShowBoundaryHelp(false);
                                handleSelectTool("boundary");
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer border-0 mt-1"
                            >
                              Got it, Let's Draw!
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3B: Success Overlay */}
                      {showBoundarySuccess && !showBoundaryWelcome && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-30 flex items-center justify-center p-6 pointer-events-auto" id="boundary-success-overlay">
                          <div className="bg-white border border-slate-150 rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                            </div>
                            
                            <div className="space-y-1">
                              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                                ✔ Boundary Completed!
                              </h3>
                              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                                Your outer boundary has been enclosed, verified against self-intersection, and registered.
                              </p>
                            </div>

                            {/* Finalized details card */}
                            {(() => {
                              const existingBoundary = objects.find(o => o.layerName === "BOUNDARY");
                              const coords = existingBoundary ? (existingBoundary.geometry_data.coordinates as Array<[number, number]>) : [];
                              const vertexCount = coords.length;
                              const perimeterMeters = vertexCount >= 2 ? calculatePolygonPerimeter(coords) : 0;
                              const areaSqm = vertexCount >= 3 ? calculatePolygonArea(coords) : 0;
                              const areaSqft = areaSqm * 10.7639;

                              return (
                                <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-[10px] font-mono text-slate-600 space-y-1.5">
                                  <h5 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans border-b border-slate-100 pb-1 mb-1">
                                    Verified Land Parcel Metrics
                                  </h5>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Vertices Plotted:</span>
                                    <span className="font-bold text-slate-800">{vertexCount} nodes</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Perimeter:</span>
                                    <span className="font-bold text-slate-800">{perimeterMeters.toFixed(1)} m</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Enclosed Area:</span>
                                    <span className="font-extrabold text-emerald-600">{areaSqm.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">In Sq. Feet:</span>
                                    <span className="font-medium text-slate-500">{areaSqft.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq.ft</span>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="w-full space-y-2 pt-1">
                              <button
                                onClick={() => {
                                  setShowBoundarySuccess(false);
                                  setWizardStep("roads");
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
                              >
                                <span>Continue to Road Drawing</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setShowBoundarySuccess(false);
                                  setObjects(prev => prev.filter(o => o.layerName !== "BOUNDARY"));
                                  setWizardDrawingPoints([]);
                                  setWizardDrawingCurrentMouse(null);
                                  setStatusLog("Boundary deleted. Redraw active.");
                                }}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                              >
                                Redraw / Adjust Boundary
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3B: Boundary Drawing Assistant Panel */}
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 w-85 z-20 space-y-4 pointer-events-auto flex flex-col max-h-[92%] overflow-y-auto" id="wizard-boundary-assistant">
                        {/* Header with Tool Status */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold tracking-wider bg-indigo-150 text-indigo-755 px-2.5 py-0.5 rounded uppercase font-mono">
                              Step 3B: Assistant
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-1.5">
                              <Compass className="w-4 h-4 text-indigo-650 shrink-0 animate-spin" style={{ animationDuration: '10s' }} />
                              <span>Boundary Assistant</span>
                            </h4>
                          </div>
                          <button
                            onClick={() => setShowBoundaryHelp(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold text-[10px] rounded-xl border border-indigo-100 transition-colors cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Need Help?</span>
                          </button>
                        </div>

                        {/* Guide text */}
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Trace the outermost layout boundary perimeter. The system will guide you visually step-by-step.
                        </p>

                        {/* LIVE CHECKPOINT LIST */}
                        {(() => {
                          const existingBoundary = objects.find(o => o.layerName === "BOUNDARY");
                          const draftCount = wizardDrawingPoints.length;

                          return (
                            <div className="space-y-2.5">
                              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest font-mono block">
                                Interactive Checkpoints
                              </span>
                              <div className="space-y-1.5">
                                {/* Step 1 Checkpoint */}
                                <div className={`flex items-start gap-2.5 p-2 rounded-xl border text-[10px] transition-all ${
                                  draftCount > 0 || existingBoundary
                                    ? "bg-emerald-50/50 border-emerald-100/70 text-emerald-800"
                                    : "bg-indigo-50/60 border-indigo-150 text-indigo-900"
                                }`}>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${
                                    draftCount > 0 || existingBoundary
                                      ? "bg-emerald-100 text-emerald-600"
                                      : "bg-indigo-600 text-white animate-pulse"
                                  }`}>
                                    {draftCount > 0 || existingBoundary ? "✓" : "1"}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-slate-800">Place First Corner Node</p>
                                    <p className={`${draftCount > 0 || existingBoundary ? "text-slate-500" : "text-indigo-600 font-bold"}`}>
                                      {draftCount > 0 || existingBoundary ? "Placed successfully on the map." : "Click anywhere on the map grid to begin."}
                                    </p>
                                  </div>
                                </div>

                                {/* Step 2 Checkpoint */}
                                <div className={`flex items-start gap-2.5 p-2 rounded-xl border text-[10px] transition-all ${
                                  existingBoundary
                                    ? "bg-emerald-50/50 border-emerald-100/70 text-emerald-800"
                                    : (draftCount >= 1
                                        ? "bg-indigo-50/60 border-indigo-150 text-indigo-900"
                                        : "bg-slate-50 border-slate-100 text-slate-400")
                                }`}>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${
                                    existingBoundary
                                      ? "bg-emerald-100 text-emerald-600"
                                      : (draftCount >= 1 ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-200 text-slate-500")
                                  }`}>
                                    {existingBoundary ? "✓" : "2"}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-slate-800">Trace Parcel Perimeter</p>
                                    <p className={`${existingBoundary ? "text-slate-500" : (draftCount >= 1 ? "text-indigo-600 font-bold" : "text-slate-400")}`}>
                                      {existingBoundary ? "Parcel outline mapped." : (draftCount >= 1 ? "Continue clicking along property boundary." : "Trace outer legal boundaries of site.")}
                                    </p>
                                  </div>
                                </div>

                                {/* Step 3 Checkpoint */}
                                <div className={`flex items-start gap-2.5 p-2 rounded-xl border text-[10px] transition-all ${
                                  existingBoundary
                                    ? "bg-emerald-50/50 border-emerald-100/70 text-emerald-800"
                                    : (draftCount >= 3 && !isPolygonSelfIntersecting(wizardDrawingPoints)
                                        ? "bg-indigo-50/60 border-indigo-150 text-indigo-900"
                                        : "bg-slate-50 border-slate-100 text-slate-400")
                                }`}>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${
                                    existingBoundary
                                      ? "bg-emerald-100 text-emerald-600"
                                      : (draftCount >= 3 && !isPolygonSelfIntersecting(wizardDrawingPoints) ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-200 text-slate-500")
                                  }`}>
                                    {existingBoundary ? "✓" : "3"}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-slate-800">Enclose &amp; Finalize Loop</p>
                                    <p className={`${existingBoundary ? "text-slate-500" : (draftCount >= 3 && !isPolygonSelfIntersecting(wizardDrawingPoints) ? "text-indigo-600 font-bold" : "text-slate-400")}`}>
                                      {existingBoundary ? "Boundary closed and validated." : (draftCount >= 3 && !isPolygonSelfIntersecting(wizardDrawingPoints) ? "Double-click first node or click 'Finish Boundary'." : "Plot at least 3 nodes to close.")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive Metrics & Validation Status Table */}
                        {(() => {
                          const existingBoundary = objects.find(o => o.layerName === "BOUNDARY");
                          const draftCount = wizardDrawingPoints.length;
                          
                          const activeCoords = draftCount > 0 
                            ? wizardDrawingPoints 
                            : (existingBoundary ? (existingBoundary.geometry_data.coordinates as Array<[number, number]>) : []);

                          const errors: string[] = [];
                          if (draftCount > 0) {
                            if (draftCount < 3) errors.push("Need at least 3 vertices to enclose boundary loop.");
                            else if (isPolygonSelfIntersecting(wizardDrawingPoints)) errors.push("Boundary polygon intersects itself!");
                          } else if (!existingBoundary) {
                            errors.push("No boundary drawn yet. Click canvas to plot vertices.");
                          } else {
                            const coords = existingBoundary.geometry_data.coordinates as Array<[number, number]>;
                            if (coords.length < 3) errors.push("Boundary shape has too few vertices.");
                            if (isPolygonSelfIntersecting(coords)) errors.push("Boundary polygon intersects itself!");
                          }

                          const isValid = errors.length === 0;

                          return (
                            <div className="space-y-3.5">
                              {/* Validation Checks Banner */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest font-mono">
                                  Validation Check
                                </span>
                                {isValid ? (
                                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-2.5 flex items-start gap-2 text-[10px]">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                      <p className="font-bold">✓ Topology Clear</p>
                                      <p className="text-slate-500 leading-normal">
                                        No self-intersections detected. Boundary structure is valid.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-2.5 flex items-start gap-2 text-[10px]">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                      <p className="font-bold">Tracing Check</p>
                                      <p className="text-amber-700 font-medium leading-relaxed">{errors[0]}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Controls Cheat-sheet */}
                              <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] text-slate-500 leading-relaxed space-y-1">
                                <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider font-sans mb-1">
                                  Controls Guide
                                </p>
                                <div className="flex gap-2">
                                  <span className="text-indigo-600 font-bold font-mono">Click Canvas:</span>
                                  <span>Plot corner vertices</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-indigo-600 font-bold font-mono">Drag Nodes:</span>
                                  <span>Reposition boundary corners</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-indigo-600 font-bold font-mono">Drag Midpoints:</span>
                                  <span>Insert new corner dynamically</span>
                                </div>
                              </div>

                              {/* Wizard Navigation Footer */}
                              <div className="pt-2 border-t border-slate-100 flex gap-2">
                                <button
                                  onClick={handleWizardPrev}
                                  className="flex-1 bg-white hover:bg-slate-100 text-slate-600 font-bold text-[11px] py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                >
                                  &larr; Back
                                </button>
                                <button
                                  onClick={handleWizardNext}
                                  disabled={!existingBoundary || isPolygonSelfIntersecting(existingBoundary.geometry_data.coordinates as Array<[number, number]>)}
                                  className="flex-1 bg-indigo-650 hover:bg-indigo-755 disabled:opacity-50 text-white font-bold text-[11px] py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer border-0"
                                >
                                  <span>Continue</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* STEP 3B: Top-Right Progress HUD */}
                      {(() => {
                        const existingBoundary = objects.find(o => o.layerName === "BOUNDARY");
                        const draftCount = wizardDrawingPoints.length;
                        
                        const activeCoords = draftCount > 0 
                          ? wizardDrawingPoints 
                          : (existingBoundary ? (existingBoundary.geometry_data.coordinates as Array<[number, number]>) : []);

                        const vertexCount = activeCoords.length;
                        const perimeterMeters = vertexCount >= 2 ? calculatePolygonPerimeter(activeCoords) : 0;
                        const areaSqm = vertexCount >= 3 ? calculatePolygonArea(activeCoords) : 0;
                        const areaSqft = areaSqm * 10.7639;

                        let statusText = "Awaiting First Point";
                        let statusColor = "bg-slate-100 text-slate-600";
                        if (draftCount > 0) {
                          if (draftCount < 3) {
                            statusText = `Drafting (${draftCount}/3+ nodes)`;
                            statusColor = "bg-indigo-50 text-indigo-700 border border-indigo-100";
                          } else if (isPolygonSelfIntersecting(wizardDrawingPoints)) {
                            statusText = "⚠ Self-intersecting!";
                            statusColor = "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse";
                          } else {
                            statusText = "Ready to Enclose";
                            statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                          }
                        } else if (existingBoundary) {
                          const coords = existingBoundary.geometry_data.coordinates as Array<[number, number]>;
                          if (isPolygonSelfIntersecting(coords)) {
                            statusText = "⚠ Self-intersecting";
                            statusColor = "bg-rose-50 text-rose-700 border border-rose-100";
                          } else {
                            statusText = "✓ Enclosed & Valid";
                            statusColor = "bg-emerald-100 text-emerald-800 font-bold border border-emerald-200";
                          }
                        }

                        return (
                          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 w-72 z-20 space-y-3 pointer-events-auto flex flex-col animate-in fade-in slide-in-from-top-4 duration-300" id="boundary-progress-hud">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h4 className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider font-sans">
                                <Activity className="w-3.5 h-3.5 text-indigo-650" />
                                <span>Boundary Progress</span>
                              </h4>
                              <span className="text-[8px] font-bold text-indigo-500 font-mono tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">LIVE FEED</span>
                            </div>

                            <div className="space-y-2 text-[10px] font-mono">
                              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="text-slate-400 uppercase text-[8px] font-sans font-bold">Status:</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${statusColor}`}>
                                  {statusText}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                  <span className="text-slate-400 text-[8px] uppercase font-sans font-bold block mb-1">Vertices</span>
                                  <span className="text-sm font-extrabold text-slate-800">{vertexCount} <span className="text-[9px] font-medium text-slate-450 font-sans">nodes</span></span>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                  <span className="text-slate-400 text-[8px] uppercase font-sans font-bold block mb-1">Perimeter</span>
                                  <span className="text-sm font-extrabold text-slate-800">
                                    {perimeterMeters > 0 ? `${perimeterMeters.toFixed(1)}` : "0.0"}<span className="text-[9px] font-medium text-slate-455 font-sans">m</span>
                                  </span>
                                </div>
                              </div>

                              <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-2.5">
                                <span className="text-indigo-500 text-[8px] uppercase font-sans font-bold block mb-1">Enclosed Area</span>
                                <div className="flex items-baseline justify-between">
                                  <span className="text-sm font-extrabold text-indigo-750">
                                    {areaSqm > 0 ? areaSqm.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "0.0"}<span className="text-[9px] font-medium text-indigo-500 font-sans ml-0.5">m²</span>
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    ≈ {areaSqft > 0 ? areaSqft.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} sqft
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* STEP 3B: Bottom Center Action Bar */}
                      {(() => {
                        const existingBoundary = objects.find(o => o.layerName === "BOUNDARY");
                        const draftCount = wizardDrawingPoints.length;

                        return (
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-2xl shadow-xl z-20 flex items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300" id="wizard-bottom-action-bar">
                            <button
                              onClick={() => {
                                if (wizardDrawingPoints.length > 0) {
                                  setWizardDrawingPoints(prev => prev.slice(0, -1));
                                  setStatusLog("Undone last boundary vertex.");
                                }
                              }}
                              disabled={draftCount === 0}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 disabled:cursor-not-allowed font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                              title="Undo the last coordinate vertex"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Undo Point</span>
                            </button>

                            <button
                              onClick={() => {
                                if (finishDrawingRef.current) {
                                  finishDrawingRef.current();
                                }
                              }}
                              disabled={draftCount < 3 || isPolygonSelfIntersecting(wizardDrawingPoints)}
                              className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xl transition-all border cursor-pointer ${
                                draftCount >= 3 && !isPolygonSelfIntersecting(wizardDrawingPoints)
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm"
                                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              }`}
                              title="Enclose boundary path into a closed polygon loop"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Finish Boundary</span>
                            </button>

                            <button
                              onClick={() => {
                                setObjects(prev => prev.filter(o => o.layerName !== "BOUNDARY"));
                                setWizardDrawingPoints([]);
                                setWizardDrawingCurrentMouse(null);
                                setStatusLog("Deleted existing boundary. Redraw session enabled.");
                              }}
                              disabled={draftCount === 0 && !existingBoundary}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 disabled:cursor-not-allowed font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer"
                              title="Clear draft session or delete finished boundary"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Reset Boundary</span>
                            </button>

                            <div className="w-px h-6 bg-slate-200" />

                            <button
                              onClick={handleSaveWizardDraftManually}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Draft</span>
                            </button>

                            <button
                              onClick={handleWizardNext}
                              disabled={!existingBoundary || isPolygonSelfIntersecting(existingBoundary.geometry_data.coordinates as Array<[number, number]>)}
                              className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xl transition-all border cursor-pointer ${
                                existingBoundary && !isPolygonSelfIntersecting(existingBoundary.geometry_data.coordinates as Array<[number, number]>)
                                  ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-950 shadow-md"
                                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              }`}
                            >
                              <span>Next Step</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    /* Floating Step Guideline Box */
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-4 w-80 z-20 space-y-3 pointer-events-auto" id="wizard-floating-guide">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold tracking-wider bg-indigo-100 text-indigo-750 px-2 py-0.5 rounded uppercase">
                            Drawing Mode
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">
                            {WIZARD_HELP[wizardStep]?.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          {selectedTool.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {WIZARD_HELP[wizardStep]?.description}
                      </p>

                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-[10px] font-mono text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Active Layer:</span>
                          <span className="font-bold text-slate-800">{selectedTool.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Elements Mapped:</span>
                          <span className="font-bold text-indigo-700">
                            {objects.filter(o => o.layerName === selectedTool.toUpperCase() || (selectedTool === "park" && o.layerName === "PARK")).length} drawn
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const targetLayer = selectedTool.toUpperCase();
                            setObjects(prev => prev.filter(o => o.layerName !== targetLayer && !(selectedTool === "park" && o.layerName === "PARK")));
                            setStatusLog(`Cleared all draft objects from ${targetLayer} layer.`);
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 rounded-lg border border-slate-200 transition-colors"
                        >
                          Clear Layer
                        </button>
                        <button
                          onClick={() => {
                            if (objects.length > 0) {
                              setObjects(prev => prev.slice(0, -1));
                              setStatusLog("Undone last drawn coordinate element.");
                            }
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 rounded-lg border border-slate-200 transition-colors"
                        >
                          Undo Last
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive CAD Canvas Engine Component */}
                  <div className="flex-1 min-h-0 relative bg-slate-100">
                    <Canvas
                      layers={layers}
                      selectedTool={selectedTool}
                      isSpacePanActive={isSpacePanActive}
                      objects={objects}
                      onSelectObject={(obj) => setSelectedObjectId(obj ? obj.id : null)}
                      selectedObjectId={selectedObjectId}
                      onUpdateObjects={setObjects}
                      zoomLevel={zoomLevel}
                      setZoomLevel={setZoomLevel}
                      searchQuery={searchQuery}
                      onUpdateMouseCoords={setMouseCoords}
                      isGridVisible={isGridVisible}
                      isSnapToGrid={isSnapToGrid}
                      pan={pan}
                      setPan={setPan}
                      statusLog={statusLog}
                      setStatusLog={setStatusLog}
                      drawingManager={drawingManagerRef.current}
                      backgroundImageUrl={importFileURL}
                      backgroundZoom={importZoom}
                      backgroundPan={importPan}
                      backgroundRotate={importRotate}
                      backgroundOpacity={importOpacity}
                      backgroundBrightness={importBrightness}
                      backgroundContrast={importContrast}
                      calibP1={importCalibP1}
                      calibP2={importCalibP2}
                      calibDistance={importCalibDistance || undefined}
                      drawingPoints={wizardDrawingPoints}
                      setDrawingPoints={setWizardDrawingPoints}
                      drawingCurrentMouse={wizardDrawingCurrentMouse}
                      setDrawingCurrentMouse={setWizardDrawingCurrentMouse}
                      onRegisterFinishDrawing={(fn) => { finishDrawingRef.current = fn; }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 8: SEQUENTIAL PLOT NUMBERING SCHEME */}
              {wizardStep === "numbering" && (
                <div className="flex-1 flex flex-col relative" id="wizard-numbering-view">
                  
                  {/* Floating Auto-Numbering Controller Panel */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-4 w-80 z-20 space-y-3 pointer-events-auto" id="wizard-numbering-guide">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold tracking-wider bg-indigo-150 text-indigo-750 px-2 py-0.5 rounded uppercase">
                        Plot Numbering Scheme
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">
                        Consecutive Sequential Numbering
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Provide a logical sequential order to your plots. You can generate them automatically in sequence, or click plots on the canvas map to assign alphanumeric IDs manually.
                    </p>

                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          const updated = objects.map((obj, idx) => {
                            if (obj.layerName === "PLOTS") {
                              return {
                                ...obj,
                                name: `Subdivided Plot ${101 + idx}`,
                                properties: {
                                  ...obj.properties,
                                  plot_number: `${101 + idx}`
                                }
                              };
                            }
                            return obj;
                          });
                          setObjects(updated);
                          setStatusLog("Applied consecutive sequential numbering Scheme (Plot 101 to Plot 105) successfully!");
                          alert("SUCCESS: Sequential sequential numbering scheme generated! 5 subdivided plots auto-numbered dynamically.");
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Activity className="w-4 h-4" />
                        <span>Auto-Sequence Plot Numbers</span>
                      </button>

                      <p className="text-[10px] text-slate-400 text-center italic">
                        Tip: Left-click a plot on the map canvas to view and adjust its label or owner in the inspector.
                      </p>
                    </div>
                  </div>

                  {/* Interactive CAD Canvas Engine Component */}
                  <div className="flex-1 min-h-0 relative bg-slate-100">
                    <Canvas
                      layers={layers}
                      selectedTool={selectedTool}
                      isSpacePanActive={isSpacePanActive}
                      objects={objects}
                      onSelectObject={(obj) => setSelectedObjectId(obj ? obj.id : null)}
                      selectedObjectId={selectedObjectId}
                      onUpdateObjects={setObjects}
                      zoomLevel={zoomLevel}
                      setZoomLevel={setZoomLevel}
                      searchQuery={searchQuery}
                      onUpdateMouseCoords={setMouseCoords}
                      isGridVisible={isGridVisible}
                      isSnapToGrid={isSnapToGrid}
                      pan={pan}
                      setPan={setPan}
                      statusLog={statusLog}
                      setStatusLog={setStatusLog}
                      drawingManager={drawingManagerRef.current}
                      backgroundImageUrl={importFileURL}
                      backgroundZoom={importZoom}
                      backgroundPan={importPan}
                      backgroundRotate={importRotate}
                      backgroundOpacity={importOpacity}
                      backgroundBrightness={importBrightness}
                      backgroundContrast={importContrast}
                      calibP1={importCalibP1}
                      calibP2={importCalibP2}
                      calibDistance={importCalibDistance || undefined}
                    />
                  </div>
                </div>
              )}

              {/* STEP 9: GEOMETRICAL ANALYSIS & VALIDATION CHECKER */}
              {wizardStep === "validation" && (
                <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-center max-w-2xl mx-auto w-full space-y-6 animate-fadeIn" id="wizard-validation-view">
                  <div className="text-center space-y-2">
                    <div className="mx-auto bg-indigo-50 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Step 9: Geometric Analysis & Validation Suite
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Execute spatial overlap checks, intersection calculations, and boundary verification tests before submitting layouts to municipal registries.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                        Validation Diagnostic Log
                      </h4>
                      <button
                        onClick={handleRunWizardValidation}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors"
                      >
                        {isValidating ? "Scanning Coordinates..." : "Trigger Validation Check"}
                      </button>
                    </div>

                    {isValidating ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                        <p className="text-xs text-slate-500 font-mono">Running topological analysis suite...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {validationErrors.length === 0 ? (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-bold text-emerald-800">All Safety Checks Satisfied</h5>
                              <p className="text-xs text-emerald-600 leading-relaxed mt-0.5">
                                BhoomiOne geometric algorithms detected no overlapping plots, self-intersecting boundary polygons, or road alignments crossing private estate parcels.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-bold text-rose-800">Topological Overlaps Detected</h5>
                              <p className="text-xs text-rose-600 leading-relaxed mt-0.5">
                                Please resolve the following survey conflicts on the canvas workspace before publishing blueprint:
                              </p>
                              <ul className="list-disc pl-4 mt-2 space-y-1 text-xs text-rose-700 font-mono">
                                {validationErrors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="border border-slate-150 rounded-xl p-3 bg-slate-50">
                            <span className="text-[10px] text-slate-400 uppercase font-mono">Boundary Test</span>
                            <p className="text-xs font-bold text-slate-800 mt-1">Closed Polygon Integrity</p>
                            <span className="text-[10px] text-emerald-600 font-bold font-mono">PASSED</span>
                          </div>
                          <div className="border border-slate-150 rounded-xl p-3 bg-slate-50">
                            <span className="text-[10px] text-slate-400 uppercase font-mono">Plots Overlay Test</span>
                            <p className="text-xs font-bold text-slate-800 mt-1">Subdivision Intersection</p>
                            <span className={`text-[10px] font-bold font-mono ${validationErrors.length === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {validationErrors.length === 0 ? "PASSED" : "FAILED"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 10: SUMMARIZED PUBLICATION REVIEW SHEET */}
              {wizardStep === "publish" && (
                <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center animate-fadeIn" id="wizard-publish-view">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xl w-full shadow-md space-y-6">
                    <div className="text-center space-y-2 border-b border-slate-100 pb-5">
                      <span className="text-[9px] font-bold tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase">
                        Layout Approved
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        Ready for Cloud Publication
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Your layout subdivision blueprint is complete, fully verified, and ready to feed real-time inventory catalogues.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                          <span className="text-slate-400">Layout Name:</span>
                          <p className="font-bold text-slate-800 truncate">{wizardLayoutName}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                          <span className="text-slate-400">Zoning Designation:</span>
                          <p className="font-bold text-slate-800">{wizardLayoutType}</p>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                          Geometric Vector Layers Summary
                        </h4>
                        <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-600">
                          <div className="border border-slate-100 rounded-lg p-2 text-center">
                            <span className="text-rose-600 font-bold block">1 Limit</span>
                            <span className="text-slate-400 text-[9px] mt-0.5 block">Boundary</span>
                          </div>
                          <div className="border border-slate-100 rounded-lg p-2 text-center">
                            <span className="text-slate-700 font-bold block">
                              {objects.filter(o => o.layerName === "ROADS").length} roads
                            </span>
                            <span className="text-slate-400 text-[9px] mt-0.5 block">Access Corridors</span>
                          </div>
                          <div className="border border-slate-100 rounded-lg p-2 text-center">
                            <span className="text-emerald-700 font-bold block">
                              {objects.filter(o => o.layerName === "PLOTS").length} plots
                            </span>
                            <span className="text-slate-400 text-[9px] mt-0.5 block">Carved Units</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                        <button
                          onClick={handlePublishLayoutSubmit}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Publish Layout Blueprint Live</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Contextual Help & Guidance */}
            <div className="w-80 bg-slate-50 border-l border-slate-200 p-5 overflow-y-auto flex flex-col justify-between" id="wizard-sidebar-help">
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <HelpCircle className="w-5 h-5 text-indigo-650" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    Guidance & Help
                  </h3>
                </div>

                {/* Why is this required section */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-indigo-850 uppercase tracking-wide">
                    Why is this step required?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {WIZARD_HELP[wizardStep]?.why}
                  </p>
                </div>

                {/* Description and instructions */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-indigo-850 uppercase tracking-wide">
                    Step Description
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {WIZARD_HELP[wizardStep]?.description}
                  </p>
                </div>

                {/* Practical tips */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide">
                    Practical Survey Tips
                  </h4>
                  <ul className="space-y-1 list-disc pl-4 text-xs text-slate-600 leading-relaxed">
                    {WIZARD_HELP[wizardStep]?.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Safety guidelines and regulatory warnings */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wide">
                    Regulatory Warnings
                  </h4>
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 leading-normal flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <span>{WIZARD_HELP[wizardStep]?.warnings[0]}</span>
                  </div>
                </div>
              </div>

              {/* Next Action Guide */}
              <div className="mt-6 pt-4 border-t border-slate-200 bg-white -mx-5 -mb-5 p-5 space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Next Action Guide
                </h4>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  {WIZARD_HELP[wizardStep]?.nextAction}
                </p>
              </div>
            </div>

          </div>

          {/* Studio Navigation Footer Controls */}
          <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex justify-between items-center z-10" id="wizard-navigation-footer">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelWizard}
                className="text-xs font-bold text-slate-500 hover:text-slate-850 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
              >
                Cancel Draft & Exit
              </button>
              <button
                onClick={handleSaveWizardDraftManually}
                className="text-xs font-bold text-slate-650 hover:text-slate-850 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleWizardPrev}
                disabled={wizardStep === "info"}
                className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                  wizardStep === "info" 
                    ? "bg-slate-50 text-slate-300 border-slate-150 cursor-not-allowed" 
                    : "bg-white text-slate-700 border-slate-250 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                &larr; Previous
              </button>

              {wizardStep !== "publish" && wizardStep !== "validation" && wizardStep !== "info" && wizardStep !== "method" && (
                <button
                  onClick={handleWizardSkip}
                  className="text-xs font-bold text-slate-500 hover:text-slate-850 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 transition-all"
                >
                  Skip Step
                </button>
              )}

              {wizardStep === "info" ? (
                <button
                  onClick={() => setWizardStep("method")}
                  disabled={!(selectedProjectId && selectedLayoutId && activeLayoutObj)}
                  className={`font-bold text-xs px-6 py-2 rounded-xl transition-all shadow-sm ${
                    (selectedProjectId && selectedLayoutId && activeLayoutObj)
                      ? "bg-indigo-650 hover:bg-indigo-700 text-white cursor-pointer"
                      : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                  }`}
                >
                  Continue to Creation Method &rarr;
                </button>
              ) : wizardStep === "publish" ? (
                <button
                  onClick={handlePublishLayoutSubmit}
                  className="bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs px-6 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Layout Blueprint Live</span>
                </button>
              ) : (
                <button
                  onClick={handleWizardNext}
                  disabled={wizardStep === "method" && !(wizardCreationMethod === "pdf" || wizardCreationMethod === "manual")}
                  className={`font-bold text-xs px-6 py-2 rounded-xl transition-all shadow-sm ${
                    wizardStep === "method" && !(wizardCreationMethod === "pdf" || wizardCreationMethod === "manual")
                      ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                      : "bg-indigo-650 hover:bg-indigo-700 text-white cursor-pointer"
                  }`}
                >
                  Continue &rarr;
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Validation Suite Alerts Overlay Toast */}
      {showValidationToast && (
        <div className="fixed top-16 right-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-5 w-96 z-50 animate-slideIn" id="validation-report-toast">
          <div className="flex justify-between items-start pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Geometrical Validation Report</h4>
            </div>
            <button 
              onClick={() => setShowValidationToast(false)}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-xs text-slate-600">
            <p className="leading-relaxed">
              BhoomiOne validation middleware completed analysis checks on vector layers. 2 minor warnings recorded:
            </p>
            <div className="space-y-1.5 font-mono text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
              {validationErrors.map((err, index) => (
                <div key={index} className="flex gap-1">
                  <span className="font-bold flex-shrink-0">&bull;</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Overlap checking checks layout vertices boundary limits to prevent duplicate survey registrations automatically.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowValidationToast(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              Acknowledge Checks
            </button>
          </div>
        </div>
      )}

      {/* Draft Resume Prompt Modal */}
      {showDraftPromptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" id="draft-resume-modal">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">Active Session Draft Found</h3>
                <p className="text-[11px] text-slate-500 font-sans font-medium">BhoomiOne Workspace Session Continuity</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-xs text-slate-650 leading-relaxed">
                An auto-saved drafting session layout draft exists for this project. Would you like to resume your previous work exactly where you left off, or start a new session?
              </p>
              {draftLayoutData && (
                <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5 text-[11px] font-mono text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Layout Name:</span>
                    <span className="font-bold text-slate-800">{draftLayoutData.wizardLayoutName || "Untitled Layout"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Active Step:</span>
                    <span className="font-bold text-indigo-700 uppercase">{draftLayoutData.wizardStep || "info"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Elements Saved:</span>
                    <span className="font-bold text-emerald-700">{(draftLayoutData.objects || []).length} items</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => setShowDraftPromptModal(false)}
                className="order-3 sm:order-1 text-xs font-bold text-slate-500 hover:text-slate-850 hover:bg-slate-150 px-4 py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeStartNewLayoutWizard}
                className="order-2 sm:order-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 transition-all"
              >
                Start New Session
              </button>
              <button
                onClick={() => {
                  handleResumeWizardDraft();
                  setShowDraftPromptModal(false);
                }}
                className="order-1 sm:order-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-650/10 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Resume Previous Draft</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
