"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
      <div className="fixed right-4 top-16 z-50 flex w-80 flex-col gap-2 print:hidden">
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
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-black/40 p-4 pt-16 print:hidden"
      onMouseDown={onCerrar}
    >
      <div className={`card w-full ${ancho} shadow-xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-semibold">{titulo}</h3>
          <button onClick={onCerrar} className="rounded p-1 hover:bg-slate-100" title="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Encabezado({ titulo, descripcion, children }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h1 className="text-xl font-semibold">{titulo}</h1>
        {descripcion && <p className="text-muted">{descripcion}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}