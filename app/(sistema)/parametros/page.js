"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Encabezado, useAviso } from "@/components/ui";

export default function ParametrosPage() {
  const aviso = useAviso();
  const [lista, setLista] = useState([]);

  useEffect(() => {
    api("/api/parametros")
      .then(setLista)
      .catch((e) => aviso.error(e.message));
  }, []);

  function cambiar(id, valor) {
    setLista(lista.map((p) => (p.idParametro === id ? { ...p, valor } : p)));
  }

  async function guardar(p) {
    try {
      await api(`/api/parametros/${p.idParametro}`, { method: "PUT", body: { valor: p.valor } });
      aviso.ok(`Parámetro ${p.clave} guardado`);
    } catch (e) {
      aviso.error(e.message);
    }
  }

  return (
    <div>
      <Encabezado
        titulo="Parámetros del sistema"
        descripcion="Datos generales de la empresa que se muestran en el sistema y en los reportes"
      />

      <div className="card max-w-3xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Valor</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.idParametro}>
                <td>
                  <div className="font-medium">{p.clave}</div>
                  <div className="text-xs text-muted">{p.descripcion}</div>
                </td>
                <td>
                  <input
                    className="input"
                    value={p.valor}
                    onChange={(e) => cambiar(p.idParametro, e.target.value)}
                  />
                </td>
                <td>
                  <button className="btn btn-primary" onClick={() => guardar(p)}>
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}