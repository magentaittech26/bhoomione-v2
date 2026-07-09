import { ILayerEngine } from "../Contracts/index.ts";
import { GeometryLayer } from "../Contracts/models.ts";
import { LayerRepository } from "../Repositories/index.ts";

/**
 * Service implementation of the Layer Engine.
 * Manages layer groups, ordering, styles, and visibility presets.
 */
export class LayerEngine implements ILayerEngine {
  private layerRepo: LayerRepository;

  constructor(layerRepo: LayerRepository) {
    this.layerRepo = layerRepo;
  }

  async createLayer(
    layoutId: string,
    layerName: GeometryLayer['layer_name'],
    displayName: string,
    displayOrder: number,
    styleConfig?: GeometryLayer['style_config'],
    permissions?: GeometryLayer['permissions']
  ): Promise<GeometryLayer> {
    const layerData: Omit<GeometryLayer, 'id' | 'created_at' | 'updated_at'> = {
      layout_id: layoutId,
      layer_name: layerName,
      display_name: displayName,
      is_visible: true,
      is_locked: false,
      display_order: displayOrder,
      style_config: styleConfig || {
        strokeColor: this.getDefaultColorForLayer(layerName),
        fillColor: this.getDefaultColorForLayer(layerName) + "33", // 20% opacity
        strokeWidth: 2,
        opacity: 0.8,
      },
      permissions: permissions || {
        viewRoles: ['ADMIN', 'DEVELOPER', 'CUSTOMER', 'AGENT'],
        editRoles: ['ADMIN', 'DEVELOPER'],
      },
    };

    return await this.layerRepo.insert(layerData);
  }

  async getLayers(layoutId: string): Promise<GeometryLayer[]> {
    const existing = await this.layerRepo.findByLayoutId(layoutId);
    if (existing.length === 0) {
      // Bootstraps default required system layers for a new layout
      const defaultLayers: { name: GeometryLayer['layer_name']; displayName: string; order: number }[] = [
        { name: 'BOUNDARY', displayName: 'Project Boundary', order: 1 },
        { name: 'ROADS', displayName: 'Road Network', order: 2 },
        { name: 'PARK', displayName: 'Parks & Greenery', order: 3 },
        { name: 'CA', displayName: 'Civic Amenities', order: 4 },
        { name: 'AMENITIES', displayName: 'General Amenities', order: 5 },
        { name: 'UTILITIES', displayName: 'Electrical & Water Lines', order: 6 },
        { name: 'PLOTS', displayName: 'Plot Boundaries', order: 7 },
        { name: 'LABELS', displayName: 'Text Labels', order: 8 },
      ];

      const created: GeometryLayer[] = [];
      for (const dl of defaultLayers) {
        const l = await this.createLayer(layoutId, dl.name, dl.displayName, dl.order);
        created.push(l);
      }
      return created;
    }
    // Return sorted by display order
    return existing.sort((a, b) => a.display_order - b.display_order);
  }

  async updateLayer(id: string, updates: Partial<GeometryLayer>): Promise<GeometryLayer> {
    return await this.layerRepo.update(id, updates);
  }

  async deleteLayer(id: string): Promise<boolean> {
    return await this.layerRepo.delete(id);
  }

  async reorderLayers(layoutId: string, orderMap: Record<string, number>): Promise<GeometryLayer[]> {
    const layers = await this.layerRepo.findByLayoutId(layoutId);
    const updatedLayers: GeometryLayer[] = [];
    for (const l of layers) {
      if (orderMap[l.id] !== undefined) {
        const updated = await this.layerRepo.update(l.id, { display_order: orderMap[l.id] });
        updatedLayers.push(updated);
      } else {
        updatedLayers.push(l);
      }
    }
    return updatedLayers.sort((a, b) => a.display_order - b.display_order);
  }

  private getDefaultColorForLayer(layerName: GeometryLayer['layer_name']): string {
    switch (layerName) {
      case 'BOUNDARY': return '#1e293b'; // slate dark
      case 'ROADS': return '#f59e0b'; // amber
      case 'PARK': return '#10b981'; // emerald green
      case 'CA': return '#06b6d4'; // cyan
      case 'AMENITIES': return '#8b5cf6'; // purple
      case 'UTILITIES': return '#ef4444'; // red
      case 'PLOTS': return '#3b82f6'; // blue
      case 'LABELS': return '#64748b'; // slate grey
      default: return '#94a3b8';
    }
  }
}
