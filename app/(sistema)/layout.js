"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { obtenerUsuario, cerrarSesion } from "@/lib/api";

const TODOS = ["Administrador", "Contador", "Consulta"];

const MENU = [
  { href: "/inicio", etiqueta: "Inicio", roles: TODOS },
  { href: "/parametros", etiqueta: "Parámetros", roles: ["Administrador"] },
  { href: "/periodos", etiqueta: "Períodos contables", roles: ["Administrador"] },
  { href: "/usuarios", etiqueta: "Usuarios", roles: ["Administrador"] },
  { href: "/cuentas", etiqueta: "Nomenclatura contable", roles: ["Administrador", "Contador"] },
  { href: "/partidas", etiqueta: "Partidas contables", roles: ["Administrador", "Contador"] },
  { href: "/reportes/diario", etiqueta: "Libro Diario", roles: TODOS },
  { href: "/reportes/mayor", etiqueta: "Libro Mayor General", roles: TODOS },
  { href: "/reportes/estado-resultados", etiqueta: "Estado de Resultados", roles: TODOS },
];

export default function SistemaLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const u = obtenerUsuario();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUsuario(u);
  }, [router]);

  function salir() {
    cerrarSesion();
    router.replace("/login");
  }

  if (!usuario) return <p className="p-6">Cargando...</p>;

  const visibles = MENU.filter((m) => m.roles.includes(usuario.rol));
  const actual = MENU.find((m) => pathname.startsWith(m.href));
  const permitido = actual ? actual.roles.includes(usuario.rol) : true;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-slate-800 p-4 text-white print:hidden">
        <h1 className="mb-1 text-lg font-bold">Contabilidad</h1>
        <p className="text-sm text-slate-300">{usuario.nombreCompleto}</p>
        <p className="mb-4 text-xs text-slate-400">Rol: {usuario.rol}</p>

        <nav className="flex flex-col gap-1">
          {visibles.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`rounded px-3 py-2 text-sm hover:bg-slate-700 ${
                pathname.startsWith(m.href) ? "bg-slate-700 font-semibold" : ""
              }`}
            >
              {m.etiqueta}
            </Link>
          ))}
        </nav>

        <button
          onClick={salir}
          className="mt-6 w-full rounded bg-red-600 px-3 py-2 text-sm hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-6">
        {permitido ? children : <p className="text-red-600">No tiene permiso para ver esta pantalla.</p>}
      </main>
    </div>
  );
}