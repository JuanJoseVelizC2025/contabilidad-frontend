"use client";

import { useEffect, useState } from "react";
import { Printer, Search } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Encabezado, useAviso } from "@/components/ui";
import EncabezadoReporte from "@/components/EncabezadoReporte";
import BotonExcel from "@/components/BotonExcel";
import { Barras, Dona, agruparTop } from "@/components/Graficas";

function Kpi({ titulo, valor, detalle, color }) {
  return (
    <div className="card p-4" style={{ borderTop: `3px solid ${color}` }}>
      <p className="text-xs uppercase tracking-wide text-muted">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted">{detalle}</p>}
    </div>
  );
}

function Libro({ titulo, prefijo, terceroEtiqueta, bloque }) {
  return (
    <div className="card mb-4 max-w-5xl overflow-hidden">
      <h2 className="px-4 py-3 font-semibold">{titulo}</h2>
      <table className="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>No.</th>
            <th>{terceroEtiqueta}</th>
            <th>NIT</th>
            <th>Condición</th>
            <th className="text-right">Subtotal</th>
            <th className="text-right">IVA</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {bloque.documentos.map((d) => (
            <tr key={`${d.tipo}-${d.numero}`}>
              <td className="whitespace-nowrap">{d.fecha}</td>
              <td className="font-mono">
                {prefijo}-{String(d.numero).padStart(4, "0")}
              </td>
              <td>{d.tercero}</td>
              <td className="font-mono">{d.nit}</td>
              <td>{d.condicion === "Credito" ? "Crédito" : "Contado"}</td>
              <td className="text-right">{dinero(d.subtotal)}</td>
              <td className="text-right">{dinero(d.iva)}</td>
              <td className="text-right">{dinero(d.total)}</td>
            </tr>
          ))}
          {bloque.documentos.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-muted">
                No hay facturas en el período.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td colSpan={5} className="text-right">
              Totales
            </td>
            <td className="text-right">{dinero(bloque.subtotal)}</td>
            <td className="text-right">{dinero(bloque.iva)}</td>
            <td className="text-right">{dinero(bloque.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function IvaPage() {
  const aviso = useAviso();
  const [desde, setDesde] = useState(`${hoy().slice(0, 8)}01`);
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState(null);

  async function generar(e) {
    if (e) e.preventDefault();
    try {
      setDatos(await api(`/api/iva?desde=${desde}&hasta=${hasta}`));
    } catch (err) {
      aviso.error(err.message);
    }
  }

  useEffect(() => {
    generar();
  }, []);

  let barras = [];
  let clientes = [];
  if (datos) {
    const aPagar = datos.ivaPorPagar >= 0;
    barras = [
      { etiqueta: "IVA débito (ventas)", monto: datos.ivaDebito, color: "#e9730c" },
      { etiqueta: "IVA crédito (compras)", monto: datos.ivaCredito, color: "#0a6ed1" },
      {
        etiqueta: aPagar ? "IVA por pagar" : "Crédito a favor",
        monto: Math.abs(datos.ivaPorPagar),
        color: aPagar ? "#bb0000" : "#107e3e",
      },
    ];
    const porCliente = {};
    datos.ventas.documentos.forEach((d) => {
      porCliente[d.tercero] = (porCliente[d.tercero] || 0) + d.subtotal;
    });
    clientes = agruparTop(
      Object.entries(porCliente).map(([etiqueta, valor]) => ({ etiqueta, valor })),
      6
    );
  }

  return (
    <div>
      <Encabezado titulo="Libro de IVA" descripcion="Ventas, compras y resumen del IVA por pagar">
        {datos && (
          <>
            <button type="button" className="btn" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir / PDF
            </button>
            <BotonExcel archivo="libro-iva" titulo="Libro de IVA" />
          </>
        )}
      </Encabezado>

      <form onSubmit={generar} className="card mb-4 flex max-w-5xl flex-wrap items-end gap-3 p-3 print:hidden">
        <div>
          <label className="label">Desde</label>
          <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} required />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary">
          <Search size={15} /> Generar
        </button>
      </form>

      {datos && (
        <>
          <EncabezadoReporte titulo="Libro de IVA" subtitulo={`Del ${datos.desde} al ${datos.hasta}`} />

          <div className="mb-4 grid max-w-5xl grid-cols-3 gap-4">
            <Kpi
              titulo="IVA débito fiscal"
              valor={dinero(datos.ivaDebito)}
              detalle={`${datos.ventas.documentos.length} facturas de venta`}
              color="#e9730c"
            />
            <Kpi
              titulo="IVA crédito fiscal"
              valor={dinero(datos.ivaCredito)}
              detalle={`${datos.compras.documentos.length} facturas de compra`}
              color="#0a6ed1"
            />
            <Kpi
              titulo={datos.ivaPorPagar >= 0 ? "IVA por pagar" : "Crédito fiscal a favor"}
              valor={dinero(Math.abs(datos.ivaPorPagar))}
              detalle="Débito menos crédito"
              color={datos.ivaPorPagar >= 0 ? "#bb0000" : "#107e3e"}
            />
          </div>

          <div className="mb-4 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
            <Barras titulo="IVA del período" datos={barras} series={[{ clave: "monto", nombre: "Monto" }]} />
            <Dona titulo="Ventas por cliente (sin IVA)" datos={clientes} centro="Ventas" />
          </div>

          <Libro titulo="Libro de ventas" prefijo="V" terceroEtiqueta="Cliente" bloque={datos.ventas} />
          <Libro titulo="Libro de compras" prefijo="C" terceroEtiqueta="Proveedor" bloque={datos.compras} />

          <p className="max-w-5xl text-sm text-muted">
            Incluye las facturas registradas en el módulo de Ventas y Compras; las anuladas no se cuentan.
          </p>
        </>
      )}
    </div>
  );
}