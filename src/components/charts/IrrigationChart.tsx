import React from "react";
import { Bar } from "react-chartjs-2";
import { IrrigationRow } from "../AnalyticsPaneltypes";
import { ChartOptions } from "chart.js";

interface Props {
  rows: IrrigationRow[];
}

export default function IrrigationChart({ rows }: Props) {
  if (!rows || rows.length === 0) return <p>No hay datos de riego…</p>;

  const safeNumber = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

  // Si existe fecha, mostramos el año entre paréntesis. Si no, solo el sector.
  const labels = rows.map((r) => {
    if (r.fecha) {
      const year = new Date(r.fecha).getFullYear();
      return `${r.sector} (${year})`;
    }
    return r.sector;
  });

  const dataKgHa = rows.map((r) => safeNumber(r.kg_ha));

  const colors = [
    "#2980b9",
    "#27ae60",
    "#8e44ad",
    "#f39c12",
    "#c0392b",
    "#16a085",
    "#2c3e50",
  ].slice(0, rows.length);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Kg/Ha",
        data: dataKgHa,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Kg/Ha: ${ctx.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `${val} Kg/Ha`,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
