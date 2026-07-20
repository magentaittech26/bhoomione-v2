import React, { useState, useRef, useEffect } from "react";
import { Move, Maximize2, ZoomIn, ZoomOut, Compass, HelpCircle, MapPin, Square, Pentagon, Building, Layers, Activity, Wrench } from "lucide-react";
import { WorkspaceTool, MockGeometry } from "./types.ts";
import { GeometryLayer, GeometryObject } from "../../MapEngine/Contracts/models.ts";
import { CanvasViewportEngine } from "../../MapEngine/Rendering/CanvasViewportEngine.ts";
import { CreateGeometryCommand, ModifyGeometryCommand } from "../../MapEngine/Drawing/DrawingToolManager.ts";
import { 
  calculatePlotMetrics, 
  detectPlotFacing, 
  detectPlotCornerType, 
  rotatePoints, 
  scalePoints,
  calculateCenterlineLength,
  generateCarriagewayPolygon,
  calculateRoadDirection,
  calculatePolygonPerimeter
} from "../../lib/plotEngine.ts";
import { getUtilityColor, getNetworkTypeForAsset } from "../../lib/utilityEngine.ts";
import { queryPlots } from "../../modules/plots/search/provider.ts";

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
  drawingManager: any; // Direct access to trigger commands

  // Background alignment & calibration props
  backgroundImageUrl?: string;
  backgroundZoom?: number;
  backgroundPan?: { x: number; y: number };
  backgroundRotate?: number;
  backgroundOpacity?: number;
  backgroundBrightness?: number;
  backgroundContrast?: number;
  calibP1?: { x: number; y: number } | null;
  calibP2?: { x: number; y: number } | null;
  calibDistance?: string;

  // Active drawing state synchronization props
  drawingPoints?: Array<[number, number]>;
  setDrawingPoints?: React.Dispatch<React.SetStateAction<Array<[number, number]>>>;
  drawingCurrentMouse?: [number, number] | null;
  setDrawingCurrentMouse?: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  onRegisterFinishDrawing?: (finishFn: () => void) => void;
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

/**
 * Standard line segment intersection formula
 */
function lineSegmentsIntersect(
  p1: [number, number],
  q1: [number, number],
  p2: [number, number],
  q2: [number, number]
): boolean {
  const orientation = (p: [number, number], q: [number, number], r: [number, number]): number => {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (Math.abs(val) < 1e-9) return 0; // Collinear
    return (val > 0) ? 1 : 2; // Clockwise or Counterclockwise
  };

  const onSegment = (p: [number, number], q: [number, number], r: [number, number]): boolean => {
    return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
           q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
  };

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
}

/**
 * Checks if a polygon has any self-intersecting segments
 */
function isPolygonSelfIntersecting(pts: Array<[number, number]>): boolean {
  const n = pts.length;
  if (n < 4) return false;

  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];

    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue; // Skip adjacent segments
      const c = pts[j];
      const d = pts[(j + 1) % n];

      if (lineSegmentsIntersect(a, b, c, d)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Sanitizes consecutive duplicate vertices
 */
function sanitizePoints(pts: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const pt of pts) {
    if (out.length === 0) {
      out.push(pt);
    } else {
      const prev = out[out.length - 1];
      const dist = Math.sqrt(Math.pow(pt[0] - prev[0], 2) + Math.pow(pt[1] - prev[1], 2));
      if (dist > 0.05) {
        out.push(pt);
      }
    }
  }
  return out;
}

/**
 * Snaps to the closest vertex of any active geometry object across all layers.
 * Provides pixel-perfect cross-layer node snapping.
 */
function snapToGeometry(
  x: number,
  y: number,
  currentObjects: MockGeometry[],
  ignoreId?: string | null,
  maxDistance: number = 12
): { x: number; y: number; isSnapped: boolean } {
  let bestX = x;
  let bestY = y;
  let minDist = maxDistance;
  let isSnapped = false;

  for (const obj of currentObjects) {
    if (!obj.is_active || obj.id === ignoreId || !obj.geometry_data?.coordinates) continue;
    const coords = obj.geometry_data.coordinates;

    const checkPoint = (px: number, py: number) => {
      const dist = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
      if (dist < minDist) {
        minDist = dist;
        bestX = px;
        bestY = py;
        isSnapped = true;
      }
    };

    if (obj.object_type === "POINT") {
      const pt = coords as [number, number];
      if (pt && pt.length === 2) {
        checkPoint(pt[0], pt[1]);
      }
    } else if (Array.isArray(coords)) {
      if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") {
        for (const pt of coords as Array<[number, number]>) {
          if (pt && pt.length === 2) {
            checkPoint(pt[0], pt[1]);
          }
        }
      } else if (Array.isArray(coords[0])) {
        for (const ring of coords as Array<Array<[number, number]>>) {
          for (const pt of ring) {
            if (pt && pt.length === 2) {
              checkPoint(pt[0], pt[1]);
            }
          }
        }
      }
    }
  }

  return { x: bestX, y: bestY, isSnapped };
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
  isSpacePanActive = false,
  drawingManager,

  // Background alignment & calibration props
  backgroundImageUrl,
  backgroundZoom,
  backgroundPan,
  backgroundRotate,
  backgroundOpacity,
  backgroundBrightness,
  backgroundContrast,
  calibP1,
  calibP2,
  calibDistance,

  // Active drawing state synchronization props
  drawingPoints: propsDrawingPoints,
  setDrawingPoints: propsSetDrawingPoints,
  drawingCurrentMouse: propsDrawingCurrentMouse,
  setDrawingCurrentMouse: propsSetDrawingCurrentMouse,
  onRegisterFinishDrawing
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

  // Amenity creation parameters
  const [amenityGeometryMode, setAmenityGeometryMode] = useState<"point" | "polygon" | "rectangle">("point");
  const [defaultAmenityType, setDefaultAmenityType] = useState<string>("Hospital");

  // Utility creation parameters
  const [utilityGeometryMode, setUtilityGeometryMode] = useState<"polyline" | "point">("polyline");
  const [defaultUtilityType, setDefaultUtilityType] = useState<string>("Water Supply");
  const [defaultUtilityAsset, setDefaultUtilityAsset] = useState<string>("Transformer");

  // Active Drawing session points (Supports local fallback or synchronized parent state binds)
  const [localDrawingPoints, setLocalDrawingPoints] = useState<Array<[number, number]>>([]);
  const [localDrawingCurrentMouse, setLocalDrawingCurrentMouse] = useState<[number, number] | null>(null);

  const drawingPoints = propsDrawingPoints !== undefined ? propsDrawingPoints : localDrawingPoints;
  const setDrawingPoints = propsSetDrawingPoints !== undefined ? propsSetDrawingPoints : setLocalDrawingPoints;
  const drawingCurrentMouse = propsDrawingCurrentMouse !== undefined ? propsDrawingCurrentMouse : localDrawingCurrentMouse;
  const setDrawingCurrentMouse = propsSetDrawingCurrentMouse !== undefined ? propsSetDrawingCurrentMouse : setLocalDrawingCurrentMouse;

  // Background Image State & Safe Asset Loader
  const [bgImageElement, setBgImageElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!backgroundImageUrl) {
      setBgImageElement(null);
      return;
    }
    const img = new Image();
    img.src = backgroundImageUrl;
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      setBgImageElement(img);
      if (engineRef.current) {
        engineRef.current.invalidate();
      }
    };
    img.onerror = () => {
      console.error("Failed to load background alignment drawing:", backgroundImageUrl);
    };
  }, [backgroundImageUrl]);

  // Expose the finish drawing function handler to the orchestrating wizard Right Column
  useEffect(() => {
    if (onRegisterFinishDrawing) {
      onRegisterFinishDrawing(handleFinishDrawing);
    }
  }, [onRegisterFinishDrawing, drawingPoints, selectedTool]);

  // Vertex / Geometry dragging states
  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);
  const [draggedVertexObjectId, setDraggedVertexObjectId] = useState<string | null>(null);
  const [draggedVertexStartCoords, setDraggedVertexStartCoords] = useState<Array<[number, number]>>([]);

  const [isMovingGeometry, setIsMovingGeometry] = useState(false);
  const [movingGeometryObjectId, setMovingGeometryObjectId] = useState<string | null>(null);
  const [movingGeometryStartCoords, setMovingGeometryStartCoords] = useState<Array<[number, number]>>([]);
  const [movingGeometryStartMouseWorld, setMovingGeometryStartMouseWorld] = useState<{ x: number; y: number } | null>(null);

  // Interactive mouseover hover indicators for nodes
  const [hoveredVertexIndex, setHoveredVertexIndex] = useState<number | null>(null);
  const [hoveredMidpointIndex, setHoveredMidpointIndex] = useState<number | null>(null);

  // Custom double-click robust timer detector
  const lastClickRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

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

  // Keyboard actions for drawing sessions (Cancel on Escape, pop last point on Backspace, delete hovered vertex)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        if (drawingPoints.length > 0) {
          e.preventDefault();
          setDrawingPoints([]);
          setDrawingCurrentMouse(null);
          setStatusLog("Drawing session cleared.");
        }
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        if (drawingPoints.length > 0) {
          e.preventDefault();
          const updated = [...drawingPoints];
          updated.pop();
          setDrawingPoints(updated);
          setStatusLog(`Removed last plotted point. Vertices count: ${updated.length}`);
        } else if (selectedTool === "boundary" || selectedTool === "select") {
          const targetSelectId = selectedTool === "boundary"
            ? (objects.find(o => o.layerName === "BOUNDARY")?.id || null)
            : selectedObjectId;
          
          if (targetSelectId && hoveredVertexIndex !== null) {
            e.preventDefault();
            const obj = objects.find(o => o.id === targetSelectId);
            if (obj) {
              const coords = [...(obj.geometry_data.coordinates as Array<[number, number]>)];
              if (coords.length > 3) {
                const oldCoords = JSON.parse(JSON.stringify(coords));
                coords.splice(hoveredVertexIndex, 1);
                
                // Update and save
                const updatedObjs = objects.map(o => {
                  if (o.id === targetSelectId) {
                    return {
                      ...o,
                      geometry_data: { ...o.geometry_data, coordinates: coords }
                    };
                  }
                  return o;
                });
                onUpdateObjects(updatedObjs);
                setHoveredVertexIndex(null);
                setStatusLog(`Deleted vertex node #${hoveredVertexIndex} from boundary.`);
              } else {
                setStatusLog("Boundary footprint requires at least 3 unique vertices.");
              }
            }
          }
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [drawingPoints, objects, selectedTool, selectedObjectId, hoveredVertexIndex, onUpdateObjects]);

  // Synchronize Render Callbacks each time render-impacting elements update
  useEffect(() => {
    if (!engineRef.current) return;

    // Pre-render hooks (Clear & Draw Grid & Draw Background Image Calibration Canvas layer)
    engineRef.current.setBeforeRender((ctx) => {
      if (!engineRef.current) return;
      engineRef.current.drawEngineeringGrid(isGridVisible);

      // Draw background layout image
      if (bgImageElement && engineRef.current) {
        const engine = engineRef.current;
        const state = engine.getViewportState();
        ctx.save();
        
        // Transform screen space to world space
        ctx.translate(state.panX, state.panY);
        ctx.scale(state.zoom, state.zoom);

        // Apply background alignment & calibration metrics
        const bZoom = backgroundZoom !== undefined ? backgroundZoom : 1;
        const bPan = backgroundPan !== undefined ? backgroundPan : { x: 0, y: 0 };
        const bRotate = backgroundRotate !== undefined ? backgroundRotate : 0;
        const bOpacity = backgroundOpacity !== undefined ? backgroundOpacity / 100 : 0.8;
        const bBrightness = backgroundBrightness !== undefined ? backgroundBrightness : 100;
        const bContrast = backgroundContrast !== undefined ? backgroundContrast : 100;

        ctx.globalAlpha = bOpacity;
        ctx.filter = `brightness(${bBrightness}%) contrast(${bContrast}%)`;

        const imgW = bgImageElement.width || 800;
        const imgH = bgImageElement.height || 600;

        // Apply alignment shifts
        ctx.translate(bPan.x, bPan.y);
        ctx.rotate((bRotate * Math.PI) / 180);
        ctx.scale(bZoom, bZoom);

        // Draw image centered at (0, 0) in world space
        ctx.drawImage(bgImageElement, -imgW / 2, -imgH / 2, imgW, imgH);

        ctx.restore();
      }

      // Draw calibration reference line Point A and Point B if active in Step 3
      if (calibP1 && calibP2 && engineRef.current) {
        const engine = engineRef.current;
        
        // Map local container coordinates to world coordinates (centered at (0,0))
        // Since container is 800x600, center is (400, 300)
        const wP1 = { x: calibP1.x - 400, y: calibP1.y - 300 };
        const wP2 = { x: calibP2.x - 400, y: calibP2.y - 300 };

        const sP1 = engine.worldToScreen(wP1.x, wP1.y);
        const sP2 = engine.worldToScreen(wP2.x, wP2.y);

        ctx.save();
        ctx.strokeStyle = "#4F46E5"; // Indigo calibration line
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sP1.x, sP1.y);
        ctx.lineTo(sP2.x, sP2.y);
        ctx.stroke();

        // Draw circles
        ctx.fillStyle = "#818CF8";
        ctx.strokeStyle = "#4F46E5";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(sP1.x, sP1.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sP2.x, sP2.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label Point A & B
        ctx.fillStyle = "#4F46E5";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("POINT A", sP1.x, sP1.y - 10);
        ctx.fillText("POINT B", sP2.x, sP2.y - 10);

        // Draw label in middle
        if (calibDistance) {
          const midX = (sP1.x + sP2.x) / 2;
          const midY = (sP1.y + sP2.y) / 2;
          const label = `CALIBRATED REFERENCE: ${calibDistance}m`;
          const textW = ctx.measureText(label).width;
          ctx.fillStyle = "rgba(79, 70, 229, 0.9)";
          ctx.beginPath();
          ctx.roundRect(midX - textW / 2 - 6, midY - 9, textW + 12, 18, 4);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.textBaseline = "middle";
          ctx.fillText(label, midX, midY);
        }

        ctx.restore();
      }
    });

    // Post-render hooks (Draw Geometries, Labels, Measurements overlays)
    engineRef.current.setAfterRender((ctx) => {
      if (!engineRef.current) return;

      const engine = engineRef.current;

      // Typecast objects as compatible GeometryObject for engine render compatibility
      const castedObjects = objects as unknown as GeometryObject[];
      engine.drawGeometries(castedObjects, layers, selectedObjectId, searchQuery);

      // A. Render Active Drawing Session Preview
      if (drawingPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = "#3B82F6"; // Blue outline
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);

        const isRectangleMode = selectedTool === "amenity" && amenityGeometryMode === "rectangle";

        if (isRectangleMode && drawingPoints.length === 1 && drawingCurrentMouse) {
          const p1 = engine.worldToScreen(drawingPoints[0][0], drawingPoints[0][1]);
          const p2 = engine.worldToScreen(drawingCurrentMouse[0], drawingCurrentMouse[1]);
          ctx.beginPath();
          ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
          ctx.stroke();
          ctx.fillStyle = "rgba(236, 72, 153, 0.08)"; // Pinkish background fill
          ctx.fill();
        } else {
          ctx.beginPath();
          const startPt = engine.worldToScreen(drawingPoints[0][0], drawingPoints[0][1]);
          ctx.moveTo(startPt.x, startPt.y);

          for (let i = 1; i < drawingPoints.length; i++) {
            const pt = engine.worldToScreen(drawingPoints[i][0], drawingPoints[i][1]);
            ctx.lineTo(pt.x, pt.y);
          }

          if (drawingCurrentMouse) {
            const curPt = engine.worldToScreen(drawingCurrentMouse[0], drawingCurrentMouse[1]);
            ctx.lineTo(curPt.x, curPt.y);
            if (selectedTool !== "road") {
              ctx.closePath();
            }
          }
          ctx.stroke();

          if (selectedTool !== "road") {
            ctx.fillStyle = "rgba(59, 130, 246, 0.08)"; // Transparent fill
            ctx.fill();
          }
        }
        ctx.restore();

        // Plotted vertices circular nodes
        ctx.save();
        drawingPoints.forEach((pt, idx) => {
          const screenPt = engine.worldToScreen(pt[0], pt[1]);
          ctx.fillStyle = idx === 0 ? "#10B981" : "#3B82F6"; // Green origin, blue elsewhere
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(screenPt.x, screenPt.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();

        // Render active segment length labels
        ctx.save();
        for (let i = 0; i < drawingPoints.length - 1; i++) {
          const p1 = drawingPoints[i];
          const p2 = drawingPoints[i + 1];
          const dx = p2[0] - p1[0];
          const dy = p2[1] - p1[1];
          const dist = Math.sqrt(dx * dx + dy * dy);

          const s1 = engine.worldToScreen(p1[0], p1[1]);
          const s2 = engine.worldToScreen(p2[0], p2[1]);
          const midX = (s1.x + s2.x) / 2;
          const midY = (s1.y + s2.y) / 2;

          ctx.font = "bold 9px monospace";
          const label = `${dist.toFixed(1)}m`;
          const textW = ctx.measureText(label).width;

          ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
          ctx.beginPath();
          ctx.roundRect(midX - textW / 2 - 4, midY - 7, textW + 8, 14, 3);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, midX, midY);
        }

        // Render segment length label to mouse position
        if (drawingCurrentMouse) {
          const p1 = drawingPoints[drawingPoints.length - 1];
          const p2 = drawingCurrentMouse;
          const dx = p2[0] - p1[0];
          const dy = p2[1] - p1[1];
          const dist = Math.sqrt(dx * dx + dy * dy);

          const s1 = engine.worldToScreen(p1[0], p1[1]);
          const s2 = engine.worldToScreen(p2[0], p2[1]);
          const midX = (s1.x + s2.x) / 2;
          const midY = (s1.y + s2.y) / 2;

          ctx.font = "bold 9px monospace";
          const label = `${dist.toFixed(1)}m`;
          const textW = ctx.measureText(label).width;

          ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
          ctx.beginPath();
          ctx.roundRect(midX - textW / 2 - 4, midY - 7, textW + 8, 14, 3);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, midX, midY);
        }
        ctx.restore();
      }

      // B. Render Selected Object Coordinate Handles & Midpoints (Enhanced styling support for Boundary Wizard mode)
      const isBoundaryOrSelect = selectedTool === "select" || selectedTool === "boundary";
      const targetRenderObjectId = selectedTool === "boundary"
        ? (objects.find(o => o.layerName === "BOUNDARY")?.id || null)
        : selectedObjectId;

      if (isBoundaryOrSelect && targetRenderObjectId) {
        const activeObj = objects.find(o => o.id === targetRenderObjectId);
        if (activeObj && (activeObj.object_type === "POLYGON" || activeObj.object_type === "POLYLINE" || activeObj.object_type === "BOUNDARY")) {
          const coords = activeObj.geometry_data.coordinates as Array<[number, number]>;
          
          if (coords && coords.length > 0) {
            // Vertex nodes
            ctx.save();
            coords.forEach((pt, idx) => {
              const screenPt = engine.worldToScreen(pt[0], pt[1]);
              const isHovered = hoveredVertexIndex === idx;

              // Visuals: Selected vertex (orange), Hover vertex (green), otherwise white with blue border
              if (isHovered) {
                ctx.fillStyle = "#10B981"; // Green hover vertex
              } else if (draggedVertexIndex === idx) {
                ctx.fillStyle = "#F97316"; // Orange selected/dragged vertex
              } else {
                ctx.fillStyle = "#FFFFFF";
              }

              ctx.strokeStyle = "#3B82F6"; // Blue outline
              ctx.lineWidth = isHovered || draggedVertexIndex === idx ? 2.5 : 1.5;
              ctx.beginPath();
              ctx.arc(screenPt.x, screenPt.y, isHovered || draggedVertexIndex === idx ? 6.5 : 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
            ctx.restore();

            // Midpoint split triggers
            ctx.save();
            const len = coords.length;
            const limit = activeObj.object_type === "POLYLINE" ? len - 1 : len;
            
            for (let i = 0; i < limit; i++) {
              const p1 = coords[i];
              const p2 = coords[(i + 1) % len];
              const midWorld: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
              const midScreen = engine.worldToScreen(midWorld[0], midWorld[1]);

              const isHovered = hoveredMidpointIndex === i;
              ctx.fillStyle = isHovered ? "#10B981" : "rgba(59, 130, 246, 0.5)"; // Green on hover, soft blue
              ctx.strokeStyle = "#FFFFFF";
              ctx.lineWidth = 1.25;
              ctx.beginPath();
              ctx.arc(midScreen.x, midScreen.y, isHovered ? 5.5 : 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }

      // Render measurements
      drawMeasurementsOnContext(ctx, engine);

      // Draw rulers overlay
      engine.drawRulers();
    });

    engineRef.current.invalidate();
  }, [
    layers, 
    objects, 
    selectedObjectId, 
    searchQuery, 
    isGridVisible, 
    measureStart, 
    measureCurrent, 
    savedMeasurements, 
    selectedTool, 
    drawingPoints, 
    drawingCurrentMouse, 
    hoveredVertexIndex, 
    hoveredMidpointIndex,
    bgImageElement,
    backgroundZoom,
    backgroundPan,
    backgroundRotate,
    backgroundOpacity,
    backgroundBrightness,
    backgroundContrast,
    calibP1,
    calibP2,
    calibDistance
  ]);

  // Auto-zoom, pan, and select object matching search query
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;

    const q = searchQuery.toLowerCase().trim();
    const match = queryPlots(objects, searchQuery) || objects.find(obj => {
      const name = (obj.name || "").toLowerCase();
      const pName = (obj.properties?.park_name || "").toLowerCase();
      const pType = (obj.properties?.park_type || "").toLowerCase();
      const aName = (obj.properties?.amenity_name || "").toLowerCase();
      const aType = (obj.properties?.amenity_type || "").toLowerCase();
      const code = (obj.properties?.unique_code || "").toLowerCase();
      const plotNum = (obj.properties?.plot_number || "").toLowerCase();
      const rName = (obj.properties?.road_name || "").toLowerCase();
      const rCode = (obj.properties?.road_code || "").toLowerCase();
      const uName = (obj.properties?.utility_name || "").toLowerCase();
      const uCode = (obj.properties?.utility_code || "").toLowerCase();
      const netType = (obj.properties?.network_type || "").toLowerCase();
      const uType = (obj.properties?.utility_type || "").toLowerCase();
      return name.includes(q) || 
             pName.includes(q) || 
             pType.includes(q) || 
             aName.includes(q) || 
             aType.includes(q) || 
             code.includes(q) || 
             plotNum.includes(q) ||
             rName.includes(q) ||
             rCode.includes(q) ||
             uName.includes(q) ||
             uCode.includes(q) ||
             netType.includes(q) ||
             uType.includes(q);
    });

    if (match) {
      // 1. Set selected object to open inspector
      onSelectObject(match);

      // 2. Set zoom to a nice closer level
      const targetZoom = 1.2;
      setZoomLevel(targetZoom);

      // 3. Center on the coordinates
      let targetX = 0;
      let targetY = 0;

      if (match.object_type === "POINT") {
        const coords = match.geometry_data.coordinates as [number, number];
        if (coords && coords.length === 2) {
          targetX = coords[0];
          targetY = coords[1];
        }
      } else {
        const coords = match.geometry_data.coordinates as Array<[number, number]>;
        if (coords && coords.length > 0) {
          let sumX = 0;
          let sumY = 0;
          coords.forEach(pt => {
            sumX += pt[0];
            sumY += pt[1];
          });
          targetX = sumX / coords.length;
          targetY = sumY / coords.length;
        }
      }

      if (canvasRef.current && targetX !== 0 && targetY !== 0) {
        const width = canvasRef.current.clientWidth || 800;
        const height = canvasRef.current.clientHeight || 600;
        const nextPanX = width / 2 - targetX * targetZoom;
        const nextPanY = height / 2 - targetY * targetZoom;
        setPan({ x: nextPanX, y: nextPanY });
        setStatusLog(`Centered and inspected matching GIS object: "${match.name || match.properties?.amenity_name || match.properties?.park_name || match.properties?.plot_number || match.properties?.unique_code}"`);
      }
    }
  }, [searchQuery, objects]);

  /**
   * Dedicated overlay drawing module for CAD scale measurements
   */
  const drawMeasurementsOnContext = (ctx: CanvasRenderingContext2D, engine: CanvasViewportEngine) => {
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
      const distance = Math.sqrt(dx * dx + dy * dy) * 0.5;
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
   * Finalizes an active drawing session, validates boundaries, and pushes CreateGeometryCommand to history stack
   */
  const handleFinishDrawing = () => {
    if (drawingPoints.length < 2) {
      setStatusLog("Drawing aborted. Plotted line requires at least 2 vertices.");
      setDrawingPoints([]);
      setDrawingCurrentMouse(null);
      return;
    }

    const isPolygon = selectedTool !== "road" && !(selectedTool === "utility" && utilityGeometryMode === "polyline");
    const sanitized = sanitizePoints(drawingPoints);

    if (isPolygon) {
      if (sanitized.length < 3) {
        setStatusLog("Closed polygon requires at least 3 unique vertices.");
        setDrawingPoints([]);
        setDrawingCurrentMouse(null);
        return;
      }

      // Check self intersection validation
      if (isPolygonSelfIntersecting(sanitized)) {
        setStatusLog("[Validation Warning] Polygon footprint intersects itself! Discarded.");
        setDrawingPoints([]);
        setDrawingCurrentMouse(null);
        return;
      }
    }

    const toolToLayerName: Record<string, string> = {
      boundary: "BOUNDARY",
      plot: "PLOTS",
      road: "ROADS",
      park: "PARK",
      amenity: "AMENITIES",
      utility: "UTILITIES",
      label: "LABELS"
    };
    const layerName = toolToLayerName[selectedTool] || selectedTool.toUpperCase();
    const matchedLayer = layers.find(l => l.layer_name === layerName);
    const layerId = matchedLayer ? matchedLayer.id : `l-${selectedTool}`;
    const styleConfig = { ...(matchedLayer?.style_config || {
      strokeColor: "#10B981",
      strokeWidth: 2,
      fillColor: "#10B981",
      opacity: 0.15
    }) };

    if (selectedTool === "utility") {
      styleConfig.strokeColor = getUtilityColor(defaultUtilityType);
      styleConfig.strokeWidth = 3;
      if (defaultUtilityType.toLowerCase().includes("future")) {
        styleConfig.dashArray = "6,6";
      }
    }

    let initialProperties: any = { owner: "" };

    if (selectedTool === "plot") {
      const plots = objects.filter(o => o.layerName === "PLOTS");
      const plotNumbers = plots.map(o => parseInt(o.properties?.plot_number || "")).filter(n => !isNaN(n));
      const nextNum = plotNumbers.length > 0 ? Math.max(...plotNumbers) + 1 : 101;

      const metrics = calculatePlotMetrics(sanitized);
      const roadObjs = objects.filter(o => o.layerName === "ROADS");
      const facing = detectPlotFacing(sanitized, roadObjs);
      const cornerType = detectPlotCornerType(sanitized, roadObjs);

      initialProperties = {
        plot_number: String(nextNum),
        area_value: Math.round(metrics.sqft),
        facing: facing,
        corner_type: cornerType,
        corner_status: {
          is_corner_plot: cornerType !== "Internal Plot",
          corner_type: cornerType
        },
        zoning: "Residential",
        plot_type: "Residential",
        owner: "",
        metadata: {
          planning_remarks: "Manually drafted plot.",
          internal_notes: ""
        }
      };
    } else if (selectedTool === "road") {
      const roadCount = objects.filter(o => o.layerName === "ROADS").length + 1;
      const lengthVal = calculateCenterlineLength(sanitized);
      const defaultWidth = 12;
      const boundaryVal = generateCarriagewayPolygon(sanitized, defaultWidth);
      const directionVal = calculateRoadDirection(sanitized);
      initialProperties = {
        road_name: `Secondary Road ${roadCount}`,
        road_type: "Secondary Road",
        road_width: defaultWidth,
        center_line: sanitized,
        boundary: boundaryVal,
        length: parseFloat(lengthVal.toFixed(2)),
        direction: directionVal,
        status: "Draft",
        area_value: parseFloat((lengthVal * defaultWidth).toFixed(2)),
        owner: "Municipal Board"
      };
    } else if (selectedTool === "park") {
      const parkCount = objects.filter(o => o.layerName === "PARK").length + 1;
      const metrics = calculatePlotMetrics(sanitized);
      const perimeterVal = calculatePolygonPerimeter(sanitized);
      initialProperties = {
        park_name: `Park ${parkCount}`,
        park_type: "Park",
        park_number: `PK-${String(parkCount).padStart(2, "0")}`,
        area_value: Math.round(metrics.sqft),
        perimeter_value: parseFloat(perimeterVal.toFixed(2)),
        landscape_status: "Planned",
        maintenance_status: "Good",
        accessibility: "Public",
        lighting: "Solar Lighting",
        irrigation: "Sprinklers",
        water_feature: false,
        play_area: false,
        walking_track: false,
        parking_available: false,
        notes: "",
        owner: "Municipal Parks Department"
      };
    } else if (selectedTool === "amenity") {
      const amenityCount = objects.filter(o => o.layerName === "AMENITIES").length + 1;
      const metrics = calculatePlotMetrics(sanitized);
      const perimeterVal = calculatePolygonPerimeter(sanitized);
      initialProperties = {
        amenity_name: `${defaultAmenityType} ${amenityCount}`,
        amenity_type: defaultAmenityType,
        unique_code: `AM-${String(amenityCount).padStart(3, "0")}`,
        status: "Planned",
        ownership: "Municipal Board",
        operational_status: "Proposed",
        area_value: Math.round(metrics.sqft),
        perimeter_value: parseFloat(perimeterVal.toFixed(2)),
        capacity: "",
        description: "",
        maintenance_notes: "",
        construction_status: "Proposed",
        future_expansion: false,
        owner: "Municipal Board"
      };
    } else if (selectedTool === "utility") {
      const utilityCount = objects.filter(o => o.layerName === "UTILITIES").length + 1;
      const len = calculateCenterlineLength(sanitized);
      initialProperties = {
        utility_name: `${defaultUtilityType} Line ${utilityCount}`,
        network_type: defaultUtilityType,
        utility_code: `UT-LINE-${String(utilityCount).padStart(3, "0")}`,
        diameter: defaultUtilityType.toLowerCase().includes("water") ? "150 mm" : defaultUtilityType.toLowerCase().includes("sewer") ? "300 mm" : "50 mm",
        material: defaultUtilityType.toLowerCase().includes("water") ? "DI (Ductile Iron)" : defaultUtilityType.toLowerCase().includes("sewer") ? "RCC NP3" : "HDPE",
        pressure_class: defaultUtilityType.toLowerCase().includes("water") ? "PN 10" : "",
        voltage: defaultUtilityType.toLowerCase().includes("ht") ? "11 KV" : defaultUtilityType.toLowerCase().includes("lt") ? "440 V" : "",
        capacity: "",
        owner: "Municipal Utilities Department",
        installation_year: String(new Date().getFullYear()),
        condition: "Excellent",
        maintenance_status: "Operational",
        operational_status: "Active",
        minimum_cover: 0.8,
        future_upgrade: false,
        length_value: parseFloat(len.toFixed(2)),
        notes: ""
      };
    }

    const newObj: MockGeometry = {
      id: `obj-${selectedTool}-${Date.now()}`,
      layer_id: layerId,
      layout_id: "lay-1",
      layerName: layerName as any,
      name: selectedTool === "plot" 
        ? `Subdivided Plot ${initialProperties.plot_number}` 
        : selectedTool === "road"
          ? initialProperties.road_name
          : selectedTool === "park"
            ? initialProperties.park_name
            : selectedTool === "amenity"
              ? initialProperties.amenity_name
              : selectedTool === "utility"
                ? initialProperties.utility_name
                : `New ${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} ${objects.length + 1}`,
      object_type: isPolygon ? "POLYGON" : "POLYLINE",
      geometry_data: {
        coordinates: sanitized
      },
      style_config: { ...styleConfig },
      properties: initialProperties,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const cmd = new CreateGeometryCommand(
      newObj,
      objects,
      (updated) => onUpdateObjects(updated),
      (id) => {
        if (id) {
          onSelectObject(newObj);
        } else {
          onSelectObject(null);
        }
      }
    );
    drawingManager.executeCommand(cmd);

    setDrawingPoints([]);
    setDrawingCurrentMouse(null);
    setStatusLog(`Added ${newObj.name}. Undo/redo cached in Platform Command stack.`);
  };

  /**
   * Screen coordinates capture on moving cursor
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldPos = engineRef.current.screenToWorld(mouseX, mouseY);

    // Cross-layer vertex snapping (prioritized) or Grid snapping
    let finalX = worldPos.x;
    let finalY = worldPos.y;
    const snapResult = snapToGeometry(worldPos.x, worldPos.y, objects, draggedVertexObjectId);
    if (snapResult.isSnapped) {
      finalX = snapResult.x;
      finalY = snapResult.y;
    } else if (isSnapToGrid) {
      finalX = Math.round(worldPos.x / 20) * 20;
      finalY = Math.round(worldPos.y / 20) * 20;
    }

    onUpdateMouseCoords({ x: finalX, y: finalY });

    if (selectedTool === "measure" && measureStart) {
      setMeasureCurrent({ x: finalX, y: finalY });
    }

    // Active Drawing rubber-band update
    if (drawingPoints.length > 0) {
      setDrawingCurrentMouse([finalX, finalY]);
    }

    // Vertex drag session update
    if (draggedVertexIndex !== null && draggedVertexObjectId !== null) {
      const updated = objects.map(o => {
        if (o.id === draggedVertexObjectId) {
          const coords = [...(o.geometry_data.coordinates as Array<[number, number]>)];
          coords[draggedVertexIndex] = [finalX, finalY];
          let props = { ...o.properties };
          if (o.layerName === "ROADS") {
            const width = o.properties.road_width || 12;
            const len = calculateCenterlineLength(coords);
            props = {
              ...props,
              center_line: coords,
              boundary: generateCarriagewayPolygon(coords, width),
              length: parseFloat(len.toFixed(2)),
              direction: calculateRoadDirection(coords),
              area_value: parseFloat((len * width).toFixed(2))
            };
          }
          return {
            ...o,
            geometry_data: { ...o.geometry_data, coordinates: coords },
            properties: props
          };
        }
        return o;
      });
      onUpdateObjects(updated);
      setStatusLog(`Dragging vertex node #${draggedVertexIndex} to (${finalX.toFixed(1)}m, ${finalY.toFixed(1)}m)`);
      return;
    }

    // Geometry whole body drag session update
    if (isMovingGeometry && movingGeometryObjectId !== null && movingGeometryStartMouseWorld !== null) {
      const dx = finalX - movingGeometryStartMouseWorld.x;
      const dy = finalY - movingGeometryStartMouseWorld.y;

      const updated = objects.map(o => {
        if (o.id === movingGeometryObjectId) {
          const shifted = movingGeometryStartCoords.map(pt => [pt[0] + dx, pt[1] + dy] as [number, number]);
          let props = { ...o.properties };
          if (o.layerName === "ROADS") {
            const width = o.properties.road_width || 12;
            const len = calculateCenterlineLength(shifted);
            props = {
              ...props,
              center_line: shifted,
              boundary: generateCarriagewayPolygon(shifted, width),
              length: parseFloat(len.toFixed(2)),
              direction: calculateRoadDirection(shifted),
              area_value: parseFloat((len * width).toFixed(2))
            };
          }
          return {
            ...o,
            geometry_data: { ...o.geometry_data, coordinates: shifted },
            properties: props
          };
        }
        return o;
      });
      onUpdateObjects(updated);
      return;
    }

    // Highlight hovering states on vertex / midpoints (Select tool or Boundary tool)
    const isBoundaryOrSelect = selectedTool === "select" || selectedTool === "boundary";
    const targetSelectObjectId = selectedTool === "boundary"
      ? (objects.find(o => o.layerName === "BOUNDARY")?.id || null)
      : selectedObjectId;

    if (isBoundaryOrSelect && targetSelectObjectId) {
      const activeObj = objects.find(o => o.id === targetSelectObjectId);
      if (activeObj && (activeObj.object_type === "POLYGON" || activeObj.object_type === "POLYLINE" || activeObj.object_type === "BOUNDARY")) {
        const coords = activeObj.geometry_data.coordinates as Array<[number, number]>;
        
        let foundVertex: number | null = null;
        let foundMidpoint: number | null = null;

        if (coords) {
          // Check vertex hover
          for (let i = 0; i < coords.length; i++) {
            const screenPt = engineRef.current.worldToScreen(coords[i][0], coords[i][1]);
            const dist = Math.sqrt(Math.pow(mouseX - screenPt.x, 2) + Math.pow(mouseY - screenPt.y, 2));
            if (dist < 10) {
              foundVertex = i;
              break;
            }
          }

          // Check midpoint hover if no vertex hovered
          if (foundVertex === null) {
            const len = coords.length;
            const limit = activeObj.object_type === "POLYLINE" ? len - 1 : len;
            for (let i = 0; i < limit; i++) {
              const p1 = coords[i];
              const p2 = coords[(i + 1) % len];
              const midWorld: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
              const midScreen = engineRef.current.worldToScreen(midWorld[0], midWorld[1]);
              const dist = Math.sqrt(Math.pow(mouseX - midScreen.x, 2) + Math.pow(mouseY - midScreen.y, 2));
              if (dist < 10) {
                foundMidpoint = i;
                break;
              }
            }
          }
        }

        setHoveredVertexIndex(foundVertex);
        setHoveredMidpointIndex(foundMidpoint);
      }
    } else {
      setHoveredVertexIndex(null);
      setHoveredMidpointIndex(null);
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

    // Get exact canvas coordinates
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = engineRef.current.screenToWorld(mouseX, mouseY);

    // Cross-layer vertex snapping (prioritized) or Grid snapping
    let finalX = worldPos.x;
    let finalY = worldPos.y;
    const snapResult = snapToGeometry(worldPos.x, worldPos.y, objects);
    if (snapResult.isSnapped) {
      finalX = snapResult.x;
      finalY = snapResult.y;
    } else if (isSnapToGrid) {
      finalX = Math.round(worldPos.x / 20) * 20;
      finalY = Math.round(worldPos.y / 20) * 20;
    }

    // Double-click detection for drawing tools
    const now = Date.now();
    const timeDiff = now - lastClickRef.current.time;
    const clickDistance = Math.sqrt(Math.pow(finalX - lastClickRef.current.x, 2) + Math.pow(finalY - lastClickRef.current.y, 2));
    
    lastClickRef.current = { time: now, x: finalX, y: finalY };

    if (["boundary", "road", "plot", "park", "amenity", "utility"].includes(selectedTool)) {
      if (timeDiff < 300 && clickDistance < 15 && drawingPoints.length > 1) {
        // Intercept as completion double click!
        e.preventDefault();
        handleFinishDrawing();
        return;
      }
    }

    if (isPanMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanAtStart({ x: pan.x, y: pan.y });
      return;
    }

    // Label Placer Tool Handler
    if (selectedTool === "label") {
      const text = prompt("Enter custom label annotation text:") || "New Map Label";
      if (text.trim()) {
        const newObj: MockGeometry = {
          id: `obj-label-${Date.now()}`,
          layer_id: "l-labels",
          layout_id: "lay-1",
          layerName: "LABELS",
          name: text,
          object_type: "POINT",
          geometry_data: {
            coordinates: [finalX, finalY]
          },
          style_config: { strokeColor: "#334155", strokeWidth: 1.25, fillColor: "#F8FAFC", opacity: 0.95 },
          properties: { owner: "" },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const cmd = new CreateGeometryCommand(
          newObj,
          objects,
          (updated) => onUpdateObjects(updated),
          (id) => onSelectObject(newObj)
        );
        drawingManager.executeCommand(cmd);
        setStatusLog(`Placed text label annotation: "${text}"`);
      }
      return;
    }

    const hasExistingBoundary = objects.some(o => o.layerName === "BOUNDARY");

    if (selectedTool === "boundary") {
      const targetSelectId = objects.find(o => o.layerName === "BOUNDARY")?.id || null;

      // 1. Check if dragging an existing vertex handle of the boundary
      if (targetSelectId && hoveredVertexIndex !== null) {
        const activeObj = objects.find(o => o.id === targetSelectId);
        if (activeObj) {
          const coords = activeObj.geometry_data.coordinates as Array<[number, number]>;
          setDraggedVertexObjectId(targetSelectId);
          setDraggedVertexIndex(hoveredVertexIndex);
          setDraggedVertexStartCoords(JSON.parse(JSON.stringify(coords)));
          setStatusLog(`Started boundary vertex node #${hoveredVertexIndex} reshape drag.`);
          return;
        }
      }

      // 2. Check if dragging a midpoint split handle of the boundary (to insert a new vertex)
      if (targetSelectId && hoveredMidpointIndex !== null) {
        const activeObj = objects.find(o => o.id === targetSelectId);
        if (activeObj) {
          const coords = activeObj.geometry_data.coordinates as Array<[number, number]>;
          const len = coords.length;
          const p1 = coords[hoveredMidpointIndex];
          const p2 = coords[(hoveredMidpointIndex + 1) % len];
          const splitPt: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

          const updatedCoords = [...coords];
          updatedCoords.splice(hoveredMidpointIndex + 1, 0, splitPt);

          // Update instantly
          const updatedObjs = objects.map(o => {
            if (o.id === targetSelectId) {
              return {
                ...o,
                geometry_data: { ...o.geometry_data, coordinates: updatedCoords }
              };
            }
            return o;
          });
          onUpdateObjects(updatedObjs);

          // Anchor vertex drag on this newly inserted vertex!
          setDraggedVertexObjectId(targetSelectId);
          setDraggedVertexIndex(hoveredMidpointIndex + 1);
          setDraggedVertexStartCoords(JSON.parse(JSON.stringify(coords)));
          setHoveredVertexIndex(hoveredMidpointIndex + 1);
          setHoveredMidpointIndex(null);
          setStatusLog(`Inserted vertex node at midpoint. Dynamic drag initiated.`);
          return;
        }
      }

      // 3. Draw or add point to drafting session:
      if (!hasExistingBoundary || drawingPoints.length > 0) {
        setDrawingPoints(prev => [...prev, [finalX, finalY]]);
        setDrawingCurrentMouse([finalX, finalY]);
        setStatusLog(`Vertex plotted at (${finalX.toFixed(1)}m, ${finalY.toFixed(1)}m). Double-click edge node to finish.`);
        return;
      } else {
        const existingBoundary = objects.find(o => o.layerName === "BOUNDARY");
        if (existingBoundary) {
          onSelectObject(existingBoundary);
        }
        setStatusLog("Boundary already exists. Drag vertex or midpoint nodes to edit, or delete existing boundary to redraw.");
        
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setPanAtStart({ x: pan.x, y: pan.y });
        return;
      }
    }

    if (selectedTool === "utility") {
      if (utilityGeometryMode === "point") {
        const utilityCount = objects.filter(o => o.layerName === "UTILITIES").length + 1;
        const initialProperties = {
          utility_name: `${defaultUtilityAsset} ${utilityCount}`,
          utility_type: defaultUtilityAsset,
          network_type: getNetworkTypeForAsset(defaultUtilityAsset),
          utility_code: `UT-NODE-${String(utilityCount).padStart(3, "0")}`,
          diameter: "",
          material: "",
          pressure_class: "",
          voltage: defaultUtilityAsset === "Transformer" ? "11 KV" : defaultUtilityAsset === "Electric Pole" ? "440 V" : "",
          capacity: "",
          owner: "Municipal Utilities Department",
          installation_year: String(new Date().getFullYear()),
          condition: "Excellent",
          maintenance_status: "Operational",
          operational_status: "Active",
          future_upgrade: false,
          notes: ""
        };

        const newObj: MockGeometry = {
          id: `obj-utility-${Date.now()}`,
          layer_id: "l-utilities",
          layout_id: "lay-1",
          layerName: "UTILITIES",
          name: initialProperties.utility_name,
          object_type: "POINT",
          geometry_data: {
            coordinates: [finalX, finalY]
          },
          style_config: {
            strokeColor: getUtilityColor(initialProperties.network_type),
            strokeWidth: 2,
            fillColor: "#FFFFFF",
            opacity: 1
          },
          properties: initialProperties,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const cmd = new CreateGeometryCommand(
          newObj,
          objects,
          (updated) => onUpdateObjects(updated),
          (id) => onSelectObject(newObj)
        );
        drawingManager.executeCommand(cmd);
        setStatusLog(`Placed Utility Node: "${newObj.name}" of type ${defaultUtilityAsset}`);
        return;
      }
    }

    if (selectedTool === "amenity") {
      if (amenityGeometryMode === "point") {
        const amenityCount = objects.filter(o => o.layerName === "AMENITIES").length + 1;
        const initialProperties = {
          amenity_name: `${defaultAmenityType} ${amenityCount}`,
          amenity_type: defaultAmenityType,
          unique_code: `AM-${String(amenityCount).padStart(3, "0")}`,
          status: "Planned",
          ownership: "Municipal Board",
          operational_status: "Proposed",
          area_value: 0,
          capacity: "",
          description: "",
          maintenance_notes: "",
          construction_status: "Proposed",
          future_expansion: false,
          owner: "Municipal Board"
        };

        const newObj: MockGeometry = {
          id: `obj-amenity-${Date.now()}`,
          layer_id: "l-amenities",
          layout_id: "lay-1",
          layerName: "AMENITIES",
          name: initialProperties.amenity_name,
          object_type: "POINT",
          geometry_data: {
            coordinates: [finalX, finalY]
          },
          style_config: {
            strokeColor: "#EC4899",
            strokeWidth: 2,
            fillColor: "#FCE7F3",
            opacity: 0.15
          },
          properties: initialProperties,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const cmd = new CreateGeometryCommand(
          newObj,
          objects,
          (updated) => onUpdateObjects(updated),
          (id) => onSelectObject(newObj)
        );
        drawingManager.executeCommand(cmd);
        setStatusLog(`Placed Point Amenity: "${newObj.name}" of type ${defaultAmenityType}`);
        return;
      } else if (amenityGeometryMode === "rectangle") {
        if (drawingPoints.length === 0) {
          setDrawingPoints([[finalX, finalY]]);
          setDrawingCurrentMouse([finalX, finalY]);
          setStatusLog(`Rectangle starting corner plotted at (${finalX.toFixed(1)}m, ${finalY.toFixed(1)}m). Click opposite diagonal corner to finish.`);
        } else {
          // Second click completes the rectangle!
          const p1 = drawingPoints[0];
          const p2 = [finalX, finalY];
          // Generate 4 corners clockwise
          const rectCoords: Array<[number, number]> = [
            [p1[0], p1[1]],
            [p2[0], p1[1]],
            [p2[0], p2[1]],
            [p1[0], p2[1]]
          ];

          const amenityCount = objects.filter(o => o.layerName === "AMENITIES").length + 1;
          const metrics = calculatePlotMetrics(rectCoords);
          const perimeterVal = calculatePolygonPerimeter(rectCoords);
          const initialProperties = {
            amenity_name: `${defaultAmenityType} ${amenityCount}`,
            amenity_type: defaultAmenityType,
            unique_code: `AM-${String(amenityCount).padStart(3, "0")}`,
            status: "Planned",
            ownership: "Municipal Board",
            operational_status: "Proposed",
            area_value: Math.round(metrics.sqft),
            perimeter_value: parseFloat(perimeterVal.toFixed(2)),
            capacity: "",
            description: "",
            maintenance_notes: "",
            construction_status: "Proposed",
            future_expansion: false,
            owner: "Municipal Board"
          };

          const newObj: MockGeometry = {
            id: `obj-amenity-${Date.now()}`,
            layer_id: "l-amenities",
            layout_id: "lay-1",
            layerName: "AMENITIES",
            name: initialProperties.amenity_name,
            object_type: "POLYGON",
            geometry_data: {
              coordinates: rectCoords
            },
            style_config: {
              strokeColor: "#EC4899",
              strokeWidth: 2,
              fillColor: "#FCE7F3",
              opacity: 0.15
            },
            properties: initialProperties,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const cmd = new CreateGeometryCommand(
            newObj,
            objects,
            (updated) => onUpdateObjects(updated),
            (id) => onSelectObject(newObj)
          );
          drawingManager.executeCommand(cmd);
          setDrawingPoints([]);
          setDrawingCurrentMouse(null);
          setStatusLog(`Added Rectangle Amenity: "${newObj.name}". Undo/redo cached.`);
        }
        return;
      }
    }

    if (["road", "plot", "park", "amenity", "utility"].includes(selectedTool)) {
      setDrawingPoints(prev => [...prev, [finalX, finalY]]);
      setDrawingCurrentMouse([finalX, finalY]);
      setStatusLog(`Vertex plotted at (${finalX.toFixed(1)}m, ${finalY.toFixed(1)}m). Double-click edge node to finish.`);
      return;
    }

    if (selectedTool === "measure") {
      if (!measureStart) {
        setMeasureStart({ x: finalX, y: finalY });
        setMeasureCurrent({ x: finalX, y: finalY });
        setStatusLog(`Measuring started at (${finalX.toFixed(1)}m, ${finalY.toFixed(1)}m). Move cursor.`);
      } else {
        const dx = finalX - measureStart.x;
        const dy = finalY - measureStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy) * 0.5;

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
        setStatusLog(`Measured segment length: ${dist.toFixed(2)} meters.`);
      }
      return;
    }

    if (selectedTool === "select") {
      // 1. Check if dragging an existing vertex handle of the selected object
      if (selectedObjectId && hoveredVertexIndex !== null) {
        const activeObj = objects.find(o => o.id === selectedObjectId);
        if (activeObj) {
          const coords = activeObj.geometry_data.coordinates as Array<[number, number]>;
          setDraggedVertexObjectId(selectedObjectId);
          setDraggedVertexIndex(hoveredVertexIndex);
          setDraggedVertexStartCoords(JSON.parse(JSON.stringify(coords)));
          setStatusLog(`Started vertex node #${hoveredVertexIndex} reshape drag.`);
          return;
        }
      }

      // 2. Check if dragging a midpoint split handle of the selected object (to insert a new vertex)
      if (selectedObjectId && hoveredMidpointIndex !== null) {
        const activeObj = objects.find(o => o.id === selectedObjectId);
        if (activeObj) {
          const coords = activeObj.geometry_data.coordinates as Array<[number, number]>;
          const len = coords.length;
          const p1 = coords[hoveredMidpointIndex];
          const p2 = coords[(hoveredMidpointIndex + 1) % len];
          const splitPt: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

          const updatedCoords = [...coords];
          updatedCoords.splice(hoveredMidpointIndex + 1, 0, splitPt);

          // Update instantly
          const updatedObjs = objects.map(o => {
            if (o.id === selectedObjectId) {
              return {
                ...o,
                geometry_data: { ...o.geometry_data, coordinates: updatedCoords }
              };
            }
            return o;
          });
          onUpdateObjects(updatedObjs);

          // Anchor vertex drag on this newly inserted vertex!
          setDraggedVertexObjectId(selectedObjectId);
          setDraggedVertexIndex(hoveredMidpointIndex + 1);
          setDraggedVertexStartCoords(JSON.parse(JSON.stringify(coords))); // Start coords are the pre-split list!
          setHoveredVertexIndex(hoveredMidpointIndex + 1);
          setHoveredMidpointIndex(null);
          setStatusLog(`Inserted vertex node at midpoint. Dynamic drag initiated.`);
          return;
        }
      }

      // 3. Fallback to selecting or moving whole geometries
      const reverseObjects = [...objects].reverse();
      let hitElement: MockGeometry | null = null;

      for (const obj of reverseObjects) {
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
            for (let i = 0; i < pts.length - 1; i++) {
              const dist = distanceToSegment([finalX, finalY], pts[i], pts[i + 1]);
              if (dist < 12) {
                hitElement = obj;
                break;
              }
            }
            if (hitElement) break;
          }
        } else if (obj.object_type === "POINT") {
          const pt = obj.geometry_data.coordinates as [number, number];
          const dist = Math.sqrt(Math.pow(finalX - pt[0], 2) + Math.pow(finalY - pt[1], 2));
          if (dist < 12) {
            hitElement = obj;
            break;
          }
        }
      }

      if (hitElement) {
        onSelectObject(hitElement);
        setStatusLog(`Selected: [${hitElement.layerName}] ${hitElement.name}.`);

        // If clicking on already selected element, initiate drag moving of entire shape
        if (hitElement.id === selectedObjectId) {
          const coords = hitElement.geometry_data.coordinates as Array<[number, number]>;
          setIsMovingGeometry(true);
          setMovingGeometryObjectId(hitElement.id);
          setMovingGeometryStartCoords(JSON.parse(JSON.stringify(coords)));
          setMovingGeometryStartMouseWorld({ x: finalX, y: finalY });
          setStatusLog(`Initiated geometric shift for ${hitElement.name}. Drag to move.`);
        }
      } else {
        onSelectObject(null);
        // Start empty space box panning
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setPanAtStart({ x: pan.x, y: pan.y });
      }
    }
  };

  /**
   * Finalizes dragging nodes or shifting layout geometries, executing the ModifyGeometryCommand for undo stack
   */
  const handleMouseUp = () => {
    setIsDragging(false);

    // Commit vertex reshape to command pattern
    if (draggedVertexIndex !== null && draggedVertexObjectId !== null) {
      const obj = objects.find(o => o.id === draggedVertexObjectId);
      if (obj) {
        const cmd = new ModifyGeometryCommand(
          draggedVertexObjectId,
          draggedVertexStartCoords,
          obj.geometry_data.coordinates,
          obj.style_config,
          obj.style_config,
          objects,
          (updated) => onUpdateObjects(updated),
          (id) => {
            const reSelected = objects.find(o => o.id === id);
            if (reSelected) onSelectObject(reSelected);
          }
        );
        drawingManager.executeCommand(cmd);
        setStatusLog(`Committed vertex reshape modifications.`);
      }
      setDraggedVertexIndex(null);
      setDraggedVertexObjectId(null);
    }

    // Commit geometry shift to command pattern
    if (isMovingGeometry && movingGeometryObjectId !== null) {
      const obj = objects.find(o => o.id === movingGeometryObjectId);
      if (obj) {
        const cmd = new ModifyGeometryCommand(
          movingGeometryObjectId,
          movingGeometryStartCoords,
          obj.geometry_data.coordinates,
          obj.style_config,
          obj.style_config,
          objects,
          (updated) => onUpdateObjects(updated),
          (id) => {
            const reSelected = objects.find(o => o.id === id);
            if (reSelected) onSelectObject(reSelected);
          }
        );
        drawingManager.executeCommand(cmd);
        setStatusLog(`Committed geometric location shift.`);
      }
      setIsMovingGeometry(false);
      setMovingGeometryObjectId(null);
      setMovingGeometryStartMouseWorld(null);
    }
  };

  /**
   * Double click handles vertex node deletion
   */
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (selectedTool === "select" && selectedObjectId && hoveredVertexIndex !== null) {
      const activeObj = objects.find(o => o.id === selectedObjectId);
      if (activeObj) {
        const coords = [...(activeObj.geometry_data.coordinates as Array<[number, number]>)];
        const isPolygon = activeObj.object_type !== "POLYLINE";
        const minVertices = isPolygon ? 3 : 2;

        if (coords.length > minVertices) {
          const oldCoords = JSON.parse(JSON.stringify(coords));
          coords.splice(hoveredVertexIndex, 1);

          const cmd = new ModifyGeometryCommand(
            selectedObjectId,
            oldCoords,
            coords,
            activeObj.style_config,
            activeObj.style_config,
            objects,
            (updated) => onUpdateObjects(updated),
            (id) => {
              const reSelected = objects.find(o => o.id === id);
              if (reSelected) onSelectObject(reSelected);
            }
          );
          drawingManager.executeCommand(cmd);
          setHoveredVertexIndex(null);
          setStatusLog(`Deleted vertex node #${hoveredVertexIndex}. Object simplified.`);
        } else {
          setStatusLog(`Cannot delete vertex. Minimum required nodes for ${activeObj.object_type} is ${minVertices}.`);
        }
      }
    }
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
        if (hoveredVertexIndex !== null || hoveredMidpointIndex !== null) return "pointer";
        return isMovingGeometry ? "move" : "default";
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
          onDoubleClick={handleDoubleClick}
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

        {/* Amenity Tool Floating Setup Dashboard */}
        {selectedTool === "amenity" && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-4 pointer-events-auto select-none z-20 animate-in fade-in slide-in-from-top-4 duration-300 border-l-4 border-l-pink-500"
            id="amenity-drawing-settings"
          >
            <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
              <Building className="w-5 h-5 text-pink-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Layer Setup</span>
                <span className="text-[11px] font-black text-slate-800">Amenity Settings</span>
              </div>
            </div>

            {/* Geometry Mode Toggle */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-450 font-mono">Drawing Tool</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setAmenityGeometryMode("point");
                    setDrawingPoints([]);
                    setDrawingCurrentMouse(null);
                    setStatusLog("Switched Amenity Tool to Point placement mode. Click once to place.");
                  }}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                    amenityGeometryMode === "point"
                      ? "bg-white text-pink-650 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                  title="Single point icon placement"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Point</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmenityGeometryMode("rectangle");
                    setDrawingPoints([]);
                    setDrawingCurrentMouse(null);
                    setStatusLog("Switched Amenity Tool to Rectangle drawing mode. Click diagonally to enclose.");
                  }}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                    amenityGeometryMode === "rectangle"
                      ? "bg-white text-pink-650 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                  title="Enclosed diagonal box layout"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Rectangle</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmenityGeometryMode("polygon");
                    setDrawingPoints([]);
                    setDrawingCurrentMouse(null);
                    setStatusLog("Switched Amenity Tool to Polygon (Freehand) drawing mode. Plot vertices and double-click to finish.");
                  }}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                    amenityGeometryMode === "polygon"
                      ? "bg-white text-pink-650 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                  title="Enclosed custom-shaped boundary"
                >
                  <Pentagon className="w-3.5 h-3.5" />
                  <span>Polygon</span>
                </button>
              </div>
            </div>

            {/* Amenity Class Selection */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-450 font-mono">Amenity Class</span>
              <select
                value={defaultAmenityType}
                onChange={(e) => {
                  setDefaultAmenityType(e.target.value);
                  setStatusLog(`Amenity class set to "${e.target.value}".`);
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors cursor-pointer"
              >
                <optgroup label="Civic & Worship">
                  <option value="Temple">Temple</option>
                  <option value="Mosque">Mosque</option>
                  <option value="Church">Church</option>
                  <option value="Community Hall">Community Hall</option>
                  <option value="Club House">Club House</option>
                </optgroup>
                <optgroup label="Recreation & Education">
                  <option value="Swimming Pool">Swimming Pool</option>
                  <option value="Gym">Gym</option>
                  <option value="School">School</option>
                  <option value="College">College</option>
                </optgroup>
                <optgroup label="Health & Safety">
                  <option value="Hospital">Hospital</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Police Station">Police Station</option>
                  <option value="Fire Station">Fire Station</option>
                </optgroup>
                <optgroup label="Commercial & Retail">
                  <option value="Shopping Complex">Shopping Complex</option>
                  <option value="Commercial Block">Commercial Block</option>
                  <option value="Office Block">Office Block</option>
                </optgroup>
                <optgroup label="Utilities & Services">
                  <option value="Water Tank">Water Tank</option>
                  <option value="Electrical Substation">Electrical Substation</option>
                  <option value="STP">STP (Sewage Treatment)</option>
                  <option value="Sewage Pump">Sewage Pump</option>
                  <option value="Solid Waste Collection Point">Solid Waste Collection</option>
                  <option value="Security Cabin">Security Cabin</option>
                  <option value="Main Entrance Gate">Main Entrance Gate</option>
                  <option value="Secondary Gate">Secondary Gate</option>
                </optgroup>
                <optgroup label="Transport & Parking">
                  <option value="Bus Stop">Bus Stop</option>
                  <option value="Parking">Parking</option>
                  <option value="EV Charging Station">EV Charging Station</option>
                </optgroup>
              </select>
            </div>
          </div>
        )}

        {selectedTool === "utility" && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-4 pointer-events-auto select-none z-20 animate-in fade-in slide-in-from-top-4 duration-300 border-l-4 border-l-blue-500"
            id="utility-drawing-settings"
          >
            <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
              <Activity className="w-5 h-5 text-blue-500 shrink-0 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Infrastructure</span>
                <span className="text-[11px] font-black text-slate-800">Utility Settings</span>
              </div>
            </div>

            {/* Geometry Mode Toggle */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-450 font-mono">Infrastructure Element</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setUtilityGeometryMode("polyline");
                    setDrawingPoints([]);
                    setDrawingCurrentMouse(null);
                    setStatusLog("Switched Utility Tool to Pipeline Route (Polyline) mode. Click to plot route, double-click to finish.");
                  }}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                    utilityGeometryMode === "polyline"
                      ? "bg-white text-blue-650 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                  title="Draw continuous pipeline route polyline"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Pipeline (Route)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUtilityGeometryMode("point");
                    setDrawingPoints([]);
                    setDrawingCurrentMouse(null);
                    setStatusLog("Switched Utility Tool to Asset Node placement mode. Click once on canvas to place Node.");
                  }}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                    utilityGeometryMode === "point"
                      ? "bg-white text-blue-650 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                  title="Single click node asset placement"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Asset Node</span>
                </button>
              </div>
            </div>

            {/* Network / Node Selector */}
            {utilityGeometryMode === "polyline" ? (
              <div className="flex flex-col gap-1 min-w-[165px]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-450 font-mono">Network Type</span>
                <select
                  value={defaultUtilityType}
                  onChange={(e) => {
                    setDefaultUtilityType(e.target.value);
                    setStatusLog(`Utility network type set to "${e.target.value}".`);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  <optgroup label="Water Systems">
                    <option value="Water Supply">Water Supply</option>
                    <option value="Raw Water Line">Raw Water Line</option>
                    <option value="Overhead Water Line">Overhead Water Line</option>
                    <option value="UG Water Line">UG Water Line</option>
                    <option value="Irrigation Line">Irrigation Line</option>
                    <option value="Fire Hydrant Line">Fire Hydrant Line</option>
                  </optgroup>
                  <optgroup label="Sewer & Drainage">
                    <option value="Sewer Line">Sewer Line</option>
                    <option value="Storm Water Drain">Storm Water Drain</option>
                    <option value="Open Drain">Open Drain</option>
                    <option value="Underground Drain">Underground Drain</option>
                    <option value="Rainwater Harvesting Line">Rainwater Harvesting Line</option>
                  </optgroup>
                  <optgroup label="Electrical & Telecom">
                    <option value="Electrical LT">Electrical LT (440V)</option>
                    <option value="Electrical HT">Electrical HT (11KV+)</option>
                    <option value="Street Lighting">Street Lighting</option>
                    <option value="Fiber Optic">Fiber Optic</option>
                    <option value="Telecom">Telecom</option>
                  </optgroup>
                  <optgroup label="Other Networks">
                    <option value="Gas Pipeline">Gas Pipeline</option>
                    <option value="Future Reserved Utility">Future Reserved Utility</option>
                  </optgroup>
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1 min-w-[165px]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-450 font-mono">Asset Node Type</span>
                <select
                  value={defaultUtilityAsset}
                  onChange={(e) => {
                    setDefaultUtilityAsset(e.target.value);
                    setStatusLog(`Utility node type set to "${e.target.value}".`);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  <optgroup label="Electrical Infrastructure">
                    <option value="Transformer">Transformer (⚡)</option>
                    <option value="Electric Pole">Electric Pole</option>
                    <option value="Street Light">Street Light (💡)</option>
                  </optgroup>
                  <optgroup label="Drainage & Wastewater">
                    <option value="Manhole">Manhole (MH)</option>
                    <option value="Inspection Chamber">Inspection Chamber</option>
                    <option value="Lift Station">Lift Station</option>
                  </optgroup>
                  <optgroup label="Water Supply Node">
                    <option value="Water Valve">Water Valve (V)</option>
                    <option value="Valve Chamber">Valve Chamber</option>
                    <option value="Fire Hydrant">Fire Hydrant (🔥)</option>
                    <option value="Pump House">Pump House</option>
                  </optgroup>
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
