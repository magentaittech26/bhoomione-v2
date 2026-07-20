import { useState, useEffect, useCallback } from "react";
import { MeasurementUnit } from "../types/measurement-unit.ts";
import { MeasurementUnitService } from "../lib/MeasurementUnitService.ts";

// Cache variables outside hook scope to share state & avoid double fetching
let cachedUnits: MeasurementUnit[] | null = null;
let isFetchingPromise: Promise<MeasurementUnit[]> | null = null;

export function useMeasurementUnits(options?: { activeOnly?: boolean; refresh?: boolean }) {
  const [units, setUnits] = useState<MeasurementUnit[]>(Array.isArray(cachedUnits) ? cachedUnits : []);
  const [loading, setLoading] = useState<boolean>(!cachedUnits);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async (forceRefresh = false) => {
    if (cachedUnits && !forceRefresh) {
      setUnits(cachedUnits);
      setLoading(false);
      return;
    }

    if (isFetchingPromise && !forceRefresh) {
      try {
        const result = await isFetchingPromise;
        setUnits(Array.isArray(result) ? result : []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch units");
        setUnits([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Create the promise for idempotent caching
    isFetchingPromise = (async () => {
      try {
        const response = await MeasurementUnitService.getAll({ active_only: true });
        const data = response && Array.isArray(response.data) ? response.data : [];
        cachedUnits = data;
        return data;
      } catch (err: any) {
        cachedUnits = [];
        throw err;
      } finally {
        isFetchingPromise = null;
      }
    })();

    try {
      const data = await isFetchingPromise;
      setUnits(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load measurement units");
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits(options?.refresh);
  }, [fetchUnits, options?.refresh]);

  const activeUnits = (units || []).filter((u) => u && u.is_active);

  // Dynamic select lookup helper: retrieve unit details by record ID
  const getUnitById = useCallback((id: string): MeasurementUnit | undefined => {
    return (units || []).find((u) => u && u.id === id);
  }, [units]);

  // Format label helper
  const getUnitLabel = useCallback((id: string): string => {
    const u = getUnitById(id);
    if (!u) return "";
    return `${u.name} (${u.symbol || u.code})`;
  }, [getUnitById]);

  // Convert area from one unit to another
  const convertArea = useCallback((value: number, fromUnitId: string, toUnitId: string): number => {
    const fromUnit = getUnitById(fromUnitId);
    const toUnit = getUnitById(toUnitId);
    if (!fromUnit || !toUnit || value === undefined || isNaN(value)) return value;

    // Convert from fromUnit to SQFT first, then to toUnit
    const sqftVal = value * Number(fromUnit.conversion_to_sqft || fromUnit.conversion_factor || 1);
    const result = sqftVal / Number(toUnit.conversion_to_sqft || toUnit.conversion_factor || 1);
    
    // Round to precision/decimal places
    const precision = toUnit.decimal_places ?? toUnit.precision ?? 2;
    return Number(result.toFixed(precision));
  }, [getUnitById]);

  // Multi-tier preference lookup: User Override -> Project Default -> Tenant Default -> System Default
  const resolveDefaultUnitId = useCallback((context?: {
    userOverrideId?: string | null;
    projectDefaultId?: string | null;
    tenantDefaultId?: string | null;
  }): string => {
    const safeUnits = units || [];
    if (context?.userOverrideId) return context.userOverrideId;
    if (context?.projectDefaultId) return context.projectDefaultId;
    if (context?.tenantDefaultId) return context.tenantDefaultId;

    // System Default is SQFT or first active unit
    const systemDefault = safeUnits.find((u) => u && u.is_default && u.is_active) || safeUnits.find((u) => u && u.is_active);
    return systemDefault?.id || "";
  }, [units]);

  return {
    units: units || [],
    activeUnits: activeUnits || [],
    loading,
    error,
    refresh: () => fetchUnits(true),
    getUnitById,
    getUnitLabel,
    convertArea,
    resolveDefaultUnitId,
  };
}
export default useMeasurementUnits;
