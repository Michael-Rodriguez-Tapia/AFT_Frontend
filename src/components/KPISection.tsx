import { useEffect, useState } from "react";
import axios from "axios";

interface KPIData {
  workspace_name: string;
  total_entregas: string;
  peso_total: string;
  ultima_entrega: string;
}

export default function KPISection({ fieldName }: { fieldName: string }) {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${apiUrl}/harvests/deliveries/summary`, {
          params: { workspace: fieldName },
        });

        const record = Array.isArray(res.data.summary)
          ? res.data.summary[0]
          : res.data.summary;

        setData(record || null);
      } catch (err) {
        console.error("❌ Error al cargar KPIs:", err);
        setError("No se pudieron cargar los KPIs del campo.");
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, [fieldName]);

  if (loading) return <p className="text-gray-500">Cargando métricas...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p>No hay datos de KPI disponibles para este campo.</p>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        Indicadores de {data.workspace_name}
      </h2>
      <ul className="text-gray-700 space-y-2">
        <li>🌿 <strong>Total Entregas:</strong> {data.total_entregas}</li>
        <li>⚖️ <strong>Peso Total:</strong> {data.peso_total} kg</li>
        <li>📅 <strong>Última Entrega:</strong> {new Date(data.ultima_entrega).toLocaleDateString()}</li>
      </ul>
    </div>
  );
}
