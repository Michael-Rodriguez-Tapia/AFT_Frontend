// ============================================================
// 🌐 api.ts — CLIENTE API CENTRAL (FINAL ESTABLE)
// ============================================================

import axios from "axios";

// ============================================================
// 🔑 Axios base
// ============================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// ============================================================
// 🔐 Interceptor JWT
// ============================================================

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// 🌱 AFT API (CONTRATO COMPLETO)
// ============================================================

export const AFT = {
  // ----------------------------------------------------------
  // 👥 USERS (GESTIÓN DE USUARIOS)
  // ----------------------------------------------------------
  users: {
    // Obtener todos los usuarios (solo admin/gerencia)
    getAll: () =>
      api.get(`/users`),

    // Obtener usuario por ID
    getById: (id: number) =>
      api.get(`/users/${id}`),

    // Crear usuario manualmente (solo admin)
    create: (userData: {
      auth0Id: string;
      email: string;
      name: string;
      role?: 'campo' | 'gerencia' | 'admin' | 'pending';
    }) =>
      api.post(`/users`, userData),

    // Actualizar rol de usuario (solo admin)
    updateRole: (userId: number, role: 'campo' | 'gerencia' | 'admin' | 'pending') =>
      api.patch(`/users/${userId}/role`, { role }),

    // Eliminar usuario (solo admin)
    delete: (userId: number) =>
      api.delete(`/users/${userId}`),
  },

  // ----------------------------------------------------------
  // 🌾 HARVEST DELIVERIES
  // ----------------------------------------------------------
  harvestDeliveries: {
    getSummary: (workspace: string) =>
      api.get(`/harvest-deliveries/summary`, {
        params: { workspace },
      }),

    getAll: () =>
      api.get(`/harvest-deliveries`),

    getById: (id: string) =>
      api.get(`/harvest-deliveries/${id}`),
  },

  // ----------------------------------------------------------
  // 🚜 CARGO STATION REGISTRIES
  // ----------------------------------------------------------
  cargoStationRegistries: {
    getAll: () =>
      api.get(`/cargo-station-registries`),

    getByHarvest: (harvestId: string) =>
      api.get(`/cargo-station-registries/harvest/${harvestId}`),
  },

  // ----------------------------------------------------------
  // 📏 CARGO STATION MEASUREMENTS
  // ----------------------------------------------------------
  cargoStationMeasurements: {
    getAll: () =>
      api.get(`/cargo-station-measurements`),

    getByStation: (stationId: string) =>
      api.get(`/cargo-station-measurements/station/${stationId}`),
  },

  // ----------------------------------------------------------
  // 🧪 QUALITY CONTROL
  // ----------------------------------------------------------
  qualityControl: {
    getAll: () =>
      api.get(`/quality-control-value`),

    getByRegistry: (registryId: string) =>
      api.get(`/quality-control-value/registry/${registryId}`),
  },

  // ----------------------------------------------------------
  // 📊 ANALYTICS
  // ----------------------------------------------------------
  analytics: {
    // 📊 Harvest summary (tabla + KPIs)
    getHarvestSummary: (params: {
      fieldId: number;
      specie?: string | null;
      variety?: string | null;
      startDate?: string;
      endDate?: string;
    }) =>
      api.get(`/analytics/harvests/summary`, {
        params,
      }),

    // 📈 Timeline kilos + mercado + cosecheros
    getHarvestSummaryTimeline: (params: {
      fieldId: number;
      specie?: string | null;
      variety?: string | null;
      startDate?: string;
      endDate?: string;
    }) =>
      api.get(`/analytics/harvests/summary/timeline`, {
        params,
      }),

    // 💰 Timeline pagos
    getHarvestSummaryPaymentsTimeline: (params: {
      fieldId: number;
      startDate?: string;
      endDate?: string;
    }) =>
      api.get(`/analytics/harvests/summary/payments/timeline`, {
        params,
      }),
  },

};

export default api;