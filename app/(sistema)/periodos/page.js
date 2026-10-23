"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function PeriodosPage() {
  const [lista, setLista] = useState([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLista(await api("/api/periodos"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e) {
    e.preventDefault();
    setMensaje("");
    setError("");
    try {
      await api("/api/periodos", {
        method: "POST",
        body: { anio: Number(anio), mes: Number(mes) },
      });
      setMensaje("Período creado");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarEstado(p) {
    setMensaje("");
    setError("");
    const nuevo = p.estado === "Abierto" ? "Cerrado" : "Abierto";
    try {
      await api(`/api/periodos/${p.idPeriodo}/estado`, {
        method: "PUT",
        body: { estado: nuevo },
      });
      setMensaje(`Período ${MESES[p.mes - 1]} ${p.anio}: ${nuevo}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Períodos contables</h1>

      {mensaje && <p className="mb-3 rounded bg-green-100 px-3 py-2 text-sm text-green-800">{mensaje}</p>}
      {error && <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <form onSubmit={crear} className="mb-6 flex max-w-3xl items-end gap-3 rounded bg-white p-4 shadow">
        <div>
          <label className="mb-1 block text-sm font-medium">Año</label>
          <input
            type="number"
            className="w-28 rounded border border-gray-300 px-2 py-1"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mes</label>
          <select
            className="rounded border border-gray-300 px-2 py-1"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          >
            {MESES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>{nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded bg-slate-800 px-4 py-1.5 text-white hover:bg-slate-700">
          Crear período
        </button>
      </form>

      <table className="w-full max-w-3xl overflow-hidden rounded bg-white shadow">
        <thead className="bg-slate-100 text-left text-sm">
          <tr>
            <th className="px-3 py-2">Período</th>
            <th className="px-3 py-2">Desde</th>
            <th className="px-3 py-2">Hasta</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.idPeriodo} className="border-t text-sm">
              <td className="px-3 py-2 font-medium">{MESES[p.mes - 1]} {p.anio}</td>
              <td className="px-3 py-2">{p.fechaInicio}</td>
              <td className="px-3 py-2">{p.fechaFin}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    p.estado === "Abierto" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {p.estado}
                </span>
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => cambiarEstado(p)}
                  className="rounded border border-slate-800 px-3 py-1 hover:bg-slate-100"
                >
                  {p.estado === "Abierto" ? "Cerrar" : "Abrir"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}