// ============================================================
// 🌾 Tipos usados por AnalyticsPanel, Hooks y Charts (FINAL)
// ============================================================

// ======================= KPIs ===============================
export interface KPIResult {
  total_entregas: number;
  peso_total: number;
  total_bins: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

// ==================== TIMELINE DIARIO ======================
export interface TimelinePoint {
  fecha: string;
  peso_total: number;
  bins_total: number;
}

// ==================== VARIEDADES ===========================
export interface VarietyStat {
  variety_name: string;
  entregas: number;
  peso_total: number;
}

// ==================== ESPECIES =============================
export interface SpeciesStat {
  especie: string;
  entregas: number;
  peso_total: number;
}

// ================= HISTOGRAMA DE MEDICIONES ================
export interface MeasurementValue {
  measurement_value: number | string;
  count?: number;
}

// ================= PRODUCCIÓN SEMANAL ======================
export interface WeeklyPoint {
  semana: number;
  peso_total: number;
  cosecheros?: number;
}

// =================== RANKING DE SECTORES ===================
export interface SectorRankingRow {
  sector: string;
  peso_total: number;
}

// =================== EXPORTACIONES =========================
export interface ExportStat {
  destino: string;
  kilos: number;
  porcentaje?: number;
}
export type ExportRow = ExportStat;

// ====================== CALIBRES ===========================
export interface CaliberStat {
  caliber: string;
  cantidad: number;
  porcentaje?: number;
}
export type CaliberRow = CaliberStat;

// =================== CALIDAD FRUTA =========================
export interface QualityStat {
  defecto: string;
  cantidad: number;
  porcentaje?: number;
}
export type QualityRow = QualityStat;

// ====================== RIEGO (KG/HA) ======================
export interface IrrigationRow {
  sector: string;
  kg_ha: number;
  fecha?: string; // MAX(date) desde backend
}

// ==================== PROCESOS =============================
export interface ProcessRow {
  pabellon: string;

  kg_cosechados: number;

  kg_export_campo: number;
  pct_export_campo: number;

  kg_procesado_primario: number;
  pct_primario: number;

  kg_procesado_secundario: number;
  pct_secundario: number;

  kg_export_final: number;
}

// ================= DISTRIBUCIÓN DE MERCADO =================
// 🥧 Exportación / Mercado local / Otros
export interface MeasurementDistributionRow {
  category: string; // ej: Exportación, Mercado Interno, Descarte
  kg: number;
  porcentaje?: number;
}

// ============================================================
// 🎯 TYPES para AnalyticsPanel (FINAL)
// ============================================================

export interface AnalyticsPanelProps {
  fieldName: string;
  sectorName?: string | null;

  // ⭐ Filtros SIEMPRE presentes (controlados por Dashboard)
  filters: {
    harvest: string | null;
    species: string | null;
    variety?: string | null;
  };
}
