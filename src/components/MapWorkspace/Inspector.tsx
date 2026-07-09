import React, { useState } from "react";
import { 
  Sliders, 
  Tag, 
  Trash2, 
  Plus, 
  Maximize, 
  Paintbrush, 
  Layers, 
  ChevronLeft, 
  Compass,
  AlertCircle,
  Hash
} from "lucide-react";
import { MockGeometry } from "./types.ts";
import EmptyState from "./EmptyState.tsx";

interface InspectorProps {
  selectedObject: MockGeometry | null;
  onUpdateObject: (updated: MockGeometry) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Inspector({
  selectedObject,
  onUpdateObject,
  isCollapsed,
  setIsCollapsed
}: InspectorProps) {
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");
  const [showAddAttr, setShowAddAttr] = useState(false);

  // Update simple direct properties
  const handlePropertyChange = (key: string, value: any) => {
    if (!selectedObject) return;
    onUpdateObject({
      ...selectedObject,
      properties: {
        ...selectedObject.properties,
        [key]: value
      }
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
        // Multi-coordinate line or polygon
        return `${coords.length} Vertices (Closed Polygon)`;
      } else {
        // Point
        return `X: ${coords[0]}, Y: ${coords[1]}`;
      }
    }
    return "N/A";
  };

  // Exclude standard properties from custom attributes listing
  const standardPropertyKeys = ["plot_id", "plot_number", "area_value", "road_width", "amenity_type", "facing", "zoning", "owner"];
  const customAttributes = selectedObject
    ? Object.entries(selectedObject.properties).filter(([k]) => !standardPropertyKeys.includes(k))
    : [];

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
        <div className="flex-1 flex flex-col min-w-0 animate-fadeIn" id="inspector-main-panel">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Properties Inspector</span>
            </h3>
            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono uppercase">
              active
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

                {/* Section 2: Direct Attributes Editors */}
                <div className="space-y-3.5" id="inspector-section-attributes">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>Attributes Ledger</span>
                    <Hash className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-3">
                    {/* Plot specific controls */}
                    {selectedObject.layerName === "PLOTS" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plot Number</label>
                          <input
                            type="text"
                            value={selectedObject.properties.plot_number || ""}
                            onChange={(e) => handlePropertyChange("plot_number", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500"
                            id="attr-plot-number"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Area (SQFT)</label>
                          <input
                            type="number"
                            value={selectedObject.properties.area_value || ""}
                            onChange={(e) => handlePropertyChange("area_value", Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500"
                            id="attr-area-value"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facing Direction</label>
                          <select
                            value={selectedObject.properties.facing || "EAST"}
                            onChange={(e) => handlePropertyChange("facing", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                            id="attr-facing-select"
                          >
                            <option value="EAST">EAST Facing</option>
                            <option value="WEST">WEST Facing</option>
                            <option value="NORTH">NORTH Facing</option>
                            <option value="SOUTH">SOUTH Facing</option>
                            <option value="CORNER">EAST-NORTH CORNER</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Roads specific controls */}
                    {selectedObject.layerName === "ROADS" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Road Width (Meters)</label>
                        <input
                          type="number"
                          value={selectedObject.properties.road_width || ""}
                          onChange={(e) => handlePropertyChange("road_width", Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500"
                          id="attr-road-width"
                        />
                      </div>
                    )}

                    {/* Standard details for others */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Designated Owner / Entity</label>
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

                {/* Section 3: Extensible attributes metadata */}
                <div className="space-y-3" id="inspector-section-custom">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>Custom Metadata</span>
                    <button 
                      type="button"
                      className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                      onClick={() => setShowAddAttr(!showAddAttr)}
                      title="Add Custom Attribute"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-600 cursor-pointer" />
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

                {/* Section 4: Live Style Overrides */}
                <div className="space-y-3.5" id="inspector-section-style">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    <span>Rendering Style Overrides</span>
                    <Paintbrush className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-3">
                    {/* Stroke Color */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Stroke Color</label>
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
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Fill Color</label>
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
              <EmptyState 
                title="No Object Selected" 
                description="Click any visual shape, plot border, road line, or marker in the canvas center to inspect and modify attributes."
                icon={<AlertCircle className="w-5 h-5 text-slate-400" />}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
