"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  Contact,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  Package,
  Receipt,
  Scale,
  Settings,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { api, obtenerUsuario, cerrarSesion } from "@/lib/api";
import { AvisoProvider } from "@/components/ui";
import Logo from "@/components/Logo";

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
      { href: "/bancos", etiqueta: "Bancos", icono: Banknote, roles: CONTABLES },
      { href: "/activos", etiqueta: "Activos fijos", icono: Package, roles: CONTABLES },
    ],
  },
  {
    titulo: "Ventas y compras",
    items: [
      { href: "/clientes", etiqueta: "Clientes", icono: Contact, roles: CONTABLES },
      { href: "/ventas", etiqueta: "Facturas de venta", icono: Receipt, roles: CONTABLES },
      { href: "/proveedores", etiqueta: "Proveedores", icono: Truck, roles: CONTABLES },
      { href: "/compras", etiqueta: "Facturas de compra", icono: ShoppingCart, roles: CONTABLES },
    ],
  },
  {
    titulo: "Reportes",
    items: [
      { href: "/reportes/diario", etiqueta: "Libro Diario", icono: BookOpen, roles: TODOS },
      { href: "/reportes/mayor", etiqueta: "Libro Mayor General", icono: BookMarked, roles: TODOS },
      { href: "/reportes/estado-resultados", etiqueta: "Estado de Resultados", icono: TrendingUp, roles: TODOS },
      { href: "/reportes/balanza", etiqueta: "Balanza de comprobación", icono: Scale, roles: TODOS },
      { href: "/reportes/iva", etiqueta: "Libro de IVA", icono: Receipt, roles: TODOS },
      { href: "/reportes/balance-general", etiqueta: "Balance General", icono: Landmark, roles: TODOS },
    ],
  },
];

export default function SistemaLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState(null);
  const [colapsado, setColapsado] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [cerrados, setCerrados] = useState({});
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
    try {
      setCerrados(JSON.parse(localStorage.getItem("gruposCerrados") || "{}"));
    } catch {
      setCerrados({});
    }

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

  // Al navegar: cierra el cajon y abre el grupo de la pantalla actual
  useEffect(() => {
    setDrawer(false);
    const g = GRUPOS.find((x) => x.items.some((i) => pathname.startsWith(i.href)));
    if (g && g.titulo) {
      setCerrados((c) => (c[g.titulo] ? { ...c, [g.titulo]: false } : c));
    }
  }, [pathname]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  function alternarMenu() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      const nuevo = !colapsado;
      setColapsado(nuevo);
      localStorage.setItem("menuColapsado", nuevo ? "1" : "0");
    } else {
      setDrawer((d) => !d);
    }
  }

  function alternarGrupo(titulo) {
    const nuevo = { ...cerrados, [titulo]: !cerrados[titulo] };
    setCerrados(nuevo);
    localStorage.setItem("gruposCerrados", JSON.stringify(nuevo));
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
      <header
        className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-3 px-3 text-white print:hidden"
        style={{ background: "#0b2a5b" }}
      >
        <button
          onClick={alternarMenu}
          className="rounded p-1.5 hover:bg-white/10"
          title="Mostrar u ocultar el menú"
          aria-label="Menú"
        >
          <Menu size={20} />
        </button>

        <Logo size={28} claro />

        <div className="ml-4 hidden items-center gap-2 text-sm text-white/80 md:flex">
          <Building2 size={16} />
          {empresa}
        </div>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {periodo && (
            <span className="hidden rounded bg-white/15 px-2 py-1 text-xs md:inline">
              Período {String(periodo.mes).padStart(2, "0")}/{periodo.anio} · {periodo.estado}
            </span>
          )}

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold">
              {iniciales}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm">{usuario.nombreCompleto}</p>
              <p className="text-xs text-white/70">{usuario.rol}</p>
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
        {drawer && (
          <div
            className="fixed bottom-0 left-0 right-0 top-12 z-20 bg-black/40 lg:hidden print:hidden"
            onClick={() => setDrawer(false)}
          />
        )}

        <aside
          className={`fixed bottom-0 left-0 top-12 z-30 w-64 overflow-y-auto border-r border-line bg-white py-2 shadow-xl transition-transform lg:sticky lg:top-12 lg:z-10 lg:h-[calc(100vh-3rem)] lg:shrink-0 lg:translate-x-0 lg:self-start lg:shadow-none print:hidden ${
            drawer ? "translate-x-0" : "-translate-x-full"
          } ${colapsado ? "lg:w-14" : "lg:w-60"}`}
        >
          <nav>
            {grupos.map((g, gi) => {
              const cerrado = g.titulo && cerrados[g.titulo];
              return (
                <div key={gi} className="mb-1">
                  {g.titulo && (
                    <>
                      <button
                        type="button"
                        onClick={() => alternarGrupo(g.titulo)}
                        aria-expanded={!cerrado}
                        className={`flex w-full items-center justify-between px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-brand ${
                          colapsado ? "lg:hidden" : ""
                        }`}
                      >
                        <span>{g.titulo}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${cerrado ? "-rotate-90" : ""}`}
                        />
                      </button>
                      <div className={`mx-3 my-2 hidden border-t border-line ${colapsado ? "lg:block" : ""}`} />
                    </>
                  )}

                  <div className={`${cerrado ? "hidden" : "block"} ${colapsado ? "lg:block" : ""}`}>
                    {g.items.map((item) => {
                      const Icono = item.icono;
                      const activo = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.etiqueta}
                          className={`flex items-center gap-3 border-l-[3px] px-4 py-2 text-[13px] transition-colors hover:bg-slate-100 ${
                            activo
                              ? "border-brand bg-brand-soft font-semibold text-brand"
                              : "border-transparent text-slate-700"
                          }`}
                        >
                          <Icono size={18} className="shrink-0" />
                          <span className={colapsado ? "lg:hidden" : ""}>{item.etiqueta}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-3 sm:p-5">
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