"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy, primerDiaMes } from "@/lib/formato";
import { Encabezado, useAviso } from "@/components/ui";
import EncabezadoReporte from "@/components/EncabezadoReporte";
import BotonExcel from "@/components/BotonExcel";
import { GraficasMayor } from "@/components/GraficasReportes";

export default function MayorPage() {
  const aviso = useAviso();
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [idCuenta, setIdCuenta] = useState("");
  const [cuentas, setCuentas] = useState([]);
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    api("/api/cuentas")
      .then((lista) => setCuentas(lista.filter((c) => c.aceptaMovimientos)))
      .catch((e) => aviso.error(e.message));
  }, []);

  async function generar(e) {
    e.preventDefault();
    const filtro = idCuenta ? `&idCuenta=${idCuenta}` : "";
    try {
      setDatos(await api(`/api/reportes/mayor?desde=${desde}&hasta=${hasta}${filtro}`));
    } catch (err) {
      setDatos(null);
      aviso.error(err.message);
    }
  }

  return (
    <div>
      <div className="print:hidden">
        <Encabezado titulo="Libro Mayor General" descripcion="Movimientos y saldo acumulado de cada cuenta" />

        <form onSubmit={generar} className="card mb-4 flex max-w-4xl flex-wrap items-end gap-3 p-3">
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} required />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
          </div>
          <div className="min-w-56 flex-1">
            <label className="label">Cuenta</label>
            <select className="input" value={idCuenta} onChange={(e) => setIdCuenta(e.target.value)}>
              <option value="">Todas las cuentas</option>
              {cuentas.map((c) => (
                <option key={c.idCuenta} value={c.idCuenta}>
                  {c.codigo} - {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Generar
          </button>
          {datos && (
            <>
              <button type="button" className="btn" onClick={() => window.print()}>
                <Printer size={15} /> Imprimir / PDF
              </button>
              <BotonExcel archivo="libro-mayor" titulo="Libro Mayor General" />
            </>
          )}
        </form>
      </div>

      {datos && (
        <div>
          <EncabezadoReporte titulo="Libro Mayor General" subtitulo={`Del ${datos.desde} al ${datos.hasta}`} />
          <GraficasMayor datos={datos} />

          {datos.cuentas.length === 0 && <p className="text-muted">No hay movimientos en ese rango.</p>}

          {datos.cuentas.map((c) => (
            <div key={c.codigo} className="card mb-4 max-w-4xl overflow-hidden break-inside-avoid print:border-0">
              <div className="flex items-center justify-between border-b border-line bg-slate-50 px-4 py-2">
                <h2 className="font-semibold">
                  {c.codigo} - {c.cuenta}
                </h2>
                <span className="badge badge-gris">Naturaleza {c.naturaleza}</span>
              </div>

              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>No.</th>
                    <th>Concepto</th>
                    <th className="text-right">Debe</th>
                    <th className="text-right">Haber</th>
                    <th className="text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50">
                    <td colSpan={5}>Saldo inicial</td>
                    <td className="text-right">{dinero(c.saldoInicial)}</td>
                  </tr>
                  {c.movimientos.map((m, i) => (
                    <tr key={i}>
                      <td>{m.fecha}</td>
                      <td>{m.numero}</td>
                      <td>{m.concepto}</td>
                      <td className="text-right">{m.debe > 0 ? dinero(m.debe) : ""}</td>
                      <td className="text-right">{m.haber > 0 ? dinero(m.haber) : ""}</td>
                      <td className="text-right">{dinero(m.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={3} className="text-right">
                      Totales / Saldo final
                    </td>
                    <td className="text-right">{dinero(c.totalDebe)}</td>
                    <td className="text-right">{dinero(c.totalHaber)}</td>
                    <td className="text-right">{dinero(c.saldoFinal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}