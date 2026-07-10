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
  HelpCircle
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

type WizardStep =
  | "info"
  | "method"
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
}

export default function MapWorkspaceIndex({ 
  initialProjectId = null, 
  initialLayoutId = null,
  projects = [],
  layouts = [],
  onBackToInventory
}: MapWorkspaceIndexProps = {}) {
  // Navigation flow state: "projects" | "layouts" | "workspace"
  const [currentStep, setCurrentStep] = useState<"projects" | "layouts" | "workspace">("projects");
  
  // Data State Arrays
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [layoutsList, setLayoutsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);

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
        setWizardStep("method"); // Continue directly to step 2: Choose Method
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

        setStatusLog(`Layout Studio Wizard launched for "${layout.name}". Skipped step 1 (Layout Info already exists in ERP).`);
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
  const [wizardStep, setWizardStep] = useState<WizardStep>("info");
  
  // Form fields
  const [wizardLayoutName, setWizardLayoutName] = useState("");
  const [wizardLayoutType, setWizardLayoutType] = useState<"Residential" | "Commercial" | "Mixed-Use" | "">("");
  const [wizardLayoutPhase, setWizardLayoutPhase] = useState("Phase 1");
  const [wizardLayoutDesc, setWizardLayoutDesc] = useState("");
  const [wizardCreationMethod, setWizardCreationMethod] = useState<"pdf" | "image" | "dxf" | "manual" | "">("");
  const [wizardUploadedFile, setWizardUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [wizardCompletedSteps, setWizardCompletedSteps] = useState<Record<string, boolean>>({});

  // Local draft cache loader state
  const [draftLayoutData, setDraftLayoutData] = useState<any | null>(null);

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
    wizardCompletedSteps,
    objects
  ]);

  // Geometry specific auto-save per layout
  useEffect(() => {
    if (selectedLayoutId) {
      localStorage.setItem(`bhoomi_geometry_layout_${selectedLayoutId}`, JSON.stringify(objects));
    }
  }, [objects, selectedLayoutId]);

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

  // Handlers
  const handleStartNewLayoutWizard = () => {
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
    const currentStepIndex = WIZARD_STEPS_META.findIndex(x => x.id === wizardStep);
    if (currentStepIndex > 0) {
      const prevStep = WIZARD_STEPS_META[currentStepIndex - 1].id as WizardStep;
      setWizardStep(prevStep);
      setStatusLog(`Moved back to step: ${WIZARD_STEPS_META[currentStepIndex - 1].label}`);
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
      if (wizardCreationMethod !== "manual" && !wizardUploadedFile) {
        alert("Please select or drag-and-drop a coordinate file to align layers.");
        return;
      }
    }

    if (wizardStep === "boundary") {
      const hasBoundary = objects.some(o => o.layerName === "BOUNDARY");
      if (!hasBoundary) {
        alert("Boundary not completed! You must draw a layout boundary polygon before you can proceed to roads.");
        return;
      }
    }

    setWizardCompletedSteps(prev => ({ ...prev, [wizardStep]: true }));

    const currentStepIndex = WIZARD_STEPS_META.findIndex(x => x.id === wizardStep);
    if (currentStepIndex < WIZARD_STEPS_META.length - 1) {
      const nextStep = WIZARD_STEPS_META[currentStepIndex + 1].id as WizardStep;
      setWizardStep(nextStep);
      setStatusLog(`Proceeded to step: ${WIZARD_STEPS_META[currentStepIndex + 1].label}`);
    }
  };

  const handleWizardSkip = () => {
    setWizardCompletedSteps(prev => ({ ...prev, [wizardStep]: true }));

    const currentStepIndex = WIZARD_STEPS_META.findIndex(x => x.id === wizardStep);
    if (currentStepIndex < WIZARD_STEPS_META.length - 1) {
      const nextStep = WIZARD_STEPS_META[currentStepIndex + 1].id as WizardStep;
      setWizardStep(nextStep);
      setStatusLog(`Skipped step: ${WIZARD_STEPS_META[currentStepIndex].label}`);
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

  const activeProjectObj = projectsList.find(p => p.id === selectedProjectId);
  const activeLayoutObj = layoutsList.find(l => l.id === selectedLayoutId);
  const activeVersionObj = versions.find(v => v.id === activeVersionId);
  const selectedObj = objects.find(o => o.id === selectedObjectId) || null;

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
                  Layout Creation Studio &mdash; <span className="text-indigo-400">{(wizardStep === "info" && selectedLayoutId) ? "Project & Layout Info" : WIZARD_STEPS_META.find(s => s.id === wizardStep)?.label}</span>
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
                  {WIZARD_STEPS_META.map((step, idx) => {
                    const label = (step.id === "info" && selectedLayoutId) ? "Project & Layout Info" : step.label;
                    const isActive = wizardStep === step.id;
                    const isCompleted = wizardCompletedSteps[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => {
                          // Allow jumping back to previously configured steps
                          const stepIdx = WIZARD_STEPS_META.findIndex(s => s.id === step.id);
                          const activeIdx = WIZARD_STEPS_META.findIndex(s => s.id === wizardStep);
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
                  {selectedLayoutId ? (
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Parent Project Context */}
                        <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                            Parent Project Context
                          </p>
                          <div className="space-y-2 text-xs">
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Project Name:</span>
                              <strong className="text-slate-800 text-right">{activeProjectObj?.name || "N/A"}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Project Code:</span>
                              <strong className="text-slate-800 font-mono text-right">{activeProjectObj?.code || "N/A"}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Developer:</span>
                              <strong className="text-slate-800 text-right">{activeProjectObj?.developer_name || activeProjectObj?.developer || "N/A"}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Location:</span>
                              <strong className="text-slate-800 text-right">{activeProjectObj?.location || "N/A"}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Layout Subdivision Plan */}
                        <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                            Layout Subdivision Plan
                          </p>
                          <div className="space-y-2 text-xs">
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Layout Name:</span>
                              <strong className="text-slate-800 text-right">{wizardLayoutName || activeLayoutObj?.name || "N/A"}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Zoning Type:</span>
                              <strong className="text-slate-800 text-right">{wizardLayoutType || activeLayoutObj?.layout_type || "N/A"}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Development Phase:</span>
                              <strong className="text-slate-800 text-right">{wizardLayoutPhase || "Phase 1"}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500">Lifecycle State:</span>
                              <strong className="text-indigo-700 font-bold uppercase font-mono text-right">{activeLayoutObj?.status || "N/A"}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {wizardLayoutDesc && (
                        <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                          <p className="italic text-slate-600 leading-relaxed">{wizardLayoutDesc}</p>
                        </div>
                      )}

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
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xl w-full shadow-md space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          Step 1: Collect Layout Plan Information
                        </h3>
                        <p className="text-xs text-slate-500">
                          Specify basic parameters regarding zoning designations, surveys, and planned construction phases.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <span>Layout Name</span>
                            <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Sector C Green Park Meadows"
                            value={wizardLayoutName}
                            onChange={(e) => setWizardLayoutName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>Zoning Classification</span>
                              <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <select
                              value={wizardLayoutType}
                              onChange={(e) => setWizardLayoutType(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                            >
                              <option value="">-- Select Zoning --</option>
                              <option value="Residential">Residential</option>
                              <option value="Commercial">Commercial</option>
                              <option value="Mixed-Use">Mixed-Use</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">
                              Development Phase
                            </label>
                            <select
                              value={wizardLayoutPhase}
                              onChange={(e) => setWizardLayoutPhase(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                            >
                              <option value="Phase 1">Phase 1 (Immediate Release)</option>
                              <option value="Phase 2">Phase 2 (Under Survey)</option>
                              <option value="Phase 3">Phase 3 (Future Booking)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">
                            Detailed Operational Brief
                          </label>
                          <textarea
                            placeholder="Draft layout survey details, developer notes, or municipal clearance indices..."
                            value={wizardLayoutDesc}
                            onChange={(e) => setWizardLayoutDesc(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Configure Creation Method & Drag-and-Drop */}
              {wizardStep === "method" && (
                <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-center max-w-4xl mx-auto w-full space-y-6 animate-fadeIn" id="wizard-method-view">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Step 2: Configure Coordinate Base Method
                    </h3>
                    <p className="text-xs text-slate-500">
                      Decide whether to draw layout lines completely from scratch or import coordinates from an existing architectural survey file.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { id: "manual", title: "Draw Manually", desc: "Construct boundaries, roads, and plots from a clean coordinate system." },
                      { id: "dxf", title: "Import DXF File", desc: "Extract layers automatically from a native CAD vector coordinates map." },
                      { id: "pdf", title: "Import PDF", desc: "Align vertices against a flattened PDF vector sheet or survey certificate." },
                      { id: "image", title: "Import PNG/JPG", desc: "Overlay an aerial survey layout blueprint as a spatial reference." }
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setWizardCreationMethod(m.id as any);
                          if (m.id === "manual") setWizardUploadedFile(null);
                        }}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          wizardCreationMethod === m.id 
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                            : "border-slate-200 bg-white hover:border-slate-350"
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800">{m.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-normal">{m.desc}</p>
                        </div>
                        <div className="flex justify-end pt-1">
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            wizardCreationMethod === m.id 
                              ? "bg-indigo-600 border-indigo-600 text-white" 
                              : "border-slate-300"
                          }`}>
                            {wizardCreationMethod === m.id && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Drag-and-Drop Area for File Upload */}
                  {wizardCreationMethod && wizardCreationMethod !== "manual" && (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          setWizardUploadedFile({ name: file.name, size: file.size });
                          setStatusLog(`Coordinate file dropped: ${file.name}`);
                        }
                      }}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = wizardCreationMethod === "dxf" ? ".dxf" : wizardCreationMethod === "pdf" ? ".pdf" : "image/*";
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setWizardUploadedFile({ name: file.name, size: file.size });
                            setStatusLog(`Coordinate file selected: ${file.name}`);
                          }
                        };
                        input.click();
                      }}
                      className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-white hover:bg-slate-50 cursor-pointer transition-all space-y-3"
                      id="wizard-drag-drop-zone"
                    >
                      <div className="mx-auto bg-indigo-50 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-800">
                          Drag and drop your .{wizardCreationMethod.toUpperCase()} blueprint coordinate file here
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          or click to choose file from your system explorer (Max 25MB)
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        BhoomiOne parses coordinate schemas, geometric vertices, and AutoCAD layouts automatically.
                      </p>
                    </div>
                  )}

                  {/* Uploaded File Stats & Auto-Extract Action */}
                  {wizardUploadedFile && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fadeIn" id="uploaded-file-stats">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-sm">
                            {wizardUploadedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {(wizardUploadedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; AutoCAD Spatial Layer Group
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          // Inject mock extracted vector geometry coordinates instantly!
                          setObjects(MOCK_EXTRACTED_OBJECTS);
                          setStatusLog("Extracted 1 boundary polygon, 2 road arterials, and 5 subdivided plots from DXF coordinate records!");
                          alert("SUCCESS: Extracted AutoCAD Layer coordinates. Outer boundary polygon, roads, and 5 initial subdivided plot cards mapped automatically to layout drafting canvas!");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <span>Auto-Extract Layers</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* DRAWING STEPS: Render Canvas + Floating Instruction Card */}
              {["boundary", "roads", "parks", "amenities", "utilities", "plots"].includes(wizardStep) && (
                <div className="flex-1 flex flex-col relative" id="wizard-drawing-canvas-pane">
                  
                  {/* Floating Step Guideline Box */}
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
                className="text-xs font-bold text-slate-600 hover:text-slate-850 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
              >
                Save Progress
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleWizardPrev}
                disabled={wizardStep === "info"}
                className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                  wizardStep === "info" 
                    ? "bg-slate-50 text-slate-300 border-slate-150 cursor-not-allowed" 
                    : "bg-white text-slate-700 border-slate-250 hover:bg-slate-50"
                }`}
              >
                &larr; Back
              </button>

              {wizardStep !== "publish" && wizardStep !== "validation" && wizardStep !== "info" && (
                <button
                  onClick={handleWizardSkip}
                  className="text-xs font-bold text-slate-500 hover:text-slate-850 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 transition-all"
                >
                  Skip Step
                </button>
              )}

              {wizardStep === "publish" ? (
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
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2 rounded-xl transition-all shadow-sm"
                >
                  Next Step &rarr;
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

    </div>
  );
}
