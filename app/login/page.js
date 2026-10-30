"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { api, guardarSesion } from "@/lib/api";
import Logo from "@/components/Logo";

const REDES = [
  { nombre: "Facebook", url: "https://www.facebook.com/profile.php?id=61595959863861", icono: "facebook" },
  { nombre: "Instagram", url: "https://www.instagram.com/erpcontabilidad?utm_source=qr", icono: "instagram" },
];

function IconoRed({ tipo }) {
  if (tipo === "facebook") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.5V13h2.7v8h3.3z" />
      </svg>
    );
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState("login");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [ver, setVer] = useState(false);
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
      <div
        className="hidden w-[44%] flex-col justify-between p-12 text-white lg:flex"
        style={{ background: "#0B2A5B" }}
      >
        <Logo size={40} claro />

        <div>
          <h2 className="mb-3 text-3xl font-semibold leading-tight">Gestión contable clara y confiable</h2>
          <p className="max-w-sm text-base text-white/70">
            Contabilidad, bancos, facturación y reportes en una sola plataforma.
          </p>
        </div>

        <p className="text-xs text-white/50">© 2026 Contabilidad ERP · Versión 1.0</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="mb-6 lg:hidden">
          <Logo size={40} />
        </div>

        <div className="card w-full max-w-sm p-8 shadow-sm">
          {info && <p className="alerta alerta-ok">{info}</p>}

          {modo === "login" && (
            <form onSubmit={iniciar}>
              <h1 className="mb-1 text-2xl font-semibold">Iniciar sesión</h1>
              <p className="mb-6 text-muted">Acceda con su usuario y contraseña</p>

              <label className="label">Usuario</label>
              <input
                className="input mb-4"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                autoComplete="username"
                required
              />

              <label className="label">Contraseña</label>
              <div className="relative mb-2">
                <input
                  type={ver ? "text" : "password"}
                  className="input"
                  style={{ paddingRight: 36 }}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVer(!ver)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-slate-700"
                  aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {ver ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="button"
                className="mb-5 text-sm text-brand hover:underline"
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

                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <Lock size={12} /> Conexión cifrada
        </p>
        <p className="mt-2 text-xs text-muted">¿Necesita ayuda?</p>
                <a
          href="https://contaedpr.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs text-brand hover:underline"
        >
          Conozca más del sistema
        </a>
        <p className="mt-2 text-xs text-muted">Escriba a contabilidaderp21@gmail.com</p>

        <div className="mt-3 flex items-center gap-4 text-muted">
          {REDES.map((r) => (
            <a
              key={r.nombre}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs hover:text-brand"
            >
              <IconoRed tipo={r.icono} /> {r.nombre}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}