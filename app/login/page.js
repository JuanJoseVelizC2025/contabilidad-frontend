"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, guardarSesion } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const datos = await api("/api/auth/login", {
        method: "POST",
        body: { nombreUsuario, clave },
      });
      guardarSesion(datos);
      router.push("/inicio");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={ingresar} className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold">Sistema de Contabilidad</h1>
        <p className="mb-6 text-sm text-gray-500">Inicie sesión para continuar</p>

        <label className="mb-1 block text-sm font-medium">Usuario</label>
        <input
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          required
        />

        <label className="mb-1 block text-sm font-medium">Contraseña</label>
        <input
          type="password"
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded bg-slate-800 px-3 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}