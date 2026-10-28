"use client";

import { Download } from "lucide-react";
import { useAviso } from "@/components/ui";

function aNumero(texto) {
  const t = texto.trim();
  if (!/^Q\s*-?[\d,]+\.\d{2}$/.test(t)) return null;
  return Number(t.replace(/^Q\s*/, "").replace(/,/g, ""));
}

async function svgAPng(svg) {
  const caja = svg.viewBox.baseVal;
  const ancho = caja.width;
  const alto = caja.height;

  const clon = svg.cloneNode(true);
  clon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clon.setAttribute("width", ancho);
  clon.setAttribute("height", alto);

  const texto = new XMLSerializer().serializeToString(clon);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(texto)}`;

  const imagen = new Image();
  await new Promise((resolver, rechazar) => {
    imagen.onload = resolver;
    imagen.onerror = rechazar;
    imagen.src = url;
  });

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho * 2;
  lienzo.height = alto * 2;
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

  return { base64: lienzo.toDataURL("image/png"), ancho, alto };
}

async function exportar(archivo, titulo) {
  const modulo = await import("exceljs/dist/exceljs.min.js");
  const ExcelJS = modulo.default ?? modulo;

  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Reporte");
  const anchos = [];

  const encabezado = hoja.addRow([titulo]);
  encabezado.font = { bold: true, size: 14 };
  hoja.addRow([`Generado: ${new Date().toLocaleString("es-GT")}`]);
  hoja.addRow([]);

  [...document.querySelectorAll("main table")]
    .filter((tabla) => tabla.getClientRects().length > 0)
    .forEach((tabla) => {
      const subtitulo = tabla.closest(".card")?.querySelector("h2")?.innerText;
      if (subtitulo) {
        const filaTitulo = hoja.addRow([subtitulo]);
        filaTitulo.font = { bold: true };
      }

      tabla.querySelectorAll("tr").forEach((tr) => {
        const valores = [];
        [...tr.children].forEach((celda) => {
          const texto = celda.innerText.trim();
          const numero = aNumero(texto);
          valores.push(numero !== null ? numero : texto);
          for (let i = 1; i < celda.colSpan; i++) valores.push("");
        });

        const fila = hoja.addRow(valores);
        const esEncabezado = !!tr.closest("thead");

        fila.eachCell((celda, columna) => {
          if (typeof celda.value === "number") celda.numFmt = '"Q" #,##0.00';
          const largo = String(celda.value ?? "").length;
          anchos[columna] = Math.min(Math.max(anchos[columna] ?? 10, largo + 2), 50);
        });

        if (esEncabezado) {
          fila.font = { bold: true };
          fila.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF1F4" } };
        }
      });
      hoja.addRow([]);
    });

  anchos.forEach((ancho, i) => {
    if (ancho) hoja.getColumn(i).width = ancho;
  });

  const graficas = [...document.querySelectorAll("main svg[data-grafica]")].filter(
    (svg) => svg.getClientRects().length > 0
  );

  if (graficas.length > 0) {
    const hojaG = libro.addWorksheet("Gráficas");
    const cab = hojaG.addRow([`${titulo}: gráficas`]);
    cab.font = { bold: true, size: 14 };
    let fila = 2;

    for (const svg of graficas) {
      const png = await svgAPng(svg);
      const id = libro.addImage({ base64: png.base64, extension: "png" });
      hojaG.addImage(id, { tl: { col: 0, row: fila }, ext: { width: png.ancho, height: png.alto } });
      fila += Math.ceil(png.alto / 20) + 2;
    }
  }

  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${archivo}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}

export default function BotonExcel({ archivo, titulo }) {
  const aviso = useAviso();

  async function clic() {
    try {
      await exportar(archivo, titulo);
    } catch (e) {
      aviso.error(`No se pudo exportar: ${e.message}`);
    }
  }

  return (
    <button type="button" className="btn" onClick={clic}>
      <Download size={15} /> Exportar a Excel
    </button>
  );
}