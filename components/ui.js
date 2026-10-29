"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const AvisoContext = createContext({ ok: () => {}, error: () => {} });

export function useAviso() {
  return useContext(AvisoContext);
}

export function AvisoProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const mostrar = useCallback((tipo, texto) => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, tipo, texto }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4000);
  }, []);

  const valor = useMemo(
    () => ({ ok: (t) => mostrar("ok", t), error: (t) => mostrar("error", t) }),
    [mostrar]
  );

  return (
    <AvisoContext.Provider value={valor}>
      {children}
      <div className="fixed right-2 top-14 z-50 flex w-[calc(100vw-1rem)] flex-col gap-2 sm:right-4 sm:top-16 sm:w-80 print:hidden">
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`alerta mb-0 shadow-lg ${a.tipo === "ok" ? "alerta-ok" : "alerta-error"}`}
          >
            {a.texto}
          </div>
        ))}
      </div>
    </AvisoContext.Provider>
  );
}

export function Modal({ titulo, onCerrar, children, ancho = "max-w-lg" }) {
  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-black/40 p-2 pt-4 sm:p-4 sm:pt-16 print:hidden"
      onMouseDown={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`card w-full ${ancho} shadow-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-semibold">{titulo}</h3>
          <button onClick={onCerrar} className="rounded p-1 hover:bg-slate-100" title="Cerrar" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-cuerpo p-4">{children}</div>
      </div>
    </div>
  );
}

export function Encabezado({ titulo, descripcion, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold">{titulo}</h1>
        {descripcion && <p className="text-muted">{descripcion}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}