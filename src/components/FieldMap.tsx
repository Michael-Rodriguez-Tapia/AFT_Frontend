// ============================================================
// 🌱 FieldMap — v17 FINAL COMPLETO (TODAS LAS CORRECCIONES)
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Polygon } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";

/* ============================================================
   Types
============================================================ */
export interface Sector {
  name: string;
  polygon?: any;
  kg_total?: number;
  species?: string | null;
  hectares?: number;
}

export interface Field {
  name: string;
  metadata?: { polygon?: any };
  sectors?: Sector[];
}

export interface FieldMapProps {
  field: Field;
  height?: string;
  filters?: {
    harvest?: string | null;
    species?: string | null;
  };
  totalSectors?: number; // ✅ Pasar el conteo correcto desde Dashboard
}

/* ============================================================
   Constants
============================================================ */
const SPECIES_COLORS: Record<string, string> = {
  paltas: "#4CAF50",
  hass: "#4CAF50",
  gem: "#66BB6A",
  fuerte: "#1E88E5",
  zutano: "#FB8C00",
  cerezos: "#E91E63",
  bing: "#C2185B",
  nogales: "#8D6E63",
  chandler: "#A1887F",
  serr: "#6D4C41",
  avellanos: "#FF9800",
  giffoni: "#F57C00",
  yamhill: "#EF6C00",
  cítricos: "#FDD835",
  eureka: "#F9A825",
  murcott: "#F57F17",
  clemenules: "#FFD600",
  other: "#9E9E9E",
};

/* ============================================================
   Utils
============================================================ */
function normalizePolygon(poly: any): Polygon | null {
  if (!poly) return null;

  try {
    if (typeof poly === 'string') {
      try {
        poly = JSON.parse(poly);
      } catch (e) {
        return null;
      }
    }

    if (poly.type === "Polygon" && Array.isArray(poly.coordinates)) {
      return poly;
    }

    if (poly.coordinates && Array.isArray(poly.coordinates)) {
      return { 
        type: "Polygon", 
        coordinates: Array.isArray(poly.coordinates[0]) 
          ? poly.coordinates 
          : [poly.coordinates]
      };
    }

    if (Array.isArray(poly) && poly.length > 0) {
      if (Array.isArray(poly[0])) {
        return { type: "Polygon", coordinates: [poly] };
      }
      if (poly[0].length === 2) {
        return { type: "Polygon", coordinates: [poly] };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

function computeBounds(poly: any): mapboxgl.LngLatBounds | null {
  const normalized = normalizePolygon(poly);
  if (!normalized || !normalized.coordinates?.[0]?.length) {
    return null;
  }

  try {
    const coords = normalized.coordinates[0];
    const bounds = new mapboxgl.LngLatBounds(
      [coords[0][0], coords[0][1]],
      [coords[0][0], coords[0][1]]
    );

    coords.forEach((c) => {
      if (Array.isArray(c) && c.length >= 2) {
        bounds.extend([c[0], c[1]]);
      }
    });

    return bounds;
  } catch (error) {
    return null;
  }
}

function computeCentroid(poly: any): [number, number] | null {
  const normalized = normalizePolygon(poly);
  if (!normalized || !normalized.coordinates?.[0]?.length) {
    return null;
  }

  try {
    const coords = normalized.coordinates[0];
    let sumLng = 0;
    let sumLat = 0;
    let count = 0;

    coords.forEach((c) => {
      if (Array.isArray(c) && c.length >= 2) {
        sumLng += c[0];
        sumLat += c[1];
        count++;
      }
    });

    if (count === 0) return null;

    return [sumLng / count, sumLat / count];
  } catch (error) {
    return null;
  }
}

function computeAreaHectares(poly: any): number {
  const normalized = normalizePolygon(poly);
  if (!normalized || !normalized.coordinates?.[0]?.length) {
    return 0;
  }

  try {
    const coords = normalized.coordinates[0];
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

function sectorId(name: string) {
  return `sector-${name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")}`;
}

function getSpeciesColor(species: string | null | undefined): string {
  if (!species) return SPECIES_COLORS.other;
  
  const normalized = species.toLowerCase().trim();
  
  if (SPECIES_COLORS[normalized]) {
    return SPECIES_COLORS[normalized];
  }
  
  for (const [key, color] of Object.entries(SPECIES_COLORS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return color;
    }
  }
  
  return SPECIES_COLORS.other;
}

function extractEquipmentName(sectorName: string): string {
  const match = sectorName.match(/Equipo\s+\d+/i);
  return match ? match[0] : sectorName;
}

/* ============================================================
   Component
============================================================ */
const FieldMap: React.FC<FieldMapProps> = ({
  field,
  height = "500px",
  filters,
  totalSectors, // ✅ Recibir desde Dashboard
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const labelsRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [mode, setMode] = useState<"normal" | "species" | "heatmap">("heatmap");
  
  // ✅ CHECKBOXES PARA MOSTRAR INFO
  const [showKgPerHa, setShowKgPerHa] = useState(true);
  const [showEquipment, setShowEquipment] = useState(true);
  const [showSpecies, setShowSpecies] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  
  // ✅ SELECTOR DE SECTORES VISIBLES
  const [visibleSectors, setVisibleSectors] = useState<Set<string>>(new Set());
  const [sectorSearchTerm, setSectorSearchTerm] = useState<string>("");

  /* ============================================================
     DATA
  ============================================================ */
  // ✅ TOTAL DE SECTORES DEL CAMPO (usar prop o calcular)
  const totalFieldSectors = useMemo(() => {
    // Si viene desde Dashboard, usar ese valor
    if (totalSectors !== undefined) return totalSectors;
    
    // Fallback: calcular desde field.sectors
    const uniqueSectors = (field.sectors ?? []).filter(sector => sector.polygon);
    const uniqueNames = new Set(uniqueSectors.map(s => s.name.toLowerCase()));
    return uniqueNames.size;
  }, [field.sectors, totalSectors]);

  const sectors = useMemo(() => {
    let s = (field.sectors ?? []).filter(sector => {
      if (!sector.polygon) {
        return false;
      }
      return true;
    });

    if (filters?.species) {
      s = s.filter(
        (x) => x.species?.toLowerCase() === filters.species!.toLowerCase()
      );
    }

    return s;
  }, [field.sectors, filters?.species]);
  
  // ✅ Inicializar todos los sectores como visibles
  useEffect(() => {
    const allSectorNames = new Set(sectors.map(s => s.name));
    setVisibleSectors(allSectorNames);
  }, [sectors]);

  const totalKg = useMemo(
    () => sectors.reduce((acc, s) => acc + (s.kg_total ?? 0), 0),
    [sectors]
  );

  const maxKgPerHa = useMemo(() => {
    return Math.max(...sectors.map((s) => {
      const hectares = s.hectares || computeAreaHectares(s.polygon);
      const kgPerHa = hectares > 0 ? (s.kg_total ?? 0) / hectares : 0;
      return kgPerHa;
    }), 1);
  }, [sectors]);

  /* ============================================================
     INIT MAP
  ============================================================ */
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.error("VITE_MAPBOX_TOKEN no está definido");
      return;
    }

    mapboxgl.accessToken = token;
    
    if (mapRef.current) return;

    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-70.65, -33.45],
        zoom: 11,
      });

      mapRef.current.scrollZoom.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      mapRef.current.on('load', () => {
        setMapLoaded(true);
      });

      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });
    } catch (error) {
      console.error("Error inicializando mapa:", error);
    }

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      Object.values(labelsRef.current).forEach(marker => marker.remove());
    };
  }, []);

  /* ============================================================
     FIT FIELD
  ============================================================ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const poly = field.metadata?.polygon || field.sectors?.[0]?.polygon;
    const bounds = computeBounds(poly);
    
    if (bounds) {
      try {
        map.fitBounds(bounds, { padding: 60, duration: 800 });
      } catch (error) {
        console.error("Error ajustando bounds:", error);
      }
    }
  }, [field, mapLoaded]);

  /* ============================================================
     DRAW SECTORS + LABELS
  ============================================================ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // CLEAN
    try {
      const style = map.getStyle();
      if (style?.sources) {
        Object.keys(style.sources).forEach((s) => {
          if (s.startsWith("sector-")) {
            if (map.getLayer(`${s}-fill`)) map.removeLayer(`${s}-fill`);
            if (map.getLayer(`${s}-line`)) map.removeLayer(`${s}-line`);
            if (map.getSource(s)) map.removeSource(s);
          }
        });
      }
    } catch (error) {
      console.error("Error limpiando capas:", error);
    }

    Object.values(labelsRef.current).forEach(marker => marker.remove());
    labelsRef.current = {};

    // DRAW
    sectors.forEach((sector) => {
      // ✅ Solo dibujar sectores visibles
      if (!visibleSectors.has(sector.name)) return;
      
      const geometry = normalizePolygon(sector.polygon);
      if (!geometry) {
        return;
      }

      const id = sectorId(sector.name);
      const hectares = sector.hectares || computeAreaHectares(sector.polygon);
      const kgPerHa = hectares > 0 ? Math.round((sector.kg_total ?? 0) / hectares) : 0;
      const equipment = extractEquipmentName(sector.name);

      try {
        map.addSource(id, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry,
            properties: {
              name: sector.name,
              equipment: equipment,
              kg: sector.kg_total ?? 0,
              kgPerHa: kgPerHa,
              hectares: hectares,
              species: sector.species ?? "Sin especie",
            },
          },
        });

        let fillColor: any = "#66BB6A";

        if (mode === "species") {
          fillColor = getSpeciesColor(sector.species);
        }

        if (mode === "heatmap") {
          fillColor = [
            "interpolate",
            ["linear"],
            ["get", "kgPerHa"],
            0, "#E3F2FD",
            maxKgPerHa * 0.25, "#90CAF9",
            maxKgPerHa * 0.5, "#42A5F5",
            maxKgPerHa * 0.75, "#FB8C00",
            maxKgPerHa, "#E65100",
          ];
        }

        map.addLayer({
          id: `${id}-fill`,
          type: "fill",
          source: id,
          paint: {
            "fill-color": fillColor,
            "fill-opacity": mode === "normal" ? 0.35 : 0.6,
          },
        });

        map.addLayer({
          id: `${id}-line`,
          type: "line",
          source: id,
          paint: {
            "line-color": "#263238",
            "line-width": 1.2,
          },
        });

        // ✅ LABEL DINÁMICO
        const centroid = computeCentroid(sector.polygon);
        if (centroid) {
          const labelParts = [];
          
          if (showEquipment) labelParts.push(equipment);
          if (showKgPerHa) labelParts.push(`${kgPerHa.toLocaleString('es-CL')} kg/ha`);
          
          const labelText = labelParts.join('<br/>');

          const labelEl = document.createElement('div');
          labelEl.className = 'sector-label';
          labelEl.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            pointer-events: none;
            text-align: center;
            line-height: 1.4;
          `;
          labelEl.innerHTML = labelText;

          const marker = new mapboxgl.Marker({
            element: labelEl,
            anchor: 'center'
          })
            .setLngLat(centroid)
            .addTo(map);

          labelsRef.current[id] = marker;
        }

        // HOVER
        map.on("mouseenter", `${id}-fill`, (e) => {
          map.getCanvas().style.cursor = "pointer";
          const p = e.features?.[0]?.properties;
          if (!p || !popupRef.current) return;

          const popupParts = [`<strong style="color: #000;">${p.name}</strong>`];
          
          if (showSpecies) popupParts.push(`<span style="color: #000;">Especie: ${p.species}</span>`);
          if (showKgPerHa) popupParts.push(`<span style="color: #000;">Producción: ${Number(p.kgPerHa).toLocaleString("es-CL")} kg/ha</span>`);
          if (showTotal) popupParts.push(`<span style="color: #000;">Total: ${Number(p.kg).toLocaleString("es-CL")} kg</span>`);
          if (showArea) popupParts.push(`<span style="color: #000;">Área: ${Number(p.hectares).toFixed(2)} ha</span>`);

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-size:12px; padding: 6px;">
                ${popupParts.join('<br/>')}
              </div>
            `)
            .addTo(map);
        });

        map.on("mouseleave", `${id}-fill`, () => {
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
        });
      } catch (error) {
        console.error(`Error dibujando sector ${sector.name}:`, error);
      }
    });
  }, [sectors, mode, maxKgPerHa, mapLoaded, showKgPerHa, showEquipment, showSpecies, showArea, showTotal, visibleSectors]);

  /* ============================================================
     FULLSCREEN
  ============================================================ */
  const toggleFullscreen = () => {
    const container = mapContainerRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div style={{ position: "relative", height: isFullscreen ? "100vh" : height }}>
      {/* KPI */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          background: "rgba(0,0,0,0.75)",
          color: "white",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <strong>Total campo</strong><br />
        {totalKg.toLocaleString("es-CL")} kg
        <br />
      </div>

      {/* ✅ LEYENDA MAPA DE CALOR */}
      {mode === "heatmap" && (
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 10,
            zIndex: 10,
            background: "rgba(255,255,255,0.95)",
            padding: "10px",
            borderRadius: 6,
            fontSize: 11,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, color: "#000" }}>kg/ha</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <div style={{ width: 20, height: 12, background: "#E3F2FD" }}></div>
            <span style={{ color: "#000" }}>0</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <div style={{ width: 20, height: 12, background: "#90CAF9" }}></div>
            <span style={{ color: "#000" }}>{Math.round(maxKgPerHa * 0.25).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <div style={{ width: 20, height: 12, background: "#42A5F5" }}></div>
            <span style={{ color: "#000" }}>{Math.round(maxKgPerHa * 0.5).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <div style={{ width: 20, height: 12, background: "#FB8C00" }}></div>
            <span style={{ color: "#000" }}>{Math.round(maxKgPerHa * 0.75).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 20, height: 12, background: "#E65100" }}></div>
            <span style={{ color: "#000" }}>{Math.round(maxKgPerHa).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* MODE BUTTONS */}
        <div style={{ display: "flex", gap: 6 }}>
          {["normal", "species", "heatmap"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: mode === m ? "#0D47A1" : "#90CAF9",
                color: "white",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {m === "normal" ? "NORMAL" : m === "species" ? "ESPECIE" : "CALOR"}
            </button>
          ))}
        </div>

        {/* ✅ MENU CHECKBOXES */}
        <div style={{
          background: "rgba(255,255,255,0.95)",
          padding: "8px",
          borderRadius: 6,
          fontSize: 11,
          color: "#000",
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Mostrar en mapa:</div>
          <label style={{ display: "block", marginBottom: 3 }}>
            <input 
              type="checkbox" 
              checked={showEquipment} 
              onChange={(e) => setShowEquipment(e.target.checked)} 
            />
            {' '}Equipo
          </label>
          <label style={{ display: "block", marginBottom: 3 }}>
            <input 
              type="checkbox" 
              checked={showKgPerHa} 
              onChange={(e) => setShowKgPerHa(e.target.checked)} 
            />
            {' '}kg/ha
          </label>
          
          <div style={{ fontWeight: 600, marginTop: 6, marginBottom: 4 }}>Ventana de Información:</div>
          <label style={{ display: "block", marginBottom: 3 }}>
            <input 
              type="checkbox" 
              checked={showSpecies} 
              onChange={(e) => setShowSpecies(e.target.checked)} 
            />
            {' '}Especie
          </label>
          <label style={{ display: "block", marginBottom: 3 }}>
            <input 
              type="checkbox" 
              checked={showTotal} 
              onChange={(e) => setShowTotal(e.target.checked)} 
            />
            {' '}Total kg
          </label>
          <label style={{ display: "block", marginBottom: 6 }}>
            <input 
              type="checkbox" 
              checked={showArea} 
              onChange={(e) => setShowArea(e.target.checked)} 
            />
            {' '}Área (ha)
          </label>
          
          {/* ✅ SELECTOR DE SECTORES */}
          <div style={{ 
            borderTop: "1px solid #ddd", 
            paddingTop: 6, 
            marginTop: 6 
          }}>
            <div style={{ 
              fontWeight: 600, 
              marginBottom: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>Sectores visibles:</span>
              <button
                onClick={() => {
                  const filteredSectors = sectors.filter(s => 
                    s.name.toLowerCase().includes(sectorSearchTerm.toLowerCase())
                  );
                  if (visibleSectors.size === filteredSectors.length) {
                    // Deseleccionar solo los filtrados
                    const newVisible = new Set(visibleSectors);
                    filteredSectors.forEach(s => newVisible.delete(s.name));
                    setVisibleSectors(newVisible);
                  } else {
                    // Seleccionar todos los filtrados
                    const newVisible = new Set(visibleSectors);
                    filteredSectors.forEach(s => newVisible.add(s.name));
                    setVisibleSectors(newVisible);
                  }
                }}
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  background: "#e0e0e0",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer"
                }}
              >
                Todos
              </button>
            </div>
            
            {/* ✅ BUSCADOR */}
            <input
              type="text"
              placeholder="Buscar sector..."
              value={sectorSearchTerm}
              onChange={(e) => setSectorSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "4px 6px",
                marginBottom: 6,
                border: "1px solid #ddd",
                borderRadius: 3,
                fontSize: 10
              }}
            />
            
            <div style={{ maxHeight: "150px", overflowY: "auto" }}>
              {sectors
                .filter(sector => 
                  sector.name.toLowerCase().includes(sectorSearchTerm.toLowerCase())
                )
                .map(sector => (
                  <label 
                    key={sector.name} 
                    style={{ 
                      display: "block", 
                      marginBottom: 2,
                      fontSize: 10
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={visibleSectors.has(sector.name)}
                      onChange={(e) => {
                        const newVisible = new Set(visibleSectors);
                        if (e.target.checked) {
                          newVisible.add(sector.name);
                        } else {
                          newVisible.delete(sector.name);
                        }
                        setVisibleSectors(newVisible);
                      }}
                    />
                    {' '}{sector.name}
                  </label>
                ))}
            </div>
          </div>
        </div>

        {/* FULLSCREEN */}
        <button
          onClick={toggleFullscreen}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: "#424242",
            color: "white",
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {isFullscreen ? "Salir ⛶" : "Pantalla Completa ⛶"}
        </button>
      </div>

      {!mapLoaded && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 5,
            background: "rgba(255,255,255,0.9)",
            padding: "20px",
            borderRadius: 8,
          }}
        >
          Cargando mapa...
        </div>
      )}

      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default FieldMap;