// ============================================================
// 🥧 Hook — Distribución de Kilos por Measurement (Mercado)
// ============================================================

import { useEffect, useState } from "react";
import api from "../services/api";

// ======================= TYPES ==============================

export interface MeasurementDistributionRow {
  category: string;   // Mercado Interno | Exportación
  kg: number;
  percentage: number;
}

interface HookResult {
  data: MeasurementDistributionRow[] | null;
  loading: boolean;
  error: string | null;
}

// ======================= HOOK ===============================

export function useFieldMeasurementDistribution(
  fieldName: string,
  filters: {
    harvest: string | null;
    species: string | null;
    variety?: string | null;
    startDate?: string;
    endDate?: string;
  }
): HookResult {
  const [data, setData] = useState<MeasurementDistributionRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fieldName) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();

    if (filters.harvest) params.append("harvest", filters.harvest);
    if (filters.species) params.append("species", filters.species);
    if (filters.variety) params.append("variety", filters.variety);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    api
      .get(
        `/analytics/field/${encodeURIComponent(
          fieldName
        )}/measurement-distribution?${params.toString()}`
      )
      .then((res) => {
        setData(res.data?.data ?? []);
      })
      .catch((err) => {
        console.error("❌ useFieldMeasurementDistribution:", err);
        setError(err?.message ?? "Error loading measurement distribution");
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    fieldName,
    filters.harvest,
    filters.species,
    filters.variety,
    filters.startDate,
    filters.endDate,
  ]);

  return { data, loading, error };
}
