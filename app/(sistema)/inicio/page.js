"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, obtenerUsuario } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Barras, Dona, agruparTop } from "@/components/Graficas";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function Kpi({ titulo, valor, detalle, color }) {
  return (
    <div className="card p-4" style={{ borderTop: `3px solid ${color}` }}>
      <p className="text-xs uppercase tracking-wide text-muted">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted">{detalle}</p>}
    </div>
  );
}

export default function InicioPage() {
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState(null);
  const [balance, setBalance] = useState(null);
  const [bancos, setBancos] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [saludo, setSaludo] = useState("Bienvenido");
  const [error, setError] = useState("");

  useEffect(() => {
    setUsuario(obtenerUsuario());
    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
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
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {saludo}
            {usuario ? `, ${usuario.nombreCompleto}` : ""}
          </h1>
          <p className="text-muted">
            {p ? `Resumen del período ${String(p.mes).padStart(2, "0")}/${p.anio}` : "Resumen del sistema"}
          </p>
        </div>
        <div className="flex gap-2">
          {puedeRegistrar && (
            <Link href="/partidas" className="btn btn-primary">
              Nueva partida
            </Link>
          )}
          <Link href="/reportes/estado-resultados" className="btn">
            Estado de Resultados
          </Link>
        </div>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}

      {datos && (
        <>
          <div className="mb-4 grid grid-cols-4 gap-4">
            <Kpi titulo="Ingresos" valor={dinero(datos.ingresos)} color="#0a6ed1" />
            <Kpi
              titulo="Costos y gastos"
              valor={dinero(datos.costos + datos.gastos)}
              detalle={`Costos ${dinero(datos.costos)} · Gastos ${dinero(datos.gastos)}`}
              color="#e9730c"
            />
            <Kpi
              titulo="Utilidad neta"
              valor={dinero(datos.utilidadNeta)}
              color={datos.utilidadNeta >= 0 ? "#107e3e" : "#bb0000"}
            />
            <Kpi
              titulo="Partidas del período"
              valor={datos.registradas}
              detalle={`${datos.anuladas} anuladas`}
              color="#5b738b"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <Barras
              titulo="Ingresos y egresos de los últimos 6 meses"
              datos={meses}
              series={[
                { clave: "ingresos", nombre: "Ingresos", color: "#0a6ed1" },
                { clave: "egresos", nombre: "Costos y gastos", color: "#e9730c" },
              ]}
            />
            <Dona titulo="Composición de gastos del período" datos={gastos} centro="Gastos" />
            <Dona titulo="Composición del activo" datos={activos} centro="Activo" />
            {bancos && saldosBanco.length > 0 ? (
              <Barras
                titulo="Saldo por banco"
                datos={saldosBanco}
                series={[{ clave: "saldo", nombre: "Saldo", color: "#107e3e" }]}
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
                    <td>{u.fecha}</td>
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
        </>
      )}
    </div>
  );
}