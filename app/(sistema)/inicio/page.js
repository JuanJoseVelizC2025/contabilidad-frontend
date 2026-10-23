"use client";

import { useEffect, useState } from "react";
import { api, obtenerUsuario } from "@/lib/api";

export default function InicioPage() {
  const [empresa, setEmpresa] = useState("");
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    setUsuario(obtenerUsuario());
    api("/api/parametros")
      .then((lista) => {
        const p = lista.find((x) => x.clave === "NombreEmpresa");
        if (p) setEmpresa(p.valor);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Bienvenido{usuario ? `, ${usuario.nombreCompleto}` : ""}</h1>
      <p className="mt-2 text-gray-600">{empresa}</p>
      <p className="mt-4 text-sm text-gray-500">
        Use el menú de la izquierda para registrar partidas, consultar cuentas y generar reportes.
      </p>
    </div>
  );
}