"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Encabezado, Modal, useAviso } from "@/components/ui";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function PeriodosPage() {
  const aviso = useAviso();
  const [lista, setLista] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  async function cargar() {
    try {
      setLista(await api("/api/periodos"));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e) {
    e.preventDefault();
    try {
      await api("/api/periodos", {
        method: "POST",
        body: { anio: Number(anio), mes: Number(mes) },
      });
      aviso.ok("Período creado");
      setAbierto(false);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function cambiarEstado(p) {
    const nuevo = p.estado === "Abierto" ? "Cerrado" : "Abierto";
    try {
      await api(`/api/periodos/${p.idPeriodo}/estado`, {
        method: "PUT",
        body: { estado: nuevo },
      });
      aviso.ok(`Período ${MESES[p.mes - 1]} ${p.anio}: ${nuevo}`);
      cargar();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  return (
    <div>
      <Encabezado
        titulo="Períodos contables"
        descripcion="Un período cerrado no admite nuevas partidas"
      >
        <button className="btn btn-primary" onClick={() => setAbierto(true)}>
          <Plus size={16} /> Nuevo período
        </button>
      </Encabezado>

      <div className="card max-w-3xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Período</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Estado</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.idPeriodo}>
                <td className="font-medium">
                  {MESES[p.mes - 1]} {p.anio}
                </td>
                <td>{p.fechaInicio}</td>
                <td>{p.fechaFin}</td>
                <td>
                  <span className={`badge ${p.estado === "Abierto" ? "badge-ok" : "badge-gris"}`}>
                    {p.estado}
                  </span>
                </td>
                <td>
                  <button className="btn" onClick={() => cambiarEstado(p)}>
                    {p.estado === "Abierto" ? "Cerrar" : "Abrir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abierto && (
        <Modal titulo="Nuevo período contable" onCerrar={() => setAbierto(false)} ancho="max-w-sm">
          <form onSubmit={crear} className="space-y-3">
            <div>
              <label className="label">Año</label>
              <input
                type="number"
                className="input"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Mes</label>
              <select className="input" value={mes} onChange={(e) => setMes(e.target.value)}>
                {MESES.map((nombre, i) => (
                  <option key={nombre} value={i + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Crear período
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}