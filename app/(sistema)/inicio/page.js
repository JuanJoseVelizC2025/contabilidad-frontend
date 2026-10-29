"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  BookOpen,
  FileText,
  Landmark,
  Package,
  Percent,
  PiggyBank,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { api, obtenerUsuario } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Barras, Dona, agruparTop } from "@/components/Graficas";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const ACCESOS_OPERACION = [
  { href: "/partidas", etiqueta: "Partidas contables", Icono: FileText, color: "#1661BE" },
  { href: "/bancos", etiqueta: "Bancos", Icono: Banknote, color: "#0C7ECF" },
  { href: "/ventas", etiqueta: "Facturas de venta", Icono: Receipt, color: "#019CE0" },
  { href: "/compras", etiqueta: "Facturas de compra", Icono: ShoppingCart, color: "#00B9F2" },
  { href: "/activos", etiqueta: "Activos fijos", Icono: Package, color: "#1661BE" },
];

const ACCESOS_REPORTES = [
  { href: "/reportes/balance-general", etiqueta: "Balance General", Icono: Landmark, color: "#107e3e" },
  { href: "/reportes/estado-resultados", etiqueta: "Estado de Resultados", Icono: TrendingUp, color: "#e9730c" },
  { href: "/reportes/iva", etiqueta: "Libro de IVA", Icono: Percent, color: "#8e44ad" },
  { href: "/reportes/diario", etiqueta: "Libro Diario", Icono: BookOpen, color: "#5b738b" },
];

function Kpi({ titulo, valor, detalle, color, Icono }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted">{titulo}</p>
          <p className="mt-1 truncate text-xl font-semibold sm:text-2xl">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-muted">{detalle}</p>}
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}1f`, color }}
        >
          <Icono size={20} />
        </span>
      </div>
      <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: color }} />
    </div>
  );
}

function Acceso({ href, etiqueta, Icono, color }) {
  return (
    <Link href={href} className="card group flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ background: color }}
      >
        <Icono size={20} />
      </span>
      <span className="text-sm font-medium">{etiqueta}</span>
    </Link>
  );
}

export default function InicioPage() {
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState(null);
  const [balance, setBalance] = useState(null);
  const [bancos, setBancos] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [saludo, setSaludo] = useState("Bienvenido");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUsuario(obtenerUsuario());
    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
    setFecha(
      new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    );
    api("/api/dashboard")
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!datos?.periodo) return;
    api(`/api/reportes/estado-resultados?idPeriodo=${datos.periodo.idPeriodo}`)
      .then(setEstado)
      .catch(() => {});
    api(`/api/reportes/balance-general?hasta=${hoy()}`)
      .then(setBalance)
      .catch(() => {});
    api("/api/bancos/cuentas")
      .then(setBancos)
      .catch(() => {});
  }, [datos]);

  const puedeRegistrar = usuario && ["Administrador", "Contador"].includes(usuario.rol);
  const p = datos?.periodo;

  const meses = datos
    ? datos.meses.map((m) => ({ etiqueta: MESES[m.mes - 1], ingresos: m.ingresos, egresos: m.egresos }))
    : [];
  const gastos = estado
    ? agruparTop(
        (estado.gastos.cuentas.length ? estado.gastos.cuentas : estado.costos.cuentas).map((c) => ({
          etiqueta: c.cuenta,
          valor: c.saldo,
        })),
        6
      )
    : [];
  const activos = balance
    ? agruparTop(balance.activo.cuentas.map((c) => ({ etiqueta: c.nombre, valor: c.saldo })), 6)
    : [];
  const saldosBanco = bancos
    ? bancos.filter((b) => b.activa).map((b) => ({ etiqueta: b.banco.replace("Banco ", ""), saldo: b.saldo }))
    : [];

  return (
    <div>
      <div
        className="mb-4 overflow-hidden rounded-xl p-5 text-white sm:p-6"
        style={{ background: "linear-gradient(120deg, #1661BE 0%, #0C7ECF 55%, #00B9F2 100%)" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/80 first-letter:uppercase">{fecha}</p>
            <h1 className="text-xl font-semibold sm:text-2xl">
              {saludo}
              {usuario ? `, ${usuario.nombreCompleto}` : ""}
            </h1>
            <p className="text-white/80">
              {p ? `Resumen del período ${String(p.mes).padStart(2, "0")}/${p.anio} · ${p.estado}` : "Resumen del sistema"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {puedeRegistrar && (
              <Link
                href="/partidas"
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-[#1661BE] shadow-sm hover:bg-white/90"
              >
                Nueva partida
              </Link>
            )}
            <Link
              href="/reportes/estado-resultados"
              className="rounded-md border border-white/60 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Estado de Resultados
            </Link>
          </div>
        </div>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}

      {datos && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi titulo="Ingresos" valor={dinero(datos.ingresos)} color="#1661BE" Icono={TrendingUp} />
            <Kpi
              titulo="Costos y gastos"
              valor={dinero(datos.costos + datos.gastos)}
              detalle={`Costos ${dinero(datos.costos)} · Gastos ${dinero(datos.gastos)}`}
              color="#e9730c"
              Icono={Wallet}
            />
            <Kpi
              titulo="Utilidad neta"
              valor={dinero(datos.utilidadNeta)}
              color={datos.utilidadNeta >= 0 ? "#107e3e" : "#bb0000"}
              Icono={PiggyBank}
            />
            <Kpi
              titulo="Partidas del período"
              valor={datos.registradas}
              detalle={`${datos.anuladas} anuladas`}
              color="#00B9F2"
              Icono={FileText}
            />
          </div>

          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Accesos rápidos</h2>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {puedeRegistrar && ACCESOS_OPERACION.map((a) => <Acceso key={a.href} {...a} />)}
            {ACCESOS_REPORTES.map((a) => (
              <Acceso key={a.href} {...a} />
            ))}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Barras
              titulo="Ingresos y egresos de los últimos 6 meses"
              datos={meses}
              series={[
                { clave: "ingresos", nombre: "Ingresos", color: "#1661BE" },
                { clave: "egresos", nombre: "Costos y gastos", color: "#e9730c" },
              ]}
            />
            <Dona titulo="Composición de gastos del período" datos={gastos} centro="Gastos" />
            <Dona titulo="Composición del activo" datos={activos} centro="Activo" />
            {bancos && saldosBanco.length > 0 ? (
              <Barras
                titulo="Saldo por banco"
                datos={saldosBanco}
                series={[{ clave: "saldo", nombre: "Saldo", color: "#00B9F2" }]}
              />
            ) : (
              <div className="card p-4">
                <h2 className="mb-3 font-semibold">Información del sistema</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Período actual</dt>
                    <dd>
                      {p ? (
                        <span className={`badge ${p.estado === "Abierto" ? "badge-ok" : "badge-gris"}`}>
                          {String(p.mes).padStart(2, "0")}/{p.anio} · {p.estado}
                        </span>
                      ) : (
                        "Sin períodos"
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Cuentas activas</dt>
                    <dd className="font-medium">{datos.cuentasActivas}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Usuarios activos</dt>
                    <dd className="font-medium">{datos.usuariosActivos}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="font-semibold">Últimas partidas</h2>
              {puedeRegistrar && (
                <Link href="/partidas" className="text-sm text-brand hover:underline">
                  Ver todas
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th className="text-right">Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.ultimas.map((u) => (
                    <tr key={u.idPartida}>
                      <td>{u.numero}</td>
                      <td className="whitespace-nowrap">{u.fecha}</td>
                      <td>{u.concepto}</td>
                      <td className="text-right">{dinero(u.total)}</td>
                      <td>
                        <span className={`badge ${u.estado === "Registrada" ? "badge-ok" : "badge-gris"}`}>
                          {u.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {datos.ultimas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        Todavía no hay partidas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}