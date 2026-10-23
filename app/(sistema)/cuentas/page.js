"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [form, setForm] = useState(VACIO);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLista(await api("/api/cuentas"));
    } catch (e) {
      setError(e.message);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar(e) {
    e.preventDefault();
    setMensaje("");
    setError("");
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
        setMensaje("Cuenta actualizada");
      } else {
        await api("/api/cuentas", { method: "POST", body: cuerpo });
        setMensaje("Cuenta creada");
      }
      setForm(VACIO);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function alternarActiva(c) {
    setMensaje("");
    setError("");
    try {
      await api(`/api/cuentas/${c.idCuenta}/activa`, {
        method: "PUT",
        body: { activa: !c.activa },
      });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const texto = buscar.trim().toLowerCase();
  const visibles = lista.filter((c) => `${c.codigo} ${c.nombre}`.toLowerCase().includes(texto));
  const padres = lista.filter((c) => !c.aceptaMovimientos && c.activa);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Nomenclatura contable</h1>

      {mensaje && <p className="mb-3 rounded bg-green-100 px-3 py-2 text-sm text-green-800">{mensaje}</p>}
      {error && <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <form onSubmit={guardar} className="mb-6 grid max-w-4xl grid-cols-2 gap-4 rounded bg-white p-4 shadow">
        <h2 className="col-span-2 font-semibold">{form.idCuenta ? "Editar cuenta" : "Nueva cuenta"}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Código</label>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1"
            value={form.codigo}
            onChange={(e) => campo("codigo", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1"
            value={form.nombre}
            onChange={(e) => campo("nombre", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cuenta padre (opcional)</label>
          <select
            className="w-full rounded border border-gray-300 px-2 py-1"
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
          <label className="mb-1 block text-sm font-medium">Tipo</label>
          <select
            className="w-full rounded border border-gray-300 px-2 py-1 disabled:bg-gray-100"
            value={form.tipo}
            onChange={(e) => campo("tipo", e.target.value)}
            disabled={!!form.idCuentaPadre}
          >
            {TIPOS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {form.idCuentaPadre && <p className="mt-1 text-xs text-gray-500">El tipo se hereda de la cuenta padre.</p>}
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.aceptaMovimientos}
            onChange={(e) => campo("aceptaMovimientos", e.target.checked)}
          />
          Acepta movimientos (cuenta de último nivel)
        </label>

        <div className="col-span-2 flex gap-2">
          <button type="submit" className="rounded bg-slate-800 px-4 py-1.5 text-white hover:bg-slate-700">
            {form.idCuenta ? "Guardar cambios" : "Crear cuenta"}
          </button>
          {form.idCuenta && (
            <button
              type="button"
              onClick={() => setForm(VACIO)}
              className="rounded border border-slate-800 px-4 py-1.5 hover:bg-slate-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <input
        className="mb-3 w-full max-w-md rounded border border-gray-300 bg-white px-3 py-2"
        placeholder="Buscar por código o nombre..."
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />

      <table className="w-full max-w-4xl overflow-hidden rounded bg-white shadow">
        <thead className="bg-slate-100 text-left text-sm">
          <tr>
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Naturaleza</th>
            <th className="px-3 py-2">Movimientos</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((c) => (
            <tr key={c.idCuenta} className={`border-t text-sm ${c.activa ? "" : "text-gray-400"}`}>
              <td className="px-3 py-2 font-mono">{c.codigo}</td>
              <td className="px-3 py-2" style={{ paddingLeft: `${12 + (c.nivel - 1) * 16}px` }}>
                {c.nombre}
              </td>
              <td className="px-3 py-2">{c.tipo}</td>
              <td className="px-3 py-2">{c.naturaleza}</td>
              <td className="px-3 py-2">{c.aceptaMovimientos ? "Sí" : "No"}</td>
              <td className="px-3 py-2">{c.activa ? "Activa" : "Inactiva"}</td>
              <td className="flex gap-2 px-3 py-2">
                <button onClick={() => editar(c)} className="rounded border border-slate-800 px-2 py-1 hover:bg-slate-100">
                  Editar
                </button>
                <button onClick={() => alternarActiva(c)} className="rounded border border-slate-800 px-2 py-1 hover:bg-slate-100">
                  {c.activa ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}