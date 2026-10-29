export default function Logo({ size = 36, texto = true, claro = false }) {
  const fondo = claro ? "#ffffff" : "#1661BE";
  const barra = claro ? "#1661BE" : "#ffffff";
  const punta = "#00B9F2";

  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Contabilidad ERP">
        <rect width="40" height="40" rx="9" fill={fondo} />
        <rect x="10" y="22" width="5" height="9" rx="1" fill={barra} />
        <rect x="17.5" y="17" width="5" height="14" rx="1" fill={barra} />
        <rect x="25" y="11" width="5" height="20" rx="1" fill={punta} />
      </svg>
      {texto && (
        <span
          className={`text-[17px] font-semibold tracking-wide ${claro ? "text-white" : "text-slate-800"}`}
        >
          Contabilidad ERP
        </span>
      )}
    </div>
  );
}