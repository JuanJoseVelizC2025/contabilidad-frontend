"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";


export default function EncabezadoReporte({ titulo, subtitulo }) {
  const [empresa, setEmpresa] = useState({ nombre: "", nit: "" });

  useEffect(() => {
    api("/api/parametros")
      .then((lista) => {
        const valor = (clave) => lista.find((p) => p.clave === clave)?.valor || "";
        setEmpresa({ nombre: valor("NombreEmpresa"), nit: valor("NIT") });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mb-4 max-w-4xl text-center">
      <p className="text-lg font-bold">{empresa.nombre}</p>
      {empresa.nit && <p className="text-sm text-gray-600">NIT: {empresa.nit}</p>}
      <h1 className="mt-2 text-xl font-bold">{titulo}</h1>
      {subtitulo && <p className="text-sm text-gray-600">{subtitulo}</p>}
    </div>
  );
}