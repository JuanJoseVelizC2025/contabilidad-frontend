"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Encabezado, useAviso } from "@/components/ui";
import EncabezadoReporte from "@/components/EncabezadoReporte";

export default function BalanzaPage() {
  const aviso = useAviso();
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState(null);

  async function generar(e) {
    e.preventDefault();
    try {
      setDatos(await api(`/api/reportes/balanza?hasta=${hasta}`));
    } catch (err) {
      setDatos(null);
      aviso.error(err.message);
    }
  }

  const iguales = datos && Math.round(datos.totalDebe * 100) === Math.round(datos.totalHaber * 100);

  return (
    <div>
      <div className="print:hidden">
        <Encabezado
          titulo="Balanza de comprobación"
          descripcion="Sumas y saldos de todas las cuentas a una fecha de corte"
        />

        <form onSubmit={generar} className="card mb-4 flex max-w-5xl items-end gap-3 p-3">
          <div>
            <label className="label">Al (fecha de corte)</label>
            <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            Generar
          </button>
          {datos && (
            <button type="button" className="btn" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir / PDF
            </button>
          )}
        </form>
      </div>

      {datos && (
        <div>
          <EncabezadoReporte titulo="Balanza de comprobación" subtitulo={`Al ${datos.hasta}`} />

          {datos.cuentas.length === 0 ? (
            <p className="text-muted">No hay movimientos a esa fecha.</p>
          ) : (
            <div className="card max-w-5xl overflow-hidden print:border-0">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cuenta</th>
                    <th className="text-right">Suma Debe</th>
                    <th className="text-right">Suma Haber</th>
                    <th className="text-right">Saldo deudor</th>
                    <th className="text-right">Saldo acreedor</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.cuentas.map((c) => (
                    <tr key={c.codigo}>
                      <td className="font-mono">{c.codigo}</td>
                      <td>{c.nombre}</td>
                      <td className="text-right">{dinero(c.debe)}</td>
                      <td className="text-right">{dinero(c.haber)}</td>
                      <td className="text-right">{c.saldoDeudor > 0 ? dinero(c.saldoDeudor) : ""}</td>
                      <td className="text-right">{c.saldoAcreedor > 0 ? dinero(c.saldoAcreedor) : ""}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan={2} className="text-right">
                      Totales
                    </td>
                    <td className="text-right">{dinero(datos.totalDebe)}</td>
                    <td className="text-right">{dinero(datos.totalHaber)}</td>
                    <td className="text-right">{dinero(datos.totalSaldoDeudor)}</td>
                    <td className="text-right">{dinero(datos.totalSaldoAcreedor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <p className="mt-3">
            {iguales ? (
              <span className="badge badge-ok">Las sumas del Debe y del Haber son iguales</span>
            ) : (
              <span className="badge badge-error">Las sumas no coinciden</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}