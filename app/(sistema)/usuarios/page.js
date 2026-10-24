"use client";

import { useEffect, useState } from "react";
import { api, obtenerUsuario } from "@/lib/api";

const VACIO = {
  idUsuario: null,
  nombreUsuario: "",
  clave: "",
  nombreCompleto: "",
  correo: "",
  idRol: "",
};

export default function UsuariosPage() {
  const [lista, setLista] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [miId, setMiId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLista(await api("/api/usuarios"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
    api("/api/roles")
      .then(setRoles)
      .catch((e) => setError(e.message));
    setMiId(obtenerUsuario()?.id ?? null);
  }, []);

  function campo(nombre, valor) {
    setForm({ ...form, [nombre]: valor });
  }

  function editar(u) {
    setForm({
      idUsuario: u.idUsuario,
      nombreUsuario: u.nombreUsuario,
      clave: "",
      nombreCompleto: u.nombreCompleto,
      correo: u.correo ?? "",
      idRol: String(u.idRol),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar(e) {
    e.preventDefault();
    setMensaje("");
    setError("");
    const cuerpo = {
      nombreUsuario: form.nombreUsuario,
      clave: form.clave || null,
      nombreCompleto: form.nombreCompleto,
      correo: form.correo || null,
      idRol: Number(form.idRol),
    };
    try {
      if (form.idUsuario) {
        await api(`/api/usuarios/${form.idUsuario}`, { method: "PUT", body: cuerpo });
        setMensaje("Usuario actualizado");
      } else {
        await api("/api/usuarios", { method: "POST", body: cuerpo });
        setMensaje("Usuario creado");
      }
      setForm(VACIO);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function alternarActivo(u) {
    setMensaje("");
    setError("");
    try {
      await api(`/api/usuarios/${u.idUsuario}/activo`, {
        method: "PUT",
        body: { activo: !u.activo },
      });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const editando = form.idUsuario !== null;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Usuarios</h1>

      {mensaje && <p className="mb-3 rounded bg-green-100 px-3 py-2 text-sm text-green-800">{mensaje}</p>}
      {error && <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <form onSubmit={guardar} className="mb-6 grid max-w-4xl grid-cols-2 gap-4 rounded bg-white p-4 shadow">
        <h2 className="col-span-2 font-semibold">{editando ? "Editar usuario" : "Nuevo usuario"}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Usuario</label>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 disabled:bg-gray-100"
            value={form.nombreUsuario}
            onChange={(e) => campo("nombreUsuario", e.target.value)}
            disabled={editando}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Contraseña {editando && <span className="font-normal text-gray-500">(vacío = no cambiar)</span>}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded border border-gray-300 px-2 py-1"
            value={form.clave}
            onChange={(e) => campo("clave", e.target.value)}
            required={!editando}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre completo</label>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1"
            value={form.nombreCompleto}
            onChange={(e) => campo("nombreCompleto", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Correo (opcional)</label>
          <input
            type="email"
            className="w-full rounded border border-gray-300 px-2 py-1"
            value={form.correo}
            onChange={(e) => campo("correo", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rol</label>
          <select
            className="w-full rounded border border-gray-300 px-2 py-1"
            value={form.idRol}
            onChange={(e) => campo("idRol", e.target.value)}
            required
          >
            <option value="">Seleccione un rol...</option>
            {roles.map((r) => (
              <option key={r.idRol} value={r.idRol}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 flex gap-2">
          <button type="submit" className="rounded bg-slate-800 px-4 py-1.5 text-white hover:bg-slate-700">
            {editando ? "Guardar cambios" : "Crear usuario"}
          </button>
          {editando && (
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

      <table className="w-full max-w-4xl overflow-hidden rounded bg-white shadow">
        <thead className="bg-slate-100 text-left text-sm">
          <tr>
            <th className="px-3 py-2">Usuario</th>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Correo</th>
            <th className="px-3 py-2">Rol</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((u) => (
            <tr key={u.idUsuario} className={`border-t text-sm ${u.activo ? "" : "text-gray-400"}`}>
              <td className="px-3 py-2 font-mono">{u.nombreUsuario}</td>
              <td className="px-3 py-2">{u.nombreCompleto}</td>
              <td className="px-3 py-2">{u.correo}</td>
              <td className="px-3 py-2">{u.rol}</td>
              <td className="px-3 py-2">{u.activo ? "Activo" : "Inactivo"}</td>
              <td className="flex gap-2 px-3 py-2">
                <button
                  onClick={() => editar(u)}
                  className="rounded border border-slate-800 px-2 py-1 hover:bg-slate-100"
                >
                  Editar
                </button>
                <button
                  onClick={() => alternarActivo(u)}
                  disabled={u.idUsuario === miId}
                  className="rounded border border-slate-800 px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
                >
                  {u.activo ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}