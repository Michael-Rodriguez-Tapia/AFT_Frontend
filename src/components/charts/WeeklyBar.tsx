import React from "react";
import { Bar } from "react-chartjs-2";
import { WeeklyPoint } from "../AnalyticsPaneltypes";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

// Registro de módulos obligatorios
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  data: WeeklyPoint[];
}

export default function WeeklyBar({ data }: Props) {
  if (!data || data.length === 0) return <p>No hay datos semanales…</p>;

  const chartData = {
    labels: data.map((x) => `Semana ${x.semana}`),
    datasets: [
      {
        label: "Kg cosechados",
        data: data.map((x) => Number(x.peso_total ?? 0)),
        backgroundColor: "rgba(46, 204, 113, 0.7)",
        borderColor: "rgba(39, 174, 96, 1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
