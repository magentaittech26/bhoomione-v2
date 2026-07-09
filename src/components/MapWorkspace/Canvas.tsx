import React, { useState, useRef, useEffect } from "react";
import { Move, Maximize2, ZoomIn, ZoomOut, Compass, HelpCircle } from "lucide-react";
import { WorkspaceTool, MockGeometry } from "./types.ts";
import { GeometryLayer, GeometryObject } from "../../MapEngine/Contracts/models.ts";
import { CanvasViewportEngine } from "../../MapEngine/Rendering/CanvasViewportEngine.ts";

interface CanvasProps {
  layers: GeometryLayer[];
  selectedTool: WorkspaceTool;
  objects: MockGeometry[];
  onSelectObject: (obj: MockGeometry | null) => void;
  selectedObjectId: string | null;
  onUpdateObjects: (objs: MockGeometry[]) => void;
  zoomLevel: number;
  setZoomLevel: (z: number) => void;
  searchQuery: string;
  onUpdateMouseCoords: (coords: { x: number; y: number } | null) => void;
  isGridVisible: boolean;
  isSnapToGrid: boolean;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  statusLog: string;
  setStatusLog: (log: string) => void;
  isSpacePanActive?: boolean;
}

/**
 * Standard Point-In-Polygon checking algorithm (Ray Casting Method)
 */
function isPointInPolygon(point: [number, number], vs: Array<[number, number]>): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates perpendicular distance from a point to a line segment
 */
function distanceToSegment(p: [number, number], v: [number, number], w: [number, number]): number {
  const l2 = Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
  if (l2 === 0) return Math.sqrt(Math.pow(p[0] - v[0], 2) + Math.pow(p[1] - v[1], 2));
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(
    Math.pow(p[0] - (v[0] + t * (w[0] - v[0])), 2) +
    Math.pow(p[1] - (v[1] + t * (w[1] - v[1])), 2)
  );
}

export default function Canvas({
  layers,
  selectedTool,
  objects,
  onSelectObject,
  selectedObjectId,
  onUpdateObjects,
  zoomLevel,
  setZoomLevel,
  searchQuery,
  onUpdateMouseCoords,
  isGridVisible,
  isSnapToGrid,
  pan,
  setPan,
  statusLog,
  setStatusLog,
  isSpacePanActive = false
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasViewportEngine | null>(null);

  // Drag pan states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panAtStart, setPanAtStart] = useState({ x: 0, y: 0 });

  // Measurement Tool states
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number; y: number } | null>(null);
  const [savedMeasurements, setSavedMeasurements] = useState<
    { p1: { x: number; y: number }; p2: { x: number; y: number }; distance: number }[]
  >([]);

  // 1. Initialize Viewport Engine once element is fully mounted
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const engine = new CanvasViewportEngine(canvasRef.current, width, height);
    engineRef.current = engine;

    // Sync initial zoom and pan parameters
    engine.updateViewport({
      zoom: zoomLevel / 100,
      panX: pan.x,
      panY: pan.y
    });

    // Start requestAnimationFrame render cycle loop
    engine.start();

    // 2. Setup dynamic ResizeObserver
    const observer = new ResizeObserver((entries) => {
      if (!containerRef.current || !engineRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      engineRef.current.resize(rect.width, rect.height);
      engineRef.current.invalidate();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  // 3. React to updates and sync props parameters with Viewport Engine
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.updateViewport({
      zoom: zoomLevel / 100,
      panX: pan.x,
      panY: pan.y
    });
  }, [zoomLevel, pan.x, pan.y]);

  // Synchronize Render Callbacks each time render-impacting elements update
  useEffect(() => {
    if (!engineRef.current) return;

    // Pre-render hooks (Clear & Draw Grid)
    engineRef.current.setBeforeRender((ctx) => {
      if (!engineRef.current) return;
      engineRef.current.drawEngineeringGrid(isGridVisible);
    });

    // Post-render hooks (Draw Geometries, Labels, Measurements overlays)
    engineRef.current.setAfterRender((ctx) => {
      if (!engineRef.current) return;

      // Typecast objects as compatible GeometryObject for engine render compatibility
      const castedObjects = objects as unknown as GeometryObject[];
      engineRef.current.drawGeometries(castedObjects, layers, selectedObjectId, searchQuery);

      // Render measurements
      drawMeasurementsOnContext(ctx, engineRef.current);

      // Draw rulers overlay
      engineRef.current.drawRulers();
    });

    engineRef.current.invalidate();
  }, [layers, objects, selectedObjectId, searchQuery, isGridVisible, measureStart, measureCurrent, savedMeasurements, selectedTool]);

  /**
   * Dedicated overlay drawing module for CAD scale measurements
   */
  const drawMeasurementsOnContext = (ctx: CanvasRenderingContext2D, engine: CanvasViewportEngine) => {
    // 1. Render Saved Measurements
    savedMeasurements.forEach((m) => {
      const p1 = engine.worldToScreen(m.p1.x, m.p1.y);
      const p2 = engine.worldToScreen(m.p2.x, m.p2.y);

      ctx.save();
      ctx.strokeStyle = "#EC4899"; // Pink measuring line
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = "#EC4899";
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Render distance pill label
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const label = `${m.distance.toFixed(1)}m`;
      
      ctx.font = "bold 9px monospace";
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = "#FCE7F3";
      ctx.strokeStyle = "#F472B6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#9D174D";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, midX, midY);
      ctx.restore();
    });

    // 2. Render Active Measurement (being drawn live)
    if (selectedTool === "measure" && measureStart && measureCurrent) {
      const p1 = engine.worldToScreen(measureStart.x, measureStart.y);
      const p2 = engine.worldToScreen(measureCurrent.x, measureCurrent.y);

      ctx.save();
      ctx.strokeStyle = "#4F46E5"; // Indigo live line
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = "#4F46E5";
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
      ctx.fill();

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = measureCurrent.x - measureStart.x;
      const dy = measureCurrent.y - measureStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy) * 0.5; // conversion scale
      const label = `${distance.toFixed(1)}m`;

      ctx.font = "bold 9px monospace";
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = "#EEF2FF";
      ctx.strokeStyle = "#818CF8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - textWidth / 2 - 6, midY - 10, textWidth + 12, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#3730A3";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, midX, midY);
      ctx.restore();
    }
  };

  /**
   * Screen coordinates capture on moving cursor
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = zoomLevel / 100;
    const worldPos = engineRef.current.screenToWorld(mouseX, mouseY);

    // Grid snapping logic if enabled
    const finalX = isSnapToGrid ? Math.round(worldPos.x / 20) * 20 : worldPos.x;
    const finalY = isSnapToGrid ? Math.round(worldPos.y / 20) * 20 : worldPos.y;

    onUpdateMouseCoords({ x: finalX, y: finalY });

    if (selectedTool === "measure" && measureStart) {
      setMeasureCurrent({ x: finalX, y: finalY });
    }

    // Process drag panning
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({
        x: panAtStart.x + dx,
        y: panAtStart.y + dy
      });
    }
  };

  /**
   * Primary mouse interaction trigger
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current) return;

        // Right/Middle-click triggers instant Drag Pan overrides regardless of active tools
    const isMiddleClick = e.button === 1;
    const isPanMode = selectedTool === "pan" || isSpacePanActive || isMiddleClick || (selectedTool === "select" && !selectedObjectId);

    if (isPanMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanAtStart({ x: pan.x, y: pan.y });
      return;
    }

    // Get exact canvas coordinates
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = engineRef.current.screenToWorld(mouseX, mouseY);

    const finalX = isSnapToGrid ? Math.round(worldPos.x / 20) * 20 : worldPos.x;
    const finalY = isSnapToGrid ? Math.round(worldPos.y / 20) * 20 : worldPos.y;

    if (selectedTool === "measure") {
      if (!measureStart) {
        setMeasureStart({ x: finalX, y: finalY });
        setMeasureCurrent({ x: finalX, y: finalY });
        setStatusLog(`Measuring started at (${finalX.toFixed(1)}m, ${finalY.toFixed(1)}m). Move cursor.`);
      } else {
        // Finalize measurement segment
        const dx = finalX - measureStart.x;
        const dy = finalY - measureStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy) * 0.5; // scale distance logic

        setSavedMeasurements(prev => [
          ...prev,
          {
            p1: measureStart,
            p2: { x: finalX, y: finalY },
            distance: dist
          }
        ]);
        setMeasureStart(null);
        setMeasureCurrent(null);
        setStatusLog(`Measured path segment length: ${dist.toFixed(2)} meters.`);
      }
      return;
    }

    if (selectedTool === "select") {
      // Loop through elements in reverse order of drawing (top-most elements first)
      const reverseObjects = [...objects].reverse();
      let hitElement: MockGeometry | null = null;

      for (const obj of reverseObjects) {
        // Validate layer is visible and unlocked
        const layer = layers.find(l => l.layer_name === obj.layerName);
        if (!layer || !layer.is_visible || layer.is_locked) continue;

        if (obj.object_type === "POLYGON" || obj.object_type === "BOUNDARY") {
          const ring = obj.geometry_data.coordinates as Array<[number, number]>;
          if (isPointInPolygon([finalX, finalY], ring)) {
            hitElement = obj;
            break;
          }
        } else if (obj.object_type === "POLYLINE") {
          const pts = obj.geometry_data.coordinates as Array<[number, number]>;
          if (pts.length >= 2) {
            // Find distance to segment
            const dist = distanceToSegment([finalX, finalY], pts[0], pts[1]);
            // Click threshold tolerance (12 world meters)
            if (dist < 12) {
              hitElement = obj;
              break;
            }
          }
        }
      }

      if (hitElement) {
        onSelectObject(hitElement);
        setStatusLog(`Selected: [${hitElement.layerName}] ${hitElement.name}. Attributes inspected.`);
      } else {
        onSelectObject(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /**
   * Cursor centric zooming logic
   */
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current || !engineRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Get world position under cursor before scaling
    const worldPoint = engineRef.current.screenToWorld(mouseX, mouseY);

    // 2. Compute dynamic next zoom step
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const currentZoom = zoomLevel / 100;
    const nextZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.15), 4.0);

    // 3. Offset coordinate pan to ensure world position locks with cursor position
    const nextPanX = mouseX - worldPoint.x * nextZoom;
    const nextPanY = mouseY - worldPoint.y * nextZoom;

    setZoomLevel(Math.round(nextZoom * 100));
    setPan({ x: nextPanX, y: nextPanY });
    setStatusLog(`Zoom calibrated: ${Math.round(nextZoom * 100)}%`);
  };

  const clearMeasurements = () => {
    setSavedMeasurements([]);
    setMeasureStart(null);
    setMeasureCurrent(null);
    setStatusLog("Scale measurement overlays flushed.");
  };

  const getCursorStyle = (): string => {
    if (isSpacePanActive) {
      return isDragging ? "grabbing" : "grab";
    }
    switch (selectedTool) {
      case "pan":
        return isDragging ? "grabbing" : "grab";
      case "select":
        return "default";
      case "measure":
        return "cell";
      case "label":
        return "text";
      case "boundary":
      case "road":
      case "plot":
      case "park":
      case "amenity":
      case "utility":
        return "crosshair";
      default:
        return "default";
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full relative overflow-hidden bg-slate-50 flex flex-col justify-between"
      id="workspace-canvas-container"
    >
      {/* 1. Canvas Main Draw Area */}
      <div className="flex-1 w-full h-full relative" id="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => onUpdateMouseCoords(null)}
          onWheel={handleWheel}
          className="w-full h-full block bg-slate-100"
          style={{ cursor: getCursorStyle() }}
          id="canvas-element"
        />

        {/* CAD Canvas Overlay Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20" id="canvas-overlay-actions">
          <div className="flex gap-1.5 bg-white/90 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200/60 shadow-md">
            <button
              onClick={() => {
                const nextZoom = Math.min(zoomLevel + 15, 400);
                setZoomLevel(nextZoom);
              }}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const nextZoom = Math.max(zoomLevel - 15, 15);
                setZoomLevel(nextZoom);
              }}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {savedMeasurements.length > 0 && (
            <button
              onClick={clearMeasurements}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              Clear Measures ({savedMeasurements.length})
            </button>
          )}
        </div>

        {/* Dynamic Canvas Floating Legend */}
        <div
          className="absolute top-6 left-6 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl p-3 shadow-md max-w-xs space-y-2 pointer-events-auto select-none z-10"
          id="canvas-legend"
        >
          <div className="flex items-center gap-1.5 border-b border-slate-150 pb-1.5">
            <Compass className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            <span className="text-[10px] font-bold uppercase text-slate-800 tracking-wider">Geospatial Legend</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              <span>Boundary Limit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <span>Plots Layer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-slate-600 rounded-full" />
              <span>Roads Link</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-200 rounded-full" />
              <span>Sector Park</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
