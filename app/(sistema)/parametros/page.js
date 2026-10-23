"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ParametrosPage() {
  const [lista, setLista] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLista(await api("/api/parametros"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiar(id, valor) {
    setLista(lista.map((p) => (p.idParametro === id ? { ...p, valor } : p)));
  }

  async function guardar(p) {
    setMensaje("");
    setError("");
    try {
      await api(`/api/parametros/${p.idParametro}`, {
        method: "PUT",
        body: { valor: p.valor },
      });
      setMensaje(`Parámetro ${p.clave} guardado`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Parámetros del sistema</h1>

      {mensaje && <p className="mb-3 rounded bg-green-100 px-3 py-2 text-sm text-green-800">{mensaje}</p>}
      {error && <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <table className="w-full max-w-3xl overflow-hidden rounded bg-white shadow">
        <thead className="bg-slate-100 text-left text-sm">
          <tr>
            <th className="px-3 py-2">Parámetro</th>
            <th className="px-3 py-2">Valor</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.idParametro} className="border-t">
              <td className="px-3 py-2 text-sm">
                <div className="font-medium">{p.clave}</div>
                <div className="text-xs text-gray-500">{p.descripcion}</div>
              </td>
              <td className="px-3 py-2">
                <input
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  value={p.valor}
                  onChange={(e) => cambiar(p.idParametro, e.target.value)}
                />
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => guardar(p)}
                  className="rounded bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700"
                >
                  Guardar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}