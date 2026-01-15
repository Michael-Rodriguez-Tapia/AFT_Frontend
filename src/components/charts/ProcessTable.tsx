import React from "react";
import { ProcessRow } from "../AnalyticsPaneltypes";

interface Props {
  rows: ProcessRow[];
}

export default function ProcessTable({ rows }: Props) {
  if (!rows || rows.length === 0)
    return <p>No hay datos de procesos…</p>;

  // --- Helpers de formato ---
  const fmtKg = (v: number | null | undefined) =>
    v == null ? "—" : Number(v).toLocaleString("es-CL");

  const fmtPct = (v: number | null | undefined) => {
    if (v == null) return "—";
    const pct = Number(v);
    return pct <= 1 ? (pct * 100).toFixed(1) + "%" : pct.toFixed(1) + "%";
  };

  return (
    <div className="table-container mt-4">
      <table className="table is-striped is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Pabellón</th>
            <th>Kg Cosechados</th>
            <th>Kg Export. Campo</th>
            <th>% Export Campo</th>
            <th>Kg Primario</th>
            <th>% Primario</th>
            <th>Kg Secundario</th>
            <th>% Secundario</th>
            <th>Kg Export Final</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="has-text-weight-semibold">{r.pabellon}</td>

              <td>{fmtKg(r.kg_cosechados)}</td>

              <td>{fmtKg(r.kg_export_campo)}</td>
              <td className="has-text-info">{fmtPct(r.pct_export_campo)}</td>

              <td>{fmtKg(r.kg_procesado_primario)}</td>
              <td className="has-text-success">{fmtPct(r.pct_primario)}</td>

              <td>{fmtKg(r.kg_procesado_secundario)}</td>
              <td className="has-text-warning">{fmtPct(r.pct_secundario)}</td>

              <td className="has-text-weight-semibold has-text-primary">
                {fmtKg(r.kg_export_final)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
