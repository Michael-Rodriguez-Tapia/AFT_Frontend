// ============================================================
// 🟠 useCargoStationRegistries.ts — ACTUALIZADO
// ============================================================

import { useEffect, useState } from "react";
import { AFT } from "../services/api";

export function useCargoStationRegistries() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    AFT.cargoStationRegistries
      .getAll()
      .then((res) => setRows(res.data.rows ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { rows, loading, error };
}

export function useCargoStationRegistriesByHarvest(harvestId?: string) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!harvestId) return;

    setLoading(true);

    AFT.cargoStationRegistries
      .getByHarvest(harvestId)
      .then((res) => setRows(res.data.rows ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [harvestId]);

  return { rows, loading, error };
}
