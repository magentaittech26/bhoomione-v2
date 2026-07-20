import React, { useState } from "react";
import { 
  Sliders, 
  Tag, 
  Trash2, 
  Plus, 
  Paintbrush, 
  ChevronLeft, 
  Compass,
  AlertCircle,
  Hash,
  Copy,
  RotateCw,
  RefreshCw,
  Maximize,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Activity
} from "lucide-react";
import { MockGeometry } from "./types.ts";
import { isModuleActive } from "../../modules/index.ts";
import EmptyState from "./EmptyState.tsx";
import { 
  calculatePlotMetrics, 
  getPolygonCentroid, 
  rotatePoints, 
  scalePoints, 
  detectPlotFacing,
  detectPlotCornerType,
  runValidationSuite,
  calculateCenterlineLength,
  generateCarriagewayPolygon,
  calculateRoadDirection,
  calculatePolygonPerimeter
} from "../../lib/plotEngine.ts";
import { 
  ModifyGeometryCommand, 
  CreateGeometryCommand, 
  BulkUpdateCommand 
} from "../../MapEngine/Drawing/DrawingToolManager.ts";
import PlotInspector from "../../modules/plots/inspector/PlotInspector.tsx";

interface InspectorProps {
  selectedObject: MockGeometry | null;
  onUpdateObject: (updated: MockGeometry) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  objects?: MockGeometry[];
  onUpdateObjects?: (updated: MockGeometry[]) => void;
  drawingManager?: any;
}

export default function Inspector({
  selectedObject,
  onUpdateObject,
  isCollapsed,
  setIsCollapsed,
  objects = [],
  onUpdateObjects,
  drawingManager
}: InspectorProps) {
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");
  const [showAddAttr, setShowAddAttr] = useState(false);

  // Bulk Numbering form state
  const [bulkStartNum, setBulkStartNum] = useState(101);
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkIncrement, setBulkIncrement] = useState(1);
  const [bulkAlgo, setBulkAlgo] = useState<"sequential" | "clockwise" | "counter-clockwise">("sequential");

  // Update simple direct properties
  const handlePropertyChange = (key: string, value: any) => {
    if (!selectedObject) return;
    
    let updatedProperties = {
      ...selectedObject.properties,
      [key]: value
    };

    let updatedName = selectedObject.name;

    if (selectedObject.layerName === "ROADS") {
      // If changing road type, update width automatically
      if (key === "road_type") {
        let defaultWidth = 12;
        if (value === "Primary Road") defaultWidth = 15;
        else if (value === "Secondary Road") defaultWidth = 12;
        else if (value === "Internal Road") defaultWidth = 9;
        else if (value === "Service Road") defaultWidth = 6;
        else if (value === "Pedestrian Path") defaultWidth = 3;
        
        updatedProperties.road_width = defaultWidth;
      }

      if (key === "road_name" || key === "park_name" || key === "amenity_name") {
        updatedName = value;
      }

      // Recalculate centerline, length, boundary, direction, status
      const coords = selectedObject.geometry_data.coordinates as Array<[number, number]>;
      const width = updatedProperties.road_width || 12;
      const lenVal = calculateCenterlineLength(coords);
      
      updatedProperties = {
        ...updatedProperties,
        center_line: coords,
        boundary: generateCarriagewayPolygon(coords, width),
        length: parseFloat(lenVal.toFixed(2)),
        direction: calculateRoadDirection(coords),
        area_value: parseFloat((lenVal * width).toFixed(2))
      };
      
      if (!updatedProperties.status) {
        updatedProperties.status = "Draft";
      }
    }

    if (key === "road_name" || key === "park_name" || key === "amenity_name" || key === "utility_name" || key === "name" || key === "plot_number") {
      updatedName = key === "plot_number" ? `Subdivided Plot ${value}` : value;
    }

    onUpdateObject({
      ...selectedObject,
      name: updatedName,
      properties: updatedProperties
    });
  };

  // Update nested style parameters
  const handleStyleChange = (key: string, value: any) => {
    if (!selectedObject) return;
    onUpdateObject({
      ...selectedObject,
      style_config: {
        ...selectedObject.style_config,
        [key]: value
      }
    });
  };

  // Add extensible custom metadata attribute
  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObject || !newAttrKey.trim() || !newAttrValue.trim()) return;

    onUpdateObject({
      ...selectedObject,
      properties: {
        ...selectedObject.properties,
        [newAttrKey.trim()]: newAttrValue.trim()
      }
    });

    setNewAttrKey("");
    setNewAttrValue("");
    setShowAddAttr(false);
  };

  // Remove extensible custom metadata attribute
  const handleRemoveAttribute = (key: string) => {
    if (!selectedObject) return;
    const updatedProperties = { ...selectedObject.properties };
    delete updatedProperties[key];

    onUpdateObject({
      ...selectedObject,
      properties: updatedProperties
    });
  };

  // Format array coordinates nicely for reading
  const renderCoordinatesText = () => {
    if (!selectedObject) return "N/A";
    const coords = selectedObject.geometry_data.coordinates;
    if (Array.isArray(coords)) {
      if (Array.isArray(coords[0])) {
        return `${coords.length} Vertices (Closed Polygon)`;
      } else {
        return `X: ${coords[0]}, Y: ${coords[1]}`;
      }
    }
    return "N/A";
  };

  // Rotate selected geometry
  const handleRotate = (angle: number) => {
    if (!selectedObject || !onUpdateObjects || !drawingManager) return;
    const coords = selectedObject.geometry_data.coordinates as Array<[number, number]>;
    if (!coords || coords.length === 0) return;

    const centroid = getPolygonCentroid(coords);
    const rotated = rotatePoints(coords, angle, centroid);

    const cmd = new ModifyGeometryCommand(
      selectedObject.id,
      coords,
      rotated,
      selectedObject.style_config,
      selectedObject.style_config,
      objects,
      (updated) => onUpdateObjects(updated),
      (id) => {}
    );
    drawingManager.executeCommand(cmd);
  };

  // Scale selected geometry
  const handleScale = (factor: number) => {
    if (!selectedObject || !onUpdateObjects || !drawingManager) return;
    const coords = selectedObject.geometry_data.coordinates as Array<[number, number]>;
    if (!coords || coords.length === 0) return;

    const centroid = getPolygonCentroid(coords);
    const scaled = scalePoints(coords, factor, centroid);

    const cmd = new ModifyGeometryCommand(
      selectedObject.id,
      coords,
      scaled,
      selectedObject.style_config,
      selectedObject.style_config,
      objects,
      (updated) => onUpdateObjects(updated),
      (id) => {}
    );
    drawingManager.executeCommand(cmd);
  };

  // Copy/Duplicate selected object (shifted slightly)
  const handleDuplicate = () => {
    if (!selectedObject || !onUpdateObjects || !drawingManager) return;
    const coords = selectedObject.geometry_data.coordinates as Array<[number, number]>;
    if (!coords || coords.length === 0) return;

    const shifted = coords.map(pt => [pt[0] + 30, pt[1] + 30] as [number, number]);
    const isPlot = selectedObject.layerName === "PLOTS";

    let newProps = { ...selectedObject.properties };
    if (isPlot) {
      const plots = objects.filter(o => o.layerName === "PLOTS");
      const plotNumbers = plots.map(o => parseInt(o.properties?.plot_number || "")).filter(n => !isNaN(n));
      const nextNum = plotNumbers.length > 0 ? Math.max(...plotNumbers) + 1 : 101;
      newProps = {
        ...newProps,
        plot_number: String(nextNum)
      };
    }

    const newObj: MockGeometry = {
      ...selectedObject,
      id: `obj-dup-${Date.now()}`,
      name: isPlot ? `Subdivided Plot ${newProps.plot_number}` : `${selectedObject.name} (Copy)`,
      geometry_data: {
        coordinates: shifted
      },
      properties: newProps,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const cmd = new CreateGeometryCommand(
      newObj,
      objects,
      (updated) => onUpdateObjects(updated),
      (id) => {}
    );
    drawingManager.executeCommand(cmd);
  };

  // Bulk numbering & sorting execution
  const handleBulkRenumber = () => {
    if (objects.length === 0 || !onUpdateObjects || !drawingManager) return;

    const plots = objects.filter(o => o.layerName === "PLOTS");
    if (plots.length === 0) return;

    // Calculate collective centroid to sort from center out
    let totalX = 0, totalY = 0, totalCount = 0;
    const plotCentroids = plots.map(plot => {
      const coords = plot.geometry_data.coordinates as Array<[number, number]>;
      const centroid = getPolygonCentroid(coords);
      totalX += centroid[0];
      totalY += centroid[1];
      totalCount++;
      return { plot, centroid };
    });

    const collectiveCentroid: [number, number] = [totalX / (totalCount || 1), totalY / (totalCount || 1)];

    // Sort according to selection
    if (bulkAlgo === "clockwise") {
      plotCentroids.sort((a, b) => {
        const angleA = Math.atan2(a.centroid[1] - collectiveCentroid[1], a.centroid[0] - collectiveCentroid[0]);
        const angleB = Math.atan2(b.centroid[1] - collectiveCentroid[1], b.centroid[0] - collectiveCentroid[0]);
        return angleA - angleB;
      });
    } else if (bulkAlgo === "counter-clockwise") {
      plotCentroids.sort((a, b) => {
        const angleA = Math.atan2(a.centroid[1] - collectiveCentroid[1], a.centroid[0] - collectiveCentroid[0]);
        const angleB = Math.atan2(b.centroid[1] - collectiveCentroid[1], b.centroid[0] - collectiveCentroid[0]);
        return angleB - angleA;
      });
    } else {
      // Sequential: Left to Right
      plotCentroids.sort((a, b) => {
        if (Math.abs(a.centroid[0] - b.centroid[0]) > 30) {
          return a.centroid[0] - b.centroid[0];
        }
        return a.centroid[1] - b.centroid[1];
      });
    }

    // Apply sequential plot numbers
    const updatedObjs = objects.map(o => {
      if (o.layerName === "PLOTS") {
        const sortedIdx = plotCentroids.findIndex(pc => pc.plot.id === o.id);
        if (sortedIdx !== -1) {
          const plotNum = `${bulkPrefix}${bulkStartNum + sortedIdx * bulkIncrement}`;
          return {
            ...o,
            name: `Subdivided Plot ${plotNum}`,
            properties: {
              ...o.properties,
              plot_number: plotNum
            }
          };
        }
      }
      return o;
    });

    // Commit BulkUpdateCommand to standard history stack
    const cmd = new BulkUpdateCommand(
      objects,
      updatedObjs,
      (updated) => onUpdateObjects(updated),
      `Bulk Renumber plots (${bulkAlgo} sorting)`
    );
    drawingManager.executeCommand(cmd);
  };

  const standardPropertyKeys = ["plot_id", "plot_number", "area_value", "road_width", "amenity_type", "facing", "zoning", "owner", "corner_type"];
  const customAttributes = selectedObject
    ? Object.entries(selectedObject.properties).filter(([k]) => !standardPropertyKeys.includes(k))
    : [];

  const validationWarnings = runValidationSuite(objects);

  // Compute live plot area metrics
  const plotCoords = selectedObject?.geometry_data?.coordinates as Array<[number, number]>;
  const isPlot = (selectedObject?.layerName === "PLOTS" || selectedObject?.properties?.plot_number !== undefined) && isModuleActive("mod-plots");
  const metrics = (isPlot && plotCoords && plotCoords.length >= 3) ? calculatePlotMetrics(plotCoords) : null;

  return (
    <div 
      className={`border-l border-slate-200 bg-white flex transition-all duration-300 relative select-none ${
        isCollapsed ? "w-12" : "w-80"
      }`}
      id="workspace-right-sidebar"
    >
      {/* A. Collapse Handle Bar */}
      <div className="w-12 border-r border-slate-100 flex flex-col items-center py-4 flex-shrink-0 bg-slate-50/70" id="inspector-collapse-bar">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          title={isCollapsed ? "Expand Inspector" : "Collapse Inspector"}
          id="inspector-toggle-trigger"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>

        {!isCollapsed && (
          <div className="mt-6 flex flex-col items-center gap-4 text-slate-350">
            <Sliders className="w-4 h-4" />
            <Tag className="w-4 h-4" />
            <Paintbrush className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* B. Content Inspector Panel */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-w-0 animate-fadeIn h-full" id="inspector-main-panel">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Plot & Layer Inspector</span>
            </h3>
            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-mono uppercase border border-emerald-100">
              CAD Core
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-600" id="inspector-scroll-area">
            {selectedObject ? (
              <div className="space-y-5 animate-fadeIn" id="inspector-content">
                
                {/* Section 1: Core Geometry Details */}
                <div className="space-y-3" id="inspector-section-core">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>Object Geometry</span>
                    <Compass className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-450">Object Name</span>
                      <span className="font-bold text-slate-800">{selectedObject.name}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-450">Layer Mapping</span>
                      <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] uppercase">
                        {selectedObject.layerName}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-450">Type Code</span>
                      <span className="font-semibold text-slate-800">{selectedObject.object_type}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-450">Geom Coordinates</span>
                      <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={renderCoordinatesText()}>
                        {renderCoordinatesText()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Real-time Area Metrics */}
                {metrics && (
                  <div className="space-y-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3" id="inspector-area-metrics">
                    <div className="flex justify-between items-center text-[9px] font-bold text-emerald-700 uppercase tracking-wider border-b border-emerald-100/60 pb-1">
                      <span>Dynamic Area Calculations</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[10px] text-slate-600">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Square Feet</span>
                        <span className="text-emerald-800 font-extrabold">{metrics.sqft.toLocaleString()} sq.ft</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Square Meters</span>
                        <span className="text-slate-800 font-bold">{metrics.sqm.toLocaleString()} m²</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Acres</span>
                        <span className="text-slate-800 font-medium">{metrics.acres.toFixed(4)} Ac</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Guntas (Kar.)</span>
                        <span className="text-slate-800 font-medium">{metrics.gunta.toFixed(2)} gt</span>
                      </div>
                      <div className="flex flex-col col-span-2 border-t border-emerald-100/50 pt-1.5 mt-0.5">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Cent Decimal</span>
                        <span className="text-slate-800 font-semibold">{metrics.cent.toFixed(2)} cents</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Geometry Manipulations */}
                <div className="space-y-3" id="inspector-geometric-operations">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>CAD Transform Tools</span>
                    <RotateCw className="w-3.5 h-3.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRotate(15)}
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700 active:scale-95 transition-all"
                      title="Rotate 15 deg Clockwise"
                    >
                      <RotateCw className="w-3 h-3 text-slate-500" />
                      <span>Rotate +15°</span>
                    </button>
                    <button
                      onClick={() => handleRotate(-15)}
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700 active:scale-95 transition-all"
                      title="Rotate 15 deg Counter-Clockwise"
                    >
                      <RotateCw className="w-3 h-3 text-slate-500 rotate-180" />
                      <span>Rotate -15°</span>
                    </button>
                    <button
                      onClick={() => handleScale(1.05)}
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700 active:scale-95 transition-all"
                      title="Scale up by 1.05x"
                    >
                      <Plus className="w-3 h-3 text-slate-500" />
                      <span>Scale +5%</span>
                    </button>
                    <button
                      onClick={() => handleScale(0.95)}
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700 active:scale-95 transition-all"
                      title="Scale down by 0.95x"
                    >
                      <Sliders className="w-3 h-3 text-slate-500" />
                      <span>Scale -5%</span>
                    </button>
                    <button
                      onClick={handleDuplicate}
                      className="col-span-2 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-lg cursor-pointer text-[10px] font-bold text-indigo-700 active:scale-95 transition-all"
                      title="Duplicate selected geometry"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-650" />
                      <span>Copy & Duplicate Shape</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Direct Attributes Editors */}
                <div className="space-y-3.5" id="inspector-section-attributes">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>Attributes Ledger</span>
                    <Hash className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-3">
                    {/* Plot specific controls */}
                    {isPlot && (
                      <PlotInspector
                        selectedObject={selectedObject}
                        onUpdateObject={onUpdateObject}
                        allObjects={objects}
                      />
                    )}

                    {/* Roads specific controls */}
                    {selectedObject.layerName === "ROADS" && isModuleActive("mod-roads") && (
                      <div className="space-y-4 border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Road Name</label>
                          <input
                            type="text"
                            value={selectedObject.properties.road_name || selectedObject.name || ""}
                            onChange={(e) => handlePropertyChange("road_name", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-medium text-xs"
                            placeholder="Enter road name..."
                            id="attr-road-name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Road Classification</label>
                          <select
                            value={selectedObject.properties.road_type || "Secondary Road"}
                            onChange={(e) => handlePropertyChange("road_type", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-medium cursor-pointer"
                            id="attr-road-classification"
                          >
                            <option value="Primary Road">Primary Road (15m)</option>
                            <option value="Secondary Road">Secondary Road (12m)</option>
                            <option value="Internal Road">Internal Road (9m)</option>
                            <option value="Service Road">Service Road (6m)</option>
                            <option value="Pedestrian Path">Pedestrian Path (3m)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Road Width (Meters)</label>
                          <input
                            type="number"
                            value={selectedObject.properties.road_width || ""}
                            onChange={(e) => handlePropertyChange("road_width", Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                            min="1"
                            max="50"
                            id="attr-road-width"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Approval Status</label>
                          <select
                            value={selectedObject.properties.status || "Draft"}
                            onChange={(e) => handlePropertyChange("status", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-medium cursor-pointer"
                            id="attr-road-status"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Validated">Validated</option>
                            <option value="Approved">Approved</option>
                          </select>
                        </div>

                        {/* Real-time calculated spatial metadata */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Calculated Spatial Metrics</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-medium">Bearing / Heading</span>
                              <span className="font-semibold text-slate-700 block">
                                {selectedObject.properties.direction || calculateRoadDirection(selectedObject.geometry_data.coordinates as Array<[number, number]>)}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-medium">Segment Length</span>
                              <span className="font-semibold text-slate-700 block">
                                {(selectedObject.properties.length || calculateCenterlineLength(selectedObject.geometry_data.coordinates as Array<[number, number]>)).toFixed(1)} m
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-medium">Total Carriageway Area</span>
                              <span className="font-semibold text-slate-700 block">
                                {((selectedObject.properties.length || calculateCenterlineLength(selectedObject.geometry_data.coordinates as Array<[number, number]>)) * (selectedObject.properties.road_width || 12)).toFixed(1)} sqm
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-medium">GIS Standard</span>
                              <span className="font-bold text-indigo-650 block">IRC Class A</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Parks & Open Spaces specific controls */}
                    {selectedObject.layerName === "PARK" && isModuleActive("mod-parks") && (
                      <div className="space-y-4 border-b border-slate-100 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Park Name</label>
                            <input
                              type="text"
                              value={selectedObject.properties.park_name || selectedObject.name || ""}
                              onChange={(e) => handlePropertyChange("park_name", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. Central Lawn"
                              id="attr-park-name"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Park / Space Number</label>
                            <input
                              type="text"
                              value={selectedObject.properties.park_number || ""}
                              onChange={(e) => handlePropertyChange("park_number", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. PK-04"
                              id="attr-park-number"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Park / Open Space Type</label>
                          <select
                            value={selectedObject.properties.park_type || "Park"}
                            onChange={(e) => handlePropertyChange("park_type", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                            id="attr-park-type"
                          >
                            <option value="Park">Park</option>
                            <option value="Children Park">Children Park</option>
                            <option value="Garden">Garden</option>
                            <option value="Central Park">Central Park</option>
                            <option value="Open Space">Open Space</option>
                            <option value="Buffer Zone">Buffer Zone</option>
                            <option value="Green Belt">Green Belt</option>
                            <option value="Reserved Open Space">Reserved Open Space</option>
                            <option value="Recreation Area">Recreation Area</option>
                            <option value="Future Expansion Area">Future Expansion Area</option>
                          </select>
                        </div>

                        {/* Real-time calculated spatial metadata for Parks */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Calculated Park Metrics (Live)</span>
                          {(() => {
                            const coords = selectedObject.geometry_data.coordinates as Array<[number, number]>;
                            const metrics = coords && coords.length >= 3 ? calculatePlotMetrics(coords) : { sqm: 0, sqft: 0, acres: 0, gunta: 0, cent: 0 };
                            const perimeter = coords && coords.length >= 2 ? calculatePolygonPerimeter(coords) : 0;
                            return (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Square Feet</span>
                                  <span className="font-bold text-slate-700 block">{metrics.sqft.toLocaleString()} sqft</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Square Meters</span>
                                  <span className="font-bold text-slate-700 block">{metrics.sqm.toLocaleString()} m²</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Acres</span>
                                  <span className="font-semibold text-slate-700 block">{metrics.acres.toFixed(4)} ac</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100 col-span-1">
                                  <span className="text-[9px] text-slate-400 block font-medium">Guntas</span>
                                  <span className="font-semibold text-slate-700 block">{metrics.gunta.toFixed(2)} guntas</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100 col-span-1">
                                  <span className="text-[9px] text-slate-400 block font-medium">Cents</span>
                                  <span className="font-semibold text-slate-700 block">{metrics.cent.toFixed(2)} cents</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Perimeter</span>
                                  <span className="font-bold text-indigo-650 block">{perimeter.toFixed(1)} meters</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Landscape Status</label>
                            <select
                              value={selectedObject.properties.landscape_status || "Planned"}
                              onChange={(e) => handlePropertyChange("landscape_status", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-park-landscape"
                            >
                              <option value="Planned">Planned</option>
                              <option value="Under Construction">Under Construction</option>
                              <option value="Completed">Completed</option>
                              <option value="Maintained">Maintained</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Maintenance Status</label>
                            <select
                              value={selectedObject.properties.maintenance_status || "Good"}
                              onChange={(e) => handlePropertyChange("maintenance_status", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-park-maintenance"
                            >
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Accessibility</label>
                          <select
                            value={selectedObject.properties.accessibility || "Public"}
                            onChange={(e) => handlePropertyChange("accessibility", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                            id="attr-park-accessibility"
                          >
                            <option value="Public">Public (All Access)</option>
                            <option value="Wheelchair Accessible">Wheelchair Accessible</option>
                            <option value="Restricted">Restricted Access</option>
                            <option value="Private">Private / Members Only</option>
                          </select>
                        </div>

                        {/* Amenity Toggles / Details */}
                        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-3">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">LID / Landscape Infrastructure</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase block">Lighting</label>
                              <select
                                value={selectedObject.properties.lighting || "Solar Lighting"}
                                onChange={(e) => handlePropertyChange("lighting", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none focus:border-indigo-500 text-[11px]"
                                id="attr-park-lighting"
                              >
                                <option value="LED Street Lights">LED Street Lights</option>
                                <option value="Solar Lighting">Solar Lighting</option>
                                <option value="Decorative Lamps">Decorative Lamps</option>
                                <option value="None">None</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase block">Irrigation</label>
                              <select
                                value={selectedObject.properties.irrigation || "Sprinklers"}
                                onChange={(e) => handlePropertyChange("irrigation", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none focus:border-indigo-500 text-[11px]"
                                id="attr-park-irrigation"
                              >
                                <option value="Sprinklers">Sprinklers</option>
                                <option value="Drip Irrigation">Drip Irrigation</option>
                                <option value="Manual Hose">Manual Hose</option>
                                <option value="None">None</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-650">
                              <input
                                type="checkbox"
                                checked={!!selectedObject.properties.water_feature}
                                onChange={(e) => handlePropertyChange("water_feature", e.target.checked)}
                                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                id="attr-park-water-feature"
                              />
                              Water Feature
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-650">
                              <input
                                type="checkbox"
                                checked={!!selectedObject.properties.play_area}
                                onChange={(e) => handlePropertyChange("play_area", e.target.checked)}
                                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                id="attr-park-play-area"
                              />
                              Play Area
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-650">
                              <input
                                type="checkbox"
                                checked={!!selectedObject.properties.walking_track}
                                onChange={(e) => handlePropertyChange("walking_track", e.target.checked)}
                                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                id="attr-park-walking-track"
                              />
                              Walking Track
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-650">
                              <input
                                type="checkbox"
                                checked={!!selectedObject.properties.parking_available}
                                onChange={(e) => handlePropertyChange("parking_available", e.target.checked)}
                                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                id="attr-park-parking"
                              />
                              Parking Available
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block font-sans">Notes / Remarks</label>
                          <textarea
                            value={selectedObject.properties.notes || ""}
                            onChange={(e) => handlePropertyChange("notes", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs min-h-[60px]"
                            placeholder="Add landscape design remarks or community guidelines..."
                            id="attr-park-notes"
                          />
                        </div>
                      </div>
                    )}

                    {/* Amenities specific controls */}
                    {selectedObject.layerName === "AMENITIES" && isModuleActive("mod-amenities") && (
                      <div className="space-y-4 border-b border-slate-100 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Amenity Name</label>
                            <input
                              type="text"
                              value={selectedObject.properties.amenity_name || selectedObject.name || ""}
                              onChange={(e) => handlePropertyChange("amenity_name", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. Community Center"
                              id="attr-amenity-name"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Unique GIS Code</label>
                            <input
                              type="text"
                              value={selectedObject.properties.unique_code || ""}
                              onChange={(e) => handlePropertyChange("unique_code", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs font-mono"
                              placeholder="e.g. AM-102"
                              id="attr-amenity-code"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Amenity Category / Type</label>
                          <select
                            value={selectedObject.properties.amenity_type || "Hospital"}
                            onChange={(e) => handlePropertyChange("amenity_type", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                            id="attr-amenity-type"
                          >
                            <option value="Temple">Temple</option>
                            <option value="Mosque">Mosque</option>
                            <option value="Church">Church</option>
                            <option value="Community Hall">Community Hall</option>
                            <option value="Club House">Club House</option>
                            <option value="Swimming Pool">Swimming Pool</option>
                            <option value="Gym">Gym</option>
                            <option value="School">School</option>
                            <option value="College">College</option>
                            <option value="Hospital">Hospital</option>
                            <option value="Clinic">Clinic</option>
                            <option value="Shopping Complex">Shopping Complex</option>
                            <option value="Commercial Block">Commercial Block</option>
                            <option value="Office Block">Office Block</option>
                            <option value="Police Station">Police Station</option>
                            <option value="Fire Station">Fire Station</option>
                            <option value="Water Tank">Water Tank</option>
                            <option value="Electrical Substation">Electrical Substation</option>
                            <option value="STP">STP (Sewage Treatment)</option>
                            <option value="Sewage Pump">Sewage Pump</option>
                            <option value="Solid Waste Collection Point">Solid Waste Collection Point</option>
                            <option value="Security Cabin">Security Cabin</option>
                            <option value="Main Entrance Gate">Main Entrance Gate</option>
                            <option value="Secondary Gate">Secondary Gate</option>
                            <option value="Bus Stop">Bus Stop</option>
                            <option value="Parking">Parking</option>
                            <option value="EV Charging Station">EV Charging Station</option>
                          </select>
                        </div>

                        {/* Real-time calculated spatial metadata for Amenities */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Calculated Spatial Metrics (Live)</span>
                          {(() => {
                            if (selectedObject.object_type === "POINT") {
                              const coords = selectedObject.geometry_data.coordinates as [number, number];
                              return (
                                <div className="space-y-1 text-xs font-sans">
                                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                                    <span className="text-[9px] text-slate-400 font-medium">GIS Geometry:</span>
                                    <span className="font-extrabold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded text-[8px] uppercase font-mono">POINT SYMBOL</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center font-mono text-[9px]">
                                    <span className="text-slate-400">Position Coordinates:</span>
                                    <span className="font-semibold text-slate-700">({coords[0].toFixed(1)}m, {coords[1].toFixed(1)}m)</span>
                                  </div>
                                </div>
                              );
                            }

                            const coords = selectedObject.geometry_data.coordinates as Array<[number, number]>;
                            const metrics = coords && coords.length >= 3 ? calculatePlotMetrics(coords) : { sqm: 0, sqft: 0, acres: 0, gunta: 0, cent: 0 };
                            const perimeter = coords && coords.length >= 2 ? calculatePolygonPerimeter(coords) : 0;
                            return (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Square Feet</span>
                                  <span className="font-bold text-slate-700 block">{metrics.sqft.toLocaleString()} sqft</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Square Meters</span>
                                  <span className="font-bold text-slate-700 block">{metrics.sqm.toLocaleString()} m²</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Acres</span>
                                  <span className="font-semibold text-slate-700 block">{metrics.acres.toFixed(4)} ac</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Perimeter</span>
                                  <span className="font-bold text-indigo-650 block">{perimeter.toFixed(1)} meters</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Status</label>
                            <select
                              value={selectedObject.properties.status || "Planned"}
                              onChange={(e) => handlePropertyChange("status", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-amenity-status"
                            >
                              <option value="Planned">Planned</option>
                              <option value="Proposed">Proposed</option>
                              <option value="Under Construction">Under Construction</option>
                              <option value="Completed">Completed</option>
                              <option value="Active">Active</option>
                              <option value="Suspended">Suspended</option>
                              <option value="Abandon">Abandoned</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Ownership</label>
                            <select
                              value={selectedObject.properties.ownership || "Municipal Board"}
                              onChange={(e) => handlePropertyChange("ownership", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-amenity-ownership"
                            >
                              <option value="Private">Private</option>
                              <option value="Public">Public</option>
                              <option value="Municipal Board">Municipal Board</option>
                              <option value="Trust">Trust</option>
                              <option value="Corporate">Corporate</option>
                              <option value="Joint Venture">Joint Venture</option>
                              <option value="Government">Government</option>
                              <option value="NGO">NGO</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Operational</label>
                            <select
                              value={selectedObject.properties.operational_status || "Proposed"}
                              onChange={(e) => handlePropertyChange("operational_status", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-amenity-operational"
                            >
                              <option value="Operational">Operational</option>
                              <option value="Closed">Closed</option>
                              <option value="Proposed">Proposed</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Under Construction">Under Construction</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Construction</label>
                            <select
                              value={selectedObject.properties.construction_status || "Proposed"}
                              onChange={(e) => handlePropertyChange("construction_status", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-amenity-construction"
                            >
                              <option value="Proposed">Proposed</option>
                              <option value="Approved">Approved</option>
                              <option value="Excavation">Excavation</option>
                              <option value="Structure">Structure</option>
                              <option value="Finishes">Finishes</option>
                              <option value="Commissioned">Commissioned</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Agency / Owner Name</label>
                          <input
                            type="text"
                            value={selectedObject.properties.owner || ""}
                            onChange={(e) => handlePropertyChange("owner", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                            placeholder="e.g. Municipal Board, Health Dept"
                            id="attr-amenity-owner"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Design Capacity</label>
                            <input
                              type="text"
                              value={selectedObject.properties.capacity || ""}
                              onChange={(e) => handlePropertyChange("capacity", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. 500 visitors, 50 beds"
                              id="attr-amenity-capacity"
                            />
                          </div>
                          <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-650">
                              <input
                                type="checkbox"
                                checked={!!selectedObject.properties.future_expansion}
                                onChange={(e) => handlePropertyChange("future_expansion", e.target.checked)}
                                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                id="attr-amenity-expansion"
                              />
                              Future Expansion
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Description / Remarks</label>
                          <textarea
                            value={selectedObject.properties.description || ""}
                            onChange={(e) => handlePropertyChange("description", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs min-h-[50px]"
                            placeholder="Add brief details about the public block..."
                            id="attr-amenity-desc"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Maintenance Directives</label>
                          <textarea
                            value={selectedObject.properties.maintenance_notes || ""}
                            onChange={(e) => handlePropertyChange("maintenance_notes", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs min-h-[50px]"
                            placeholder="Add maintenance schedules or contact logs..."
                            id="attr-amenity-maint"
                          />
                        </div>
                      </div>
                    )}

                    {/* Utilities specific controls */}
                    {selectedObject.layerName === "UTILITIES" && isModuleActive("mod-utilities") && (
                      <div className="space-y-4 border-b border-slate-100 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Utility Name</label>
                            <input
                              type="text"
                              value={selectedObject.properties.utility_name || selectedObject.name || ""}
                              onChange={(e) => handlePropertyChange("utility_name", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. Water Pipeline A"
                              id="attr-utility-name"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Utility Code</label>
                            <input
                              type="text"
                              value={selectedObject.properties.utility_code || ""}
                              onChange={(e) => handlePropertyChange("utility_code", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs font-mono"
                              placeholder="e.g. UT-LINE-101"
                              id="attr-utility-code"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Network Type</label>
                            <select
                              value={selectedObject.properties.network_type || "Water Supply"}
                              onChange={(e) => handlePropertyChange("network_type", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-utility-network"
                            >
                              <option value="Water Supply">Water Supply</option>
                              <option value="Raw Water Line">Raw Water Line</option>
                              <option value="Overhead Water Line">Overhead Water Line</option>
                              <option value="UG Water Line">UG Water Line</option>
                              <option value="Sewer Line">Sewer Line</option>
                              <option value="Storm Water Drain">Storm Water Drain</option>
                              <option value="Open Drain">Open Drain</option>
                              <option value="Underground Drain">Underground Drain</option>
                              <option value="Electrical LT">Electrical LT</option>
                              <option value="Electrical HT">Electrical HT</option>
                              <option value="Street Lighting">Street Lighting</option>
                              <option value="Fiber Optic">Fiber Optic</option>
                              <option value="Telecom">Telecom</option>
                              <option value="Gas Pipeline">Gas Pipeline</option>
                              <option value="Fire Hydrant Line">Fire Hydrant Line</option>
                              <option value="Irrigation Line">Irrigation Line</option>
                              <option value="Rainwater Harvesting Line">Rainwater Harvesting Line</option>
                              <option value="Future Reserved Utility">Future Reserved Utility</option>
                            </select>
                          </div>

                          {selectedObject.object_type === "POINT" ? (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Asset Node Type</label>
                              <select
                                value={selectedObject.properties.utility_type || "Transformer"}
                                onChange={(e) => handlePropertyChange("utility_type", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                                id="attr-utility-asset-node"
                              >
                                <option value="Transformer">Transformer</option>
                                <option value="Electric Pole">Electric Pole</option>
                                <option value="Street Light">Street Light</option>
                                <option value="Manhole">Manhole</option>
                                <option value="Inspection Chamber">Inspection Chamber</option>
                                <option value="Valve Chamber">Valve Chamber</option>
                                <option value="Water Valve">Water Valve</option>
                                <option value="Fire Hydrant">Fire Hydrant</option>
                                <option value="Pump House">Pump House</option>
                                <option value="Lift Station">Lift Station</option>
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Pipe Diameter</label>
                              <input
                                type="text"
                                value={selectedObject.properties.diameter || ""}
                                onChange={(e) => handlePropertyChange("diameter", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                                placeholder="e.g. 150 mm, 4 inches"
                                id="attr-utility-diameter"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Material</label>
                            <input
                              type="text"
                              value={selectedObject.properties.material || ""}
                              onChange={(e) => handlePropertyChange("material", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. PVC, HDPE, DI, RCC"
                              id="attr-utility-material"
                            />
                          </div>
                          
                          {selectedObject.properties.network_type?.toLowerCase().includes("electric") || selectedObject.properties.network_type?.toLowerCase().includes("light") ? (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Voltage Level</label>
                              <input
                                type="text"
                                value={selectedObject.properties.voltage || ""}
                                onChange={(e) => handlePropertyChange("voltage", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                                placeholder="e.g. 440 V, 11 KV"
                                id="attr-utility-voltage"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Pressure / Flow Class</label>
                              <input
                                type="text"
                                value={selectedObject.properties.pressure_class || ""}
                                onChange={(e) => handlePropertyChange("pressure_class", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                                placeholder="e.g. PN 10, PN 16, Class 150"
                                id="attr-utility-pressure"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Cover Depth (meters)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedObject.properties.minimum_cover ?? 0.8}
                              onChange={(e) => handlePropertyChange("minimum_cover", parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. 0.8"
                              id="attr-utility-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Design Capacity</label>
                            <input
                              type="text"
                              value={selectedObject.properties.capacity || ""}
                              onChange={(e) => handlePropertyChange("capacity", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                              placeholder="e.g. 100 kVA, 50 Lps"
                              id="attr-utility-capacity"
                            />
                          </div>
                        </div>

                        {/* Real-time calculated spatial metadata for Utilities */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Calculated Spatial Metrics (Live)</span>
                          {(() => {
                            if (selectedObject.object_type === "POINT") {
                              const coords = selectedObject.geometry_data.coordinates as [number, number];
                              return (
                                <div className="space-y-1 text-xs font-sans">
                                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center font-mono text-[9px]">
                                    <span className="text-slate-400">Position Coordinates:</span>
                                    <span className="font-semibold text-slate-700">({coords[0].toFixed(1)}m, {coords[1].toFixed(1)}m)</span>
                                  </div>
                                </div>
                              );
                            }

                            const coords = selectedObject.geometry_data.coordinates as Array<[number, number]>;
                            const lenVal = coords && coords.length >= 2 ? calculateCenterlineLength(coords) : 0;
                            return (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Pipeline Length</span>
                                  <span className="font-bold text-indigo-650 block">{lenVal.toFixed(1)} meters</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="text-[9px] text-slate-400 block font-medium">Vertices Count</span>
                                  <span className="font-bold text-slate-700 block">{coords?.length || 0} nodes</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Asset Condition</label>
                            <select
                              value={selectedObject.properties.condition || "Excellent"}
                              onChange={(e) => handlePropertyChange("condition", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-utility-condition"
                            >
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Maintenance Status</label>
                            <select
                              value={selectedObject.properties.maintenance_status || "Operational"}
                              onChange={(e) => handlePropertyChange("maintenance_status", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-utility-maint-status"
                            >
                              <option value="Operational">Operational</option>
                              <option value="Under Maintenance">Under Maintenance</option>
                              <option value="Needs Repair">Needs Repair</option>
                              <option value="Inoperative">Inoperative</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Operational Status</label>
                            <select
                              value={selectedObject.properties.operational_status || "Active"}
                              onChange={(e) => handlePropertyChange("operational_status", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                              id="attr-utility-operational-status"
                            >
                              <option value="Active">Active</option>
                              <option value="Proposed">Proposed</option>
                              <option value="Abandoned">Abandoned</option>
                              <option value="Future Upgrade">Future Upgrade</option>
                            </select>
                          </div>
                          <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-650">
                              <input
                                type="checkbox"
                                checked={!!selectedObject.properties.future_upgrade}
                                onChange={(e) => handlePropertyChange("future_upgrade", e.target.checked)}
                                className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                id="attr-utility-future-upgrade"
                              />
                              Needs Future Upgrade
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Owner Agency</label>
                          <input
                            type="text"
                            value={selectedObject.properties.owner || "Municipal Utilities Department"}
                            onChange={(e) => handlePropertyChange("owner", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-semibold text-xs"
                            placeholder="e.g. Municipal Board"
                            id="attr-utility-owner"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Notes & Remarks</label>
                          <textarea
                            value={selectedObject.properties.notes || ""}
                            onChange={(e) => handlePropertyChange("notes", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs min-h-[50px]"
                            placeholder="Add brief utility notes or design codes..."
                            id="attr-utility-notes"
                          />
                        </div>
                      </div>
                    )}

                    {/* Standard details for others */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Designated Owner / Entity</label>
                      <input
                        type="text"
                        placeholder="e.g. Municipal Board"
                        value={selectedObject.properties.owner || ""}
                        onChange={(e) => handlePropertyChange("owner", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500"
                        id="attr-owner-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Extensible attributes metadata */}
                <div className="space-y-3" id="inspector-section-custom">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>Custom Metadata</span>
                    <button 
                      type="button"
                      className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                      onClick={() => setShowAddAttr(!showAddAttr)}
                      title="Add Custom Attribute"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-650 cursor-pointer" />
                    </button>
                  </div>

                  {/* Add Attribute Drawer Form */}
                  {showAddAttr && (
                    <form onSubmit={handleAddAttribute} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-slideIn">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-450 uppercase block mb-0.5">Key</label>
                          <input
                            type="text"
                            required
                            placeholder="Zoning"
                            value={newAttrKey}
                            onChange={(e) => setNewAttrKey(e.target.value.replace(/\s+/g, "_"))}
                            className="w-full bg-white border border-slate-200 rounded-md p-1 font-mono text-[10px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-450 uppercase block mb-0.5">Value</label>
                          <input
                            type="text"
                            required
                            placeholder="Commercial"
                            value={newAttrValue}
                            onChange={(e) => setNewAttrValue(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md p-1 text-[10px] outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 text-[9px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setShowAddAttr(false)}
                          className="px-2 py-1 bg-white hover:bg-slate-150 border border-slate-200 rounded cursor-pointer text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer"
                        >
                          Register
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Custom values listing */}
                  <div className="space-y-1.5" id="custom-metadata-list">
                    {customAttributes.map(([key, val]) => (
                      <div 
                        key={key} 
                        className="p-2 border border-slate-150 rounded-lg flex items-center justify-between hover:bg-slate-50"
                        id={`custom-attr-${key}`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-mono text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded mr-1.5 uppercase">{key}</span>
                          <span className="text-slate-800 font-medium">{String(val)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(key)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {customAttributes.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic block py-1">No custom attributes. Click + above to register keys.</span>
                    )}
                  </div>
                </div>

                {/* Section 6: Live Style Overrides */}
                <div className="space-y-3.5" id="inspector-section-style">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>Rendering Style Overrides</span>
                    <Paintbrush className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-3">
                    {/* Stroke Color */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Stroke Color</label>
                        <span className="font-mono text-[10px] text-slate-800">{selectedObject.style_config?.strokeColor || "#000000"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedObject.style_config?.strokeColor || "#000000"}
                          onChange={(e) => handleStyleChange("strokeColor", e.target.value)}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden"
                          id="style-stroke-picker"
                        />
                        <input
                          type="text"
                          value={selectedObject.style_config?.strokeColor || "#000000"}
                          onChange={(e) => handleStyleChange("strokeColor", e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono text-[11px] uppercase"
                        />
                      </div>
                    </div>

                    {/* Fill Color */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Fill Color</label>
                        <span className="font-mono text-[10px] text-slate-800">{selectedObject.style_config?.fillColor || "#000000"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedObject.style_config?.fillColor || "#000000"}
                          onChange={(e) => handleStyleChange("fillColor", e.target.value)}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden"
                          id="style-fill-picker"
                        />
                        <input
                          type="text"
                          value={selectedObject.style_config?.fillColor || "#000000"}
                          onChange={(e) => handleStyleChange("fillColor", e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono text-[11px] uppercase"
                        />
                      </div>
                    </div>

                    {/* Stroke Width Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Stroke Width (Thickness)</label>
                        <span className="font-mono text-[10px] font-bold text-slate-800">{selectedObject.style_config?.strokeWidth || 1}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={selectedObject.style_config?.strokeWidth || 1}
                        onChange={(e) => handleStyleChange("strokeWidth", Number(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        id="style-stroke-width"
                      />
                    </div>

                    {/* Opacity Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Fill Opacity (Transparency)</label>
                        <span className="font-mono text-[10px] font-bold text-slate-800">{Math.round((selectedObject.style_config?.opacity || 0.5) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedObject.style_config?.opacity || 0.5}
                        onChange={(e) => handleStyleChange("opacity", Number(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        id="style-opacity"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Global Layout Automation Panel (When no individual object selected) */
              <div className="space-y-5 animate-fadeIn" id="inspector-global-panel">
                
                {/* 1. Automated Sequential Plot Numbering Panel */}
                <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5" id="global-bulk-numbering">
                  <div className="flex justify-between items-center text-[10px] font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-100 pb-1.5">
                    <span>Automated Plot Numbering</span>
                    <Hash className="w-4 h-4 text-indigo-600" />
                  </div>
                  
                  <div className="space-y-3 pt-1">
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Automatically sort and renumber all subdivisions using clockwise, counter-clockwise, or linear grid layouts.
                    </p>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-450 uppercase block">Starting Value</label>
                      <input
                        type="number"
                        value={bulkStartNum}
                        onChange={(e) => setBulkStartNum(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-mono font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-450 uppercase block">Prefix</label>
                        <input
                          type="text"
                          placeholder="P-"
                          value={bulkPrefix}
                          onChange={(e) => setBulkPrefix(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-450 uppercase block">Increment</label>
                        <input
                          type="number"
                          value={bulkIncrement}
                          onChange={(e) => setBulkIncrement(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-450 uppercase block">Renumbering Path Algorithm</label>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-2 p-1.5 bg-white border border-slate-150 rounded-lg cursor-pointer hover:border-indigo-300">
                          <input
                            type="radio"
                            name="bulk_algo"
                            checked={bulkAlgo === "sequential"}
                            onChange={() => setBulkAlgo("sequential")}
                            className="accent-indigo-600"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-[10px]">Sequential (Left-to-Right)</span>
                            <span className="text-[8px] text-slate-450">Order sequentially by coordinate offset</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 bg-white border border-slate-150 rounded-lg cursor-pointer hover:border-indigo-300">
                          <input
                            type="radio"
                            name="bulk_algo"
                            checked={bulkAlgo === "clockwise"}
                            onChange={() => setBulkAlgo("clockwise")}
                            className="accent-indigo-600"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-[10px]">Clockwise Spiral</span>
                            <span className="text-[8px] text-slate-450">Order radially around plot center</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 bg-white border border-slate-150 rounded-lg cursor-pointer hover:border-indigo-300">
                          <input
                            type="radio"
                            name="bulk_algo"
                            checked={bulkAlgo === "counter-clockwise"}
                            onChange={() => setBulkAlgo("counter-clockwise")}
                            className="accent-indigo-600"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-[10px]">Counter-Clockwise Spiral</span>
                            <span className="text-[8px] text-slate-450">Radial order in reverse direction</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleBulkRenumber}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-[10px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                      <span>Renumber All Subdivision Plots</span>
                    </button>
                  </div>
                </div>

                {/* 2. Live Layout Validation Warning Panel */}
                <div className="space-y-3 bg-rose-50/50 border border-rose-200/60 rounded-2xl p-4.5" id="global-validation-ledger">
                  <div className="flex justify-between items-center text-[10px] font-bold text-rose-800 uppercase tracking-wider border-b border-rose-100 pb-1.5">
                    <span>Geometric Validity Log</span>
                    <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                  </div>
                  
                  <div className="space-y-2 pt-1">
                    {validationWarnings.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 leading-normal">
                          The following spatial anomalies are live in your draft. Address these to comply with municipal plotting standards:
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {validationWarnings.map((warn, i) => (
                            <div 
                              key={i} 
                              className="bg-white border border-rose-150 p-2 rounded-lg text-[9px] font-mono text-rose-800 flex gap-1.5 items-start"
                            >
                              <span className="text-rose-500 font-extrabold flex-shrink-0">&bull;</span>
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center space-y-1.5">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        <span className="font-bold text-slate-800 text-[11px]">Draft is Geometrically Clean</span>
                        <span className="text-[9px] text-slate-450 leading-normal max-w-[180px]">
                          All active plot polygons conform to intersection and minimum footprint metrics!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <EmptyState 
                    title="No Object Selected" 
                    description="Click any visual shape, plot border, road line, or marker in the canvas center to inspect and modify attributes."
                    icon={<HelpCircle className="w-5 h-5 text-slate-400" />}
                  />
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
