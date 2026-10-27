"use client";

import { useEffect, useState } from "react";
import { Eye, Plus, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Encabezado, Modal, useAviso } from "@/components/ui";

const LINEA_VACIA = { idCuenta: "", debe: "", haber: "" };
const FILTROS_VACIOS = { desde: "", hasta: "", numero: "", concepto: "", estado: "" };

export default function PartidasPage() {
  const aviso = useAviso();
  const [cuentas, setCuentas] = useState([]);
  const [lista, setLista] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [nueva, setNueva] = useState(false);
  const [fecha, setFecha] = useState(hoy());
  const [concepto, setConcepto] = useState("");
  const [lineas, setLineas] = useState([{ ...LINEA_VACIA }, { ...LINEA_VACIA }]);
  const [detalle, setDetalle] = useState(null);
  const [motivo, setMotivo] = useState("");

  async function cargarLista(f = filtros) {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([clave, valor]) => {
      if (valor) params.append(clave, valor);
    });
    try {
      setLista(await api(`/api/partidas?${params.toString()}`));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    api("/api/cuentas")
      .then((c) => setCuentas(c.filter((x) => x.activa && x.aceptaMovimientos)))
      .catch((e) => aviso.error(e.message));
    cargarLista();
  }, []);

  function abrirNueva() {
    setFecha(hoy());
    setConcepto("");
    setLineas([{ ...LINEA_VACIA }, { ...LINEA_VACIA }]);
    setNueva(true);
  }

  function cambiarLinea(i, campo, valor) {
    setLineas(
      lineas.map((l, idx) => {
        if (idx !== i) return l;
        const nuevaLinea = { ...l, [campo]: valor };
        if (campo === "debe" && Number(valor) > 0) nuevaLinea.haber = "";
        if (campo === "haber" && Number(valor) > 0) nuevaLinea.debe = "";
        return nuevaLinea;
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
      aviso.ok(`Partida No. ${r.numero} registrada`);
      setNueva(false);
      cargarLista();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function ver(id) {
    try {
      setDetalle(await api(`/api/partidas/${id}`));
      setMotivo("");
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function anular() {
    try {
      await api(`/api/partidas/${detalle.idPartida}/anular`, {
        method: "PUT",
        body: { motivo },
      });
      aviso.ok(`Partida No. ${detalle.numero} anulada`);
      setDetalle(null);
      cargarLista();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  function buscar(e) {
    e.preventDefault();
    cargarLista(filtros);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS);
    cargarLista(FILTROS_VACIOS);
  }

  return (
    <div>
      <Encabezado
        titulo="Partidas contables"
        descripcion="Registro y consulta de los movimientos contables"
      >
        <button className="btn btn-primary" onClick={abrirNueva}>
          <Plus size={16} /> Nueva partida
        </button>
      </Encabezado>

      <form onSubmit={buscar} className="card mb-3 flex max-w-6xl flex-wrap items-end gap-3 p-3">
        <div>
          <label className="label">Desde</label>
          <input
            type="date"
            className="input"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input
            type="date"
            className="input"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
        </div>
        <div>
          <label className="label">No.</label>
          <input
            type="number"
            className="input w-20"
            value={filtros.numero}
            onChange={(e) => setFiltros({ ...filtros, numero: e.target.value })}
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="label">Concepto</label>
          <input
            className="input"
            value={filtros.concepto}
            onChange={(e) => setFiltros({ ...filtros, concepto: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="input"
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="Registrada">Registrada</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          <Search size={15} /> Buscar
        </button>
        <button type="button" className="btn" onClick={limpiarFiltros}>
          Limpiar
        </button>
      </form>

      <div className="card max-w-6xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Período</th>
              <th>No.</th>
              <th>Fecha</th>
              <th>Concepto</th>
              <th className="text-right">Total</th>
              <th>Estado</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.idPartida} className={p.estado === "Anulada" ? "text-muted" : ""}>
                <td>
                  {String(p.mes).padStart(2, "0")}/{p.anio}
                </td>
                <td>{p.numero}</td>
                <td>{p.fecha}</td>
                <td>{p.concepto}</td>
                <td className="text-right">{dinero(p.total)}</td>
                <td>
                  <span className={`badge ${p.estado === "Registrada" ? "badge-ok" : "badge-gris"}`}>
                    {p.estado}
                  </span>
                </td>
                <td>
                  <button className="btn" onClick={() => ver(p.idPartida)}>
                    <Eye size={14} /> Ver
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted">
                  No hay partidas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {nueva && (
        <Modal titulo="Nueva partida contable" onCerrar={() => setNueva(false)} ancho="max-w-4xl">
          <form onSubmit={guardar}>
            <div className="mb-4 grid grid-cols-4 gap-3">
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  className="input"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-3">
                <label className="label">Concepto</label>
                <input
                  className="input"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3 overflow-hidden rounded border border-line">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Cuenta</th>
                    <th className="w-36">Debe</th>
                    <th className="w-36">Haber</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l, i) => (
                    <tr key={i}>
                      <td>
                        <select
                          className="input"
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
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input text-right"
                          value={l.debe}
                          onChange={(e) => cambiarLinea(i, "debe", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input text-right"
                          value={l.haber}
                          onChange={(e) => cambiarLinea(i, "haber", e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => quitarLinea(i)}
                          className="text-red-600 hover:text-red-800"
                          title="Quitar línea"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="text-right">Totales</td>
                    <td className="text-right">{dinero(totalDebe)}</td>
                    <td className="text-right">{dinero(totalHaber)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mb-4 flex items-center gap-4">
              <button type="button" className="btn" onClick={agregarLinea}>
                <Plus size={14} /> Agregar línea
              </button>
              {totalDebe + totalHaber > 0 &&
                (cuadra ? (
                  <span className="badge badge-ok">La partida cuadra</span>
                ) : (
                  <span className="badge badge-error">
                    No cuadra: diferencia {dinero(Math.abs(totalDebe - totalHaber))}
                  </span>
                ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button type="button" className="btn" onClick={() => setNueva(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!puedeGuardar}>
                Registrar partida
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detalle && (
        <Modal titulo={`Partida No. ${detalle.numero}`} onCerrar={() => setDetalle(null)} ancho="max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-muted">{detalle.fecha}</p>
            <span className={`badge ${detalle.estado === "Registrada" ? "badge-ok" : "badge-gris"}`}>
              {detalle.estado}
            </span>
          </div>
          <p className="mb-3 font-medium">{detalle.concepto}</p>

          <div className="mb-3 overflow-hidden rounded border border-line">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th className="text-right">Debe</th>
                  <th className="text-right">Haber</th>
                </tr>
              </thead>
              <tbody>
                {detalle.detalle.map((d) => (
                  <tr key={d.idDetalle}>
                    <td>
                      {d.codigo} - {d.cuentaNombre}
                    </td>
                    <td className="text-right">{d.debe > 0 ? dinero(d.debe) : ""}</td>
                    <td className="text-right">{d.haber > 0 ? dinero(d.haber) : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="text-right">Totales</td>
                  <td className="text-right">{dinero(detalle.totalDebe)}</td>
                  <td className="text-right">{dinero(detalle.totalHaber)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {detalle.estado === "Anulada" ? (
            <p className="alerta alerta-error mb-0">Partida anulada. Motivo: {detalle.motivoAnulacion}</p>
          ) : (
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Motivo de anulación"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              <button className="btn btn-danger" onClick={anular} disabled={!motivo.trim()}>
                Anular partida
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}