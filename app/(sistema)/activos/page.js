"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Encabezado, Modal, useAviso } from "@/components/ui";
import BotonExcel from "@/components/BotonExcel";
import { Barras } from "@/components/Graficas";

function Kpi({ titulo, valor, detalle, color }) {
  return (
    <div className="card p-4" style={{ borderTop: `3px solid ${color}` }}>
      <p className="text-xs uppercase tracking-wide text-muted">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted">{detalle}</p>}
    </div>
  );
}

export default function ActivosPage() {
  const aviso = useAviso();
  const [lista, setLista] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [form, setForm] = useState(null);
  const [dep, setDep] = useState(null);
  const [baja, setBaja] = useState(null);

  async function cargar() {
    try {
      setLista(await api("/api/activos"));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargar();
    api("/api/cuentas")
      .then((c) =>
        setCuentas(
          c.filter(
            (x) =>
              x.aceptaMovimientos &&
              x.activa &&
              (x.codigo.startsWith("1.2.01.01.") ||
                x.codigo.startsWith("1.2.01.02.") ||
                x.codigo.startsWith("1.2.01.03.") ||
                x.codigo === "1.2.01.04.02")
          )
        )
      )
      .catch((e) => aviso.error(e.message));
    api("/api/periodos")
      .then((p) => setPeriodos(p.filter((x) => x.estado === "Abierto")))
      .catch((e) => aviso.error(e.message));
  }, []);

  const vigentes = lista.filter((a) => a.estado === "Activo");
  const costo = vigentes.reduce((s, a) => s + a.costo, 0);
  const acumulada = vigentes.reduce((s, a) => s + a.depreciacionAcumulada, 0);
  const libros = vigentes.reduce((s, a) => s + a.valorEnLibros, 0);
  const barras = vigentes.slice(0, 8).map((a) => ({ etiqueta: a.codigo, costo: a.costo, libros: a.valorEnLibros }));

  async function guardar(e) {
    e.preventDefault();
    try {
      const r = await api("/api/activos", {
        method: "POST",
        body: {
          descripcion: form.descripcion,
          fechaAdquisicion: form.fecha,
          costo: Number(form.costo),
          valorResidual: Number(form.residual || 0),
          vidaUtilMeses: Number(form.vida),
          idCuentaActivo: Number(form.idCuenta),
        },
      });
      aviso.ok(`Activo ${r.codigo} registrado`);
      setForm(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function depreciar(e) {
    e.preventDefault();
    try {
      const r = await api("/api/activos/depreciar", {
        method: "POST",
        body: { idPeriodo: Number(dep.idPeriodo) },
      });
      aviso.ok(`Depreciación de ${r.activos} activo(s) por ${dinero(r.total)} (Partida No. ${r.numeroPartida})`);
      setDep(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function darBaja(e) {
    e.preventDefault();
    try {
      const r = await api(`/api/activos/${baja.activo.idActivo}/baja`, {
        method: "POST",
        body: { fecha: baja.fecha, motivo: baja.motivo },
      });
      aviso.ok(`Baja registrada (Partida No. ${r.numeroPartida})`);
      setBaja(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  return (
    <div>
      <Encabezado
        titulo="Activos fijos"
        descripcion="Registro de bienes, depreciación mensual en línea recta y bajas, con partida automática"
      >
        <BotonExcel archivo="activos-fijos" titulo="Activos fijos" />
        <button
          className="btn"
          onClick={() => setDep({ idPeriodo: periodos.length ? String(periodos[0].idPeriodo) : "" })}
          disabled={vigentes.length === 0}
        >
          <TrendingDown size={16} /> Depreciar período
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setForm({ descripcion: "", fecha: hoy(), costo: "", residual: "0", vida: "36", idCuenta: "" })}
        >
          <Plus size={16} /> Nuevo activo
        </button>
      </Encabezado>

      <div className="mb-4 grid max-w-6xl grid-cols-3 gap-4">
        <Kpi titulo="Costo de adquisición" valor={dinero(costo)} detalle={`${vigentes.length} activos vigentes`} color="#0a6ed1" />
        <Kpi titulo="Depreciación acumulada" valor={dinero(acumulada)} color="#e9730c" />
        <Kpi titulo="Valor en libros" valor={dinero(libros)} color="#107e3e" />
      </div>

      <div className="mb-4 max-w-6xl">
        <Barras
          titulo="Costo y valor en libros por activo"
          datos={barras}
          series={[
            { clave: "costo", nombre: "Costo", color: "#0a6ed1" },
            { clave: "libros", nombre: "Valor en libros", color: "#107e3e" },
          ]}
        />
      </div>

      <div className="card max-w-6xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Adquisición</th>
              <th className="text-right">Costo</th>
              <th className="text-right">Vida (meses)</th>
              <th className="text-right">Dep. mensual</th>
              <th className="text-right">Dep. acumulada</th>
              <th className="text-right">Valor en libros</th>
              <th>Estado</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.idActivo} className={a.estado === "Baja" ? "text-muted" : ""}>
                <td className="font-mono">{a.codigo}</td>
                <td>
                  {a.descripcion}
                  <div className="text-xs text-muted">
                    {a.cuentaCodigo} - {a.cuentaNombre}
                  </div>
                </td>
                <td className="whitespace-nowrap">{a.fechaAdquisicion}</td>
                <td className="text-right">{dinero(a.costo)}</td>
                <td className="text-right">{a.vidaUtilMeses}</td>
                <td className="text-right">{dinero(a.mensual)}</td>
                <td className="text-right">{dinero(a.depreciacionAcumulada)}</td>
                <td className="text-right font-medium">{dinero(a.valorEnLibros)}</td>
                <td>
                  <span className={`badge ${a.estado === "Activo" ? "badge-ok" : "badge-gris"}`}>{a.estado}</span>
                </td>
                <td>
                  {a.estado === "Activo" && (
                    <button className="btn" onClick={() => setBaja({ activo: a, fecha: hoy(), motivo: "" })}>
                      Dar de baja
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-muted">
                  No hay activos fijos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo="Nuevo activo fijo" onCerrar={() => setForm(null)}>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <input
                className="input"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">Cuenta del activo</label>
              <select
                className="input"
                value={form.idCuenta}
                onChange={(e) => setForm({ ...form, idCuenta: e.target.value })}
                required
              >
                <option value="">Seleccione...</option>
                {cuentas.map((c) => (
                  <option key={c.idCuenta} value={c.idCuenta}>
                    {c.codigo} - {c.nombre}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                La cuenta de depreciación acumulada y la de gasto se asignan solas según el tipo de bien.
              </p>
            </div>
            <div>
              <label className="label">Fecha de adquisición</label>
              <input
                type="date"
                className="input"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Vida útil (meses)</label>
              <input
                type="number"
                min="1"
                className="input text-right"
                value={form.vida}
                onChange={(e) => setForm({ ...form, vida: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Costo</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input text-right"
                value={form.costo}
                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Valor residual</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input text-right"
                value={form.residual}
                onChange={(e) => setForm({ ...form, residual: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar activo
              </button>
            </div>
          </form>
        </Modal>
      )}

      {dep && (
        <Modal titulo="Depreciar período" onCerrar={() => setDep(null)} ancho="max-w-md">
          <form onSubmit={depreciar}>
            <p className="mb-3 text-sm text-muted">
              Se calcula la depreciación mensual de todos los activos vigentes y se genera una sola partida.
            </p>
            <label className="label">Período</label>
            <select
              className="input mb-4"
              value={dep.idPeriodo}
              onChange={(e) => setDep({ ...dep, idPeriodo: e.target.value })}
              required
            >
              <option value="">Seleccione...</option>
              {periodos.map((p) => (
                <option key={p.idPeriodo} value={p.idPeriodo}>
                  {String(p.mes).padStart(2, "0")}/{p.anio}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setDep(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!dep.idPeriodo}>
                Depreciar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {baja && (
        <Modal titulo={`Baja de ${baja.activo.codigo}`} onCerrar={() => setBaja(null)} ancho="max-w-md">
          <form onSubmit={darBaja}>
            <p className="mb-3 text-sm">
              {baja.activo.descripcion}: valor en libros <b>{dinero(baja.activo.valorEnLibros)}</b>. Se genera la partida de baja.
            </p>
            <label className="label">Fecha de baja</label>
            <input
              type="date"
              className="input mb-3"
              value={baja.fecha}
              onChange={(e) => setBaja({ ...baja, fecha: e.target.value })}
              required
            />
            <label className="label">Motivo</label>
            <input
              className="input mb-4"
              value={baja.motivo}
              onChange={(e) => setBaja({ ...baja, motivo: e.target.value })}
              required
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setBaja(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger" disabled={!baja.motivo.trim()}>
                Dar de baja
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}