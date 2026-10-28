"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Power } from "lucide-react";
import { api } from "@/lib/api";
import { Encabezado, Modal, useAviso } from "@/components/ui";

const VACIO = { idTercero: null, nombre: "", nit: "", direccion: "", telefono: "", correo: "" };

export default function Terceros({ tipo }) {
  const aviso = useAviso();
  const plural = tipo === "Cliente" ? "Clientes" : "Proveedores";
  const singular = tipo === "Cliente" ? "cliente" : "proveedor";
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(null);
  const [buscar, setBuscar] = useState("");

  async function cargar() {
    try {
      setLista(await api(`/api/terceros?tipo=${tipo}`));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, [tipo]);

  async function guardar(e) {
    e.preventDefault();
    const cuerpo = {
      tipo,
      nombre: form.nombre,
      nit: form.nit || null,
      direccion: form.direccion || null,
      telefono: form.telefono || null,
      correo: form.correo || null,
    };
    try {
      if (form.idTercero) {
        await api(`/api/terceros/${form.idTercero}`, { method: "PUT", body: cuerpo });
        aviso.ok(`${plural.slice(0, -1)} actualizado`);
      } else {
        await api("/api/terceros", { method: "POST", body: cuerpo });
        aviso.ok(`${plural.slice(0, -1)} creado`);
      }
      setForm(null);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function alternar(t) {
    try {
      await api(`/api/terceros/${t.idTercero}/activo`, { method: "PUT", body: { activo: !t.activo } });
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  const texto = buscar.trim().toLowerCase();
  const visibles = lista.filter((t) => `${t.nombre} ${t.nit ?? ""}`.toLowerCase().includes(texto));

  return (
    <div>
      <Encabezado titulo={plural} descripcion={`Catálogo de ${plural.toLowerCase()} de la empresa`}>
        <button className="btn btn-primary" onClick={() => setForm({ ...VACIO })}>
          <Plus size={16} /> Nuevo {singular}
        </button>
      </Encabezado>

      <input
        className="input mb-3 max-w-md bg-white"
        placeholder="Buscar por nombre o NIT..."
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />

      <div className="card max-w-5xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th className="w-44"></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((t) => (
              <tr key={t.idTercero} className={t.activo ? "" : "text-muted"}>
                <td>
                  <div className="font-medium">{t.nombre}</div>
                  <div className="text-xs text-muted">{t.direccion}</div>
                </td>
                <td className="font-mono">{t.nit}</td>
                <td>{t.telefono}</td>
                <td>{t.correo}</td>
                <td>
                  <span className={`badge ${t.activo ? "badge-ok" : "badge-gris"}`}>
                    {t.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn"
                      onClick={() =>
                        setForm({
                          idTercero: t.idTercero,
                          nombre: t.nombre,
                          nit: t.nit ?? "",
                          direccion: t.direccion ?? "",
                          telefono: t.telefono ?? "",
                          correo: t.correo ?? "",
                        })
                      }
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button className="btn" onClick={() => alternar(t)}>
                      <Power size={14} /> {t.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted">
                  No hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo={form.idTercero ? `Editar ${singular}` : `Nuevo ${singular}`} onCerrar={() => setForm(null)}>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nombre</label>
              <input
                className="input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">NIT</label>
              <input className="input" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                className="input"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Dirección</label>
              <input
                className="input"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Correo</label>
              <input
                type="email"
                className="input"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}