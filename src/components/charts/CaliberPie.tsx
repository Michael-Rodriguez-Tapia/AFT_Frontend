import React from "react";
import { Pie } from "react-chartjs-2";
import { CaliberStat } from "../AnalyticsPaneltypes";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar módulos obligatorios
ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: CaliberStat[];
}

export default function CaliberPie({ data }: Props) {
  if (!data || data.length === 0) return <p>No hay datos de calibres…</p>;

  // Normalización segura 0–1 → 0–100
  const normalize = (value: unknown): number => {
    const num = Number(value);
    if (isNaN(num) || num < 0) return 0;
    if (num <= 1) return num * 100;
    return num;
  };

  const chartData = {
    labels: data.map((x) => x.caliber ?? "N/A"),
    datasets: [
      {
        label: "% Calibre",
        data: data.map((x) => normalize(x.porcentaje)),
        backgroundColor: [
          "#2ecc71",
          "#3498db",
          "#9b59b6",
          "#e67e22",
          "#e74c3c",
          "#1abc9c",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
    },
  };

  return <Pie data={chartData} options={options} />;
}
