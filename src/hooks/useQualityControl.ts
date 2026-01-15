// ============================================================
// 🔵 useQualityControl.ts — ACTUALIZADO
// ============================================================

import { useEffect, useState } from "react";
import { AFT } from "../services/api";

export function useQualityControlAll() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    AFT.qualityControl
      .getAll()
      .then((res) => setRows(res.data.rows ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { rows, loading, error };
}

export function useQualityControlByRegistry(registryId?: string) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!registryId) return;

    setLoading(true);

    AFT.qualityControl
      .getByRegistry(registryId)
      .then((res) => setRows(res.data.rows ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [registryId]);

  return { rows, loading, error };
}
