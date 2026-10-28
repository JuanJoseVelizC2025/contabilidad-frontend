"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, guardarSesion } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState("login");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cargando, setCargando] = useState(false);

  function limpiarMensajes() {
    setError("");
    setInfo("");
  }

  async function ejecutar(accion) {
    limpiarMensajes();
    setCargando(true);
    try {
      await accion();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function entrar(datos) {
    guardarSesion(datos);
    router.push("/inicio");
  }

  function iniciar(e) {
    e.preventDefault();
    ejecutar(async () => {
      const r = await api("/api/auth/login", {
        method: "POST",
        body: { nombreUsuario, clave },
      });
      if (r.requiereCodigo) {
        setCodigo("");
        setModo("codigo");
        setInfo(`Enviamos un código de 6 dígitos a ${r.correo}. Revise también la carpeta de spam.`);
        return;
      }
      entrar(r);
    });
  }

  function verificar(e) {
    e.preventDefault();
    ejecutar(async () => {
      const r = await api("/api/auth/verificar-codigo", {
        method: "POST",
        body: { nombreUsuario, codigo },
      });
      entrar(r);
    });
  }

  function pedirCodigo(e) {
    e.preventDefault();
    ejecutar(async () => {
      await api("/api/auth/olvide-clave", { method: "POST", body: { usuario: nombreUsuario } });
      setCodigo("");
      setModo("restablecer");
      setInfo("Si el usuario existe y tiene correo, enviamos un código de 6 dígitos. Vence en 10 minutos.");
    });
  }

  function restablecer(e) {
    e.preventDefault();
    if (nuevaClave !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    ejecutar(async () => {
      await api("/api/auth/restablecer-clave", {
        method: "POST",
        body: { usuario: nombreUsuario, codigo, nuevaClave },
      });
      setClave("");
      setNuevaClave("");
      setConfirmar("");
      setCodigo("");
      setModo("login");
      setInfo("Contraseña actualizada. Ya puede iniciar sesión.");
    });
  }

  function cambiarModo(nuevo) {
    limpiarMensajes();
    setModo(nuevo);
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
            <li>Nomenclatura contable de 6 niveles y partidas validadas al centavo</li>
            <li>Bancos, Diario, Mayor, Balanza, Balance General y Estado de Resultados</li>
            <li>Acceso por roles, doble autenticación y bitácora de auditoría</li>
          </ul>
        </div>

        <p className="text-xs text-slate-400">Universidad Mariano Gálvez · Desarrollo Web</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="card w-full max-w-sm p-8 shadow">
          {info && <p className="alerta alerta-ok">{info}</p>}

          {modo === "login" && (
            <form onSubmit={iniciar}>
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
                className="input mb-2"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />

              <button
                type="button"
                className="mb-4 text-sm text-brand hover:underline"
                onClick={() => cambiarModo("olvide")}
              >
                ¿Olvidó su contraseña?
              </button>

              {error && <p className="alerta alerta-error">{error}</p>}

              <button type="submit" disabled={cargando} className="btn btn-primary w-full justify-center py-2">
                {cargando ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          )}

          {modo === "codigo" && (
            <form onSubmit={verificar}>
              <h1 className="mb-1 text-2xl font-semibold">Verificación en dos pasos</h1>
              <p className="mb-6 text-muted">Escriba el código que recibió por correo</p>

              <label className="label">Código de 6 dígitos</label>
              <input
                className="input mb-4 text-center text-lg tracking-widest"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                required
              />

              {error && <p className="alerta alerta-error">{error}</p>}

              <button
                type="submit"
                disabled={cargando || codigo.length !== 6}
                className="btn btn-primary w-full justify-center py-2"
              >
                {cargando ? "Verificando..." : "Verificar"}
              </button>
              <button type="button" className="mt-3 text-sm text-brand hover:underline" onClick={() => cambiarModo("login")}>
                Volver al inicio de sesión
              </button>
            </form>
          )}

          {modo === "olvide" && (
            <form onSubmit={pedirCodigo}>
              <h1 className="mb-1 text-2xl font-semibold">Recuperar contraseña</h1>
              <p className="mb-6 text-muted">Le enviaremos un código a su correo registrado</p>

              <label className="label">Usuario o correo</label>
              <input
                className="input mb-4"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                required
              />

              {error && <p className="alerta alerta-error">{error}</p>}

              <button type="submit" disabled={cargando} className="btn btn-primary w-full justify-center py-2">
                {cargando ? "Enviando..." : "Enviar código"}
              </button>
              <button type="button" className="mt-3 text-sm text-brand hover:underline" onClick={() => cambiarModo("login")}>
                Volver al inicio de sesión
              </button>
            </form>
          )}

          {modo === "restablecer" && (
            <form onSubmit={restablecer}>
              <h1 className="mb-1 text-2xl font-semibold">Nueva contraseña</h1>
              <p className="mb-6 text-muted">Escriba el código y su nueva contraseña</p>

              <label className="label">Código de 6 dígitos</label>
              <input
                className="input mb-4 text-center text-lg tracking-widest"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                required
              />

              <label className="label">Nueva contraseña</label>
              <input
                type="password"
                className="input mb-4"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                required
              />

              <label className="label">Confirmar contraseña</label>
              <input
                type="password"
                className="input mb-4"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />

              {error && <p className="alerta alerta-error">{error}</p>}

              <button
                type="submit"
                disabled={cargando || codigo.length !== 6}
                className="btn btn-primary w-full justify-center py-2"
              >
                {cargando ? "Guardando..." : "Cambiar contraseña"}
              </button>
              <button type="button" className="mt-3 text-sm text-brand hover:underline" onClick={() => cambiarModo("login")}>
                Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}