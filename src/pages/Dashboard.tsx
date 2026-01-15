// ============================================================
// 🌱 Dashboard.tsx — CORREGIDO (KG/HA + SIN DUPLICADOS)
// ============================================================

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import FieldMap from "../components/FieldMap";
import CollapsibleAnalyticsPanel from "../components/CollapsibleAnalyticsPanel";
import { Calendar } from "lucide-react";

function getDatesFromHarvestName(harvestName: string | null) {
  if (!harvestName) return { start: undefined, end: undefined };

  const years = harvestName.match(/\d{4}/g);

  if (years && years.length >= 1) {
    years.sort();
    const startYear = years[0];
    const endYear = years[years.length - 1];

    return {
      start: `${startYear}-01-01`,
      end: `${endYear}-12-31`
    };
  }
  return { start: undefined, end: undefined };
}

function getLastNDays(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

// ✅ Calcular hectáreas aproximadas
function computeAreaHectares(poly: any): number {
  if (!poly || !poly.coordinates || !poly.coordinates[0]) return 0;
  
  try {
    const coords = poly.coordinates[0];
    let area = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i];
      const [x2, y2] = coords[i + 1];
      area += x1 * y2 - x2 * y1;
    }

    area = Math.abs(area) / 2;
    const hectares = area * 111000 * 111000 * Math.cos((-33 * Math.PI) / 180) / 10000;
    
    return Math.round(hectares * 100) / 100;
  } catch (error) {
    return 0;
  }
}

export default function Dashboard() {
  const { user, getAccessTokenSilently, logout } = useAuth0();

  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [selectedSector, setSelectedSector] = useState<any>(null);

  const [harvests, setHarvests] = useState<string[]>([]);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [varietiesList, setVarietiesList] = useState<string[]>([]);
  const [selectedHarvest, setSelectedHarvest] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);

  const [showDatePickers, setShowDatePickers] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [dateMode, setDateMode] = useState<"20days" | "30days" | "harvest" | "custom">("20days");

  const [sectorProduction, setSectorProduction] = useState<any[]>([]);

  const [topN, setTopN] = useState(5);
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  // ============================================================
  // LOAD FIELDS
  // ============================================================
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await api.get("/fields", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFields(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ============================================================
  // LOAD FIELD
  // ============================================================
  const loadFieldById = async (id: string) => {
    const token = await getAccessTokenSilently();
    const res = await api.get(`/fields/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSelectedField(res.data);
  };

  // ============================================================
  // LOAD FILTERS
  // ============================================================
  const loadFilters = async (fieldName: string) => {
    try {
      const token = await getAccessTokenSilently();
      const [h, s] = await Promise.all([
        api.get(`/analytics/field/${fieldName}/harvests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/analytics/field/${fieldName}/species-list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const harvestList = (h.data.data ?? []).sort((a: string, b: string) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      );
      
      const speciesListSorted = (s.data.data ?? []).sort((a: string, b: string) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      );

      setHarvests(harvestList);
      setSpeciesList(speciesListSorted);
      setSelectedHarvest(harvestList[0] ?? null);
      setSelectedSpecies(speciesListSorted[0] ?? null);
      setSelectedVariety(null);
      setSelectedSector(null);
      setDateMode("20days");
    } catch (error) {
      console.error("Error cargando filtros:", error);
      setHarvests([]);
      setSpeciesList([]);
      setSelectedHarvest(null);
      setSelectedSpecies(null);
    }
  };

  // ============================================================
  // LOAD VARIETIES
  // ============================================================
  useEffect(() => {
    if (!selectedField || !selectedHarvest) {
      setVarietiesList([]);
      return;
    }

    const loadVarieties = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await api.get(`/analytics/harvests/summary`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            fieldId: selectedField.id,
            harvestName: selectedHarvest,
            specie: selectedSpecies,
          }
        });
        
        if (res.data?.data) {
          const varieties: string[] = [...new Set(
            res.data.data
              .map((r: any) => r.variety)
              .filter((v: string) => v && v !== "Sin Variedad")
          )] as string[];
          
          const varietiesSorted = varieties.sort((a, b) =>
            a.localeCompare(b, 'es', { sensitivity: 'base' })
          );
          
          setVarietiesList(varietiesSorted);
          
          if (varietiesSorted.length > 0 && !selectedVariety) {
            setSelectedVariety(varietiesSorted[0]);
          }
        }
      } catch (error) {
        console.error("Error cargando variedades:", error);
        setVarietiesList([]);
      }
    };

    loadVarieties();
  }, [selectedField?.id, selectedHarvest, selectedSpecies]);

  // ============================================================
  // LOAD SECTOR PRODUCTION
  // ============================================================
  useEffect(() => {
    if (!selectedField || !selectedHarvest) {
      setSectorProduction([]);
      return;
    }

    const load = async () => {
      try {
        const token = await getAccessTokenSilently();
        const p = await api.get(
          `/analytics/field/${selectedField.name}/sectors/production`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { 
              harvest: selectedHarvest, 
              species: selectedSpecies || undefined
            },
          }
        );
        setSectorProduction(p.data.data ?? []);
      } catch (error) {
        console.error("Error cargando producción de sectores:", error);
        setSectorProduction([]);
      }
    };

    load();
  }, [selectedField?.name, selectedHarvest, selectedSpecies]);

  // ============================================================
  // CALCULAR FECHAS
  // ============================================================
  const effectiveDates = useMemo(() => {
    if (dateMode === "custom") {
      return { start: customStartDate, end: customEndDate };
    }
    
    if (dateMode === "20days") {
      return getLastNDays(20);
    }
    
    if (dateMode === "30days") {
      return getLastNDays(30);
    }
    
    return getDatesFromHarvestName(selectedHarvest);
  }, [dateMode, customStartDate, customEndDate, selectedHarvest]);

  // ============================================================
  // ✅ SECTORES ORDENADOS POR KG/HA (NO TOTAL)
  // ============================================================
  const orderedSectors = useMemo(() => {
    // Primero calcular kg/ha para cada sector
    const sectorsWithKgPerHa = sectorProduction.map(s => {
      const sector = selectedField?.sectors?.find(
        (sec: any) => sec.name.toLowerCase() === s.sector.toLowerCase()
      );
      
      const hectares = sector ? computeAreaHectares(sector.polygon) : 0;
      const kgPerHa = hectares > 0 ? Number(s.kg_total) / hectares : 0;
      
      return {
        ...s,
        hectares,
        kg_per_ha: Math.round(kgPerHa)
      };
    });
    
    // Ordenar por kg/ha
    const sorted = [...sectorsWithKgPerHa].sort((a, b) =>
      order === "desc"
        ? b.kg_per_ha - a.kg_per_ha
        : a.kg_per_ha - b.kg_per_ha
    );
    
    return sorted.slice(0, topN);
  }, [sectorProduction, selectedField?.sectors, topN, order]);

  const maxKgPerHa = Math.max(
    ...orderedSectors.map((s) => s.kg_per_ha),
    1
  );

  // ============================================================
  // ✅ MAPEAR FIELD SIN DUPLICADOS
  // ============================================================
  const mappedField = useMemo(() => {
    if (!selectedField || !selectedField.sectors) return null;
    
    // ✅ Filtrar sectores únicos por nombre (evitar duplicados)
    const uniqueSectors = selectedField.sectors.filter((s: any, index: number, self: any[]) => {
      return s.polygon && index === self.findIndex((t: any) => t.name.toLowerCase() === s.name.toLowerCase());
    });
    
    return {
      ...selectedField,
      sectors: uniqueSectors.map((s: any) => {
        const p = sectorProduction.find(
          (x) => x.sector?.toLowerCase() === s.name.toLowerCase()
        );
        return {
          ...s,
          kg_total: Number(p?.kg_total ?? 0),
          species: p?.specie ?? selectedSpecies ?? "other",
          hectares: computeAreaHectares(s.polygon)
        };
      }),
    };
  }, [selectedField, sectorProduction, selectedSpecies]);

  // ✅ TOTAL DE SECTORES ÚNICOS
  const uniqueSectorsCount = useMemo(() => {
    if (!selectedField?.sectors) return 0;
    const uniqueNames = new Set(
      selectedField.sectors
        .filter((s: any) => s.polygon)
        .map((s: any) => s.name.toLowerCase())
    );
    return uniqueNames.size;
  }, [selectedField?.sectors]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <section className="section">
      <div className="container">
        {/* HEADER */}
        <div className="box has-background-info-light">
          <h1 className="title is-3">📊 Gestión Agrícola</h1>
          <p className="subtitle is-6">
            Usuario: <strong>{user?.email}</strong>
          </p>
        </div>

        {loading && <progress className="progress is-primary" max="100" />}

        {/* SELECT FIELD */}
        <div className="box">
          <label className="label">Campo</label>
          <div className="select is-fullwidth">
            <select
              value={selectedField?.id ?? ""}
              onChange={async (e) => {
                const f = fields.find((x) => String(x.id) === e.target.value);
                if (f) {
                  setSelectedField(null);
                  setSectorProduction([]);
                  await loadFieldById(f.id);
                  await loadFilters(f.name);
                }
              }}
            >
              <option value="">-- Selecciona campo --</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FILTERS */}
        {selectedField && (
          <div className="box">
            <div className="columns">
              <div className="column">
                <label className="label">Cosecha</label>
                <div className="select is-fullwidth">
                  <select
                    value={selectedHarvest ?? ""}
                    onChange={(e) => {
                      setSelectedHarvest(e.target.value || null);
                      setSelectedVariety(null);
                    }}
                  >
                    {harvests.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="column">
                <label className="label">Especie</label>
                <div className="select is-fullwidth">
                  <select
                    value={selectedSpecies ?? ""}
                    onChange={(e) => {
                      setSelectedSpecies(e.target.value || null);
                      setSelectedVariety(null);
                    }}
                  >
                    {speciesList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="column">
                <label className="label">Variedad</label>
                <div className="select is-fullwidth">
                  <select
                    value={selectedVariety ?? ""}
                    onChange={(e) =>
                      setSelectedVariety(e.target.value || null)
                    }
                    disabled={varietiesList.length === 0}
                  >
                    <option value="">Todas</option>
                    {varietiesList.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="field is-grouped" style={{ marginTop: '1rem' }}>
              <p className="control">
                <button
                  className={`button ${dateMode === "20days" ? "is-info" : "is-light"}`}
                  onClick={() => setDateMode("20days")}
                >
                  Últimos 20 días
                </button>
              </p>
              <p className="control">
                <button
                  className={`button ${dateMode === "30days" ? "is-info" : "is-light"}`}
                  onClick={() => setDateMode("30days")}
                >
                  Últimos 30 días
                </button>
              </p>
              <p className="control">
                <button
                  className={`button ${dateMode === "harvest" ? "is-info" : "is-light"}`}
                  onClick={() => setDateMode("harvest")}
                >
                  Rango de cosecha
                </button>
              </p>
              <p className="control">
                <button
                  className={`button ${dateMode === "custom" ? "is-info" : "is-light"}`}
                  onClick={() => {
                    setDateMode("custom");
                    setShowDatePickers(!showDatePickers);
                  }}
                >
                  <span className="icon">
                    <Calendar size={18} />
                  </span>
                  <span>Personalizar</span>
                </button>
              </p>
            </div>

            {showDatePickers && dateMode === "custom" && (
              <div className="box" style={{ marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
                <div className="columns">
                  <div className="column">
                    <label className="label is-small">Fecha Inicio</label>
                    <input
                      type="date"
                      className="input"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="column">
                    <label className="label is-small">Fecha Fin</label>
                    <input
                      type="date"
                      className="input"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MAP + COMPARISON */}
        {mappedField && mappedField.sectors.length > 0 && selectedHarvest && (
          <div className="columns">
            <div className="column is-7">
              <div className="box">
                <FieldMap 
                  field={mappedField} 
                  height="450px"
                  filters={{
                    harvest: selectedHarvest,
                    species: selectedSpecies
                  }}
                  totalSectors={uniqueSectorsCount}
                />
              </div>
            </div>

            <div className="column is-5">
              <div className="box">
                <h3 className="title is-5 mb-3">Comparación de Sectores (kg/ha)</h3>

                <div className="columns is-mobile mb-3">
                  <div className="column">
                    <label className="label is-small">Top</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input"
                      value={topN}
                      onChange={(e) => setTopN(Number(e.target.value))}
                    />
                  </div>

                  <div className="column">
                    <label className="label is-small">Orden</label>
                    <div className="select is-fullwidth">
                      <select
                        value={order}
                        onChange={(e) =>
                          setOrder(e.target.value as "asc" | "desc")
                        }
                      >
                        <option value="desc">Mayor → Menor</option>
                        <option value="asc">Menor → Mayor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {orderedSectors.length === 0 ? (
                  <div className="notification is-warning">
                    No hay datos de producción para los filtros seleccionados
                  </div>
                ) : (
                  orderedSectors.map((s) => {
                    const pct = (s.kg_per_ha / maxKgPerHa) * 100;
                    const active = selectedSector?.name === s.sector;

                    return (
                      <div
                        key={s.sector}
                        className={`box mb-2 ${
                          active ? "has-background-info-light" : ""
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedSector({ name: s.sector })}
                      >
                        <div className="is-flex is-justify-content-space-between">
                          <strong>{s.sector}</strong>
                          <span>{s.kg_per_ha.toLocaleString()} kg/ha</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                          {s.hectares.toFixed(2)} ha · Total: {Number(s.kg_total).toLocaleString()} kg
                        </div>
                        <progress
                          className="progress is-info mt-2"
                          value={pct}
                          max={100}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL COLAPSABLE */}
        {selectedField && selectedHarvest && (
          <CollapsibleAnalyticsPanel
            fieldId={selectedField.id}
            fieldName={selectedField.name}
            filters={{
              specie: selectedSpecies,
              variety: selectedVariety,
              initialStartDate: effectiveDates.start,
              initialEndDate: effectiveDates.end,
              harvestName: selectedHarvest,
            }}
          />
        )}

        {/* LOGOUT */}
        <button
          className="button is-danger mt-5"
          onClick={() =>
            logout({
              logoutParams: {
                returnTo: import.meta.env.VITE_AUTH0_LOGOUT_URL,
              },
            })
          }
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}