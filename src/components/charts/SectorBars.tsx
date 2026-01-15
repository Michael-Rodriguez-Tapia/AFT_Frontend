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

export default function SectorBars({ summary }: { summary: any[] }) {
  if (!summary || summary.length === 0) return <p>No hay datos sectorizados.</p>;

  const chartData = {
    labels: summary.map((s) => s.space_name),
    datasets: [
      {
        label: "Peso total (kg)",
        data: summary.map((s) => Number(s.peso_total || 0)),
        backgroundColor: "rgba(76,175,80,0.6)",
      },
    ],
  };

  return <Bar data={chartData} />;
}
