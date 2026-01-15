// ============================================================
// 🟢 useHarvestDeliveries.ts — FINAL TS SAFE
// ============================================================

import { useEffect, useState } from "react";
import { AFT } from "../services/api";

// ============================================================
// 📊 SUMMARY POR WORKSPACE
// ============================================================
export function useHarvestDeliveriesSummary(workspace?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // 🧼 Si no hay workspace → reset limpio
    if (!workspace) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // ✅ workspace garantizado como string
    AFT.harvestDeliveries
      .getSummary(workspace)
      .then((res) => {
        if (cancelled) return;
        setData(res?.data?.summary ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspace]);

  return { data, loading, error };
}

// ============================================================
// 📄 LISTADO COMPLETO
// ============================================================
export function useHarvestDeliveries() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    AFT.harvestDeliveries
      .getAll()
      .then((res) => {
        if (cancelled) return;
        setRows(res?.data?.rows ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, error };
}

// ============================================================
// 🔍 DETALLE POR ID
// ============================================================
export function useHarvestDelivery(id?: string) {
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      setRow(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    AFT.harvestDeliveries
      .getById(id)
      .then((res) => {
        if (cancelled) return;
        setRow(res?.data?.row ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setRow(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { row, loading, error };
}
