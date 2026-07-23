import api from "./api.ts";
import { MeasurementUnit, MeasurementUnitsResponse } from "../types/measurement-unit.ts";

export class MeasurementUnitService {
  static async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
    active_only?: boolean;
    measurement_type?: string;
    sort_by?: string;
    sort_order?: "ASC" | "DESC";
  }): Promise<MeasurementUnitsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          queryParams.append(key, String(val));
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/measurement-units${queryString ? `?${queryString}` : ""}`;
    
    try {
      const res = await api.request<any>(endpoint, { method: "GET" });
      
      let items: any[] = [];
      let total = 0;
      let page = params?.page ?? 1;
      let per_page = params?.per_page ?? 100;
      let last_page = 1;

      if (Array.isArray(res)) {
        items = res;
      } else if (res && typeof res === "object") {
        if (Array.isArray(res.data)) {
          items = res.data;
        } else if (res.data && Array.isArray(res.data.items)) {
          items = res.data.items;
        } else if (res.units && Array.isArray(res.units)) {
          items = res.units;
        } else if (res.rows && Array.isArray(res.rows)) {
          items = res.rows;
        }

        if (res.meta) {
          total = res.meta.total ?? items.length;
          page = res.meta.page ?? page;
          per_page = res.meta.per_page ?? per_page;
          last_page = res.meta.last_page ?? Math.ceil(total / per_page);
        }
      }

      // Ensure every unit is valid and has expected structure
      const normalizedUnits: MeasurementUnit[] = items
        .map((u: any) => {
          if (!u || typeof u !== "object") return null;
          return {
            id: String(u.id || u.uuid || ""),
            uuid: String(u.uuid || u.id || ""),
            code: String(u.code || ""),
            name: String(u.name || u.display_name || ""),
            display_name: String(u.display_name || u.name || ""),
            symbol: String(u.symbol || u.short_code || u.code || ""),
            short_code: String(u.short_code || u.symbol || u.code || ""),
            measurement_type: String(u.measurement_type || ""),
            conversion_factor: Number(u.conversion_factor ?? u.conversion_to_sqft ?? 1),
            conversion_to_sqft: Number(u.conversion_to_sqft ?? u.conversion_factor ?? 1),
            precision: Number(u.precision ?? u.decimal_places ?? 2),
            decimal_places: Number(u.decimal_places ?? u.precision ?? 2),
            is_active: Boolean(u.is_active ?? true),
            is_default: Boolean(u.is_default ?? false),
            is_system: Boolean(u.is_system ?? false),
          };
        })
        .filter(Boolean) as MeasurementUnit[];

      return {
        data: normalizedUnits,
        meta: {
          total: total || normalizedUnits.length,
          page,
          per_page,
          last_page: last_page || Math.ceil((total || normalizedUnits.length) / per_page),
        },
      };
    } catch (err: any) {
      console.error("MeasurementUnitService.getAll normalizer error caught:", err);
      throw err;
    }
  }

  static async getLookup(): Promise<{ data: MeasurementUnit[] }> {
    try {
      const res = await api.request<any>("/measurement-units/lookup", { method: "GET" });
      let items: any[] = [];
      if (res && Array.isArray(res.data)) {
        items = res.data;
      } else if (Array.isArray(res)) {
        items = res;
      }

      const normalizedUnits: MeasurementUnit[] = items
        .map((u: any) => {
          if (!u || typeof u !== "object") return null;
          return {
            id: String(u.id || u.uuid || ""),
            uuid: String(u.uuid || u.id || ""),
            code: String(u.code || ""),
            name: String(u.name || u.display_name || ""),
            display_name: String(u.display_name || u.name || ""),
            symbol: String(u.symbol || u.short_code || u.code || ""),
            short_code: String(u.short_code || u.symbol || u.code || ""),
            measurement_type: String(u.measurement_type || ""),
            conversion_factor: Number(u.conversion_factor ?? u.conversion_to_sqft ?? 1),
            conversion_to_sqft: Number(u.conversion_to_sqft ?? u.conversion_factor ?? 1),
            precision: Number(u.precision ?? u.decimal_places ?? 2),
            decimal_places: Number(u.decimal_places ?? u.precision ?? 2),
            is_active: Boolean(u.is_active ?? true),
            is_default: Boolean(u.is_default ?? false),
            is_system: Boolean(u.is_system ?? false),
          };
        })
        .filter(Boolean) as MeasurementUnit[];

      return { data: normalizedUnits };
    } catch (err: any) {
      console.error("MeasurementUnitService.getLookup error caught:", err);
      throw err;
    }
  }

  // TENANT SPECIFIC API METHODS
  static async getTenantUnits(params?: any): Promise<MeasurementUnit[]> {
    try {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      const res = await api.request<any>(`/tenant/measurement-units${query}`, { method: "GET" });
      const items = res?.data || (Array.isArray(res) ? res : []);
      return items.map((u: any) => ({
        id: String(u.id || u.uuid || ""),
        uuid: String(u.uuid || u.id || ""),
        code: String(u.code || ""),
        name: String(u.name || u.display_name || ""),
        display_name: String(u.display_name || u.custom_label || u.name || ""),
        symbol: String(u.symbol || u.custom_symbol || u.short_code || u.code || ""),
        short_code: String(u.short_code || u.symbol || u.code || ""),
        measurement_type: String(u.measurement_type || "Area"),
        conversion_factor: Number(u.conversion_factor ?? u.conversion_to_sqft ?? 1),
        conversion_to_sqft: Number(u.conversion_to_sqft ?? u.conversion_factor ?? 1),
        precision: Number(u.precision ?? u.decimal_places ?? 2),
        decimal_places: Number(u.decimal_places ?? u.precision ?? 2),
        is_active: Boolean(u.is_active ?? true),
        is_enabled: Boolean(u.is_enabled ?? true),
        is_default: Boolean(u.is_default ?? false),
        is_system: Boolean(u.is_system ?? false),
        custom_label: u.custom_label || null,
        custom_symbol: u.custom_symbol || null,
      }));
    } catch (err: any) {
      console.error("Failed to fetch tenant measurement units:", err);
      throw err;
    }
  }

  static async updateTenantSetting(id: string, settings: {
    is_enabled?: boolean;
    display_precision?: number;
    decimal_places_override?: number;
    display_order?: number;
    custom_label?: string;
    custom_symbol?: string;
  }): Promise<any> {
    return await api.request(`/tenant/measurement-units/${id}/setting`, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  static async setTenantDefault(id: string): Promise<any> {
    return await api.request(`/tenant/measurement-units/${id}/set-default`, {
      method: "POST",
    });
  }

  static async createTenantCustom(data: Partial<MeasurementUnit>): Promise<any> {
    return await api.request(`/tenant/measurement-units/custom`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PLATFORM MASTER API METHODS
  static async getPlatformUnits(params?: any): Promise<MeasurementUnitsResponse> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await api.request<any>(`/platform/measurement-units${query}`, { method: "GET" });
    const items = res?.data || [];
    return {
      data: items,
      meta: res?.meta || { total: items.length, page: 1, per_page: 50, last_page: 1 }
    };
  }

  static async createPlatformUnit(data: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    const res = await api.request<{ data: MeasurementUnit }>("/platform/measurement-units", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  static async updatePlatformUnit(id: string, data: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    const res = await api.request<{ data: MeasurementUnit }>(`/platform/measurement-units/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  static async togglePlatformUnit(id: string): Promise<MeasurementUnit> {
    const res = await api.request<{ data: MeasurementUnit }>(`/platform/measurement-units/${id}/toggle`, {
      method: "PATCH",
    });
    return res.data;
  }

  static async deletePlatformUnit(id: string): Promise<void> {
    await api.request<void>(`/platform/measurement-units/${id}`, { method: "DELETE" });
  }

  static async create(data: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    const res = await api.request<{ data: MeasurementUnit }>("/measurement-units", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  static async update(id: string, data: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    const res = await api.request<{ data: MeasurementUnit }>(`/measurement-units/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  static async delete(id: string): Promise<void> {
    await api.request<void>(`/measurement-units/${id}`, { method: "DELETE" });
  }
}
export default MeasurementUnitService;
