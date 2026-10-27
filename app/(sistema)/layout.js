"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  Scale,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { api, obtenerUsuario, cerrarSesion } from "@/lib/api";
import { AvisoProvider } from "@/components/ui";

const TODOS = ["Administrador", "Contador", "Consulta"];
const ADMIN = ["Administrador"];
const CONTABLES = ["Administrador", "Contador"];

const GRUPOS = [
  {
    titulo: null,
    items: [{ href: "/inicio", etiqueta: "Inicio", icono: LayoutDashboard, roles: TODOS }],
  },
  {
    titulo: "Configuración",
    items: [
      { href: "/parametros", etiqueta: "Parámetros", icono: Settings, roles: ADMIN },
      { href: "/periodos", etiqueta: "Períodos contables", icono: Calendar, roles: ADMIN },
      { href: "/usuarios", etiqueta: "Usuarios", icono: Users, roles: ADMIN },
      { href: "/bitacora", etiqueta: "Bitácora", icono: History, roles: ADMIN },
    ],
  },
  {
    titulo: "Contabilidad",
    items: [
      { href: "/cuentas", etiqueta: "Nomenclatura contable", icono: ListTree, roles: CONTABLES },
      { href: "/partidas", etiqueta: "Partidas contables", icono: FileText, roles: CONTABLES },
    ],
  },
  {
    titulo: "Reportes",
    items: [
      { href: "/reportes/diario", etiqueta: "Libro Diario", icono: BookOpen, roles: TODOS },
      { href: "/reportes/mayor", etiqueta: "Libro Mayor General", icono: BookMarked, roles: TODOS },
      { href: "/reportes/estado-resultados", etiqueta: "Estado de Resultados", icono: TrendingUp, roles: TODOS },
      { href: "/reportes/balanza", etiqueta: "Balanza de comprobación", icono: Scale, roles: TODOS },
      { href: "/reportes/balance-general", etiqueta: "Balance General", icono: Landmark, roles: TODOS },
    ],
  },
];

export default function SistemaLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState(null);
  const [colapsado, setColapsado] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [periodo, setPeriodo] = useState(null);

  useEffect(() => {
    const u = obtenerUsuario();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUsuario(u);
    setColapsado(localStorage.getItem("menuColapsado") === "1");

    api("/api/parametros")
      .then((lista) => {
        const p = lista.find((x) => x.clave === "NombreEmpresa");
        if (p) setEmpresa(p.valor);
      })
      .catch(() => {});

    api("/api/periodos")
      .then((lista) => {
        const hoy = new Date();
        const actual =
          lista.find((p) => p.anio === hoy.getFullYear() && p.mes === hoy.getMonth() + 1) ||
          lista.find((p) => p.estado === "Abierto") ||
          lista[0];
        if (actual) setPeriodo(actual);
      })
      .catch(() => {});
  }, [router]);

  function alternarMenu() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    localStorage.setItem("menuColapsado", nuevo ? "1" : "0");
  }

  function salir() {
    cerrarSesion();
    router.replace("/login");
  }

  if (!usuario) return <p className="p-6">Cargando...</p>;

  const grupos = GRUPOS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(usuario.rol)),
  })).filter((g) => g.items.length > 0);

  const todos = GRUPOS.flatMap((g) => g.items.map((i) => ({ ...i, grupo: g.titulo })));
  const actual = todos.find((i) => pathname.startsWith(i.href));
  const permitido = actual ? actual.roles.includes(usuario.rol) : true;

  const iniciales = usuario.nombreCompleto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 bg-shell px-3 text-white print:hidden">
        <button onClick={alternarMenu} className="rounded p-1.5 hover:bg-white/10" title="Mostrar u ocultar el menú">
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand text-sm font-bold">C</div>
          <span className="font-semibold tracking-wide">Contabilidad ERP</span>
        </div>

        <div className="ml-4 hidden items-center gap-2 text-sm text-slate-300 md:flex">
          <Building2 size={16} />
          {empresa}
        </div>

        <div className="ml-auto flex items-center gap-4">
          {periodo && (
            <span className="hidden rounded bg-white/10 px-2 py-1 text-xs md:inline">
              Período {String(periodo.mes).padStart(2, "0")}/{periodo.anio} · {periodo.estado}
            </span>
          )}

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold">
              {iniciales}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm">{usuario.nombreCompleto}</p>
              <p className="text-xs text-slate-300">{usuario.rol}</p>
            </div>
          </div>

          <button
            onClick={salir}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-white/10"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={`${colapsado ? "w-14" : "w-60"} shrink-0 border-r border-line bg-white py-2 transition-all print:hidden`}
        >
          <nav>
            {grupos.map((g, gi) => (
              <div key={gi} className="mb-2">
                {g.titulo && !colapsado && (
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {g.titulo}
                  </p>
                )}
                {g.titulo && colapsado && <div className="mx-3 my-2 border-t border-line" />}

                {g.items.map((item) => {
                  const Icono = item.icono;
                  const activo = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.etiqueta}
                      className={`flex items-center gap-3 border-l-[3px] px-4 py-2 text-[13px] hover:bg-slate-100 ${
                        activo ? "border-brand bg-blue-50 font-semibold text-brand" : "border-transparent text-slate-700"
                      }`}
                    >
                      <Icono size={18} className="shrink-0" />
                      {!colapsado && <span>{item.etiqueta}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-5">
          {actual && actual.href !== "/inicio" && (
            <p className="mb-3 text-xs text-muted print:hidden">
              Inicio / {actual.grupo} / <span className="text-slate-800">{actual.etiqueta}</span>
            </p>
          )}
                    {permitido ? (
            <AvisoProvider>{children}</AvisoProvider>
          ) : (
            <p className="text-red-600">No tiene permiso para ver esta pantalla.</p>
          )}          
        </main>
      </div>
    </div>
  );
}