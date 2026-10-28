"use client";

import { Barras, Dona, Linea, agruparTop } from "@/components/Graficas";

function Rejilla({ children }) {
  return <div className="mb-4 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">{children}</div>;
}

export function GraficasDiario({ datos }) {
  const porDia = {};
  datos.partidas.forEach((p) => {
    porDia[p.fecha] = (porDia[p.fecha] || 0) + p.totalDebe;
  });
  const dias = Object.keys(porDia)
    .sort()
    .map((f) => ({ etiqueta: f.slice(5), monto: porDia[f] }));

  const porCuenta = {};
  datos.partidas.forEach((p) =>
    p.lineas.forEach((l) => {
      const clave = `${l.codigo} ${l.cuenta}`;
      porCuenta[clave] = (porCuenta[clave] || 0) + l.debe + l.haber;
    })
  );
  const top = agruparTop(
    Object.entries(porCuenta).map(([etiqueta, valor]) => ({ etiqueta, valor })),
    6
  );

  return (
    <Rejilla>
      <Barras titulo="Movimiento por día" datos={dias} series={[{ clave: "monto", nombre: "Monto", color: "#0a6ed1" }]} />
      <Dona titulo="Cuentas con más movimiento" datos={top} centro="Movimiento" />
    </Rejilla>
  );
}

export function GraficasMayor({ datos }) {
  const top = [...datos.cuentas]
    .sort((a, b) => b.totalDebe + b.totalHaber - (a.totalDebe + a.totalHaber))
    .slice(0, 8);

  const movimientos = top.map((c) => ({ etiqueta: c.codigo, debe: c.totalDebe, haber: c.totalHaber }));
  const saldos = top.map((c) => ({ etiqueta: c.codigo, saldo: c.saldoFinal }));

  const unica = datos.cuentas.length === 1 ? datos.cuentas[0] : null;
  const evolucion = unica
    ? unica.movimientos.map((m) => ({ etiqueta: `${m.fecha.slice(5)} #${m.numero}`, valor: m.saldo }))
    : [];

  return (
    <Rejilla>
      <Barras
        titulo="Debe y Haber por cuenta"
        datos={movimientos}
        series={[
          { clave: "debe", nombre: "Debe", color: "#0a6ed1" },
          { clave: "haber", nombre: "Haber", color: "#e9730c" },
        ]}
      />
      {unica ? (
        <Linea titulo={`Evolución del saldo: ${unica.cuenta}`} datos={evolucion} />
      ) : (
        <Barras titulo="Saldo final por cuenta" datos={saldos} series={[{ clave: "saldo", nombre: "Saldo", color: "#107e3e" }]} />
      )}
    </Rejilla>
  );
}

export function GraficasEstado({ datos }) {
  const neta = datos.utilidadNeta;
  const barras = [
    { etiqueta: "Ingresos", monto: datos.ingresos.total, color: "#0a6ed1" },
    { etiqueta: "Costos", monto: datos.costos.total, color: "#e9730c" },
    { etiqueta: "Utilidad bruta", monto: datos.utilidadBruta, color: "#16a3b8" },
    { etiqueta: "Gastos", monto: datos.gastos.total, color: "#bb0000" },
    { etiqueta: neta >= 0 ? "Utilidad neta" : "Pérdida neta", monto: neta, color: neta >= 0 ? "#107e3e" : "#bb0000" },
  ];
  const usaGastos = datos.gastos.cuentas.length > 0;
  const base = usaGastos ? datos.gastos.cuentas : datos.costos.cuentas;
  const dona = agruparTop(base.map((c) => ({ etiqueta: c.cuenta, valor: c.saldo })), 7);

  return (
    <Rejilla>
      <Barras titulo="Resumen del período" datos={barras} series={[{ clave: "monto", nombre: "Monto" }]} />
      <Dona titulo={usaGastos ? "Composición de los gastos" : "Composición de los costos"} datos={dona} centro="Total" />
    </Rejilla>
  );
}

export function GraficasBalance({ datos }) {
  const barras = [
    { etiqueta: "Activo", monto: datos.activo.total, color: "#0a6ed1" },
    { etiqueta: "Pasivo", monto: datos.pasivo.total, color: "#e9730c" },
    { etiqueta: "Capital y resultado", monto: datos.capital.total + datos.resultadoEjercicio, color: "#107e3e" },
  ];
  const activo = agruparTop(datos.activo.cuentas.map((c) => ({ etiqueta: c.nombre, valor: c.saldo })), 7);

  return (
    <Rejilla>
      <Barras titulo="Activo, pasivo y capital" datos={barras} series={[{ clave: "monto", nombre: "Monto" }]} />
      <Dona titulo="Composición del activo" datos={activo} centro="Activo" />
    </Rejilla>
  );
}

export function GraficasBalanza({ datos }) {
  const top = [...datos.cuentas]
    .sort((a, b) => b.debe + b.haber - (a.debe + a.haber))
    .slice(0, 8)
    .map((c) => ({ etiqueta: c.codigo, debe: c.debe, haber: c.haber }));
  const deudores = agruparTop(
    datos.cuentas.map((c) => ({ etiqueta: c.nombre, valor: c.saldoDeudor })),
    7
  );

  return (
    <Rejilla>
      <Barras
        titulo="Sumas del Debe y del Haber"
        datos={top}
        series={[
          { clave: "debe", nombre: "Debe", color: "#0a6ed1" },
          { clave: "haber", nombre: "Haber", color: "#e9730c" },
        ]}
      />
      <Dona titulo="Composición de los saldos deudores" datos={deudores} centro="Saldos" />
    </Rejilla>
  );
}