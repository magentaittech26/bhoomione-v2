import { ISearchEngine } from "../Contracts/index.ts";
import { GeometryObject } from "../Contracts/models.ts";
import { GeometryRepository } from "../Repositories/index.ts";

/**
 * Service implementation of the Search Engine.
 * Implements architectural interfaces and stub search routers for layout spatial components.
 */
export class SearchEngine implements ISearchEngine {
  private geometryRepo: GeometryRepository;

  constructor(geometryRepo: GeometryRepository) {
    this.geometryRepo = geometryRepo;
  }

  async searchSpatial(
    layoutId: string,
    query: string,
    filters?: {
      layerName?: 'BOUNDARY' | 'PLOTS' | 'ROADS' | 'PARK' | 'CA' | 'AMENITIES' | 'UTILITIES' | 'LABELS';
      objectType?: 'POLYGON' | 'POLYLINE' | 'POINT' | 'BOUNDARY' | 'LABEL';
    }
  ): Promise<GeometryObject[]> {
    console.log(`[SearchEngine] Executing spatial index query for "${query}" on layout: ${layoutId}`, filters);

    // 1. Retrieve active layout vectors from database
    const geometries = await this.geometryRepo.findByLayoutId(layoutId);

    // 2. Perform text similarity matching on labels and parameters
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return geometries;

    return geometries.filter(g => {
      // Filter by object type if specified
      if (filters?.objectType && g.object_type !== filters.objectType) {
        return false;
      }

      // Check plot number search, e.g. "P-101"
      const plotNum = String(g.properties.plot_number || "").toLowerCase();
      if (plotNum.includes(cleanQuery)) return true;

      // Check label text search, e.g. "Main Road", "Community Hall"
      const labelText = String(g.label_text || "").toLowerCase();
      if (labelText.includes(cleanQuery)) return true;

      // Check amenity type, e.g. "clubhouse"
      const amenity = String(g.properties.amenity_type || "").toLowerCase();
      if (amenity.includes(cleanQuery)) return true;

      // Fallback search in general properties
      const propsString = JSON.stringify(g.properties).toLowerCase();
      return propsString.includes(cleanQuery);
    });
  }
}
