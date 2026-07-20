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
    return api.request<MeasurementUnitsResponse>(endpoint, { method: "GET" });
  }

  static async getById(id: string): Promise<MeasurementUnit> {
    const res = await api.request<{ data: MeasurementUnit }>(`/measurement-units/${id}`, { method: "GET" });
    return res.data;
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
