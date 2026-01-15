// ============================================================
// 🟣 useCargoStationMeasurements.ts — ACTUALIZADO
// ============================================================

import { useEffect, useState } from "react";
import { AFT } from "../services/api";

export function useCargoStationMeasurements() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    AFT.cargoStationMeasurements
      .getAll()
      .then((res) => setRows(res.data.rows ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { rows, loading, error };
}

export function useCargoStationMeasurementsByStation(stationId?: string) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!stationId) return;

    setLoading(true);

    AFT.cargoStationMeasurements
      .getByStation(stationId)
      .then((res) => setRows(res.data.rows ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [stationId]);

  return { rows, loading, error };
}
