import { GeometryLayer, GeometryObject } from "../Contracts/models.ts";
import { calculatePlotMetrics, generateCarriagewayPolygon, getPolygonCentroid } from "../../lib/plotEngine.ts";
import { getUtilityColor } from "../../lib/utilityEngine.ts";
import { isModuleActive } from "../../modules/index.ts";

/**
 * Viewport State representing the active camera metrics on the infinite canvas.
 */
export interface ViewportState {
  zoom: number;      // Scale multiplier (e.g. 1.0 for 100%)
  panX: number;      // X displacement in screen pixels
  panY: number;      // Y displacement in screen pixels
  width: number;     // Physical container width
  height: number;    // Physical container height
  dpiScale: number;  // Device pixel ratio factor (Retina/DPI support)
}

/**
 * Prepared Interface Contract for the Snap Engine.
 * (To be implemented in a future phase - signatures declared as requested)
 */
export interface ISnapEngine {
  /**
   * Snaps a world/screen coordinate point to active grid markers, vertex vertices, or alignment vectors.
   */
  snap(
    screenPos: { x: number; y: number },
    worldPos: { x: number; y: number },
    gridSpacing: number,
    options?: { snapToGrid?: boolean; snapToElements?: boolean; snapDistance?: number }
  ): {
    screen: { x: number; y: number };
    world: { x: number; y: number };
    isSnapped: boolean;
    snapSource?: 'GRID' | 'VERTEX' | 'EDGE';
  };
}

/**
 * Prepared Interface Contract for the Selection Engine.
 * (To be implemented in a future phase - signatures declared as requested)
 */
export interface ISelectionEngine {
  /**
   * Identifies if a screen/world coordinate intersects with a geometric object on active/visible layers.
   */
  hitTest(
    worldPos: { x: number; y: number },
    objects: GeometryObject[],
    layers: GeometryLayer[],
    tolerance: number
  ): GeometryObject | null;

  /**
   * Performs box/marquee selection of geometries within a boundary rectangle.
   */
  boxSelect(
    startWorldPos: { x: number; y: number },
    endWorldPos: { x: number; y: number },
    objects: GeometryObject[]
  ): GeometryObject[];
}

/**
 * Prepared Interface Contract for the Drawing Engine.
 * (To be implemented in a future phase - signatures declared as requested)
 */
export interface IDrawingEngine {
  /**
   * Starts a dynamic vector drawing path session.
   */
  beginDraw(mode: 'POLYGON' | 'POLYLINE' | 'POINT' | 'BOUNDARY' | 'LABEL', startWorldPos: { x: number; y: number }): void;

  /**
   * Adds or updates the interactive vertex marker as user drags cursor.
   */
  updateDraw(currentWorldPos: { x: number; y: number }): void;

  /**
   * Commits current drawn coordinates into physical database objects.
   */
  completeDraw(): GeometryObject | null;

  /**
   * Cancels active drawn coordinates sequence without saving.
   */
  cancelDraw(): void;
}

/**
 * High-performance, professional HTML5 Canvas Viewport and Geometry Rendering Engine.
 * Manages rendering cycles, coordinate transformation matrices, infinite engineering grids,
 * dynamic zoom/pan physics, and view-frustum bounds culling.
 */
export class CanvasViewportEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: ViewportState;
  
  // Animation loop variables
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isDirty: boolean = true; // Set to true to trigger render frame

  // Render callback hooks
  private onBeforeRender: ((ctx: CanvasRenderingContext2D) => void) | null = null;
  private onAfterRender: ((ctx: CanvasRenderingContext2D) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, initialWidth: number, initialHeight: number) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("CanvasViewportEngine: Failed to obtain 2D rendering context.");
    }
    this.ctx = context;

    this.state = {
      zoom: 1.0,
      panX: 200,
      panY: 150,
      width: initialWidth,
      height: initialHeight,
      dpiScale: window.devicePixelRatio || 1
    };

    this.applyDpiScaling();
  }

  /**
   * Returns current viewport parameters.
   */
  public getViewportState(): ViewportState {
    return { ...this.state };
  }

  /**
   * Updates viewport state and marks frame as dirty.
   */
  public updateViewport(updates: Partial<Omit<ViewportState, "width" | "height" | "dpiScale">>): void {
    if (updates.zoom !== undefined) {
      this.state.zoom = Math.max(0.1, Math.min(updates.zoom, 10.0));
    }
    if (updates.panX !== undefined) {
      this.state.panX = updates.panX;
    }
    if (updates.panY !== undefined) {
      this.state.panY = updates.panY;
    }
    this.isDirty = true;
  }

  /**
   * Performs conversion from World Space coordinates to Screen Space pixels.
   */
  public worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx * this.state.zoom + this.state.panX,
      y: wy * this.state.zoom + this.state.panY
    };
  }

  /**
   * Performs conversion from Screen Space pixels to World Space coordinates.
   */
  public screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.state.panX) / this.state.zoom,
      y: (sy - this.state.panY) / this.state.zoom
    };
  }

  /**
   * Computes the bounding box of the currently visible viewport in World Coordinates.
   * Utilized for frustum culling performance optimizations.
   */
  public getVisibleWorldBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.state.width, this.state.height);
    return {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y)
    };
  }

  /**
   * Configures pixel resolution buffer match for sharp Retina display assets rendering.
   */
  public applyDpiScaling(): void {
    const dpr = window.devicePixelRatio || 1;
    this.state.dpiScale = dpr;

    this.canvas.width = this.state.width * dpr;
    this.canvas.height = this.state.height * dpr;
    this.canvas.style.width = `${this.state.width}px`;
    this.canvas.style.height = `${this.state.height}px`;

    // Reset and rescale the transform context natively
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.isDirty = true;
  }

  /**
   * Updates container dimensional metrics on window resizing.
   */
  public resize(width: number, height: number): void {
    this.state.width = width;
    this.state.height = height;
    this.applyDpiScaling();
  }

  /**
   * Set dynamic pre-render rendering handlers.
   */
  public setBeforeRender(hook: (ctx: CanvasRenderingContext2D) => void): void {
    this.onBeforeRender = hook;
  }

  /**
   * Set dynamic post-render rendering handlers.
   */
  public setAfterRender(hook: (ctx: CanvasRenderingContext2D) => void): void {
    this.onAfterRender = hook;
  }

  /**
   * Triggers explicit repaint of viewport contents.
   */
  public invalidate(): void {
    this.isDirty = true;
  }

  /**
   * Starts the high-performance requestAnimationFrame render loop.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stops the active frame ticks loop.
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Executes viewport geometry checks and draws canvas content layers.
   */
  private render(): void {
    // Only repaint if the viewport has been shifted, zoomed, or marked dirty.
    if (!this.isDirty) return;
    this.isDirty = false;

    const ctx = this.ctx;
    const { width, height, zoom, panX, panY } = this.state;

    // 1. Clear background viewport context with smooth off-white
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, width, height);

    // Call registered hook to perform layer or grid background paints
    if (this.onBeforeRender) {
      this.onBeforeRender(ctx);
    }

    // Call registered hook to draw primary shapes, labels, or active tools overlays
    if (this.onAfterRender) {
      this.onAfterRender(ctx);
    }
  }

  /**
   * Helper utility to render the infinite architectural grid.
   * Dynamically alters grid spacing steps based on current camera zoom ratios.
   */
  public drawEngineeringGrid(isGridVisible: boolean): void {
    if (!isGridVisible) return;

    const ctx = this.ctx;
    const { width, height, zoom, panX, panY } = this.state;

    // Define coordinate spacing intervals dynamically
    let spacing = 20; // 20 units in world space
    if (zoom < 0.25) spacing = 200;
    else if (zoom < 0.6) spacing = 100;
    else if (zoom < 1.5) spacing = 50;

    // Screen distance between grid lines
    const screenSpacing = spacing * zoom;

    // Grid origin position projected to screen pixels
    const originX = panX;
    const originY = panY;

    // Compute starting columns & rows based on viewport boundaries
    const startX = Math.floor(-originX / screenSpacing) * screenSpacing + originX;
    const startY = Math.floor(-originY / screenSpacing) * screenSpacing + originY;

    ctx.save();
    
    // Draw minor grid lines
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = startX; x < width; x += screenSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += screenSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw major grid lines (every 5th minor interval)
    const majorSpacing = screenSpacing * 5;
    const majorStartX = Math.floor(-originX / majorSpacing) * majorSpacing + originX;
    const majorStartY = Math.floor(-originY / majorSpacing) * majorSpacing + originY;

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let x = majorStartX; x < width; x += majorSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = majorStartY; y < height; y += majorSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw origin world coordinate crosshairs (0, 0)
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Y-Axis line at world x = 0
    if (panX >= 0 && panX <= width) {
      ctx.moveTo(panX, 0);
      ctx.lineTo(panX, height);
    }
    // X-Axis line at world y = 0
    if (panY >= 0 && panY <= height) {
      ctx.moveTo(0, panY);
      ctx.lineTo(width, panY);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Clip geometries and render vector elements.
   * Performs frustum culling optimizations on large mock layouts.
   */
  public drawGeometries(
    objects: GeometryObject[],
    layers: GeometryLayer[],
    selectedObjectId: string | null,
    searchQuery: string
  ): void {
    const ctx = this.ctx;
    const bounds = this.getVisibleWorldBounds();

    // Draw objects layer by layer to preserve correct visual stacking order
    const sortedLayers = [...layers].sort((a, b) => a.display_order - b.display_order);

    for (const layer of sortedLayers) {
      if (!layer.is_visible) continue;

      // Module activity check for the layer
      let isLayerActive = true;
      const lName = layer.layer_name.toUpperCase();
      if (lName === "BOUNDARY" && !isModuleActive("mod-boundary")) isLayerActive = false;
      else if (lName === "PLOTS" && !isModuleActive("mod-plots")) isLayerActive = false;
      else if (lName === "ROADS" && !isModuleActive("mod-roads")) isLayerActive = false;
      else if (lName === "PARK" && !isModuleActive("mod-parks")) isLayerActive = false;
      else if ((lName === "AMENITIES" || lName === "CA") && !isModuleActive("mod-amenities")) isLayerActive = false;
      else if (lName === "UTILITIES" && !isModuleActive("mod-utilities")) isLayerActive = false;

      if (!isLayerActive) continue;

      const layerObjects = objects.filter(
        (obj) => obj.layer_id === layer.id || (obj as any).layerName === layer.layer_name
      );

      for (const obj of layerObjects) {
        // 1. Calculate bounding box of the current object in World Space
        const objBounds = this.computeObjectBounds(obj);
        if (!objBounds) continue;

        // 2. Perform bounding box clipping (Frustum Culling check)
        const inViewport = (
          objBounds.maxX >= bounds.minX &&
          objBounds.minX <= bounds.maxX &&
          objBounds.maxY >= bounds.minY &&
          objBounds.minY <= bounds.maxY
        );

        if (!inViewport) {
          // Geometry falls completely outside the active screen viewport, skip painting for performance
          continue;
        }

        // 3. Object lies fully or partially inside viewport, render it
        this.renderObject(ctx, obj, layer, selectedObjectId === obj.id, searchQuery);
      }
    }
  }

  /**
   * Calculates the axis-aligned bounding box (AABB) of a geometry in world coordinates.
   */
  private computeObjectBounds(obj: GeometryObject): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const coords = obj.geometry_data.coordinates;
    if (!coords) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const processPoint = (pt: [number, number]) => {
      minX = Math.min(minX, pt[0]);
      minY = Math.min(minY, pt[1]);
      maxX = Math.max(maxX, pt[0]);
      maxY = Math.max(maxY, pt[1]);
    };

    if (obj.object_type === "POINT" || obj.object_type === "LABEL") {
      const pt = coords as [number, number];
      processPoint(pt);
    } else if (Array.isArray(coords)) {
      // Coordinates could be multidimensional array of arrays
      if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") {
        (coords as Array<[number, number]>).forEach(processPoint);
      } else if (Array.isArray(coords[0])) {
        // Polygon with rings
        (coords as Array<Array<[number, number]>>).forEach((ring) => {
          ring.forEach(processPoint);
        });
      }
    }

    if (minX === Infinity) return null;

    return { minX, minY, maxX, maxY };
  }

  /**
   * Helper to draw a single vector geometry object with high-fidelity styles.
   */
  private renderObject(
    ctx: CanvasRenderingContext2D,
    obj: GeometryObject,
    layer: GeometryLayer,
    isSelected: boolean,
    searchQuery: string
  ): void {
    const coords = obj.geometry_data.coordinates;
    if (!coords) return;

    const style = layer.style_config || {};
    const isMatched = searchQuery
      ? obj.label_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obj as any).name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.plot_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.park_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.park_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.amenity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.amenity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.unique_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.road_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.road_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.utility_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.utility_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.network_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.properties?.utility_type?.toLowerCase().includes(searchQuery.toLowerCase())
      : false;

    // Styling configuration
    ctx.save();

    let baseStrokeColor = isSelected ? "#3B82F6" : isMatched ? "#EF4444" : style.strokeColor || "#475569";
    let baseFillColor = isMatched ? "#FEE2E2" : style.fillColor || "#E2E8F0";
    let opacity = isMatched ? 0.85 : style.opacity !== undefined ? style.opacity : 0.4;
    let dashArrayToUse = style.dashArray || "";

    if (layer.layer_name === "PARK") {
      const pType = obj.properties?.park_type || "Park";
      let pFill = "#22c55e"; // Bright green default
      let pStroke = "#15803d";
      let pOpacity = 0.5;
      let pDash = "";

      if (pType === "Central Park") {
        pFill = "#15803d";
        pStroke = "#14532d";
        pOpacity = 0.8;
      } else if (pType === "Children Park") {
        pFill = "#22c55e";
        pStroke = "#15803d";
        pOpacity = 0.75;
      } else if (pType === "Garden") {
        pFill = "#86efac";
        pStroke = "#16a34a";
        pOpacity = 0.7;
      } else if (pType === "Buffer Zone") {
        pFill = "#a7f3d0";
        pStroke = "#059669";
        pOpacity = 0.25;
      } else if (pType === "Future Expansion Area" || pType === "Future Area") {
        pFill = "#f0fdf4";
        pStroke = "#16a34a";
        pOpacity = 0.3;
        pDash = "6,4";
      } else if (pType === "Open Space") {
        pFill = "#4ade80";
        pStroke = "#16a34a";
        pOpacity = 0.5;
      } else if (pType === "Green Belt") {
        pFill = "#0f766e";
        pStroke = "#115e59";
        pOpacity = 0.6;
      } else if (pType === "Reserved Open Space") {
        pFill = "#059669";
        pStroke = "#047857";
        pOpacity = 0.5;
      } else if (pType === "Recreation Area") {
        pFill = "#10b981";
        pStroke = "#047857";
        pOpacity = 0.6;
      }

      baseFillColor = pFill;
      if (!isSelected && !isMatched) {
        baseStrokeColor = pStroke;
      }
      opacity = pOpacity;
      if (pDash) {
        dashArrayToUse = pDash;
      }
    }

    const strokeWidth = isSelected ? (style.strokeWidth || 1.5) + 1.5 : style.strokeWidth || 1.5;

    ctx.strokeStyle = baseStrokeColor;
    ctx.lineWidth = strokeWidth * this.state.zoom; // Scale outline to match viewport depth
    
    // Convert hex fillColor into rgba to apply configured opacity properly
    ctx.fillStyle = this.hexToRgba(baseFillColor, opacity);

    if (isSelected) {
      // Selection highlight dash effect
      ctx.setLineDash([6 * this.state.zoom, 4 * this.state.zoom]);
    } else if (dashArrayToUse) {
      const dashVals = dashArrayToUse.split(",").map((v) => parseFloat(v) * this.state.zoom);
      ctx.setLineDash(dashVals);
    }

    if (obj.object_type === "POLYGON" || obj.object_type === "BOUNDARY") {
      ctx.beginPath();
      
      const rings = Array.isArray(coords[0]) && Array.isArray((coords[0] as any)[0]) 
        ? (coords as Array<Array<[number, number]>>) 
        : [coords as Array<[number, number]>];

      rings.forEach((ring) => {
        if (ring.length === 0) return;
        const start = this.worldToScreen(ring[0][0], ring[0][1]);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < ring.length; i++) {
          const pt = this.worldToScreen(ring[i][0], ring[i][1]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
      });

      ctx.fill();
      ctx.stroke();

      // Draw custom GIS icon at centroid for AMENITIES layer
      if (layer.layer_name === "AMENITIES") {
        const ring0 = rings[0];
        if (ring0 && ring0.length >= 3) {
          const centroid = getPolygonCentroid(ring0);
          if (centroid) {
            const screenCentroid = this.worldToScreen(centroid[0], centroid[1]);
            const amenityType = obj.properties?.amenity_type || "Amenity";
            this.drawAmenityIcon(ctx, amenityType, screenCentroid.x, screenCentroid.y, 22 * Math.max(0.7, Math.min(1.5, this.state.zoom)), isSelected);
          }
        }
      }

      // Render Label texts
      if (layer.layer_name === "PLOTS" || layer.layer_name === "BOUNDARY" || layer.layer_name === "PARK" || layer.layer_name === "AMENITIES") {
        this.renderLabelOverlay(ctx, obj, isSelected);
      }
    } else if (obj.object_type === "POLYLINE") {
      const pts = coords as Array<[number, number]>;
      if (layer.layer_name === "ROADS" && pts.length > 0) {
        const roadWidth = (obj.properties as any)?.road_width || 12;
        const boundaryPts = (obj.properties as any)?.boundary || generateCarriagewayPolygon(pts, roadWidth);

        if (boundaryPts && boundaryPts.length >= 3) {
          // A. Draw full generated physical carriageway polygon filled with asphalt/configured style
          ctx.save();
          ctx.beginPath();
          const startPt = this.worldToScreen(boundaryPts[0][0], boundaryPts[0][1]);
          ctx.moveTo(startPt.x, startPt.y);
          for (let i = 1; i < boundaryPts.length; i++) {
            const pt = this.worldToScreen(boundaryPts[i][0], boundaryPts[i][1]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();

          // Use style configuration from layer or default asphalt color
          ctx.fillStyle = this.hexToRgba(style.fillColor || "#475569", style.opacity !== undefined ? style.opacity : 0.8);
          ctx.fill();

          // Draw side curb borders (Shoulders)
          ctx.strokeStyle = isSelected ? "#6366F1" : style.strokeColor || "#1E293B";
          ctx.lineWidth = isSelected ? Math.max(2, 2.5 * this.state.zoom) : Math.max(1, 1.25 * this.state.zoom);
          if (isSelected) {
            ctx.setLineDash([6 * this.state.zoom, 4 * this.state.zoom]);
          }
          ctx.stroke();
          ctx.restore();
        }

        // B. Yellow centerline divider
        ctx.save();
        ctx.beginPath();
        const start = this.worldToScreen(pts[0][0], pts[0][1]);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < pts.length; i++) {
          const pt = this.worldToScreen(pts[i][0], pts[i][1]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = Math.max(0.75, 1 * this.state.zoom);
        ctx.setLineDash([8 * this.state.zoom, 8 * this.state.zoom]);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();

        // C. Direction arrows
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = Math.max(1, 1.5 * this.state.zoom);
        const arrowSize = 6 * this.state.zoom;
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = this.worldToScreen(pts[i][0], pts[i][1]);
          const p2 = this.worldToScreen(pts[i + 1][0], pts[i + 1][1]);
          
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          
          ctx.beginPath();
          ctx.moveTo(midX - arrowSize * Math.cos(angle - Math.PI / 6), midY - arrowSize * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(midX, midY);
          ctx.lineTo(midX - arrowSize * Math.cos(angle + Math.PI / 6), midY - arrowSize * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
        ctx.restore();

        this.renderLabelOverlay(ctx, obj, isSelected);
      } else {
        if (layer.layer_name === "UTILITIES") {
          // Dedicated Utility Line rendering
          ctx.save();
          ctx.beginPath();
          if (pts.length > 0) {
            const start = this.worldToScreen(pts[0][0], pts[0][1]);
            ctx.moveTo(start.x, start.y);
            for (let i = 1; i < pts.length; i++) {
              const pt = this.worldToScreen(pts[i][0], pts[i][1]);
              ctx.lineTo(pt.x, pt.y);
            }
          }
          const networkType = obj.properties?.network_type || "";
          const uColor = getUtilityColor(networkType);
          ctx.strokeStyle = isSelected ? "#3B82F6" : uColor;
          ctx.lineWidth = isSelected ? Math.max(3, 4.5 * this.state.zoom) : Math.max(1.5, 2.25 * this.state.zoom);
          if (networkType.toLowerCase().includes("future") || (obj as any).style_config?.dashArray) {
            ctx.setLineDash([6 * this.state.zoom, 6 * this.state.zoom]);
          } else {
            ctx.setLineDash([]);
          }
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.restore();

          this.renderUtilityLabel(ctx, obj, isSelected);
        } else {
          // Standard Polyline rendering for roads/other fallback layers
          ctx.beginPath();
          if (pts.length > 0) {
            const start = this.worldToScreen(pts[0][0], pts[0][1]);
            ctx.moveTo(start.x, start.y);
            for (let i = 1; i < pts.length; i++) {
              const pt = this.worldToScreen(pts[i][0], pts[i][1]);
              ctx.lineTo(pt.x, pt.y);
            }
          }
          ctx.stroke();
        }
      }
    } else if (obj.object_type === "POINT") {
      const pt = coords as [number, number];
      const screenPt = this.worldToScreen(pt[0], pt[1]);
      
      if (layer.layer_name === "AMENITIES") {
        const amenityType = obj.properties?.amenity_type || "Amenity";
        this.drawAmenityIcon(ctx, amenityType, screenPt.x, screenPt.y, 22 * Math.max(0.7, Math.min(1.5, this.state.zoom)), isSelected);
        this.renderLabelOverlay(ctx, obj, isSelected);
      } else if (layer.layer_name === "UTILITIES") {
        const assetType = obj.properties?.utility_type || "Node";
        const networkType = obj.properties?.network_type || "";
        this.drawUtilityAssetIcon(ctx, assetType, networkType, screenPt.x, screenPt.y, 14 * Math.max(0.7, Math.min(1.5, this.state.zoom)), isSelected);
        this.renderUtilityLabel(ctx, obj, isSelected);
      } else {
        ctx.save();
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Draw subtle dot
        ctx.fillStyle = isSelected ? "#4F46E5" : "#334155";
        ctx.beginPath();
        ctx.arc(screenPt.x, screenPt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw clean pill container
        const text = (obj as any).name || obj.label_text || "Label";
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.strokeStyle = isSelected ? "#4F46E5" : "rgba(100, 116, 139, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(screenPt.x - textWidth/2 - 6, screenPt.y - 18, textWidth + 12, 16, 4);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = "#1F2937";
        ctx.fillText(text, screenPt.x, screenPt.y - 10);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  /**
   * Centered text overlay label inside elements
   */
  private renderLabelOverlay(ctx: CanvasRenderingContext2D, obj: GeometryObject, isSelected: boolean): void {
    // Hide labels automatically when zoomed out (less than 50% / 0.5 zoom), unless selected!
    if (this.state.zoom < 0.5 && !isSelected) return;

    const bounds = this.computeObjectBounds(obj);
    if (!bounds) return;

    // Find center point in world coordinate spaces
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const screenCenter = this.worldToScreen(centerX, centerY);

    ctx.save();
    ctx.setLineDash([]); // clear dash arrays

    const lines: string[] = [];
    const isPlot = (obj as any).layerName === "PLOTS" || obj.properties?.plot_number !== undefined;
    const isPark = (obj as any).layerName === "PARK" || obj.properties?.park_type !== undefined;
    const isAmenity = (obj as any).layerName === "AMENITIES" || obj.properties?.amenity_type !== undefined;

    if (isPlot) {
      if (obj.properties?.plot_number) {
        lines.push(`Plot ${obj.properties.plot_number}`);
      } else {
        lines.push(`Plot -`);
      }

      const coords = obj.geometry_data.coordinates as Array<[number, number]>;
      if (coords && coords.length >= 3) {
        const metrics = calculatePlotMetrics(coords);
        lines.push(`${metrics.sqft.toLocaleString()} sq.ft`);
        lines.push(`${metrics.sqm} m²`);
      } else if (obj.properties?.area_value) {
        lines.push(`${obj.properties.area_value} sq.ft`);
      }

      if (obj.properties?.facing) {
        lines.push(`${obj.properties.facing} Facing`);
      }
    } else if (isPark) {
      const parkName = obj.properties?.park_name || (obj as any).name || "Unnamed Park";
      lines.push(parkName);
      lines.push(obj.properties?.park_type || "Park");

      const coords = obj.geometry_data.coordinates as Array<[number, number]>;
      if (coords && coords.length >= 3) {
        const metrics = calculatePlotMetrics(coords);
        lines.push(`${metrics.sqft.toLocaleString()} sq.ft`);
        lines.push(`${metrics.acres.toFixed(3)} acres`);
      } else if (obj.properties?.area_value) {
        lines.push(`${obj.properties.area_value} sq.ft`);
      }
    } else if (isAmenity) {
      const amenityName = obj.properties?.amenity_name || (obj as any).name || "Unnamed Amenity";
      const amenityType = obj.properties?.amenity_type || "Amenity";
      lines.push(amenityName);
      lines.push(amenityType);

      if (obj.object_type === "POLYGON") {
        const coords = obj.geometry_data.coordinates as Array<[number, number]>;
        if (coords && coords.length >= 3) {
          const metrics = calculatePlotMetrics(coords);
          lines.push(`${metrics.sqft.toLocaleString()} sq.ft`);
        } else if (obj.properties?.area_value) {
          lines.push(`${obj.properties.area_value} sq.ft`);
        }
      }
    } else {
      const labelText = obj.label_text || obj.properties?.amenity_type || (obj.properties?.road_width ? `${obj.properties.road_width}m Road` : "");
      if (labelText) {
        lines.push(labelText);
      }
    }

    if (lines.length > 0) {
      ctx.font = `bold ${Math.max(7, Math.min(10, 8 * this.state.zoom))}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textWidths = lines.map(line => ctx.measureText(line).width);
      const maxWidth = Math.max(...textWidths);
      const lineHeight = 11 * Math.max(0.8, Math.min(1.1, this.state.zoom));
      const totalHeight = lineHeight * lines.length;

      const padX = 6;
      const padY = 4;

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.roundRect(
        screenCenter.x - maxWidth / 2 - padX,
        screenCenter.y - totalHeight / 2 - padY,
        maxWidth + padX * 2,
        totalHeight + padY * 2,
        4
      );
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#4F46E5" : "rgba(100, 116, 139, 0.35)";
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#312E81" : "#1E293B";
      lines.forEach((line, index) => {
        const lineY = screenCenter.y - totalHeight / 2 + lineHeight * index + lineHeight / 2;
        ctx.fillText(line, screenCenter.x, lineY);
      });
    }

    ctx.restore();
  }

  /**
   * Helper to render highly polished GIS vector symbols for all 30 amenity types.
   */
  private drawAmenityIcon(
    ctx: CanvasRenderingContext2D,
    type: string,
    x: number,
    y: number,
    size: number,
    isSelected: boolean
  ): void {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Set styling based on selection
    ctx.strokeStyle = isSelected ? "#4F46E5" : "#EC4899";
    ctx.fillStyle = isSelected ? "#EEF2FF" : "#FCE7F3";

    const r = size / 2;

    // Draw background circle or shield depending on type
    ctx.beginPath();
    if (type === "Police Station") {
      // Draw shield shape
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x + r, y - r, x + r, y - r/3);
      ctx.quadraticCurveTo(x + r, y + r/3, x, y + r);
      ctx.quadraticCurveTo(x - r, y + r/3, x - r, y - r/3);
      ctx.quadraticCurveTo(x - r, y - r, x, y - r);
    } else {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Draw custom icon glyph inside the background
    ctx.beginPath();
    ctx.strokeStyle = isSelected ? "#312E81" : "#9D174D";
    ctx.fillStyle = isSelected ? "#312E81" : "#9D174D";
    ctx.lineWidth = 1.25;

    const s = r * 0.55; // Inner bounds

    switch (type) {
      case "Temple": {
        ctx.moveTo(x - s, y + s);
        ctx.lineTo(x + s, y + s);
        ctx.lineTo(x + s, y + s/3);
        ctx.quadraticCurveTo(x, y - s, x - s, y + s/3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x, y - s * 1.5);
        ctx.lineTo(x + s * 0.6, y - s * 1.25);
        ctx.lineTo(x, y - s * 1.0);
        ctx.stroke();
        break;
      }
      case "Mosque": {
        ctx.moveTo(x - s, y + s);
        ctx.lineTo(x + s, y + s);
        ctx.lineTo(x + s * 0.7, y + s * 0.2);
        ctx.arc(x, y + s * 0.2, s * 0.7, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y - s * 0.7, s * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "Church": {
        ctx.moveTo(x, y - s);
        ctx.lineTo(x, y + s);
        ctx.moveTo(x - s, y - s * 0.2);
        ctx.lineTo(x + s, y - s * 0.2);
        ctx.stroke();
        break;
      }
      case "Hospital":
      case "Clinic": {
        ctx.fillRect(x - s * 0.25, y - s, s * 0.5, s * 2);
        ctx.fillRect(x - s, y - s * 0.25, s * 2, s * 0.5);
        break;
      }
      case "School":
      case "College": {
        ctx.moveTo(x, y - s * 0.6);
        ctx.lineTo(x + s, y - s * 0.15);
        ctx.lineTo(x, y + s * 0.3);
        ctx.lineTo(x - s, y - s * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.3);
        ctx.lineTo(x - s * 0.3, y + s * 0.9);
        ctx.stroke();
        break;
      }
      case "Community Hall":
      case "Club House": {
        ctx.moveTo(x - s, y + s);
        ctx.lineTo(x - s, y);
        ctx.lineTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x + s, y + s);
        ctx.closePath();
        ctx.stroke();
        ctx.fillRect(x - s * 0.25, y + s * 0.3, s * 0.5, s * 0.7);
        break;
      }
      case "Swimming Pool": {
        ctx.moveTo(x - s, y - s * 0.2);
        ctx.bezierCurveTo(x - s * 0.5, y - s * 0.5, x - s * 0.5, y + s * 0.1, x, y - s * 0.2);
        ctx.bezierCurveTo(x + s * 0.5, y - s * 0.5, x + s * 0.5, y + s * 0.1, x + s, y - s * 0.2);
        ctx.moveTo(x - s, y + s * 0.3);
        ctx.bezierCurveTo(x - s * 0.5, y, x - s * 0.5, y + s * 0.6, x, y + s * 0.3);
        ctx.bezierCurveTo(x + s * 0.5, y, x + s * 0.5, y + s * 0.6, x + s, y + s * 0.3);
        ctx.stroke();
        break;
      }
      case "Gym": {
        ctx.fillRect(x - s, y - s * 0.3, s * 0.35, s * 0.6);
        ctx.fillRect(x + s * 0.65, y - s * 0.3, s * 0.35, s * 0.6);
        ctx.fillRect(x - s * 0.6, y - s * 0.08, s * 1.2, s * 0.16);
        break;
      }
      case "Shopping Complex":
      case "Commercial Block":
      case "Office Block": {
        ctx.strokeRect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.4);
        ctx.strokeRect(x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8);
        ctx.moveTo(x - s * 0.7, y + s * 0.1);
        ctx.lineTo(x + s * 0.7, y + s * 0.1);
        ctx.stroke();
        break;
      }
      case "Police Station": {
        ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "Fire Station": {
        ctx.moveTo(x, y - s);
        ctx.bezierCurveTo(x + s * 0.7, y - s * 0.2, x + s * 0.4, y + s, x, y + s);
        ctx.bezierCurveTo(x - s * 0.4, y + s, x - s * 0.7, y - s * 0.2, x, y - s);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "Water Tank": {
        ctx.moveTo(x, y - s);
        ctx.bezierCurveTo(x + s, y - s * 0.2, x + s, y + s, x, y + s);
        ctx.bezierCurveTo(x - s, y + s, x - s, y - s * 0.2, x, y - s);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "Electrical Substation": {
        ctx.moveTo(x + s * 0.15, y - s);
        ctx.lineTo(x - s * 0.4, y + s * 0.1);
        ctx.lineTo(x, y + s * 0.1);
        ctx.lineTo(x - s * 0.15, y + s);
        ctx.lineTo(x + s * 0.4, y - s * 0.1);
        ctx.lineTo(x, y - s * 0.1);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "STP":
      case "Sewage Pump":
      case "Solid Waste Collection Point": {
        ctx.arc(x, y, s * 0.65, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.moveTo(x - s * 0.5, y);
        ctx.lineTo(x + s * 0.5, y);
        ctx.moveTo(x, y - s * 0.5);
        ctx.lineTo(x, y + s * 0.5);
        ctx.stroke();
        break;
      }
      case "Security Cabin":
      case "Main Entrance Gate":
      case "Secondary Gate": {
        ctx.fillRect(x - s, y - s, s * 0.35, s * 2);
        ctx.fillRect(x + s * 0.65, y - s, s * 0.35, s * 2);
        ctx.fillRect(x - s * 0.6, y - s * 0.2, s * 1.2, s * 0.4);
        break;
      }
      case "Bus Stop": {
        ctx.strokeRect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.4);
        ctx.fillRect(x - s * 0.35, y - s * 0.35, s * 0.7, s * 0.7);
        break;
      }
      case "Parking": {
        ctx.font = `bold ${Math.round(size * 0.6)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("P", x, y);
        break;
      }
      case "EV Charging Station": {
        ctx.fillRect(x - s * 0.35, y - s * 0.35, s * 0.7, s * 0.7);
        ctx.moveTo(x, y + s * 0.35);
        ctx.lineTo(x, y + s * 0.95);
        ctx.stroke();
        break;
      }
      default: {
        ctx.strokeRect(x - s * 0.75, y - s * 0.45, s * 1.5, s * 0.9);
        ctx.moveTo(x - s * 0.35, y + s * 0.45);
        ctx.lineTo(x - s * 0.35, y - s * 0.75);
        ctx.lineTo(x + s * 0.35, y - s * 0.75);
        ctx.lineTo(x + s * 0.35, y + s * 0.45);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Renders rulers along top/left viewport margins dynamically.
   */
  public drawRulers(): void {
    const ctx = this.ctx;
    const { width, height, zoom, panX, panY } = this.state;

    ctx.save();
    
    // Set ruler metrics styles
    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;

    // Horizontal Ruler Area (top 20px)
    ctx.fillRect(0, 0, width, 20);
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(width, 20);
    ctx.stroke();

    // Vertical Ruler Area (left 20px)
    ctx.fillRect(0, 0, 20, height);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(20, height);
    ctx.stroke();

    ctx.fillStyle = "#475569";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Spacing interval dynamic calculations
    let spacing = 50;
    if (zoom < 0.25) spacing = 500;
    else if (zoom < 0.6) spacing = 200;
    else if (zoom < 1.5) spacing = 100;

    const screenSpacing = spacing * zoom;

    // Horizontal Tick Marks
    const startX = Math.floor(-panX / screenSpacing) * screenSpacing + panX;
    for (let x = startX; x < width; x += screenSpacing) {
      if (x < 20) continue;
      const worldVal = Math.round((x - panX) / zoom);
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, 20);
      ctx.stroke();
      ctx.fillText(`${worldVal}m`, x, 5);
    }

    // Vertical Tick Marks
    const startY = Math.floor(-panY / screenSpacing) * screenSpacing + panY;
    for (let y = startY; y < height; y += screenSpacing) {
      if (y < 20) continue;
      const worldVal = Math.round((y - panY) / zoom);
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(20, y);
      ctx.stroke();

      ctx.save();
      ctx.translate(5, y);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${worldVal}m`, 0, 0);
      ctx.restore();
    }

    // Top-Left Corner Box
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(0, 0, 20, 20);
    ctx.strokeStyle = "#94A3B8";
    ctx.strokeRect(0, 0, 20, 20);

    ctx.restore();
  }

  /**
   * Helper function to safely parse and translate hex colors to rgba.
   */
  private hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace("#", "");
    let r = 200, g = 200, b = 200;
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Helper to draw custom engineering icons for utility point nodes
   */
  private drawUtilityAssetIcon(
    ctx: CanvasRenderingContext2D,
    type: string,
    networkType: string,
    x: number,
    y: number,
    size: number,
    isSelected: boolean
  ): void {
    ctx.save();
    const color = getUtilityColor(networkType || type);
    
    // Draw outer circle/box container
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = isSelected ? "#3B82F6" : color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fill();
    ctx.stroke();

    // Draw inner engineering symbols
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.font = `bold ${Math.round(size * 0.95)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const symbol = type.toLowerCase();
    if (symbol.includes("transformer")) {
      ctx.fillText("⚡", x, y);
    } else if (symbol.includes("pole")) {
      ctx.moveTo(x - size * 0.5, y);
      ctx.lineTo(x + size * 0.5, y);
      ctx.moveTo(x, y - size * 0.5);
      ctx.lineTo(x, y + size * 0.5);
      ctx.stroke();
    } else if (symbol.includes("street light") || symbol.includes("lamp")) {
      ctx.fillText("💡", x, y);
    } else if (symbol.includes("manhole")) {
      ctx.fillText("MH", x, y);
    } else if (symbol.includes("chamber")) {
      ctx.fillText("C", x, y);
    } else if (symbol.includes("valve")) {
      ctx.fillText("V", x, y);
    } else if (symbol.includes("hydrant")) {
      ctx.fillText("🔥", x, y);
    } else if (symbol.includes("pump")) {
      ctx.fillText("P", x, y);
    } else if (symbol.includes("lift")) {
      ctx.fillText("L", x, y);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Helper to render custom scaling labels for utility elements
   */
  private renderUtilityLabel(ctx: CanvasRenderingContext2D, obj: GeometryObject, isSelected: boolean): void {
    ctx.save();
    
    // Scale label dynamically with zoom
    const zoomScale = Math.max(0.6, Math.min(1.4, this.state.zoom));
    ctx.font = `${isSelected ? "bold" : "normal"} ${Math.round(9.5 * zoomScale)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Determine coordinate center
    let labelX = 0;
    let labelY = 0;
    
    if (obj.object_type === "POINT") {
      const pt = obj.geometry_data.coordinates as [number, number];
      const screenPt = this.worldToScreen(pt[0], pt[1]);
      labelX = screenPt.x;
      labelY = screenPt.y - (14 * zoomScale); // Offset above symbol
    } else {
      const pts = obj.geometry_data.coordinates as Array<[number, number]>;
      if (pts.length < 2) {
        ctx.restore();
        return;
      }
      // Put label at the midpoint of the polyline
      const midIdx = Math.floor(pts.length / 2);
      const p1 = pts[midIdx];
      const screenPt = this.worldToScreen(p1[0], p1[1]);
      labelX = screenPt.x;
      labelY = screenPt.y - (12 * zoomScale);
    }

    // Construct label text
    const name = (obj as any).name || obj.properties?.utility_name || "Utility";
    const type = obj.properties?.network_type || obj.properties?.utility_type || "";
    
    let detail = "";
    if (obj.properties?.diameter) {
      detail = `(${obj.properties.diameter})`;
    } else if (obj.properties?.voltage) {
      detail = `(${obj.properties.voltage})`;
    }

    const labelText = `${name} - ${type} ${detail}`.trim();
    const textWidth = ctx.measureText(labelText).width;

    // Draw background pill
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = isSelected ? "#3B82F6" : "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(labelX - textWidth / 2 - 5, labelY - 7 * zoomScale, textWidth + 10, 14 * zoomScale, 3);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = isSelected ? "#1E3A8A" : "#1E293B";
    ctx.fillText(labelText, labelX, labelY);

    ctx.restore();
  }
}
