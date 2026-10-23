"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { dinero, hoy, primerDiaMes } from "@/lib/formato";
import EncabezadoReporte from "@/components/EncabezadoReporte";

export default function DiarioPage() {
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  async function generar(e) {
    e.preventDefault();
    setError("");
    try {
      setDatos(await api(`/api/reportes/diario?desde=${desde}&hasta=${hasta}`));
    } catch (err) {
      setDatos(null);
      setError(err.message);
    }
  }

  return (
    <div>
      <form onSubmit={generar} className="mb-6 flex max-w-4xl items-end gap-3 rounded bg-white p-4 shadow print:hidden">
        <div>
          <label className="mb-1 block text-sm font-medium">Desde</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-2 py-1"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Hasta</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-2 py-1"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="rounded bg-slate-800 px-4 py-1.5 text-white hover:bg-slate-700">
          Generar
        </button>
        {datos && (
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-slate-800 px-4 py-1.5 hover:bg-slate-100"
          >
            Imprimir / PDF
          </button>
        )}
      </form>

      {error && <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800 print:hidden">{error}</p>}

      {datos && (
        <div>
          <EncabezadoReporte titulo="Libro Diario" subtitulo={`Del ${datos.desde} al ${datos.hasta}`} />

          {datos.partidas.length === 0 ? (
            <p className="text-sm text-gray-500">No hay partidas en ese rango.</p>
          ) : (
            <table className="w-full max-w-4xl bg-white text-sm shadow print:shadow-none">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Cuenta</th>
                  <th className="px-3 py-2 text-right">Debe</th>
                  <th className="px-3 py-2 text-right">Haber</th>
                </tr>
              </thead>
              {datos.partidas.map((p, i) => (
                <tbody key={i} className="border-t">
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-3 py-2">
                      Partida No. {p.numero} · {p.fecha} · {p.concepto}
                    </td>
                  </tr>
                  {p.lineas.map((l, j) => (
                    <tr key={j}>
                      <td className="px-3 py-1 font-mono">{l.codigo}</td>
                      <td className="px-3 py-1">{l.cuenta}</td>
                      <td className="px-3 py-1 text-right">{l.debe > 0 ? dinero(l.debe) : ""}</td>
                      <td className="px-3 py-1 text-right">{l.haber > 0 ? dinero(l.haber) : ""}</td>
                    </tr>
                  ))}
                  <tr className="text-gray-600">
                    <td colSpan={2} className="px-3 py-1 text-right">Suma de la partida</td>
                    <td className="px-3 py-1 text-right">{dinero(p.totalDebe)}</td>
                    <td className="px-3 py-1 text-right">{dinero(p.totalHaber)}</td>
                  </tr>
                </tbody>
              ))}
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={2} className="px-3 py-2 text-right">Totales del Diario</td>
                  <td className="px-3 py-2 text-right">{dinero(datos.totalDebe)}</td>
                  <td className="px-3 py-2 text-right">{dinero(datos.totalHaber)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}