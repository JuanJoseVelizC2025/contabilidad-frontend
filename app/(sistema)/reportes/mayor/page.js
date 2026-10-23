"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dinero, hoy, primerDiaMes } from "@/lib/formato";
import EncabezadoReporte from "@/components/EncabezadoReporte";

export default function MayorPage() {
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [idCuenta, setIdCuenta] = useState("");
  const [cuentas, setCuentas] = useState([]);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/cuentas")
      .then((lista) => setCuentas(lista.filter((c) => c.aceptaMovimientos)))
      .catch((e) => setError(e.message));
  }, []);

  async function generar(e) {
    e.preventDefault();
    setError("");
    const filtro = idCuenta ? `&idCuenta=${idCuenta}` : "";
    try {
      setDatos(await api(`/api/reportes/mayor?desde=${desde}&hasta=${hasta}${filtro}`));
    } catch (err) {
      setDatos(null);
      setError(err.message);
    }
  }

  return (
    <div>
      <form onSubmit={generar} className="mb-6 flex max-w-4xl flex-wrap items-end gap-3 rounded bg-white p-4 shadow print:hidden">
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
        <div>
          <label className="mb-1 block text-sm font-medium">Cuenta</label>
          <select
            className="rounded border border-gray-300 px-2 py-1"
            value={idCuenta}
            onChange={(e) => setIdCuenta(e.target.value)}
          >
            <option value="">Todas las cuentas</option>
            {cuentas.map((c) => (
              <option key={c.idCuenta} value={c.idCuenta}>
                {c.codigo} - {c.nombre}
              </option>
            ))}
          </select>
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
          <EncabezadoReporte titulo="Libro Mayor General" subtitulo={`Del ${datos.desde} al ${datos.hasta}`} />

          {datos.cuentas.length === 0 && <p className="text-sm text-gray-500">No hay movimientos en ese rango.</p>}

          {datos.cuentas.map((c) => (
            <div key={c.codigo} className="mb-6 max-w-4xl break-inside-avoid rounded bg-white p-4 shadow print:shadow-none">
              <div className="mb-2 flex justify-between">
                <h2 className="font-semibold">
                  {c.codigo} - {c.cuenta}
                </h2>
                <span className="text-sm text-gray-600">Naturaleza {c.naturaleza}</span>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-2 py-1">Fecha</th>
                    <th className="px-2 py-1">No.</th>
                    <th className="px-2 py-1">Concepto</th>
                    <th className="px-2 py-1 text-right">Debe</th>
                    <th className="px-2 py-1 text-right">Haber</th>
                    <th className="px-2 py-1 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-2 py-1">Saldo inicial</td>
                    <td className="px-2 py-1 text-right">{dinero(c.saldoInicial)}</td>
                  </tr>
                  {c.movimientos.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{m.fecha}</td>
                      <td className="px-2 py-1">{m.numero}</td>
                      <td className="px-2 py-1">{m.concepto}</td>
                      <td className="px-2 py-1 text-right">{m.debe > 0 ? dinero(m.debe) : ""}</td>
                      <td className="px-2 py-1 text-right">{m.haber > 0 ? dinero(m.haber) : ""}</td>
                      <td className="px-2 py-1 text-right">{dinero(m.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={3} className="px-2 py-1 text-right">Totales / Saldo final</td>
                    <td className="px-2 py-1 text-right">{dinero(c.totalDebe)}</td>
                    <td className="px-2 py-1 text-right">{dinero(c.totalHaber)}</td>
                    <td className="px-2 py-1 text-right">{dinero(c.saldoFinal)}</td>
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