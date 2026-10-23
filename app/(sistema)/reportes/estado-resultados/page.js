"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dinero, hoy, primerDiaMes } from "@/lib/formato";
import EncabezadoReporte from "@/components/EncabezadoReporte";

function Seccion({ titulo, bloque }) {
  return (
    <>
      <tr className="bg-gray-50 font-semibold">
        <td colSpan={3} className="px-3 py-2">{titulo}</td>
      </tr>
      {bloque.cuentas.map((c) => (
        <tr key={c.codigo}>
          <td className="px-3 py-1 font-mono">{c.codigo}</td>
          <td className="px-3 py-1">{c.cuenta}</td>
          <td className="px-3 py-1 text-right">{dinero(c.saldo)}</td>
        </tr>
      ))}
      <tr className="border-t font-semibold">
        <td colSpan={2} className="px-3 py-1 text-right">Total {titulo.toLowerCase()}</td>
        <td className="px-3 py-1 text-right">{dinero(bloque.total)}</td>
      </tr>
    </>
  );
}

export default function EstadoResultadosPage() {
  const [modo, setModo] = useState("periodo");
  const [periodos, setPeriodos] = useState([]);
  const [idPeriodo, setIdPeriodo] = useState("");
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/periodos")
      .then((lista) => {
        setPeriodos(lista);
        if (lista.length > 0) setIdPeriodo(String(lista[0].idPeriodo));
      })
      .catch((e) => setError(e.message));
  }, []);

  async function generar(e) {
    e.preventDefault();
    setError("");
    const ruta =
      modo === "periodo"
        ? `/api/reportes/estado-resultados?idPeriodo=${idPeriodo}`
        : `/api/reportes/estado-resultados?desde=${desde}&hasta=${hasta}`;
    try {
      setDatos(await api(ruta));
    } catch (err) {
      setDatos(null);
      setError(err.message);
    }
  }

  return (
    <div>
      <form onSubmit={generar} className="mb-6 flex max-w-4xl flex-wrap items-end gap-3 rounded bg-white p-4 shadow print:hidden">
        <div>
          <label className="mb-1 block text-sm font-medium">Filtrar por</label>
          <select
            className="rounded border border-gray-300 px-2 py-1"
            value={modo}
            onChange={(e) => setModo(e.target.value)}
          >
            <option value="periodo">Período contable</option>
            <option value="rango">Rango de fechas</option>
          </select>
        </div>

        {modo === "periodo" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Período</label>
            <select
              className="rounded border border-gray-300 px-2 py-1"
              value={idPeriodo}
              onChange={(e) => setIdPeriodo(e.target.value)}
            >
              {periodos.map((p) => (
                <option key={p.idPeriodo} value={p.idPeriodo}>
                  {String(p.mes).padStart(2, "0")}/{p.anio}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
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
          </>
        )}

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
          <EncabezadoReporte titulo="Estado de Resultados" subtitulo={`Del ${datos.desde} al ${datos.hasta}`} />

          <table className="w-full max-w-4xl bg-white text-sm shadow print:shadow-none">
            <tbody>
              <Seccion titulo="Ingresos" bloque={datos.ingresos} />
              <Seccion titulo="Costos" bloque={datos.costos} />
              <tr className="border-t-2 bg-slate-100 font-bold">
                <td colSpan={2} className="px-3 py-2 text-right">Utilidad bruta</td>
                <td className="px-3 py-2 text-right">{dinero(datos.utilidadBruta)}</td>
              </tr>
              <Seccion titulo="Gastos" bloque={datos.gastos} />
              <tr
                className={`border-t-2 font-bold ${
                  datos.utilidadNeta >= 0 ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
                }`}
              >
                <td colSpan={2} className="px-3 py-3 text-right">
                  {datos.utilidadNeta >= 0 ? "Utilidad neta" : "Pérdida neta"}
                </td>
                <td className="px-3 py-3 text-right">{dinero(datos.utilidadNeta)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}