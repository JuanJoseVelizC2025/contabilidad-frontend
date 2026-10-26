"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Power } from "lucide-react";
import { api, obtenerUsuario } from "@/lib/api";
import { Encabezado, Modal, useAviso } from "@/components/ui";

const VACIO = {
  idUsuario: null,
  nombreUsuario: "",
  clave: "",
  nombreCompleto: "",
  correo: "",
  idRol: "",
};

export default function UsuariosPage() {
  const aviso = useAviso();
  const [lista, setLista] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(null);
  const [miId, setMiId] = useState(null);

  async function cargar() {
    try {
      setLista(await api("/api/usuarios"));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargar();
    api("/api/roles")
      .then(setRoles)
      .catch((e) => aviso.error(e.message));
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
  }

  async function guardar(e) {
    e.preventDefault();
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
        aviso.ok("Usuario actualizado");
      } else {
        await api("/api/usuarios", { method: "POST", body: cuerpo });
        aviso.ok("Usuario creado");
      }
      setForm(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function alternarActivo(u) {
    try {
      await api(`/api/usuarios/${u.idUsuario}/activo`, {
        method: "PUT",
        body: { activo: !u.activo },
      });
      aviso.ok(`Usuario ${u.nombreUsuario} ${u.activo ? "desactivado" : "activado"}`);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  const editando = form && form.idUsuario !== null;

  return (
    <div>
      <Encabezado
        titulo="Usuarios"
        descripcion="Quién puede entrar al sistema y qué puede hacer según su rol"
      >
        <button className="btn btn-primary" onClick={() => setForm({ ...VACIO })}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </Encabezado>

      <div className="card max-w-5xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="w-44"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.idUsuario} className={u.activo ? "" : "text-muted"}>
                <td className="font-mono">{u.nombreUsuario}</td>
                <td>{u.nombreCompleto}</td>
                <td>{u.correo}</td>
                <td>{u.rol}</td>
                <td>
                  <span className={`badge ${u.activo ? "badge-ok" : "badge-gris"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn" onClick={() => editar(u)}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      className="btn"
                      onClick={() => alternarActivo(u)}
                      disabled={u.idUsuario === miId}
                      title={u.idUsuario === miId ? "No puede desactivar su propio usuario" : ""}
                    >
                      <Power size={14} /> {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo={editando ? "Editar usuario" : "Nuevo usuario"} onCerrar={() => setForm(null)}>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Usuario</label>
              <input
                className="input disabled:bg-gray-100"
                value={form.nombreUsuario}
                onChange={(e) => campo("nombreUsuario", e.target.value)}
                disabled={editando}
                required
              />
            </div>
            <div>
              <label className="label">
                Contraseña {editando && <span className="font-normal text-muted">(vacío = no cambiar)</span>}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="input"
                value={form.clave}
                onChange={(e) => campo("clave", e.target.value)}
                required={!editando}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Nombre completo</label>
              <input
                className="input"
                value={form.nombreCompleto}
                onChange={(e) => campo("nombreCompleto", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Correo (opcional)</label>
              <input
                type="email"
                className="input"
                value={form.correo}
                onChange={(e) => campo("correo", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Rol</label>
              <select
                className="input"
                value={form.idRol}
                onChange={(e) => campo("idRol", e.target.value)}
                required
              >
                <option value="">Seleccione...</option>
                {roles.map((r) => (
                  <option key={r.idRol} value={r.idRol}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editando ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}