import { AssetManager } from "../Assets/index.ts";
import { GeometryEngine } from "../Geometry/index.ts";
import { LayerEngine } from "../Layers/index.ts";
import { VersionEngine } from "../Versioning/index.ts";
import { ValidationEngine } from "../Validation/index.ts";
import { SearchEngine } from "../Search/index.ts";

import {
  AssetRepository,
  LayerRepository,
  GeometryRepository,
  VersionRepository,
  ValidationRepository,
  AuditLogRepository,
  EditingSessionRepository,
} from "../Repositories/index.ts";

/**
 * MapIntelligenceEngine Service Container.
 * Orchestrates and expose all underlying engines, functioning as the Single Source of Truth
 * for map geometry, layers, validation, and historical versions.
 */
export class MapIntelligenceEngine {
  private static instance: MapIntelligenceEngine | null = null;

  // Repositories
  public readonly assetsRepo: AssetRepository;
  public readonly layersRepo: LayerRepository;
  public readonly geometryRepo: GeometryRepository;
  public readonly versionsRepo: VersionRepository;
  public readonly validationRepo: ValidationRepository;
  public readonly auditRepo: AuditLogRepository;
  public readonly sessionsRepo: EditingSessionRepository;

  // Engines
  public readonly assets: AssetManager;
  public readonly geometry: GeometryEngine;
  public readonly layers: LayerEngine;
  public readonly versions: VersionEngine;
  public readonly validation: ValidationEngine;
  public readonly search: SearchEngine;

  constructor() {
    // Instantiate Data Storage Repositories
    this.assetsRepo = new AssetRepository();
    this.layersRepo = new LayerRepository();
    this.geometryRepo = new GeometryRepository();
    this.versionsRepo = new VersionRepository();
    this.validationRepo = new ValidationRepository();
    this.auditRepo = new AuditLogRepository();
    this.sessionsRepo = new EditingSessionRepository();

    // Inject Repositories into Engine services
    this.assets = new AssetManager(this.assetsRepo);
    this.geometry = new GeometryEngine(this.geometryRepo);
    this.layers = new LayerEngine(this.layersRepo);
    this.versions = new VersionEngine(this.versionsRepo, this.layersRepo, this.geometryRepo);
    this.validation = new ValidationEngine(this.validationRepo);
    this.search = new SearchEngine(this.geometryRepo);
  }

  /**
   * Singleton pattern resolver to ensure single runtime container is shared across
   * Projects, Layouts, CRM, Sales, and GIS.
   */
  public static getInstance(): MapIntelligenceEngine {
    if (!MapIntelligenceEngine.instance) {
      MapIntelligenceEngine.instance = new MapIntelligenceEngine();
    }
    return MapIntelligenceEngine.instance;
  }
}

// Export individual classes for direct extensibility or unit testing
export { AssetManager, GeometryEngine, LayerEngine, VersionEngine, ValidationEngine, SearchEngine };
