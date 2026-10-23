"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function dinero(n) {
  return `Q ${Number(n || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const LINEA_VACIA = { idCuenta: "", debe: "", haber: "" };

export default function PartidasPage() {
  const [cuentas, setCuentas] = useState([]);
  const [lista, setLista] = useState([]);
  const [fecha, setFecha] = useState(hoy());
  const [concepto, setConcepto] = useState("");
  const [lineas, setLineas] = useState([{ ...LINEA_VACIA }, { ...LINEA_VACIA }]);
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", numero: "", concepto: "", estado: "" });
  const [detalle, setDetalle] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarLista(f = filtros) {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([clave, valor]) => {
      if (valor) params.append(clave, valor);
    });
    try {
      setLista(await api(`/api/partidas?${params.toString()}`));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    api("/api/cuentas")
      .then((c) => setCuentas(c.filter((x) => x.activa && x.aceptaMovimientos)))
      .catch((e) => setError(e.message));
    cargarLista();
  }, []);

  function cambiarLinea(i, campo, valor) {
    setLineas(
      lineas.map((l, idx) => {
        if (idx !== i) return l;
        const nueva = { ...l, [campo]: valor };
        if (campo === "debe" && Number(valor) > 0) nueva.haber = "";
        if (campo === "haber" && Number(valor) > 0) nueva.debe = "";
        return nueva;
      })
    );
  }

  function agregarLinea() {
    setLineas([...lineas, { ...LINEA_VACIA }]);
  }

  function quitarLinea(i) {
    if (lineas.length <= 2) return;
    setLineas(lineas.filter((_, idx) => idx !== i));
  }

  const totalDebe = Math.round(lineas.reduce((s, l) => s + Number(l.debe || 0), 0) * 100) / 100;
  const totalHaber = Math.round(lineas.reduce((s, l) => s + Number(l.haber || 0), 0) * 100) / 100;
  const cuadra = totalDebe > 0 && totalDebe === totalHaber;
  const lineasCompletas = lineas.every(
    (l) => l.idCuenta && (Number(l.debe) > 0 || Number(l.haber) > 0)
  );
  const puedeGuardar = cuadra && lineasCompletas && concepto.trim() !== "" && fecha !== "";

  async function guardar(e) {
    e.preventDefault();
    setMensaje("");
    setError("");
    try {
      const r = await api("/api/partidas", {
        method: "POST",
        body: {
          fecha,
          concepto,
          detalle: lineas.map((l) => ({
            idCuenta: Number(l.idCuenta),
            debe: Number(l.debe || 0),
            haber: Number(l.haber || 0),
          })),
        },
      });
      setMensaje(`Partida No. ${r.numero} registrada`);
      setConcepto("");
      setLineas([{ ...LINEA_VACIA }, { ...LINEA_VACIA }]);
      cargarLista();
    } catch (err) {
      setError(err.message);
    }
  }

  async function ver(id) {
    setError("");
    try {
      setDetalle(await api(`/api/partidas/${id}`));
      setMotivo("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function anular() {
    setError("");
    try {
      await api(`/api/partidas/${detalle.idPartida}/anular`, {
        method: "PUT",
        body: { motivo },
      });
      setMensaje(`Partida No. ${detalle.numero} anulada`);
      setDetalle(null);
      cargarLista();
    } catch (err) {
      setError(err.message);
    }
  }

  function buscar(e) {
    e.preventDefault();
    cargarLista(filtros);
  }

  function limpiarFiltros() {
    const vacios = { desde: "", hasta: "", numero: "", concepto: "", estado: "" };
    setFiltros(vacios);
    cargarLista(vacios);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Partidas contables</h1>

      {mensaje && <p className="mb-3 rounded bg-green-100 px-3 py-2 text-sm text-green-800">{mensaje}</p>}
      {error && <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <form onSubmit={guardar} className="mb-8 max-w-5xl rounded bg-white p-4 shadow">
        <h2 className="mb-3 font-semibold">Nueva partida</h2>

        <div className="mb-4 grid grid-cols-4 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha</label>
            <input
              type="date"
              className="w-full rounded border border-gray-300 px-2 py-1"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-sm font-medium">Concepto</label>
            <input
              className="w-full rounded border border-gray-300 px-2 py-1"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
            />
          </div>
        </div>

        <table className="mb-3 w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-2 py-2">Cuenta</th>
              <th className="w-36 px-2 py-2">Debe</th>
              <th className="w-36 px-2 py-2">Haber</th>
              <th className="w-10 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1">
                  <select
                    className="w-full rounded border border-gray-300 px-2 py-1"
                    value={l.idCuenta}
                    onChange={(e) => cambiarLinea(i, "idCuenta", e.target.value)}
                  >
                    <option value="">Seleccione una cuenta...</option>
                    {cuentas.map((c) => (
                      <option key={c.idCuenta} value={c.idCuenta}>
                        {c.codigo} - {c.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-right"
                    value={l.debe}
                    onChange={(e) => cambiarLinea(i, "debe", e.target.value)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-right"
                    value={l.haber}
                    onChange={(e) => cambiarLinea(i, "haber", e.target.value)}
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => quitarLinea(i)}
                    className="text-red-600 hover:text-red-800"
                    title="Quitar línea"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td className="px-2 py-2 text-right">Totales</td>
              <td className="px-2 py-2 text-right">{dinero(totalDebe)}</td>
              <td className="px-2 py-2 text-right">{dinero(totalHaber)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div className="mb-4 flex items-center gap-4">
          <button
            type="button"
            onClick={agregarLinea}
            className="rounded border border-slate-800 px-3 py-1 text-sm hover:bg-slate-100"
          >
            + Agregar línea
          </button>
          {totalDebe + totalHaber > 0 &&
            (cuadra ? (
              <span className="text-sm text-green-700">La partida cuadra</span>
            ) : (
              <span className="text-sm text-red-700">
                No cuadra: diferencia {dinero(Math.abs(totalDebe - totalHaber))}
              </span>
            ))}
        </div>

        <button
          type="submit"
          disabled={!puedeGuardar}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Registrar partida
        </button>
      </form>

      <h2 className="mb-3 text-lg font-semibold">Consulta de partidas</h2>

      <form onSubmit={buscar} className="mb-4 flex max-w-5xl flex-wrap items-end gap-3 rounded bg-white p-4 shadow">
        <div>
          <label className="mb-1 block text-xs font-medium">Desde</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Hasta</label>
          <input
            type="date"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">No.</label>
          <input
            type="number"
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            value={filtros.numero}
            onChange={(e) => setFiltros({ ...filtros, numero: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Concepto</label>
          <input
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            value={filtros.concepto}
            onChange={(e) => setFiltros({ ...filtros, concepto: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Estado</label>
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="Registrada">Registrada</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>
        <button type="submit" className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
          Buscar
        </button>
        <button
          type="button"
          onClick={limpiarFiltros}
          className="rounded border border-slate-800 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Limpiar
        </button>
      </form>

      <table className="w-full max-w-5xl overflow-hidden rounded bg-white shadow">
        <thead className="bg-slate-100 text-left text-sm">
          <tr>
            <th className="px-3 py-2">Período</th>
            <th className="px-3 py-2">No.</th>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Concepto</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.idPartida} className={`border-t text-sm ${p.estado === "Anulada" ? "text-gray-400" : ""}`}>
              <td className="px-3 py-2">{String(p.mes).padStart(2, "0")}/{p.anio}</td>
              <td className="px-3 py-2">{p.numero}</td>
              <td className="px-3 py-2">{p.fecha}</td>
              <td className="px-3 py-2">{p.concepto}</td>
              <td className="px-3 py-2 text-right">{dinero(p.total)}</td>
              <td className="px-3 py-2">{p.estado}</td>
              <td className="px-3 py-2">
                <button
                  onClick={() => ver(p.idPartida)}
                  className="rounded border border-slate-800 px-2 py-1 hover:bg-slate-100"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
          {lista.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                No hay partidas para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {detalle && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded bg-white p-6 shadow-lg">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Partida No. {detalle.numero}</h3>
                <p className="text-sm text-gray-600">{detalle.fecha}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-xl text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>

            <p className="mb-3">{detalle.concepto}</p>

            <table className="mb-3 w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-2 py-1">Cuenta</th>
                  <th className="px-2 py-1 text-right">Debe</th>
                  <th className="px-2 py-1 text-right">Haber</th>
                </tr>
              </thead>
              <tbody>
                {detalle.detalle.map((d) => (
                  <tr key={d.idDetalle} className="border-t">
                    <td className="px-2 py-1">{d.codigo} - {d.cuentaNombre}</td>
                    <td className="px-2 py-1 text-right">{d.debe > 0 ? dinero(d.debe) : ""}</td>
                    <td className="px-2 py-1 text-right">{d.haber > 0 ? dinero(d.haber) : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="px-2 py-1 text-right">Totales</td>
                  <td className="px-2 py-1 text-right">{dinero(detalle.totalDebe)}</td>
                  <td className="px-2 py-1 text-right">{dinero(detalle.totalHaber)}</td>
                </tr>
              </tfoot>
            </table>

            {detalle.estado === "Anulada" ? (
              <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">
                Partida anulada. Motivo: {detalle.motivoAnulacion}
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  placeholder="Motivo de anulación"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                <button
                  onClick={anular}
                  disabled={!motivo.trim()}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-40"
                >
                  Anular partida
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}