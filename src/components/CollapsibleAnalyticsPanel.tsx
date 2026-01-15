// ============================================================
// 📊 CollapsibleAnalyticsPanel.tsx
// VERSIÓN OPTIMIZADA CON FORMATO DE FECHAS MEJORADO
// ============================================================

import { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from "react-chartjs-2";

import { useHarvestSummary } from "../hooks/useHarvestSummary";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface Props {
  fieldId: number;
  fieldName: string;
  filters?: {
    specie?: string | null;
    variety?: string | null;
    initialStartDate?: string;
    initialEndDate?: string;
    harvestName?: string | null;
  };
}

// ============================================================
// 🛠️ FORMATO DE FECHAS: Día + Mes agrupado
// ============================================================
function formatDateLabels(dates: string[]) {
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  const formatted = dates.map(dateStr => {
    try {
      let date: Date;
      
      // Detectar formato M/D/YYYY HH:MM:SS (ejemplo: "9/5/2025 17:57:01")
      if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const [datePart] = dateStr.split(' ');
        const [month, day, year] = datePart.split('/').map(Number);
        date = new Date(year, month - 1, day);
      }
      // Formato ISO con T (YYYY-MM-DDTHH:MM:SS)
      else if (dateStr.includes('T')) {
        date = new Date(dateStr);
      }
      // Formato ISO sin T (YYYY-MM-DD)
      else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateStr + 'T12:00:00Z');
      }
      // Intentar parsear directamente
      else {
        date = new Date(dateStr);
      }
      
      // Validar que la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateStr);
        return { day: 0, month: 0, valid: false };
      }
      
      // Usar getDate() y getMonth() en lugar de getUTCDate() para formato M/D/YYYY
      const day = dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) ? date.getDate() : date.getUTCDate();
      const month = dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) ? date.getMonth() : date.getUTCMonth();
      
      return { 
        day, 
        month, 
        valid: !isNaN(day) && !isNaN(month) && day > 0 && day <= 31 && month >= 0 && month <= 11 
      };
    } catch (error) {
      console.error('Error parseando fecha:', dateStr, error);
      return { day: 0, month: 0, valid: false };
    }
  });

  const labels: string[] = [];
  const months: { index: number; label: string }[] = [];
  let lastMonth = -1;
  let monthStartIndex = 0;

  formatted.forEach((item, idx) => {
    if (!item.valid) {
      labels.push('?');
      return;
    }
    
    labels.push(item.day.toString());
    
    // Detectar cambio de mes
    if (item.month !== lastMonth) {
      if (lastMonth !== -1) {
        // Calcular posición central del mes anterior
        const monthMidIndex = Math.floor((monthStartIndex + idx - 1) / 2);
        months.push({
          index: monthMidIndex,
          label: monthNames[lastMonth]
        });
      }
      lastMonth = item.month;
      monthStartIndex = idx;
    }
  });

  // Agregar último mes
  if (lastMonth !== -1) {
    const monthMidIndex = Math.floor((monthStartIndex + formatted.length - 1) / 2);
    months.push({
      index: monthMidIndex,
      label: monthNames[lastMonth]
    });
  }

  return { labels, months };
}

export default function CollapsibleAnalyticsPanel({
  fieldId,
  fieldName,
  filters,
}: Props) {
  const [open, setOpen] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setStartDate(filters?.initialStartDate ?? "");
    setEndDate(filters?.initialEndDate ?? "");
  }, [filters?.initialStartDate, filters?.initialEndDate]);

  const { summary, timeline, payments, loading, error } = useHarvestSummary(
    fieldId,
    {
      specie: filters?.specie,
      variety: filters?.variety,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      harvestName: filters?.harvestName,
    }
  );

  // ============================================================
  // CÁLCULOS TOTALES
  // ============================================================
  const totals = useMemo(() => {
    if (!summary.length) {
      return {
        kg_totales: 0,
        superficie_ha: 0,
        kg_por_ha: 0,
        kg_por_cosechero: 0,
        pct_exportacion_campo: 0,
        pct_mercado_interno: 0,
        pct_exportacion_procesos: 0,
        pct_exportacion_final: 0,
      };
    }

    const kg_totales = summary.reduce(
      (acc, r) => acc + Number(r.kg_totales ?? 0),
      0
    );
    const superficie_ha = Number(summary[0]?.superficie_ha ?? 0);
    const kg_por_ha = superficie_ha > 0 ? kg_totales / superficie_ha : 0;
    const kg_por_cosechero = Number(summary[0]?.kg_por_cosechero ?? 0);
    const pct_exportacion_campo = Number(summary[0]?.pct_exportacion_campo ?? 0);
    const pct_mercado_interno = Number(summary[0]?.pct_mercado_interno ?? 0);
    const pct_exportacion_procesos = Number(summary[0]?.pct_exportacion_procesos ?? 0);
    const pct_exportacion_final = Number(summary[0]?.pct_exportacion_final ?? 0);

    return {
      kg_totales,
      superficie_ha,
      kg_por_ha,
      kg_por_cosechero,
      pct_exportacion_campo,
      pct_mercado_interno,
      pct_exportacion_procesos,
      pct_exportacion_final,
    };
  }, [summary]);

  // ============================================================
  // 📈 GRÁFICO 1: KILOS COSECHADOS + COSECHEROS (OPTIMIZADO)
  // ============================================================
  const timelineChartData = useMemo(() => {
    if (!timeline.length) return null;

    const { labels, months } = formatDateLabels(timeline.map(t => t.fecha));

    const percentages = timeline.map((t) => {
      const total = Number(t.kg_exportacion) + Number(t.kg_mercado_interno);
      if (total === 0) return { exp: 0, int: 0 };
      
      const pctExp = Math.round((Number(t.kg_exportacion) / total) * 100);
      const pctInt = Math.round((Number(t.kg_mercado_interno) / total) * 100);
      
      return { exp: pctExp, int: pctInt };
    });

    return {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Kg Exportación Campo",
          data: timeline.map((t) => Number(t.kg_exportacion)),
          backgroundColor: "#FF8C42",
          stack: "stack0",
          yAxisID: "y",
          barThickness: 'flex' as const,
          maxBarThickness: 35,
          order: 2,
          datalabels: {
            display: (context: any) => percentages[context.dataIndex].exp >= 5,
            color: '#000',
            font: { size: 8, weight: 'bold' as const },
            formatter: (value: number, context: any) => `${percentages[context.dataIndex].exp}%`,
            anchor: 'center' as const,
            align: 'center' as const,
          }
        },
        {
          type: "bar" as const,
          label: "Kg Mercado Interno",
          data: timeline.map((t) => Number(t.kg_mercado_interno)),
          backgroundColor: "#90C695",
          stack: "stack0",
          yAxisID: "y",
          barThickness: 'flex' as const,
          maxBarThickness: 35,
          order: 2,
          datalabels: {
            display: (context: any) => percentages[context.dataIndex].int >= 5,
            color: '#000',
            font: { size: 8, weight: 'bold' as const },
            formatter: (value: number, context: any) => `${percentages[context.dataIndex].int}%`,
            anchor: 'center' as const,
            align: 'center' as const,
          }
        },
        {
          type: "line" as const,
          label: "Cosecheros",
          data: timeline.map((t) => Number(t.cosecheros ?? 0)),
          borderColor: "#F4C430",
          backgroundColor: "#F4C430",
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointStyle: 'circle',
          yAxisID: "y1",
          tension: 0,
          order: 1,
          datalabels: {
            display: true,
            color: '#000',
            backgroundColor: '#F4C430',
            borderRadius: 3,
            font: { size: 8, weight: 'bold' as const },
            padding: 2,
            formatter: (value: number) => value > 0 ? value : '',
            anchor: 'end' as const,
            align: 'top' as const,
            offset: 2,
          }
        },
      ],
      months,
      // ✅ AGREGAR: Fechas originales para tooltips
      originalDates: timeline.map(t => t.fecha),
    };
  }, [timeline]);

  // ============================================================
  // 📈 GRÁFICO 2: KG/COSECHERO + PAGO/KG (OPTIMIZADO)
  // ============================================================
  const paymentsChartData = useMemo(() => {
    if (!payments.length) return null;

    const { labels, months } = formatDateLabels(payments.map(p => p.fecha));

    return {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Kg/Cosechero",
          data: payments.map((p) => Number(p.kg_por_cosechero)),
          backgroundColor: "#90C695",
          yAxisID: "y",
          barThickness: 'flex' as const,
          maxBarThickness: 40,
          order: 2,
          datalabels: {
            display: (context: any) => context.dataset.data[context.dataIndex] > 0,
            color: '#fff',
            font: { size: 9, weight: 'bold' as const },
            formatter: (value: number) => {
              if (value === 0) return '';
              if (value >= 1000) return Math.round(value / 100) / 10 + 'k';
              return Math.round(value);
            },
            anchor: 'center' as const,
            align: 'center' as const,
          }
        },
        {
          type: "line" as const,
          label: "Pago/Kg",
          data: payments.map((p) => Number(p.pago_kg ?? 0)),
          borderColor: "#4A90E2",
          backgroundColor: "#4A90E2",
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointStyle: 'circle',
          yAxisID: "y1",
          tension: 0,
          order: 1,
          datalabels: {
            display: true,
            color: '#fff',
            backgroundColor: '#4A90E2',
            borderRadius: 3,
            font: { size: 8, weight: 'bold' as const },
            padding: 2,
            formatter: (value: number) => value > 0 ? Math.round(value) : '',
            anchor: 'end' as const,
            align: 'top' as const,
            offset: 2,
          }
        },
      ],
      months,
      // ✅ AGREGAR: Fechas originales para tooltips
      originalDates: payments.map(p => p.fecha),
    };
  }, [payments]);

  // ============================================================
  // OPCIONES DE GRÁFICOS (MEMOIZADAS)
  // ============================================================
  const timelineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        stacked: true,
        title: { display: false },
        ticks: {
          callback: function(value: any) {
            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value.toLocaleString();
          }
        },
        grid: { color: '#e0e0e0' }
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        title: { display: false },
        ticks: { stepSize: 20 }
      },
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          color: '#374151'
        }
      }
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { 
          usePointStyle: true, 
          padding: 15, 
          font: { size: 12, weight: 'bold' as const },
          color: '#1f2937'
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const idx = context[0].dataIndex;
            const dateStr = timelineChartData?.originalDates?.[idx];
            if (!dateStr) return '';
            
            // Parsear y formatear la fecha
            try {
              let date: Date;
              if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
                const [datePart] = dateStr.split(' ');
                const [month, day, year] = datePart.split('/').map(Number);
                date = new Date(year, month - 1, day);
              } else if (dateStr.includes('T')) {
                date = new Date(dateStr);
              } else {
                date = new Date(dateStr + 'T12:00:00Z');
              }
              
              return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            } catch {
              return dateStr;
            }
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      },
    },
    layout: { 
      padding: { top: 10, right: 10, bottom: 60, left: 10 }
    },
    categoryPercentage: 0.9,
    barPercentage: 0.85,
  }), [timelineChartData]);

  const paymentsChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: { display: false },
        ticks: {
          callback: function(value: any) {
            if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
            return value.toLocaleString();
          }
        },
        grid: { color: '#e0e0e0' }
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        title: { display: false },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          maxRotation: 0,
          minRotation: 0,
          color: '#374151'
        }
      }
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { 
          usePointStyle: true, 
          padding: 15, 
          font: { size: 12, weight: 'bold' as const },
          color: '#1f2937'
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const idx = context[0].dataIndex;
            const dateStr = paymentsChartData?.originalDates?.[idx];
            if (!dateStr) return '';
            
            // Parsear y formatear la fecha
            try {
              let date: Date;
              if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
                const [datePart] = dateStr.split(' ');
                const [month, day, year] = datePart.split('/').map(Number);
                date = new Date(year, month - 1, day);
              } else if (dateStr.includes('T')) {
                date = new Date(dateStr);
              } else {
                date = new Date(dateStr + 'T12:00:00Z');
              }
              
              return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            } catch {
              return dateStr;
            }
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 1) {
                label += '$' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y.toLocaleString();
              }
            }
            return label;
          }
        }
      },
    },
    layout: { 
      padding: { top: 10, right: 10, bottom: 60, left: 10 }
    },
    categoryPercentage: 0.8,
    barPercentage: 0.9,
  }), [paymentsChartData]);

  // ============================================================
  // PLUGINS PARA MOSTRAR MESES EN EL EJE X
  // ============================================================
  const timelineMonthsPlugin = useMemo(() => ({
    id: 'timelineMonthsPlugin',
    afterDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      const months = timelineChartData?.months;
      
      if (!months || months.length === 0) return;

      ctx.save();
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';

      months.forEach((m: any) => {
        const x = scales.x.getPixelForValue(m.index);
        const y = chartArea.bottom + 40;
        ctx.fillText(m.label, x, y);
      });

      ctx.restore();
    },
  }), [timelineChartData]);

  const paymentsMonthsPlugin = useMemo(() => ({
    id: 'paymentsMonthsPlugin',
    afterDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      const months = paymentsChartData?.months;
      
      if (!months || months.length === 0) return;

      ctx.save();
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';

      months.forEach((m: any) => {
        const x = scales.x.getPixelForValue(m.index);
        const y = chartArea.bottom + 40;
        ctx.fillText(m.label, x, y);
      });

      ctx.restore();
    },
  }), [paymentsChartData]);

  return (
    <div className="box" style={{ backgroundColor: '#fff' }}>
      {/* HEADER */}
      <header
        className="is-flex is-justify-content-space-between is-align-items-center"
        onClick={() => setOpen((v) => !v)}
        style={{ cursor: "pointer", borderBottom: '2px solid #f0f0f0', paddingBottom: '1rem' }}
      >
        <div>
          <h3 className="title is-5" style={{ marginBottom: '0.25rem' }}>📊 Informe de Cosecha</h3>
          <p className="is-size-7 has-text-grey">Campo: {fieldName}</p>
        </div>
        <button className="button is-small is-ghost">
          {open ? "▼" : "▶"}
        </button>
      </header>

      {/* CONTENIDO COLAPSABLE */}
      {open && (
        <div className="mt-4">
          {loading && (
            <progress className="progress is-primary" max="100">
              Cargando...
            </progress>
          )}

          {error && (
            <div className="notification is-danger">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {!loading && !error && summary.length === 0 && (
            <div className="notification is-warning">
              <p className="has-text-weight-bold mb-2">No hay datos disponibles.</p>
              <details className="mt-3">
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  🔍 Ver información de debug
                </summary>
                <div className="content mt-2" style={{ fontSize: '0.85rem' }}>
                  <p><strong>Campo ID:</strong> {fieldId}</p>
                  <p><strong>Campo:</strong> {fieldName}</p>
                  <p><strong>Cosecha:</strong> {filters?.harvestName || 'No especificada'}</p>
                  <p><strong>Especie:</strong> {filters?.specie || 'Todas'}</p>
                  <p><strong>Variedad:</strong> {filters?.variety || 'Todas'}</p>
                  <p><strong>Fecha inicio:</strong> {startDate || 'No especificada'}</p>
                  <p><strong>Fecha fin:</strong> {endDate || 'No especificada'}</p>
                  <p className="mt-3">
                    <strong>Sugerencias:</strong><br/>
                    • Revisa la consola del navegador (F12) para ver los logs detallados<br/>
                    • Verifica que el campo y cosecha seleccionados tengan datos<br/>
                    • Intenta ampliar el rango de fechas
                  </p>
                </div>
              </details>
            </div>
          )}

          {!loading && !error && summary.length > 0 && (
            <>
              {/* TABLA DE KPIs */}
              <div className="box" style={{ backgroundColor: '#fff', border: '1px solid #dee2e6' }}>
                <div className="table-container">
                  <table className="table is-fullwidth is-bordered is-hoverable" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1f2937', color: '#fff' }}>
                        <th>Variedad</th>
                        <th>Kg Totales</th>
                        <th>Superficie</th>
                        <th>Kg/ha</th>
                        <th>Costo/Kg</th>
                        <th>Pago/Kg</th>
                        <th>Kg/Cosechero</th>
                        <th>% M. Interno</th>
                        <th>% Exp. Campo</th>
                        <th>% Exp. Procesos</th>
                        <th>% Exp. Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((row, i) => (
                        <tr key={i}>
                          <td><strong>{row.variety ?? "—"}</strong></td>
                          <td>{Number(row.kg_totales ?? 0).toLocaleString()}</td>
                          <td>{Number(row.superficie_ha ?? 0).toFixed(2)}</td>
                          <td>{Number(row.kg_por_ha ?? 0).toLocaleString()}</td>
                          <td>{row.costo_total_kg ? Number(row.costo_total_kg).toFixed(2) : "—"}</td>
                          <td>{row.pago_kg ? Number(row.pago_kg).toLocaleString() : "—"}</td>
                          <td>{Number(row.kg_por_cosechero ?? 0).toLocaleString()}</td>
                          <td>{Number(row.pct_mercado_interno ?? 0).toFixed(0)}%</td>
                          <td>{Number(row.pct_exportacion_campo ?? 0).toFixed(0)}%</td>
                          <td>{Number(row.pct_exportacion_procesos ?? 0).toFixed(0)}%</td>
                          <td>{Number(row.pct_exportacion_final ?? 0).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GRÁFICO 1: KILOS COSECHADOS + COSECHEROS */}
              {timelineChartData && (
                <div className="box" style={{ backgroundColor: '#fff', border: '1px solid #dee2e6' }}>
                  <h4 
                    className="title is-5 mb-4" 
                    style={{ 
                      textTransform: 'uppercase', 
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center',
                      letterSpacing: '0.5px'
                    }}
                  >
                    KILOS COSECHADOS Y CANTIDAD COSECHEROS
                  </h4>
                  <div style={{ height: "500px" }}>
                    <Chart 
                      type="bar" 
                      data={timelineChartData} 
                      options={timelineChartOptions}
                      plugins={[timelineMonthsPlugin]}
                    />
                  </div>
                </div>
              )}

              {/* GRÁFICO 2: KG/COSECHERO + PAGO/KG */}
              {paymentsChartData && (
                <div className="box" style={{ backgroundColor: '#fff', border: '1px solid #dee2e6' }}>
                  <h4 
                    className="title is-5 mb-4" 
                    style={{ 
                      textTransform: 'uppercase', 
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center',
                      letterSpacing: '0.5px'
                    }}
                  >
                    KG/PERSONA Y PAGO/KG
                  </h4>
                  <div style={{ height: "500px" }}>
                    <Chart 
                      type="bar" 
                      data={paymentsChartData} 
                      options={paymentsChartOptions}
                      plugins={[paymentsMonthsPlugin]}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}