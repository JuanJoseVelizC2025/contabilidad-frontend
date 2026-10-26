"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Power, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Encabezado, Modal, useAviso } from "@/components/ui";

const TIPOS = ["Activo", "Pasivo", "Capital", "Ingreso", "Costo", "Gasto"];

const VACIO = {
  idCuenta: null,
  codigo: "",
  nombre: "",
  tipo: "Activo",
  idCuentaPadre: "",
  aceptaMovimientos: true,
};

export default function CuentasPage() {
  const aviso = useAviso();
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [form, setForm] = useState(null);

  async function cargar() {
    try {
      setLista(await api("/api/cuentas"));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function campo(nombre, valor) {
    setForm({ ...form, [nombre]: valor });
  }

  function editar(c) {
    setForm({
      idCuenta: c.idCuenta,
      codigo: c.codigo,
      nombre: c.nombre,
      tipo: c.tipo,
      idCuentaPadre: c.idCuentaPadre ?? "",
      aceptaMovimientos: c.aceptaMovimientos,
    });
  }

  async function guardar(e) {
    e.preventDefault();
    const cuerpo = {
      codigo: form.codigo,
      nombre: form.nombre,
      tipo: form.tipo,
      idCuentaPadre: form.idCuentaPadre ? Number(form.idCuentaPadre) : null,
      aceptaMovimientos: form.aceptaMovimientos,
    };
    try {
      if (form.idCuenta) {
        await api(`/api/cuentas/${form.idCuenta}`, { method: "PUT", body: cuerpo });
        aviso.ok("Cuenta actualizada");
      } else {
        await api("/api/cuentas", { method: "POST", body: cuerpo });
        aviso.ok("Cuenta creada");
      }
      setForm(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function alternarActiva(c) {
    try {
      await api(`/api/cuentas/${c.idCuenta}/activa`, {
        method: "PUT",
        body: { activa: !c.activa },
      });
      aviso.ok(`Cuenta ${c.codigo} ${c.activa ? "desactivada" : "activada"}`);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  const texto = buscar.trim().toLowerCase();
  const visibles = lista.filter(
    (c) =>
      `${c.codigo} ${c.nombre}`.toLowerCase().includes(texto) && (!tipoFiltro || c.tipo === tipoFiltro)
  );
  const padres = lista.filter((c) => !c.aceptaMovimientos && c.activa);

  return (
    <div>
      <Encabezado
        titulo="Nomenclatura contable"
        descripcion={`${lista.length} cuentas en el catálogo`}
      >
        <button className="btn btn-primary" onClick={() => setForm({ ...VACIO })}>
          <Plus size={16} /> Nueva cuenta
        </button>
      </Encabezado>

      <div className="card mb-3 flex max-w-5xl items-center gap-3 p-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-2 top-2 text-muted" />
          <input
            className="input pl-7"
            placeholder="Buscar por código o nombre..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>
        <select
          className="input w-44"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="card max-w-5xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Naturaleza</th>
              <th>Movimientos</th>
              <th>Estado</th>
              <th className="w-44"></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <tr key={c.idCuenta} className={c.activa ? "" : "text-muted"}>
                <td className="font-mono">{c.codigo}</td>
                <td
                  className={c.aceptaMovimientos ? "" : "font-semibold"}
                  style={{ paddingLeft: `${10 + (c.nivel - 1) * 18}px` }}
                >
                  {c.nombre}
                </td>
                <td>{c.tipo}</td>
                <td>{c.naturaleza}</td>
                <td>{c.aceptaMovimientos ? "Sí" : "No"}</td>
                <td>
                  <span className={`badge ${c.activa ? "badge-ok" : "badge-gris"}`}>
                    {c.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn" onClick={() => editar(c)}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button className="btn" onClick={() => alternarActiva(c)}>
                      <Power size={14} /> {c.activa ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted">
                  No hay cuentas que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo={form.idCuenta ? "Editar cuenta" : "Nueva cuenta"} onCerrar={() => setForm(null)}>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Código</label>
              <input
                className="input"
                value={form.codigo}
                onChange={(e) => campo("codigo", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Nombre</label>
              <input
                className="input"
                value={form.nombre}
                onChange={(e) => campo("nombre", e.target.value)}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">Cuenta padre (opcional)</label>
              <select
                className="input"
                value={form.idCuentaPadre}
                onChange={(e) => campo("idCuentaPadre", e.target.value)}
              >
                <option value="">(Sin padre: cuenta de nivel 1)</option>
                {padres.map((p) => (
                  <option key={p.idCuenta} value={p.idCuenta}>
                    {p.codigo} - {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                className="input disabled:bg-gray-100"
                value={form.tipo}
                onChange={(e) => campo("tipo", e.target.value)}
                disabled={!!form.idCuentaPadre}
              >
                {TIPOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {form.idCuentaPadre && <p className="mt-1 text-xs text-muted">Se hereda de la cuenta padre.</p>}
            </div>
            <label className="flex items-center gap-2 pt-5 text-sm">
              <input
                type="checkbox"
                checked={form.aceptaMovimientos}
                onChange={(e) => campo("aceptaMovimientos", e.target.checked)}
              />
              Acepta movimientos
            </label>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {form.idCuenta ? "Guardar cambios" : "Crear cuenta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}