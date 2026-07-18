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
  calculateRoadDirection
} from "../../lib/plotEngine.ts";
import { 
  ModifyGeometryCommand, 
  CreateGeometryCommand, 
  BulkUpdateCommand 
} from "../../MapEngine/Drawing/DrawingToolManager.ts";

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

      if (key === "road_name") {
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
  const isPlot = selectedObject?.layerName === "PLOTS" || selectedObject?.properties?.plot_number !== undefined;
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
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Plot Number</label>
                          <input
                            type="text"
                            value={selectedObject.properties.plot_number || ""}
                            onChange={(e) => {
                              handlePropertyChange("plot_number", e.target.value);
                              // Update name sequentially as well
                              onUpdateObject({
                                ...selectedObject,
                                name: `Subdivided Plot ${e.target.value}`,
                                properties: {
                                  ...selectedObject.properties,
                                  plot_number: e.target.value
                                }
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-mono font-bold"
                            id="attr-plot-number"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Manual Registered Area (SQFT)</label>
                          <input
                            type="number"
                            value={selectedObject.properties.area_value || ""}
                            onChange={(e) => handlePropertyChange("area_value", Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-mono"
                            id="attr-area-value"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Facing Direction</label>
                          <select
                            value={selectedObject.properties.facing || "EAST"}
                            onChange={(e) => handlePropertyChange("facing", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                            id="attr-facing-select"
                          >
                            <option value="EAST">EAST Facing</option>
                            <option value="WEST">WEST Facing</option>
                            <option value="NORTH">NORTH Facing</option>
                            <option value="SOUTH">SOUTH Facing</option>
                            <option value="NORTH-EAST">NORTH-EAST Facing</option>
                            <option value="NORTH-WEST">NORTH-WEST Facing</option>
                            <option value="SOUTH-EAST">SOUTH-EAST Facing</option>
                            <option value="SOUTH-WEST">SOUTH-WEST Facing</option>
                          </select>
                        </div>
                        {selectedObject.properties.corner_type && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Autodetected Layout Class</label>
                            <span className="block w-full bg-indigo-50/50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-1.5 font-bold text-[10px]">
                              {selectedObject.properties.corner_type}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Roads specific controls */}
                    {selectedObject.layerName === "ROADS" && (
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
