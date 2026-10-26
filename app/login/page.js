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
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-shell p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-brand text-lg font-bold">C</div>
          <span className="text-lg font-semibold tracking-wide">Contabilidad ERP</span>
        </div>

        <div>
          <h2 className="mb-4 text-3xl font-semibold leading-tight">
            Control contable claro, seguro y en tiempo real
          </h2>
          <ul className="space-y-2 text-slate-300">
            <li>Nomenclatura contable y partidas validadas al centavo</li>
            <li>Libro Diario, Mayor General y Estado de Resultados</li>
            <li>Acceso por roles y períodos contables controlados</li>
          </ul>
        </div>

        <p className="text-xs text-slate-400">Universidad Mariano Gálvez · Desarrollo Web</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={ingresar} className="card w-full max-w-sm p-8 shadow">
          <h1 className="mb-1 text-2xl font-semibold">Iniciar sesión</h1>
          <p className="mb-6 text-muted">Ingrese sus credenciales para continuar</p>

          <label className="label">Usuario</label>
          <input
            className="input mb-4"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            required
          />

          <label className="label">Contraseña</label>
          <input
            type="password"
            className="input mb-4"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />

          {error && <p className="alerta alerta-error">{error}</p>}

          <button type="submit" disabled={cargando} className="btn btn-primary w-full justify-center py-2">
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}