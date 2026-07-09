import {
  LayoutAsset,
  GeometryLayer,
  GeometryObject,
  LayoutVersion,
  ValidationLog,
  GeometryAuditLog,
  EditingSession
} from "../Contracts/models.ts";

/**
 * Repository interface for layout_assets table.
 */
export class AssetRepository {
  private static mockDb: LayoutAsset[] = [];

  async insert(asset: Omit<LayoutAsset, 'id' | 'created_at' | 'updated_at'>): Promise<LayoutAsset> {
    const newAsset: LayoutAsset = {
      ...asset,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      created_at: new Date(),
      updated_at: new Date(),
    };
    AssetRepository.mockDb.push(newAsset);
    return newAsset;
  }

  async findById(id: string): Promise<LayoutAsset | null> {
    return AssetRepository.mockDb.find(a => a.id === id) || null;
  }

  async findByLayoutId(layoutId: string): Promise<LayoutAsset[]> {
    return AssetRepository.mockDb.filter(a => a.layout_id === layoutId);
  }

  async delete(id: string): Promise<boolean> {
    const idx = AssetRepository.mockDb.findIndex(a => a.id === id);
    if (idx !== -1) {
      AssetRepository.mockDb.splice(idx, 1);
      return true;
    }
    return false;
  }
}

/**
 * Repository interface for geometry_layers table.
 */
export class LayerRepository {
  private static mockDb: GeometryLayer[] = [];

  async insert(layer: Omit<GeometryLayer, 'id' | 'created_at' | 'updated_at'>): Promise<GeometryLayer> {
    const newLayer: GeometryLayer = {
      ...layer,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      created_at: new Date(),
      updated_at: new Date(),
    };
    LayerRepository.mockDb.push(newLayer);
    return newLayer;
  }

  async findById(id: string): Promise<GeometryLayer | null> {
    return LayerRepository.mockDb.find(l => l.id === id) || null;
  }

  async findByLayoutId(layoutId: string): Promise<GeometryLayer[]> {
    return LayerRepository.mockDb.filter(l => l.layout_id === layoutId);
  }

  async update(id: string, updates: Partial<GeometryLayer>): Promise<GeometryLayer> {
    const idx = LayerRepository.mockDb.findIndex(l => l.id === id);
    if (idx === -1) throw new Error("Layer not found");
    const updated = {
      ...LayerRepository.mockDb[idx],
      ...updates,
      updated_at: new Date(),
    };
    LayerRepository.mockDb[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const idx = LayerRepository.mockDb.findIndex(l => l.id === id);
    if (idx !== -1) {
      LayerRepository.mockDb.splice(idx, 1);
      return true;
    }
    return false;
  }
}

/**
 * Repository interface for geometry_objects table.
 */
export class GeometryRepository {
  private static mockDb: GeometryObject[] = [];

  async insert(geometry: Omit<GeometryObject, 'id' | 'created_at' | 'updated_at'>): Promise<GeometryObject> {
    const newGeometry: GeometryObject = {
      ...geometry,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      created_at: new Date(),
      updated_at: new Date(),
    };
    GeometryRepository.mockDb.push(newGeometry);
    return newGeometry;
  }

  async findById(id: string): Promise<GeometryObject | null> {
    return GeometryRepository.mockDb.find(g => g.id === id) || null;
  }

  async findByLayerId(layerId: string): Promise<GeometryObject[]> {
    return GeometryRepository.mockDb.filter(g => g.layer_id === layerId && g.is_active);
  }

  async findByLayoutId(layoutId: string): Promise<GeometryObject[]> {
    return GeometryRepository.mockDb.filter(g => g.layout_id === layoutId && g.is_active);
  }

  async update(id: string, updates: Partial<GeometryObject>): Promise<GeometryObject> {
    const idx = GeometryRepository.mockDb.findIndex(g => g.id === id);
    if (idx === -1) throw new Error("Geometry not found");
    const updated = {
      ...GeometryRepository.mockDb[idx],
      ...updates,
      updated_at: new Date(),
    };
    GeometryRepository.mockDb[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const idx = GeometryRepository.mockDb.findIndex(g => g.id === id);
    if (idx !== -1) {
      GeometryRepository.mockDb[idx].is_active = false; // Soft delete to support versioning & audit logs
      return true;
    }
    return false;
  }
}

/**
 * Repository interface for layout_versions table.
 */
export class VersionRepository {
  private static mockDb: LayoutVersion[] = [];

  async insert(version: Omit<LayoutVersion, 'id' | 'created_at'>): Promise<LayoutVersion> {
    const newVersion: LayoutVersion = {
      ...version,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      created_at: new Date(),
    };
    VersionRepository.mockDb.push(newVersion);
    return newVersion;
  }

  async findById(id: string): Promise<LayoutVersion | null> {
    return VersionRepository.mockDb.find(v => v.id === id) || null;
  }

  async findByLayoutId(layoutId: string): Promise<LayoutVersion[]> {
    return VersionRepository.mockDb.filter(v => v.layout_id === layoutId);
  }

  async updateStatus(id: string, status: LayoutVersion['status'], approvedBy?: string): Promise<LayoutVersion> {
    const idx = VersionRepository.mockDb.findIndex(v => v.id === id);
    if (idx === -1) throw new Error("Version not found");
    const updated = {
      ...VersionRepository.mockDb[idx],
      status,
      approved_by: approvedBy,
      approved_at: approvedBy ? new Date() : undefined,
    };
    VersionRepository.mockDb[idx] = updated;
    return updated;
  }
}

/**
 * Repository interface for validation_logs table.
 */
export class ValidationRepository {
  private static mockDb: ValidationLog[] = [];

  async insert(log: Omit<ValidationLog, 'id' | 'executed_at'>): Promise<ValidationLog> {
    const newLog: ValidationLog = {
      ...log,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      executed_at: new Date(),
    };
    ValidationRepository.mockDb.push(newLog);
    return newLog;
  }

  async findByLayoutId(layoutId: string): Promise<ValidationLog[]> {
    return ValidationRepository.mockDb.filter(v => v.layout_id === layoutId);
  }
}

/**
 * Repository interface for geometry_audit_logs table.
 */
export class AuditLogRepository {
  private static mockDb: GeometryAuditLog[] = [];

  async insert(log: Omit<GeometryAuditLog, 'id' | 'performed_at'>): Promise<GeometryAuditLog> {
    const newLog: GeometryAuditLog = {
      ...log,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      performed_at: new Date(),
    };
    AuditLogRepository.mockDb.push(newLog);
    return newLog;
  }

  async findByLayoutId(layoutId: string): Promise<GeometryAuditLog[]> {
    return AuditLogRepository.mockDb.filter(a => a.layout_id === layoutId);
  }
}

/**
 * Repository interface for editing_sessions table.
 */
export class EditingSessionRepository {
  private static mockDb: EditingSession[] = [];

  async insert(session: Omit<EditingSession, 'id' | 'started_at' | 'last_heartbeat'>): Promise<EditingSession> {
    const newSession: EditingSession = {
      ...session,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      started_at: new Date(),
      last_heartbeat: new Date(),
    };
    EditingSessionRepository.mockDb.push(newSession);
    return newSession;
  }

  async findActiveByLayoutId(layoutId: string): Promise<EditingSession[]> {
    return EditingSessionRepository.mockDb.filter(s => s.layout_id === layoutId && s.status === 'ACTIVE');
  }

  async updateStatus(id: string, status: EditingSession['status']): Promise<EditingSession> {
    const idx = EditingSessionRepository.mockDb.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Session not found");
    const updated = {
      ...EditingSessionRepository.mockDb[idx],
      status,
      last_heartbeat: new Date(),
    };
    EditingSessionRepository.mockDb[idx] = updated;
    return updated;
  }
}
