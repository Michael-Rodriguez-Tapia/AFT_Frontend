// ============================================================
// 🪝 useHarvestSummary.ts
// CUSTOM HOOK PARA INFORME DE COSECHAS - CON DEBUG
// ============================================================

import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../services/api";

export interface HarvestSummaryRow {
  variety: string | null;
  kg_totales: number;
  superficie_ha: number;
  kg_por_ha: number;
  costo_total_kg: number | null;
  pago_kg: number | null;
  kg_por_cosechero: number;
  pct_mercado_interno: number;
  pct_exportacion_campo: number;
  pct_exportacion_procesos: number;
  pct_exportacion_final: number;
}

export interface HarvestTimelineRow {
  fecha: string;
  kg_exportacion: number;
  kg_mercado_interno: number;
  cosecheros: number | null;
}

export interface HarvestPaymentsTimelineRow {
  fecha: string;
  kg_por_cosechero: number;
  pago_kg: number | null;
}

interface Filters {
  specie?: string | null;
  variety?: string | null;
  startDate?: string;
  endDate?: string;
  harvestName?: string | null;
}

export function useHarvestSummary(fieldId: number | null, filters?: Filters) {
  const { getAccessTokenSilently } = useAuth0();
  
  const [summary, setSummary] = useState<HarvestSummaryRow[]>([]);
  const [timeline, setTimeline] = useState<HarvestTimelineRow[]>([]);
  const [payments, setPayments] = useState<HarvestPaymentsTimelineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fieldId) {
      setSummary([]);
      setTimeline([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const token = await getAccessTokenSilently();
        const params: any = { fieldId };

        if (filters?.specie) params.specie = filters.specie;
        if (filters?.variety) params.variety = filters.variety;
        if (filters?.startDate) params.startDate = filters.startDate;
        if (filters?.endDate) params.endDate = filters.endDate;
        if (filters?.harvestName) params.harvestName = filters.harvestName;

        console.log("🔍 Loading harvest summary with params:", params);

        const headers = { Authorization: `Bearer ${token}` };

        const [s, t, p] = await Promise.all([
          api.get("/analytics/harvests/summary", { params, headers }),
          api.get("/analytics/harvests/summary/timeline", { params, headers }),
          api.get("/analytics/harvests/summary/payments/timeline", { params, headers }),
        ]);

        if (cancelled) return;

        // ✅ DEBUG: Mostrar datos crudos
        console.log("📊 SUMMARY DATA:", s.data?.data);
        console.log("📈 TIMELINE DATA:", t.data?.data);
        console.log("💰 PAYMENTS DATA:", p.data?.data);

        // ✅ DEBUG: Verificar estructura
        if (s.data?.data?.length > 0) {
          console.log("✅ Summary tiene", s.data.data.length, "registros");
          console.log("   Primer registro:", s.data.data[0]);
        } else {
          console.warn("⚠️ Summary está VACÍO");
        }

        if (t.data?.data?.length > 0) {
          console.log("✅ Timeline tiene", t.data.data.length, "registros");
          console.log("   Primer registro:", t.data.data[0]);
          console.log("   Último registro:", t.data.data[t.data.data.length - 1]);
        } else {
          console.warn("⚠️ Timeline está VACÍO");
        }

        if (p.data?.data?.length > 0) {
          console.log("✅ Payments tiene", p.data.data.length, "registros");
          console.log("   Primer registro:", p.data.data[0]);
          console.log("   Último registro:", p.data.data[p.data.data.length - 1]);
        } else {
          console.warn("⚠️ Payments está VACÍO");
        }

        setSummary(s.data?.data ?? []);
        setTimeline(t.data?.data ?? []);
        setPayments(p.data?.data ?? []);
      } catch (err: any) {
        if (!cancelled) {
          console.error("❌ Error loading harvest summary:", err);
          console.error("❌ Error details:", {
            message: err?.message,
            response: err?.response?.data,
            status: err?.response?.status,
          });
          setError(err?.response?.data?.message ?? "Error al cargar datos");
          setSummary([]);
          setTimeline([]);
          setPayments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    fieldId,
    filters?.specie,
    filters?.variety,
    filters?.startDate,
    filters?.endDate,
    filters?.harvestName,
    getAccessTokenSilently,
  ]);

  return { summary, timeline, payments, loading, error };
}