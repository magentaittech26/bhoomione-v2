import { IVersionEngine } from "../Contracts/index.ts";
import { LayoutVersion } from "../Contracts/models.ts";
import { VersionRepository, LayerRepository, GeometryRepository } from "../Repositories/index.ts";

/**
 * Service implementation of the Version Engine.
 * Manages immutable layout snapshots, approvals, and rollback points.
 */
export class VersionEngine implements IVersionEngine {
  private versionRepo: VersionRepository;
  private layerRepo: LayerRepository;
  private geometryRepo: GeometryRepository;

  constructor(
    versionRepo: VersionRepository,
    layerRepo: LayerRepository,
    geometryRepo: GeometryRepository
  ) {
    this.versionRepo = versionRepo;
    this.layerRepo = layerRepo;
    this.geometryRepo = geometryRepo;
  }

  async createVersionDraft(layoutId: string, userId: string, summary: string): Promise<LayoutVersion> {
    // 1. Gather all current layers and shapes to create a snapshot
    const activeLayers = await this.layerRepo.findByLayoutId(layoutId);
    const activeObjects = await this.geometryRepo.findByLayoutId(layoutId);

    // 2. Resolve version sequence count
    const history = await this.versionRepo.findByLayoutId(layoutId);
    const versionNum = `v${history.length + 1}.0-draft`;

    const newVersion: Omit<LayoutVersion, 'id' | 'created_at'> = {
      layout_id: layoutId,
      version_number: versionNum,
      status: 'DRAFT',
      snapshot_data: {
        layers: activeLayers,
        objects: activeObjects,
      },
      created_by: userId,
      change_summary: summary,
    };

    return await this.versionRepo.insert(newVersion);
  }

  async approveVersionDraft(versionId: string, approverId: string): Promise<LayoutVersion> {
    const version = await this.versionRepo.findById(versionId);
    if (!version) throw new Error("Draft version not found");
    if (version.status !== 'DRAFT') throw new Error("Only draft versions can be approved");

    const cleanNumber = version.version_number.replace("-draft", "");
    
    // Updates status to APPROVED
    const updated = await this.versionRepo.updateStatus(versionId, 'APPROVED', approverId);
    updated.version_number = cleanNumber; // Promoted to release version

    return updated;
  }

  async getVersionsByLayout(layoutId: string): Promise<LayoutVersion[]> {
    return await this.versionRepo.findByLayoutId(layoutId);
  }

  async rollbackToVersion(layoutId: string, versionId: string, userId: string): Promise<LayoutVersion> {
    const targetVersion = await this.versionRepo.findById(versionId);
    if (!targetVersion) throw new Error("Target restore version not found");
    if (targetVersion.status !== 'APPROVED') throw new Error("Can only rollback to approved version snapshots");

    // 1. Mark existing items as inactive/overwritten
    const currentObjects = await this.geometryRepo.findByLayoutId(layoutId);
    for (const obj of currentObjects) {
      await this.geometryRepo.delete(obj.id); // Soft deletes
    }

    // 2. Restore all geometries and layers from snapshot
    const snapshot = targetVersion.snapshot_data;
    
    // In a production SQL repository, we'd insert these records back as new state
    for (const restoredObj of snapshot.objects) {
      await this.geometryRepo.insert({
        layer_id: restoredObj.layer_id,
        layout_id: layoutId,
        object_type: restoredObj.object_type,
        geometry_data: restoredObj.geometry_data,
        properties: {
          ...restoredObj.properties,
          restored_from_version: targetVersion.version_number,
        },
        label_text: restoredObj.label_text,
        is_active: true,
      });
    }

    // Create a new draft indicating the rollback event
    const rollbackDraft = await this.createVersionDraft(
      layoutId,
      userId,
      `Rollback layout state to historical version ${targetVersion.version_number}`
    );

    return rollbackDraft;
  }
}
