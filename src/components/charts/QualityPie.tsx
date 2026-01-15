import React from "react";
import { Pie } from "react-chartjs-2";
import { QualityStat } from "../AnalyticsPaneltypes";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

// ✔ Registro obligatorio para Pie charts
ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: QualityStat[];
}

export default function QualityPie({ data }: Props) {
  if (!data || data.length === 0) return <p>No hay inspecciones registradas…</p>;

  // Normaliza porcentaje: si viene entre 0–1 → conviértelo a % real
  const normalizePercent = (p: unknown) => {
    const n = Number(p);
    if (isNaN(n) || n < 0) return 0;
    return n <= 1 ? n * 100 : n;
  };

  const safeText = (v: unknown, fallback = "N/A") =>
    typeof v === "string" && v.trim() !== "" ? v : fallback;

  // Paleta profesional
  const palette = [
    "#f1c40f",
    "#e67e22",
    "#e74c3c",
    "#9b59b6",
    "#2ecc71",
    "#3498db",
    "#1abc9c",
    "#34495e",
    "#8e44ad",
    "#d35400"
  ];

  const chartData = {
    labels: data.map((x) => safeText(x.defecto, "Defecto")),
    datasets: [
      {
        label: "% del total",
        data: data.map((x) => normalizePercent(x.porcentaje)),
        backgroundColor: data.map((_, i) => palette[i % palette.length]),
        borderColor: "#ffffff",
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const pct = normalizePercent(ctx.raw).toFixed(1);
            const row = data[ctx.dataIndex];
            const cantidad = row.cantidad ?? null;

            if (cantidad !== null) {
              return `${pct}% — ${cantidad} unidades`;
            }
            return `${pct}%`;
          }
        }
      }
    }
  };

  return <Pie data={chartData} options={options} />;
}
