/**
 * Map Provider Abstraction Layer for BhoomiOne
 * Provides interface definitions, adaptive adapter patterns, and configuration schemas
 * to support multiple mapping backends (Google Maps, MapLibre, Leaflet/OSM, MapTiler)
 * without vendor lock-in.
 */

export type MapProviderType = "google" | "maplibre" | "openstreetmap" | "maptiler";

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapViewport {
  center: MapCoordinates;
  zoom: number;
  bounds?: {
    northEast: MapCoordinates;
    southWest: MapCoordinates;
  };
}

export interface MapLayerConfig {
  id: string;
  type: "vector" | "raster" | "geojson";
  url?: string;
  visible: boolean;
  opacity: number;
  style?: Record<string, any>;
}

export interface MapProviderConfig {
  provider: MapProviderType;
  apiKey?: string;
  styleUrl?: string;
  theme?: "light" | "dark" | "satellite" | "terrain";
  containerId: string;
  initialViewport: MapViewport;
}

/**
 * Common Map Interface all adapters must implement
 */
export interface IBhoomiMapInstance {
  initialize(config: MapProviderConfig): Promise<void>;
  setCenter(coords: MapCoordinates): void;
  setZoom(zoom: number): void;
  fitBounds(northEast: MapCoordinates, southWest: MapCoordinates): void;
  addLayer(config: MapLayerConfig, data?: any): void;
  removeLayer(layerId: string): void;
  updateLayerVisibility(layerId: string, visible: boolean): void;
  destroy(): void;
}

/**
 * 1. Google Maps Adapter Implementation Placeholder
 */
export class GoogleMapsAdapter implements IBhoomiMapInstance {
  private mapInstance: any = null;

  async initialize(config: MapProviderConfig): Promise<void> {
    console.log(`[GoogleMapsAdapter] Initializing Google Maps inside container: ${config.containerId}`);
    // Future implementation:
    // const { Loader } = await import("@googlemaps/js-api-loader");
    // const loader = new Loader({ apiKey: config.apiKey || "", version: "weekly" });
    // const google = await loader.load();
    // this.mapInstance = new google.maps.Map(document.getElementById(config.containerId), {
    //   center: config.initialViewport.center,
    //   zoom: config.initialViewport.zoom,
    //   mapTypeId: config.theme === "satellite" ? "satellite" : "roadmap"
    // });
  }

  setCenter(coords: MapCoordinates): void {
    if (this.mapInstance) {
      this.mapInstance.setCenter(coords);
    } else {
      console.log(`[GoogleMapsAdapter] setCenter: `, coords);
    }
  }

  setZoom(zoom: number): void {
    if (this.mapInstance) {
      this.mapInstance.setZoom(zoom);
    } else {
      console.log(`[GoogleMapsAdapter] setZoom: ${zoom}`);
    }
  }

  fitBounds(northEast: MapCoordinates, southWest: MapCoordinates): void {
    console.log(`[GoogleMapsAdapter] fitBounds to NE:`, northEast, `SW:`, southWest);
  }

  addLayer(config: MapLayerConfig, data?: any): void {
    console.log(`[GoogleMapsAdapter] Adding layer: ${config.id}`, config, data);
  }

  removeLayer(layerId: string): void {
    console.log(`[GoogleMapsAdapter] Removing layer: ${layerId}`);
  }

  updateLayerVisibility(layerId: string, visible: boolean): void {
    console.log(`[GoogleMapsAdapter] Updating layer ${layerId} visibility: ${visible}`);
  }

  destroy(): void {
    console.log(`[GoogleMapsAdapter] Destroying map instance`);
    this.mapInstance = null;
  }
}

/**
 * 2. MapLibre GL Adapter Implementation Placeholder
 */
export class MapLibreAdapter implements IBhoomiMapInstance {
  private mapInstance: any = null;

  async initialize(config: MapProviderConfig): Promise<void> {
    console.log(`[MapLibreAdapter] Initializing MapLibre GL inside container: ${config.containerId}`);
    // Future implementation:
    // const maplibregl = await import("maplibre-gl");
    // this.mapInstance = new maplibregl.Map({
    //   container: config.containerId,
    //   style: config.styleUrl || "https://demotiles.maplibre.org/style.json",
    //   center: [config.initialViewport.center.lng, config.initialViewport.center.lat],
    //   zoom: config.initialViewport.zoom
    // });
  }

  setCenter(coords: MapCoordinates): void {
    if (this.mapInstance) {
      this.mapInstance.setCenter([coords.lng, coords.lat]);
    } else {
      console.log(`[MapLibreAdapter] setCenter: `, coords);
    }
  }

  setZoom(zoom: number): void {
    if (this.mapInstance) {
      this.mapInstance.setZoom(zoom);
    } else {
      console.log(`[MapLibreAdapter] setZoom: ${zoom}`);
    }
  }

  fitBounds(northEast: MapCoordinates, southWest: MapCoordinates): void {
    console.log(`[MapLibreAdapter] fitBounds to NE:`, northEast, `SW:`, southWest);
  }

  addLayer(config: MapLayerConfig, data?: any): void {
    console.log(`[MapLibreAdapter] Adding layer: ${config.id}`, config, data);
  }

  removeLayer(layerId: string): void {
    console.log(`[MapLibreAdapter] Removing layer: ${layerId}`);
  }

  updateLayerVisibility(layerId: string, visible: boolean): void {
    console.log(`[MapLibreAdapter] Updating layer ${layerId} visibility: ${visible}`);
  }

  destroy(): void {
    console.log(`[MapLibreAdapter] Destroying map instance`);
    this.mapInstance = null;
  }
}

/**
 * 3. OpenStreetMap/Leaflet Adapter Implementation Placeholder
 */
export class OpenStreetMapAdapter implements IBhoomiMapInstance {
  private mapInstance: any = null;

  async initialize(config: MapProviderConfig): Promise<void> {
    console.log(`[OpenStreetMapAdapter] Initializing Leaflet/OSM inside container: ${config.containerId}`);
    // Future implementation:
    // const L = await import("leaflet");
    // this.mapInstance = L.map(config.containerId).setView(
    //   [config.initialViewport.center.lat, config.initialViewport.center.lng],
    //   config.initialViewport.zoom
    // );
    // L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //   maxZoom: 19,
    //   attribution: "© OpenStreetMap"
    // }).addTo(this.mapInstance);
  }

  setCenter(coords: MapCoordinates): void {
    if (this.mapInstance) {
      this.mapInstance.setView([coords.lat, coords.lng]);
    } else {
      console.log(`[OpenStreetMapAdapter] setCenter: `, coords);
    }
  }

  setZoom(zoom: number): void {
    if (this.mapInstance) {
      this.mapInstance.setZoom(zoom);
    } else {
      console.log(`[OpenStreetMapAdapter] setZoom: ${zoom}`);
    }
  }

  fitBounds(northEast: MapCoordinates, southWest: MapCoordinates): void {
    console.log(`[OpenStreetMapAdapter] fitBounds to NE:`, northEast, `SW:`, southWest);
  }

  addLayer(config: MapLayerConfig, data?: any): void {
    console.log(`[OpenStreetMapAdapter] Adding layer: ${config.id}`, config, data);
  }

  removeLayer(layerId: string): void {
    console.log(`[OpenStreetMapAdapter] Removing layer: ${layerId}`);
  }

  updateLayerVisibility(layerId: string, visible: boolean): void {
    console.log(`[OpenStreetMapAdapter] Updating layer ${layerId} visibility: ${visible}`);
  }

  destroy(): void {
    console.log(`[OpenStreetMapAdapter] Destroying map instance`);
    this.mapInstance = null;
  }
}

/**
 * 4. MapTiler Adapter Implementation Placeholder
 */
export class MapTilerAdapter implements IBhoomiMapInstance {
  private mapInstance: any = null;

  async initialize(config: MapProviderConfig): Promise<void> {
    console.log(`[MapTilerAdapter] Initializing MapTiler SDK inside container: ${config.containerId}`);
    // Future implementation:
    // const maptiler = await import("@maptiler/sdk");
    // maptiler.config.apiKey = config.apiKey || "";
    // this.mapInstance = new maptiler.Map({
    //   container: config.containerId,
    //   style: config.styleUrl || maptiler.MapStyle.STREETS,
    //   center: [config.initialViewport.center.lng, config.initialViewport.center.lat],
    //   zoom: config.initialViewport.zoom
    // });
  }

  setCenter(coords: MapCoordinates): void {
    if (this.mapInstance) {
      this.mapInstance.setCenter([coords.lng, coords.lat]);
    } else {
      console.log(`[MapTilerAdapter] setCenter: `, coords);
    }
  }

  setZoom(zoom: number): void {
    if (this.mapInstance) {
      this.mapInstance.setZoom(zoom);
    } else {
      console.log(`[MapTilerAdapter] setZoom: ${zoom}`);
    }
  }

  fitBounds(northEast: MapCoordinates, southWest: MapCoordinates): void {
    console.log(`[MapTilerAdapter] fitBounds to NE:`, northEast, `SW:`, southWest);
  }

  addLayer(config: MapLayerConfig, data?: any): void {
    console.log(`[MapTilerAdapter] Adding layer: ${config.id}`, config, data);
  }

  removeLayer(layerId: string): void {
    console.log(`[MapTilerAdapter] Removing layer: ${layerId}`);
  }

  updateLayerVisibility(layerId: string, visible: boolean): void {
    console.log(`[MapTilerAdapter] Updating layer ${layerId} visibility: ${visible}`);
  }

  destroy(): void {
    console.log(`[MapTilerAdapter] Destroying map instance`);
    this.mapInstance = null;
  }
}

/**
 * Map Factory class that produces instances of unified IBhoomiMapInstance
 */
export class BhoomiMapFactory {
  static createAdapter(provider: MapProviderType): IBhoomiMapInstance {
    switch (provider) {
      case "google":
        return new GoogleMapsAdapter();
      case "maplibre":
        return new MapLibreAdapter();
      case "openstreetmap":
        return new OpenStreetMapAdapter();
      case "maptiler":
        return new MapTilerAdapter();
      default:
        throw new Error(`Unsupported map provider requested: ${provider}`);
    }
  }
}
