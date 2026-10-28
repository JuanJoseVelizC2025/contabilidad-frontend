"use client";

import { dinero } from "@/lib/formato";

export const COLORES = ["#0a6ed1", "#e9730c", "#107e3e", "#5b738b", "#bb0000", "#8e44ad", "#16a3b8", "#c9a227"];

export function agruparTop(items, n) {
  const orden = [...items].filter((i) => i.valor > 0).sort((a, b) => b.valor - a.valor);
  if (orden.length <= n) return orden;
  const principales = orden.slice(0, n - 1);
  const resto = orden.slice(n - 1).reduce((s, i) => s + i.valor, 0);
  return [...principales, { etiqueta: "Otras", valor: resto }];
}

function corto(n) {
  const a = Math.abs(n);
  const signo = n < 0 ? "-" : "";
  if (a >= 1000000) return `${signo}${(a / 1000000).toFixed(1)}M`;
  if (a >= 1000) return `${signo}${(a / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return `${signo}${a.toFixed(0)}`;
}

function recortar(texto, max) {
  const t = String(texto);
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function Marco({ titulo, ancho, alto, vacio, children }) {
  return (
    <div className="card p-3">
      <svg
        data-grafica="true"
        data-titulo={titulo}
        viewBox={`0 0 ${ancho} ${alto}`}
        width="100%"
        role="img"
        aria-label={titulo}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <rect width={ancho} height={alto} fill="#ffffff" />
        <text x="12" y="22" fontSize="14" fontWeight="bold" fill="#1d2d3e">
          {titulo}
        </text>
        {vacio ? (
          <text x={ancho / 2} y={alto / 2} textAnchor="middle" fontSize="12" fill="#6a6d70">
            Sin datos para graficar
          </text>
        ) : (
          children
        )}
      </svg>
    </div>
  );
}

export function Barras({ titulo, datos, series }) {
  const ancho = 560;
  const rotar = datos.length > 5;
  const alto = rotar ? 310 : 280;
  const izq = 56;
  const der = 16;
  const arriba = 56;
  const abajo = rotar ? 76 : 44;
  const w = ancho - izq - der;
  const h = alto - arriba - abajo;

  const valores = datos.flatMap((d) => series.map((s) => Number(d[s.clave] || 0)));
  const max = Math.max(0, ...valores);
  const min = Math.min(0, ...valores);
  const rango = max - min || 1;
  const y = (v) => arriba + h - ((v - min) / rango) * h;
  const cero = y(0);
  const ticks = [0, 1, 2, 3, 4].map((i) => min + (rango * i) / 4);
  const grupo = w / Math.max(datos.length, 1);
  const barra = Math.min(34, (grupo * 0.7) / series.length);

  return (
    <Marco
      titulo={titulo}
      ancho={ancho}
      alto={alto}
      vacio={datos.length === 0 || valores.every((v) => v === 0)}
    >
      {series.length > 1 &&
        series.map((s, i) => (
          <g key={s.clave} transform={`translate(${izq + i * 130}, 34)`}>
            <rect width="10" height="10" fill={s.color || COLORES[i]} />
            <text x="15" y="9" fontSize="11" fill="#4b5563">
              {s.nombre}
            </text>
          </g>
        ))}

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={izq} x2={ancho - der} y1={y(t)} y2={y(t)} stroke="#e5e7eb" />
          <text x={izq - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6a6d70">
            {corto(t)}
          </text>
        </g>
      ))}
      <line x1={izq} x2={ancho - der} y1={cero} y2={cero} stroke="#9ca3af" />

      {datos.map((d, i) => {
        const x0 = izq + i * grupo + (grupo - barra * series.length) / 2;
        const cx = izq + i * grupo + grupo / 2;
        const ey = alto - abajo + 14;
        return (
          <g key={i}>
            {series.map((s, j) => {
              const v = Number(d[s.clave] || 0);
              const yy = Math.min(y(v), cero);
              const hh = Math.abs(y(v) - cero);
              const color = d.color && series.length === 1 ? d.color : s.color || COLORES[j];
              return (
                <rect key={s.clave} x={x0 + j * barra} y={yy} width={barra - 2} height={Math.max(hh, 0.5)} fill={color} rx="2">
                  <title>{`${s.nombre}: ${dinero(v)}`}</title>
                </rect>
              );
            })}
            <text
              x={cx}
              y={ey}
              textAnchor={rotar ? "end" : "middle"}
              transform={rotar ? `rotate(-35 ${cx} ${ey})` : undefined}
              fontSize="10"
              fill="#4b5563"
            >
              {recortar(d.etiqueta, 16)}
            </text>
          </g>
        );
      })}
    </Marco>
  );
}

export function Dona({ titulo, datos, centro }) {
  const ancho = 560;
  const alto = 280;
  const items = datos.filter((d) => d.valor > 0).slice(0, 8);
  const total = items.reduce((s, d) => s + d.valor, 0);
  const cx = 130;
  const cy = 160;
  const R = 90;
  const r = 55;
  let acum = -Math.PI / 2;

  const punto = (a, rad) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];

  return (
    <Marco titulo={titulo} ancho={ancho} alto={alto} vacio={total === 0}>
      {items.length === 1 ? (
        <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={COLORES[0]} strokeWidth={R - r} />
      ) : (
        items.map((d, i) => {
          const ang = (d.valor / total) * Math.PI * 2;
          const a0 = acum;
          const a1 = acum + ang;
          acum = a1;
          const [x0, y0] = punto(a0, R);
          const [x1, y1] = punto(a1, R);
          const [x2, y2] = punto(a1, r);
          const [x3, y3] = punto(a0, r);
          const grande = ang > Math.PI ? 1 : 0;
          const ruta = `M ${x0} ${y0} A ${R} ${R} 0 ${grande} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${grande} 0 ${x3} ${y3} Z`;
          return (
            <path key={i} d={ruta} fill={COLORES[i % COLORES.length]}>
              <title>{`${d.etiqueta}: ${dinero(d.valor)}`}</title>
            </path>
          );
        })
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fill="#6a6d70">
        {centro || "Total"}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1d2d3e">
        {dinero(total)}
      </text>

      {items.map((d, i) => (
        <g key={i} transform={`translate(270, ${50 + i * 26})`}>
          <rect width="11" height="11" fill={COLORES[i % COLORES.length]} />
          <text x="18" y="10" fontSize="11" fill="#1d2d3e">
            {recortar(d.etiqueta, 26)}
          </text>
          <text x="18" y="22" fontSize="10" fill="#6a6d70">
            {`${dinero(d.valor)} · ${((d.valor / total) * 100).toFixed(1)}%`}
          </text>
        </g>
      ))}
    </Marco>
  );
}

export function Linea({ titulo, datos }) {
  const ancho = 560;
  const alto = 280;
  const izq = 56;
  const der = 20;
  const arriba = 44;
  const abajo = 44;
  const w = ancho - izq - der;
  const h = alto - arriba - abajo;

  const vals = datos.map((d) => d.valor);
  const max = Math.max(0, ...vals);
  const min = Math.min(0, ...vals);
  const rango = max - min || 1;
  const y = (v) => arriba + h - ((v - min) / rango) * h;
  const x = (i) => izq + (datos.length === 1 ? w / 2 : (i / (datos.length - 1)) * w);
  const ticks = [0, 1, 2, 3, 4].map((i) => min + (rango * i) / 4);
  const puntos = datos.map((d, i) => `${x(i)},${y(d.valor)}`).join(" ");
  const paso = Math.max(1, Math.ceil(datos.length / 6));

  return (
    <Marco titulo={titulo} ancho={ancho} alto={alto} vacio={datos.length === 0}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={izq} x2={ancho - der} y1={y(t)} y2={y(t)} stroke="#e5e7eb" />
          <text x={izq - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6a6d70">
            {corto(t)}
          </text>
        </g>
      ))}
      <polyline points={puntos} fill="none" stroke="#0a6ed1" strokeWidth="2" />
      {datos.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.valor)} r="3.5" fill="#0a6ed1">
          <title>{`${d.etiqueta}: ${dinero(d.valor)}`}</title>
        </circle>
      ))}
      {datos.map((d, i) =>
        i % paso === 0 ? (
          <text key={i} x={x(i)} y={alto - abajo + 16} textAnchor="middle" fontSize="10" fill="#4b5563">
            {recortar(d.etiqueta, 14)}
          </text>
        ) : null
      )}
    </Marco>
  );
}