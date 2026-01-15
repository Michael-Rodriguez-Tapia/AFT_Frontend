import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function HistogramChart({ values = [] }: { values: number[] }) {
  if (!values || values.length === 0) return <p>No hay mediciones.</p>;

  // Bucket básico
  const buckets = new Array(10).fill(0);
  values.forEach((v) => {
    const idx = Math.min(Math.floor(v / 10), 9);
    buckets[idx]++;
  });

  const chartData = {
    labels: buckets.map((_, i) => `${i * 10} - ${i * 10 + 9}`),
    datasets: [
      {
        label: "Cantidad",
        data: buckets,
        backgroundColor: "rgba(66,165,245,0.6)",
      },
    ],
  };

  return <Bar data={chartData} />;
}
