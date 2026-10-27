"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy, primerDiaMes } from "@/lib/formato";
import { Encabezado, useAviso } from "@/components/ui";
import EncabezadoReporte from "@/components/EncabezadoReporte";
import BotonExcel from "@/components/BotonExcel";

export default function DiarioPage() {
  const aviso = useAviso();
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState(null);

  async function generar(e) {
    e.preventDefault();
    try {
      setDatos(await api(`/api/reportes/diario?desde=${desde}&hasta=${hasta}`));
    } catch (err) {
      setDatos(null);
      aviso.error(err.message);
    }
  }

  return (
    <div>
      <div className="print:hidden">
        <Encabezado titulo="Libro Diario" descripcion="Registro cronológico de todas las partidas del rango" />

        <form onSubmit={generar} className="card mb-4 flex max-w-4xl items-end gap-3 p-3">
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} required />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            Generar
          </button>
          {datos && (
            <>
              <button type="button" className="btn" onClick={() => window.print()}>
                <Printer size={15} /> Imprimir / PDF
              </button>
              <BotonExcel archivo="libro-diario" titulo="Libro Diario" />
            </>
          )}
        </form>
      </div>

      {datos && (
        <div>
          <EncabezadoReporte titulo="Libro Diario" subtitulo={`Del ${datos.desde} al ${datos.hasta}`} />

          {datos.partidas.length === 0 ? (
            <p className="text-muted">No hay partidas en ese rango.</p>
          ) : (
            <div className="card max-w-4xl overflow-hidden print:border-0">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cuenta</th>
                    <th className="text-right">Debe</th>
                    <th className="text-right">Haber</th>
                  </tr>
                </thead>
                {datos.partidas.map((p, i) => (
                  <tbody key={i}>
                    <tr className="bg-slate-100 font-semibold">
                      <td colSpan={4}>
                        Partida No. {p.numero} · {p.fecha} · {p.concepto}
                      </td>
                    </tr>
                    {p.lineas.map((l, j) => (
                      <tr key={j}>
                        <td className="font-mono">{l.codigo}</td>
                        <td>{l.cuenta}</td>
                        <td className="text-right">{l.debe > 0 ? dinero(l.debe) : ""}</td>
                        <td className="text-right">{l.haber > 0 ? dinero(l.haber) : ""}</td>
                      </tr>
                    ))}
                    <tr className="text-muted">
                      <td colSpan={2} className="text-right">
                        Suma de la partida
                      </td>
                      <td className="text-right">{dinero(p.totalDebe)}</td>
                      <td className="text-right">{dinero(p.totalHaber)}</td>
                    </tr>
                  </tbody>
                ))}
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan={2} className="text-right">
                      Totales del Diario
                    </td>
                    <td className="text-right">{dinero(datos.totalDebe)}</td>
                    <td className="text-right">{dinero(datos.totalHaber)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}