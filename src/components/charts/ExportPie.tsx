import React from "react";
import { Pie } from "react-chartjs-2";
import { ExportStat } from "../AnalyticsPaneltypes";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar módulos necesarios
ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: ExportStat[];
}

export default function ExportPie({ data }: Props) {
  if (!data || data.length === 0) return <p>No hay datos de exportación…</p>;

  // Normaliza valores para evitar NaN
  const safeNumber = (v: unknown) => {
    const num = Number(v);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  // Genera colores dinámicos según número de destinos
  const generateColors = (count: number) => {
    const baseColors = [
      "#27ae60",
      "#2980b9",
      "#8e44ad",
      "#f39c12",
      "#c0392b",
      "#16a085",
      "#34495e",
      "#d35400",
      "#2ecc71",
      "#9b59b6",
    ];

    // Si hay más destinos que colores base → recicla
    return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
  };

  const labels = data.map((x) => x.destino ?? "N/A");
  const kilos = data.map((x) => safeNumber(x.kilos));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Kg exportados",
        data: kilos,
        backgroundColor: generateColors(data.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw;
            return `${value.toLocaleString("es-CL")} kg`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}
