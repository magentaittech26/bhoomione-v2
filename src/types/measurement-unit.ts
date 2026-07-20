export interface MeasurementUnit {
  id: string;
  uuid?: string;
  code: string;
  name: string;
  display_name?: string;
  symbol?: string;
  short_code?: string;
  measurement_type?: string;
  conversion_factor: number;
  conversion_to_sqft?: number;
  base_unit?: string;
  precision?: number;
  decimal_places?: number;
  display_order?: number;
  is_metric?: boolean;
  is_default?: boolean;
  is_system?: boolean;
  is_active: boolean;
  country_code?: string | null;
  state_code?: string | null;
  tenant_override_allowed?: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MeasurementUnitsResponse {
  data: MeasurementUnit[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
  };
}
