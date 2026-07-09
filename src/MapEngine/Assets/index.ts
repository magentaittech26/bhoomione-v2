import { IAssetManager } from "../Contracts/index.ts";
import { LayoutAsset } from "../Contracts/models.ts";
import { AssetRepository } from "../Repositories/index.ts";

/**
 * Service implementation of Asset Manager.
 * Registers and maintains physical layout files and metadata in the database.
 */
export class AssetManager implements IAssetManager {
  private assetRepo: AssetRepository;

  constructor(assetRepo: AssetRepository) {
    this.assetRepo = assetRepo;
  }

  async uploadAsset(
    layoutId: string,
    assetType: 'PDF' | 'IMAGE' | 'DXF' | 'SVG' | 'GIS',
    file: { name: string; size: number; content: string | Blob; mimeType: string },
    uploadedBy: string
  ): Promise<LayoutAsset> {
    // Stores spatial file references
    const assetData: Omit<LayoutAsset, 'id' | 'created_at' | 'updated_at'> = {
      layout_id: layoutId,
      asset_type: assetType,
      file_name: file.name,
      file_path: `/uploads/layouts/${layoutId}/${file.name}`,
      mime_type: file.mimeType,
      file_size: file.size,
      uploaded_by: uploadedBy,
      metadata: {
        dimensions: assetType === 'IMAGE' ? { width: 1920, height: 1080 } : undefined,
        gis_format: assetType === 'GIS' ? 'GeoJSON' : undefined,
        dxf_layer_count: assetType === 'DXF' ? 12 : undefined,
      },
    };

    return await this.assetRepo.insert(assetData);
  }

  async getAssetsByLayout(layoutId: string): Promise<LayoutAsset[]> {
    return await this.assetRepo.findByLayoutId(layoutId);
  }

  async getAssetDetail(assetId: string): Promise<LayoutAsset | null> {
    return await this.assetRepo.findById(assetId);
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    return await this.assetRepo.delete(assetId);
  }
}
