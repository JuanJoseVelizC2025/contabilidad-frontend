"use client";

import { useEffect, useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Encabezado, Modal, useAviso } from "@/components/ui";

const LINEA_VACIA = { descripcion: "", cantidad: "1", precio: "", idCuenta: "" };
const redondear = (n) => Math.round(n * 100) / 100;

export default function Documentos({ tipo }) {
  const aviso = useAviso();
  const esVenta = tipo === "Venta";
  const titulo = esVenta ? "Facturas de venta" : "Facturas de compra";
  const terceroEtiqueta = esVenta ? "Cliente" : "Proveedor";
  const prefijo = esVenta ? "V" : "C";

  const [lista, setLista] = useState([]);
  const [terceros, setTerceros] = useState([]);
  const [cuentasLinea, setCuentasLinea] = useState([]);
  const [cuentasPago, setCuentasPago] = useState([]);
  const [pct, setPct] = useState(12);
  const [form, setForm] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [motivo, setMotivo] = useState("");

  async function cargar() {
    try {
      setLista(await api(`/api/documentos?tipo=${tipo}`));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargar();
    api(`/api/terceros?tipo=${esVenta ? "Cliente" : "Proveedor"}`)
      .then((l) => setTerceros(l.filter((t) => t.activo)))
      .catch((e) => aviso.error(e.message));
    api("/api/cuentas")
      .then((c) => {
        const hojas = c.filter((x) => x.aceptaMovimientos && x.activa);
        setCuentasPago(hojas.filter((x) => x.codigo.startsWith("1.1.01.")));
        setCuentasLinea(
          esVenta
            ? hojas.filter((x) => x.tipo === "Ingreso")
            : hojas.filter(
                (x) =>
                  x.tipo === "Gasto" ||
                  x.tipo === "Costo" ||
                  (x.tipo === "Activo" && (x.codigo.startsWith("1.1.03") || x.codigo.startsWith("1.2")))
              )
        );
      })
      .catch((e) => aviso.error(e.message));
    api("/api/parametros")
      .then((l) => {
        const p = l.find((x) => x.clave === "PorcentajeIVA");
        if (p && Number(p.valor) >= 0) setPct(Number(p.valor));
      })
      .catch(() => {});
  }, [tipo]);

  function abrir() {
    setForm({
      fecha: hoy(),
      idTercero: "",
      condicion: "Contado",
      idCuentaPago: "",
      concepto: "",
      lineas: [{ ...LINEA_VACIA }],
    });
  }

  function cambiarLinea(i, campo, valor) {
    setForm({
      ...form,
      lineas: form.lineas.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)),
    });
  }

  const subtotales = form ? form.lineas.map((l) => redondear(Number(l.cantidad || 0) * Number(l.precio || 0))) : [];
  const subtotal = redondear(subtotales.reduce((s, x) => s + x, 0));
  const iva = redondear((subtotal * pct) / 100);
  const total = redondear(subtotal + iva);

  const completo =
    form &&
    form.idTercero &&
    form.fecha &&
    (form.condicion === "Credito" || form.idCuentaPago) &&
    form.lineas.every((l) => l.descripcion.trim() && Number(l.cantidad) > 0 && Number(l.precio) > 0 && l.idCuenta);

  async function guardar(e) {
    e.preventDefault();
    try {
      const r = await api("/api/documentos", {
        method: "POST",
        body: {
          tipo,
          fecha: form.fecha,
          idTercero: Number(form.idTercero),
          condicion: form.condicion,
          idCuentaPago: form.condicion === "Contado" ? Number(form.idCuentaPago) : null,
          concepto: form.concepto || null,
          lineas: form.lineas.map((l) => ({
            descripcion: l.descripcion,
            cantidad: Number(l.cantidad),
            precioUnitario: Number(l.precio),
            idCuenta: Number(l.idCuenta),
          })),
        },
      });
      aviso.ok(`Factura ${prefijo}-${String(r.numero).padStart(4, "0")} registrada (Partida No. ${r.numeroPartida})`);
      setForm(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function ver(id) {
    try {
      setDetalle(await api(`/api/documentos/${id}`));
      setMotivo("");
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function anular() {
    try {
      await api(`/api/documentos/${detalle.idDocumento}/anular`, { method: "PUT", body: { motivo } });
      aviso.ok("Factura anulada junto con su partida");
      setDetalle(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  return (
    <div>
      <Encabezado
        titulo={titulo}
        descripcion={`Cada factura genera su partida contable automáticamente (IVA ${pct}%)`}
      >
        <button className="btn btn-primary" onClick={abrir}>
          <Plus size={16} /> Nueva factura
        </button>
      </Encabezado>

      <div className="card max-w-6xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>No.</th>
              <th>Fecha</th>
              <th>{terceroEtiqueta}</th>
              <th>Condición</th>
              <th className="text-right">Subtotal</th>
              <th className="text-right">IVA</th>
              <th className="text-right">Total</th>
              <th>Partida</th>
              <th>Estado</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((d) => (
              <tr key={d.idDocumento} className={d.estado === "Anulado" ? "text-muted" : ""}>
                <td className="font-mono">
                  {prefijo}-{String(d.numero).padStart(4, "0")}
                </td>
                <td className="whitespace-nowrap">{d.fecha}</td>
                <td>{d.tercero}</td>
                <td>{d.condicion === "Credito" ? "Crédito" : "Contado"}</td>
                <td className="text-right">{dinero(d.subtotal)}</td>
                <td className="text-right">{dinero(d.iva)}</td>
                <td className="text-right font-medium">{dinero(d.total)}</td>
                <td>{d.numeroPartida ? `No. ${d.numeroPartida}` : ""}</td>
                <td>
                  <span className={`badge ${d.estado === "Registrado" ? "badge-ok" : "badge-gris"}`}>{d.estado}</span>
                </td>
                <td>
                  <button className="btn" onClick={() => ver(d.idDocumento)}>
                    <Eye size={14} /> Ver
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-muted">
                  No hay facturas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo={`Nueva factura de ${esVenta ? "venta" : "compra"}`} onCerrar={() => setForm(null)} ancho="max-w-4xl">
          <form onSubmit={guardar}>
            <div className="mb-4 grid grid-cols-4 gap-3">
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  className="input"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="label">{terceroEtiqueta}</label>
                <select
                  className="input"
                  value={form.idTercero}
                  onChange={(e) => setForm({ ...form, idTercero: e.target.value })}
                  required
                >
                  <option value="">Seleccione...</option>
                  {terceros.map((t) => (
                    <option key={t.idTercero} value={t.idTercero}>
                      {t.nombre} {t.nit ? `(${t.nit})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Condición</label>
                <select
                  className="input"
                  value={form.condicion}
                  onChange={(e) => setForm({ ...form, condicion: e.target.value })}
                >
                  <option value="Contado">Contado</option>
                  <option value="Credito">Crédito</option>
                </select>
              </div>
              {form.condicion === "Contado" && (
                <div className="col-span-2">
                  <label className="label">{esVenta ? "Cuenta donde se cobra" : "Cuenta de donde se paga"}</label>
                  <select
                    className="input"
                    value={form.idCuentaPago}
                    onChange={(e) => setForm({ ...form, idCuentaPago: e.target.value })}
                    required
                  >
                    <option value="">Seleccione caja o banco...</option>
                    {cuentasPago.map((c) => (
                      <option key={c.idCuenta} value={c.idCuenta}>
                        {c.codigo} - {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className={form.condicion === "Contado" ? "col-span-2" : "col-span-4"}>
                <label className="label">Observaciones (opcional)</label>
                <input
                  className="input"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-3 overflow-hidden rounded border border-line">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="w-20">Cant.</th>
                    <th className="w-28">Precio (sin IVA)</th>
                    <th className="w-24 text-right">Subtotal</th>
                    <th>{esVenta ? "Cuenta de ingreso" : "Cuenta de gasto o inventario"}</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineas.map((l, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          className="input"
                          value={l.descripcion}
                          onChange={(e) => cambiarLinea(i, "descripcion", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input text-right"
                          value={l.cantidad}
                          onChange={(e) => cambiarLinea(i, "cantidad", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input text-right"
                          value={l.precio}
                          onChange={(e) => cambiarLinea(i, "precio", e.target.value)}
                        />
                      </td>
                      <td className="text-right">{dinero(subtotales[i])}</td>
                      <td>
                        <select
                          className="input"
                          value={l.idCuenta}
                          onChange={(e) => cambiarLinea(i, "idCuenta", e.target.value)}
                        >
                          <option value="">Seleccione...</option>
                          {cuentasLinea.map((c) => (
                            <option key={c.idCuenta} value={c.idCuenta}>
                              {c.codigo} - {c.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {form.lineas.length > 1 && (
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() => setForm({ ...form, lineas: form.lineas.filter((_, idx) => idx !== i) })}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4 flex items-start justify-between">
              <button type="button" className="btn" onClick={() => setForm({ ...form, lineas: [...form.lineas, { ...LINEA_VACIA }] })}>
                <Plus size={14} /> Agregar línea
              </button>
              <dl className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{dinero(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">IVA {pct}%</dt>
                  <dd>{dinero(iva)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-1 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{dinero(total)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!completo}>
                Registrar factura
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detalle && (
        <Modal
          titulo={`Factura ${prefijo}-${String(detalle.numero).padStart(4, "0")}`}
          onCerrar={() => setDetalle(null)}
          ancho="max-w-2xl"
        >
          <div className="mb-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{detalle.tercero}</p>
              <p className="text-muted">
                NIT {detalle.terceroNit || "-"} · {detalle.fecha} · {detalle.condicion === "Credito" ? "Crédito" : "Contado"}
              </p>
            </div>
            <span className={`badge ${detalle.estado === "Registrado" ? "badge-ok" : "badge-gris"}`}>
              {detalle.estado}
            </span>
          </div>

          <div className="mb-3 overflow-hidden rounded border border-line">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.lineas.map((l) => (
                  <tr key={l.idLinea}>
                    <td>
                      {l.descripcion}
                      <div className="text-xs text-muted">
                        {l.codigo} - {l.cuentaNombre}
                      </div>
                    </td>
                    <td className="text-right">{l.cantidad}</td>
                    <td className="text-right">{dinero(l.precioUnitario)}</td>
                    <td className="text-right">{dinero(l.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right">Subtotal</td>
                  <td className="text-right">{dinero(detalle.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right">IVA</td>
                  <td className="text-right">{dinero(detalle.iva)}</td>
                </tr>
                <tr className="font-semibold">
                  <td colSpan={3} className="text-right">Total</td>
                  <td className="text-right">{dinero(detalle.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mb-3 text-sm text-muted">Partida contable generada: No. {detalle.numeroPartida}</p>

          {detalle.estado === "Anulado" ? (
            <p className="alerta alerta-error mb-0">Factura anulada. Motivo: {detalle.motivoAnulacion}</p>
          ) : (
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Motivo de anulación"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              <button className="btn btn-danger" onClick={anular} disabled={!motivo.trim()}>
                Anular factura
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}