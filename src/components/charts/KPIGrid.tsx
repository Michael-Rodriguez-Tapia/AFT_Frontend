export default function KPIGrid({ kpis }: { kpis: any }) {
  if (!kpis) return null;

  return (
    <div className="columns is-multiline">

      <div className="column is-3">
        <div className="notification is-primary has-text-centered">
          <p className="title is-4">{Number(kpis.peso_total).toLocaleString()}</p>
          <p className="subtitle is-6">Peso total (kg)</p>
        </div>
      </div>

      <div className="column is-3">
        <div className="notification is-info has-text-centered">
          <p className="title is-4">{kpis.total_entregas}</p>
          <p className="subtitle is-6">Entregas</p>
        </div>
      </div>

      <div className="column is-3">
        <div className="notification is-warning has-text-centered">
          <p className="title is-4">{kpis.total_bins}</p>
          <p className="subtitle is-6">Bins</p>
        </div>
      </div>

      <div className="column is-3">
        <div className="notification is-success has-text-centered">
          <p className="title is-6">
            {kpis.fecha_inicio ? new Date(kpis.fecha_inicio).toLocaleDateString() : "—"}
          </p>
          <p className="subtitle is-6">Inicio cosecha</p>
        </div>
      </div>

    </div>
  );
}
