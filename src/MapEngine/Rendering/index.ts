import { IRenderingInterface } from "../Contracts/index.ts";
import { GeometryLayer, GeometryObject } from "../Contracts/models.ts";

/**
 * Base Abstract Renderer class.
 * All concrete GIS rendering engines (e.g. GoogleMapsRenderer, LeafletRenderer, CanvasOfflineRenderer)
 * will extend this class or implement IRenderingInterface directly.
 */
export class MapRenderer implements IRenderingInterface {
  protected containerId: string | null = null;
  protected layers: GeometryLayer[] = [];
  protected geometries: GeometryObject[] = [];
  protected activeEngineName: string = "AbstractBase";
  protected onSelectCallback: ((id: string) => void) | null = null;

  initialize(containerId: string, options?: Record<string, any>): void {
    this.containerId = containerId;
    console.log(`[MapRenderer] Initializing ${this.activeEngineName} on container #${containerId}`, options);
  }

  setLayers(layers: GeometryLayer[]): void {
    this.layers = layers;
    console.log(`[MapRenderer] Subscribing to layers update:`, layers.map(l => l.layer_name));
    this.render();
  }

  setGeometries(geometries: GeometryObject[]): void {
    this.geometries = geometries;
    console.log(`[MapRenderer] Loading ${geometries.length} vector shapes into scene.`);
    this.render();
  }

  zoomToExtent(boundingBox: [[number, number], [number, number]]): void {
    console.log(`[MapRenderer] Camera viewport adjusted to bounding box:`, boundingBox);
  }

  clear(): void {
    this.geometries = [];
    console.log(`[MapRenderer] Render buffer cleared.`);
    this.render();
  }

  onSelect(callback: (selectedObjectId: string) => void): void {
    this.onSelectCallback = callback;
    console.log(`[MapRenderer] Registered click interaction handler.`);
  }

  destroy(): void {
    console.log(`[MapRenderer] Disposing layout resources, event listeners, and engine context.`);
  }

  /**
   * Abstract rendering loop to be overridden by concrete display drivers.
   */
  protected render(): void {
    console.log(`[MapRenderer] Triggering internal repaint. Active Layers count: ${this.layers.length}, Objects: ${this.geometries.length}`);
  }
}

/**
 * Empty stub implementation for the future Google Maps Map Engine
 */
export class GoogleMapsRenderer extends MapRenderer {
  constructor() {
    super();
    this.activeEngineName = "Google Maps Native API";
  }

  protected override render(): void {
    console.log("[GoogleMapsRenderer] Transforming custom geometries into google.maps.Data or google.maps.Polygon overlays.");
  }
}

/**
 * Empty stub implementation for the future Leaflet Open-Source Engine
 */
export class LeafletRenderer extends MapRenderer {
  constructor() {
    super();
    this.activeEngineName = "Leaflet GIS";
  }

  protected override render(): void {
    console.log("[LeafletRenderer] Loading GeoJSON features into L.geoJSON map layers.");
  }
}
