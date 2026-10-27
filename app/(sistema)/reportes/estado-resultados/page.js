"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy, primerDiaMes } from "@/lib/formato";
import { Encabezado, useAviso } from "@/components/ui";
import EncabezadoReporte from "@/components/EncabezadoReporte";
import BotonExcel from "@/components/BotonExcel";

function Seccion({ titulo, bloque }) {
  return (
    <>
      <tr className="bg-slate-100 font-semibold">
        <td colSpan={3}>{titulo}</td>
      </tr>
      {bloque.cuentas.map((c) => (
        <tr key={c.codigo}>
          <td className="font-mono">{c.codigo}</td>
          <td>{c.cuenta}</td>
          <td className="text-right">{dinero(c.saldo)}</td>
        </tr>
      ))}
      <tr className="border-t font-semibold">
        <td colSpan={2} className="text-right">
          Total {titulo.toLowerCase()}
        </td>
        <td className="text-right">{dinero(bloque.total)}</td>
      </tr>
    </>
  );
}

export default function EstadoResultadosPage() {
  const aviso = useAviso();
  const [modo, setModo] = useState("periodo");
  const [periodos, setPeriodos] = useState([]);
  const [idPeriodo, setIdPeriodo] = useState("");
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    api("/api/periodos")
      .then((lista) => {
        setPeriodos(lista);
        if (lista.length > 0) setIdPeriodo(String(lista[0].idPeriodo));
      })
      .catch((e) => aviso.error(e.message));
  }, []);

  async function generar(e) {
    e.preventDefault();
    const ruta =
      modo === "periodo"
        ? `/api/reportes/estado-resultados?idPeriodo=${idPeriodo}`
        : `/api/reportes/estado-resultados?desde=${desde}&hasta=${hasta}`;
    try {
      setDatos(await api(ruta));
    } catch (err) {
      setDatos(null);
      aviso.error(err.message);
    }
  }

  return (
    <div>
      <div className="print:hidden">
        <Encabezado titulo="Estado de Resultados" descripcion="Ingresos, costos, gastos y utilidad del período" />

        <form onSubmit={generar} className="card mb-4 flex max-w-4xl flex-wrap items-end gap-3 p-3">
          <div>
            <label className="label">Filtrar por</label>
            <select className="input" value={modo} onChange={(e) => setModo(e.target.value)}>
              <option value="periodo">Período contable</option>
              <option value="rango">Rango de fechas</option>
            </select>
          </div>

          {modo === "periodo" ? (
            <div>
              <label className="label">Período</label>
              <select className="input" value={idPeriodo} onChange={(e) => setIdPeriodo(e.target.value)}>
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
                <label className="label">Desde</label>
                <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} required />
              </div>
              <div>
                <label className="label">Hasta</label>
                <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary">
            Generar
          </button>
          {datos && (
            <>
              <button type="button" className="btn" onClick={() => window.print()}>
                <Printer size={15} /> Imprimir / PDF
              </button>
              <BotonExcel archivo="estado-resultados" titulo="Estado de Resultados" />
            </>
          )}
        </form>
      </div>

      {datos && (
        <div>
          <EncabezadoReporte titulo="Estado de Resultados" subtitulo={`Del ${datos.desde} al ${datos.hasta}`} />

          <div className="card max-w-4xl overflow-hidden print:border-0">
            <table className="tabla">
              <tbody>
                <Seccion titulo="Ingresos" bloque={datos.ingresos} />
                <Seccion titulo="Costos" bloque={datos.costos} />
                <tr className="border-t-2 bg-slate-100 font-bold">
                  <td colSpan={2} className="text-right">
                    Utilidad bruta
                  </td>
                  <td className="text-right">{dinero(datos.utilidadBruta)}</td>
                </tr>
                <Seccion titulo="Gastos" bloque={datos.gastos} />
                <tr
                  className={`border-t-2 text-base font-bold ${
                    datos.utilidadNeta >= 0 ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
                  }`}
                >
                  <td colSpan={2} className="py-3 text-right">
                    {datos.utilidadNeta >= 0 ? "Utilidad neta" : "Pérdida neta"}
                  </td>
                  <td className="py-3 text-right">{dinero(datos.utilidadNeta)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}