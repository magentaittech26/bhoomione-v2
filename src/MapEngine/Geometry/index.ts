import { IGeometryEngine } from "../Contracts/index.ts";
import { GeometryObject } from "../Contracts/models.ts";
import { GeometryRepository } from "../Repositories/index.ts";

/**
 * Service implementation of the Geometry Engine.
 * Responsible for vector data storage and integrity (Polygons, Polylines, Points).
 */
export class GeometryEngine implements IGeometryEngine {
  private geometryRepo: GeometryRepository;

  constructor(geometryRepo: GeometryRepository) {
    this.geometryRepo = geometryRepo;
  }

  async createGeometry(
    layerId: string,
    objectType: 'POLYGON' | 'POLYLINE' | 'POINT' | 'BOUNDARY' | 'LABEL',
    geometryData: GeometryObject['geometry_data'],
    properties: GeometryObject['properties'],
    labelText?: string
  ): Promise<GeometryObject> {
    const geoObject: Omit<GeometryObject, 'id' | 'created_at' | 'updated_at'> = {
      layer_id: layerId,
      layout_id: properties.layout_id || '',
      object_type: objectType,
      geometry_data: geometryData,
      properties,
      label_text: labelText,
      is_active: true,
    };

    return await this.geometryRepo.insert(geoObject);
  }

  async updateGeometry(id: string, updates: Partial<GeometryObject>): Promise<GeometryObject> {
    return await this.geometryRepo.update(id, updates);
  }

  async deleteGeometry(id: string): Promise<boolean> {
    return await this.geometryRepo.delete(id);
  }

  async getGeometryByLayer(layerId: string): Promise<GeometryObject[]> {
    return await this.geometryRepo.findByLayerId(layerId);
  }

  async getGeometryDetail(id: string): Promise<GeometryObject | null> {
    return await this.geometryRepo.findById(id);
  }

  async bulkSaveGeometries(geometries: Omit<GeometryObject, 'id' | 'created_at' | 'updated_at'>[]): Promise<GeometryObject[]> {
    const results: GeometryObject[] = [];
    for (const g of geometries) {
      const inserted = await this.geometryRepo.insert(g);
      results.push(inserted);
    }
    return results;
  }
}
