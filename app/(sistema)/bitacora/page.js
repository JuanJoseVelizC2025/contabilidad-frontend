"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { Encabezado, useAviso } from "@/components/ui";
import BotonExcel from "@/components/BotonExcel";

const MODULOS = ["Seguridad", "Partidas", "Cuentas", "Usuarios", "Periodos", "Parametros"];
const VACIOS = { desde: "", hasta: "", usuario: "", modulo: "" };

function formato(f) {
  const d = new Date(f.endsWith("Z") ? f : f + "Z");
  return d.toLocaleString("es-GT", { dateStyle: "short", timeStyle: "medium" });
}

export default function BitacoraPage() {
  const aviso = useAviso();
  const [filtros, setFiltros] = useState(VACIOS);
  const [lista, setLista] = useState([]);

  async function cargar(f = filtros) {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([clave, valor]) => {
      if (valor) params.append(clave, valor);
    });
    try {
      setLista(await api(`/api/bitacora?${params.toString()}`));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function buscar(e) {
    e.preventDefault();
    cargar(filtros);
  }

  function limpiar() {
    setFiltros(VACIOS);
    cargar(VACIOS);
  }

  return (
    <div>
    <Encabezado
        titulo="Bitácora de auditoría"
        descripcion="Registro de quién hizo qué y cuándo (últimos 300 movimientos)"
      >
        <BotonExcel archivo="bitacora" titulo="Bitácora de auditoría" />
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
          <label className="label">Usuario</label>
          <input
            className="input"
            value={filtros.usuario}
            onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Módulo</label>
          <select
            className="input"
            value={filtros.modulo}
            onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
          >
            <option value="">Todos</option>
            {MODULOS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          <Search size={15} /> Buscar
        </button>
        <button type="button" className="btn" onClick={limpiar}>
          Limpiar
        </button>
      </form>

      <div className="card max-w-6xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Usuario</th>
              <th>Módulo</th>
              <th>Acción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((b) => (
              <tr key={b.idBitacora}>
                <td className="whitespace-nowrap">{formato(b.fechaHora)}</td>
                <td className="font-mono">{b.nombreUsuario}</td>
                <td>{b.modulo}</td>
                <td>
                  <span
                    className={`badge ${
                      b.accion.includes("fallido")
                        ? "badge-error"
                        : b.accion.startsWith("Anular") || b.accion.startsWith("Desactivar")
                        ? "badge-gris"
                        : "badge-ok"
                    }`}
                  >
                    {b.accion}
                  </span>
                </td>
                <td>{b.detalle}</td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}