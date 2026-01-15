import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type TimelinePoint = {
  fecha: string;
  peso_total: number;
  bins_total: number;
};

export default function TimelineChart({ data }: { data: TimelinePoint[] }) {
  if (!data || data.length === 0) return <p>No hay datos para mostrar.</p>;

  const chartData = {
    labels: data.map((d) => d.fecha),
    datasets: [
      {
        label: "Peso total (kg)",
        data: data.map((d) => d.peso_total),
        borderColor: "#42A5F5",
        backgroundColor: "rgba(66,165,245,0.3)",
        yAxisID: "y1",
      },
      {
        label: "Bins",
        data: data.map((d) => d.bins_total),
        borderColor: "#FFB300",
        backgroundColor: "rgba(255,179,0,0.3)",
        yAxisID: "y2",
      },
    ],
  };

  const options: any = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    scales: {
      y1: { type: "linear", position: "left", title: { text: "Peso", display: true } },
      y2: { type: "linear", position: "right", title: { text: "Bins", display: true } },
    },
  };

  return <Line data={chartData} options={options} />;
}
