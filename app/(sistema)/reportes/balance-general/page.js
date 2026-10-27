"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Encabezado, useAviso } from "@/components/ui";
import EncabezadoReporte from "@/components/EncabezadoReporte";

function Seccion({ titulo, bloque, extra }) {
  return (
    <>
      <tr className="bg-slate-100 font-semibold">
        <td colSpan={3}>{titulo}</td>
      </tr>
      {bloque.cuentas.map((c) => (
        <tr key={c.codigo}>
          <td className="font-mono">{c.codigo}</td>
          <td>{c.nombre}</td>
          <td className="text-right">{dinero(c.saldo)}</td>
        </tr>
      ))}
      {extra}
      <tr className="border-t font-semibold">
        <td colSpan={2} className="text-right">
          Total {titulo.toLowerCase()}
        </td>
        <td className="text-right">{dinero(bloque.total + (extra ? extra.props.valor : 0))}</td>
      </tr>
    </>
  );
}

export default function BalanceGeneralPage() {
  const aviso = useAviso();
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState(null);

  async function generar(e) {
    e.preventDefault();
    try {
      setDatos(await api(`/api/reportes/balance-general?hasta=${hasta}`));
    } catch (err) {
      setDatos(null);
      aviso.error(err.message);
    }
  }

  const filaResultado = datos && (
    <tr key="resultado" valor={datos.resultadoEjercicio}>
      <td className="font-mono"></td>
      <td>Resultado del ejercicio</td>
      <td className="text-right">{dinero(datos.resultadoEjercicio)}</td>
    </tr>
  );

  return (
    <div>
      <div className="print:hidden">
        <Encabezado
          titulo="Balance General"
          descripcion="Situación financiera de la empresa a una fecha de corte"
        />

        <form onSubmit={generar} className="card mb-4 flex max-w-4xl items-end gap-3 p-3">
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
          <EncabezadoReporte titulo="Balance General" subtitulo={`Al ${datos.hasta}`} />

          <div className="card max-w-4xl overflow-hidden print:border-0">
            <table className="tabla">
              <tbody>
                <Seccion titulo="Activo" bloque={datos.activo} />
                <Seccion titulo="Pasivo" bloque={datos.pasivo} />
                <Seccion titulo="Capital" bloque={datos.capital} extra={filaResultado} />
                <tr className="border-t-2 bg-slate-100 font-bold">
                  <td colSpan={2} className="text-right">
                    Total pasivo y capital
                  </td>
                  <td className="text-right">{dinero(datos.totalPasivoCapital)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3">
            {datos.cuadra ? (
              <span className="badge badge-ok">El balance cuadra: Activo = Pasivo + Capital</span>
            ) : (
              <span className="badge badge-error">El balance no cuadra</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}