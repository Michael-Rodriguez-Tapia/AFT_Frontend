import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function VarietiesPieChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p>No hay variedades registradas.</p>;

  const chartData = {
    labels: data.map((v) => v.variety_name || "Sin nombre"),
    datasets: [
      {
        data: data.map((v) => Number(v.peso_total)),
        backgroundColor: ["#4CAF50", "#FF7043", "#42A5F5", "#AB47BC", "#FFA726"],
      },
    ],
  };

  return <Pie data={chartData} />;
}
