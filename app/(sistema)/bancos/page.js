"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { dinero, hoy } from "@/lib/formato";
import { Encabezado, Modal, useAviso } from "@/components/ui";

const TIPOS = [
  { valor: "Deposito", etiqueta: "Depósito", clase: "badge-ok", ayuda: "Entra dinero al banco. Contrapartida: de dónde viene (caja, ventas, capital...)." },
  { valor: "Retiro", etiqueta: "Retiro", clase: "badge-error", ayuda: "Sale dinero del banco. Contrapartida: a dónde va (por ejemplo, caja)." },
  { valor: "Cheque", etiqueta: "Cheque", clase: "badge-error", ayuda: "Pago con cheque. Contrapartida: lo que se paga (gasto, proveedor...)." },
  { valor: "NotaDebito", etiqueta: "Nota de débito", clase: "badge-error", ayuda: "Cargo del banco (comisiones). Contrapartida: el gasto." },
  { valor: "NotaCredito", etiqueta: "Nota de crédito", clase: "badge-ok", ayuda: "Abono del banco (intereses ganados). Contrapartida: el ingreso." },
  { valor: "Transferencia", etiqueta: "Transferencia", clase: "badge-gris", ayuda: "Mueve dinero entre dos cuentas bancarias propias." },
];

const BANCOS_GT = ["Banco Industrial", "Banco BAC Credomatic", "Banrural", "Banco G&T Continental", "Bantrab"];

function tipoInfo(valor) {
  return TIPOS.find((t) => t.valor === valor) || TIPOS[0];
}

export default function BancosPage() {
  const aviso = useAviso();
  const [bancos, setBancos] = useState([]);
  const [contables, setContables] = useState([]);
  const [movs, setMovs] = useState([]);
  const [filtros, setFiltros] = useState({ idCuentaBancaria: "", desde: "", hasta: "" });
  const [formCuenta, setFormCuenta] = useState(null);
  const [formMov, setFormMov] = useState(null);
  const [anulando, setAnulando] = useState(null);
  const [motivo, setMotivo] = useState("");

  async function cargarBancos() {
    try {
      setBancos(await api("/api/bancos/cuentas"));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  async function cargarMovs(f = filtros) {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([clave, valor]) => {
      if (valor) params.append(clave, valor);
    });
    try {
      setMovs(await api(`/api/bancos/movimientos?${params.toString()}`));
    } catch (e) {
      aviso.error(e.message);
    }
  }

  useEffect(() => {
    cargarBancos();
    cargarMovs();
    api("/api/cuentas")
      .then((c) => setContables(c.filter((x) => x.aceptaMovimientos && x.activa)))
      .catch((e) => aviso.error(e.message));
  }, []);

  const bancarias = contables.filter(
    (c) => c.codigo.startsWith("1.1.01.02.") && !bancos.some((b) => b.idCuenta === c.idCuenta)
  );
  const totalSaldo = bancos.filter((b) => b.activa).reduce((s, b) => s + b.saldo, 0);

  function seleccionarBanco(id) {
    const nuevo = { ...filtros, idCuentaBancaria: String(filtros.idCuentaBancaria) === String(id) ? "" : String(id) };
    setFiltros(nuevo);
    cargarMovs(nuevo);
  }

  function abrirMovimiento() {
    setFormMov({
      idCuentaBancaria: filtros.idCuentaBancaria || "",
      tipo: "Deposito",
      fecha: hoy(),
      monto: "",
      referencia: "",
      concepto: "",
      idCuentaContrapartida: "",
      idCuentaBancariaDestino: "",
    });
  }

  async function guardarCuenta(e) {
    e.preventDefault();
    try {
      await api("/api/bancos/cuentas", {
        method: "POST",
        body: {
          banco: formCuenta.banco,
          numeroCuenta: formCuenta.numeroCuenta,
          tipoCuenta: formCuenta.tipoCuenta,
          idCuenta: Number(formCuenta.idCuenta),
        },
      });
      aviso.ok("Cuenta bancaria creada");
      setFormCuenta(null);
      cargarBancos();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function guardarMovimiento(e) {
    e.preventDefault();
    const esTransferencia = formMov.tipo === "Transferencia";
    try {
      const r = await api("/api/bancos/movimientos", {
        method: "POST",
        body: {
          idCuentaBancaria: Number(formMov.idCuentaBancaria),
          fecha: formMov.fecha,
          tipo: formMov.tipo,
          monto: Number(formMov.monto),
          referencia: formMov.referencia || null,
          concepto: formMov.concepto,
          idCuentaContrapartida: esTransferencia ? null : Number(formMov.idCuentaContrapartida),
          idCuentaBancariaDestino: esTransferencia ? Number(formMov.idCuentaBancariaDestino) : null,
        },
      });
      aviso.ok(`Movimiento registrado (Partida No. ${r.numeroPartida})`);
      setFormMov(null);
      cargarBancos();
      cargarMovs();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function anular() {
    try {
      await api(`/api/bancos/movimientos/${anulando.idMovimiento}/anular`, {
        method: "PUT",
        body: { motivo },
      });
      aviso.ok("Movimiento anulado");
      setAnulando(null);
      setMotivo("");
      cargarBancos();
      cargarMovs();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  async function conciliar(m) {
    try {
      await api(`/api/bancos/movimientos/${m.idMovimiento}/conciliar`, {
        method: "PUT",
        body: { conciliado: !m.conciliado },
      });
      cargarMovs();
    } catch (err) {
      aviso.error(err.message);
    }
  }

  const bancoOrigen = formMov ? bancos.find((b) => String(b.idCuentaBancaria) === String(formMov.idCuentaBancaria)) : null;
  const info = formMov ? tipoInfo(formMov.tipo) : null;

  return (
    <div>
      <Encabezado
        titulo="Bancos"
        descripcion="Cuentas bancarias y movimientos; cada movimiento genera su partida contable"
      >
        <button className="btn" onClick={() => setFormCuenta({ banco: "", numeroCuenta: "", tipoCuenta: "Monetaria", idCuenta: "" })}>
          <Plus size={16} /> Nueva cuenta bancaria
        </button>
        <button className="btn btn-primary" onClick={abrirMovimiento} disabled={bancos.length === 0}>
          <Plus size={16} /> Nuevo movimiento
        </button>
      </Encabezado>

      <div className="mb-4 grid max-w-6xl grid-cols-4 gap-3">
        <div className="card p-4" style={{ borderTop: "3px solid #0a6ed1" }}>
          <p className="text-xs uppercase tracking-wide text-muted">Saldo total en bancos</p>
          <p className="mt-1 text-2xl font-semibold">{dinero(totalSaldo)}</p>
          <p className="mt-1 text-xs text-muted">{bancos.length} cuentas bancarias</p>
        </div>
        {bancos.map((b) => (
          <button
            key={b.idCuentaBancaria}
            onClick={() => seleccionarBanco(b.idCuentaBancaria)}
            className={`card p-4 text-left hover:bg-slate-50 ${
              String(filtros.idCuentaBancaria) === String(b.idCuentaBancaria) ? "ring-2 ring-brand" : ""
            }`}
          >
            <p className="text-sm font-semibold">{b.banco}</p>
            <p className="text-xs text-muted">
              {b.tipoCuenta} · {b.numeroCuenta}
            </p>
            <p className="mt-1 text-xl font-semibold">{dinero(b.saldo)}</p>
            <p className="mt-1 font-mono text-[11px] text-muted">{b.codigo}</p>
          </button>
        ))}
        {bancos.length === 0 && (
          <div className="card col-span-3 p-4 text-muted">
            Todavía no hay cuentas bancarias. Cree la primera con <b>Nueva cuenta bancaria</b>.
          </div>
        )}
      </div>

      <div className="card mb-3 flex max-w-6xl flex-wrap items-end gap-3 p-3">
        <div>
          <label className="label">Desde</label>
          <input
            type="date"
            className="input"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input
            type="date"
            className="input"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" onClick={() => cargarMovs(filtros)}>
          Filtrar
        </button>
        <button
          className="btn"
          onClick={() => {
            const vacios = { idCuentaBancaria: "", desde: "", hasta: "" };
            setFiltros(vacios);
            cargarMovs(vacios);
          }}
        >
          Limpiar
        </button>
      </div>

      <div className="card max-w-6xl overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cuenta</th>
              <th>Tipo</th>
              <th>Referencia</th>
              <th>Concepto</th>
              <th className="text-right">Monto</th>
              <th>Partida</th>
              <th>Conciliado</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.idMovimiento} className={m.estado === "Anulado" ? "text-muted line-through" : ""}>
                <td className="whitespace-nowrap">{m.fecha}</td>
                <td>
                  {m.banco}
                  <div className="text-xs text-muted">{m.numeroCuenta}</div>
                </td>
                <td>
                  <span className={`badge ${tipoInfo(m.tipo).clase}`}>{tipoInfo(m.tipo).etiqueta}</span>
                </td>
                <td>{m.referencia}</td>
                <td>{m.concepto}</td>
                <td className="text-right">{dinero(m.monto)}</td>
                <td>{m.numeroPartida ? `No. ${m.numeroPartida}` : ""}</td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={m.conciliado}
                    disabled={m.estado === "Anulado"}
                    onChange={() => conciliar(m)}
                  />
                </td>
                <td>
                  {m.estado !== "Anulado" && (
                    <button className="btn" onClick={() => setAnulando(m)}>
                      Anular
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {movs.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted">
                  No hay movimientos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formCuenta && (
        <Modal titulo="Nueva cuenta bancaria" onCerrar={() => setFormCuenta(null)}>
          <form onSubmit={guardarCuenta} className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Banco</label>
              <input
                className="input"
                list="lista-bancos"
                value={formCuenta.banco}
                onChange={(e) => setFormCuenta({ ...formCuenta, banco: e.target.value })}
                required
              />
              <datalist id="lista-bancos">
                {BANCOS_GT.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Número de cuenta</label>
              <input
                className="input"
                value={formCuenta.numeroCuenta}
                onChange={(e) => setFormCuenta({ ...formCuenta, numeroCuenta: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={formCuenta.tipoCuenta}
                onChange={(e) => setFormCuenta({ ...formCuenta, tipoCuenta: e.target.value })}
              >
                <option>Monetaria</option>
                <option>Ahorro</option>
              </select>
            </div>
            <div>
              <label className="label">Cuenta contable (rubro Bancos)</label>
              <select
                className="input"
                value={formCuenta.idCuenta}
                onChange={(e) => setFormCuenta({ ...formCuenta, idCuenta: e.target.value })}
                required
              >
                <option value="">Seleccione...</option>
                {bancarias.map((c) => (
                  <option key={c.idCuenta} value={c.idCuenta}>
                    {c.codigo} - {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setFormCuenta(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Crear cuenta
              </button>
            </div>
          </form>
        </Modal>
      )}

      {formMov && (
        <Modal titulo="Nuevo movimiento bancario" onCerrar={() => setFormMov(null)} ancho="max-w-2xl">
          <form onSubmit={guardarMovimiento} className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cuenta bancaria</label>
              <select
                className="input"
                value={formMov.idCuentaBancaria}
                onChange={(e) => setFormMov({ ...formMov, idCuentaBancaria: e.target.value })}
                required
              >
                <option value="">Seleccione...</option>
                {bancos
                  .filter((b) => b.activa)
                  .map((b) => (
                    <option key={b.idCuentaBancaria} value={b.idCuentaBancaria}>
                      {b.banco} · {b.numeroCuenta}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo de movimiento</label>
              <select
                className="input"
                value={formMov.tipo}
                onChange={(e) => setFormMov({ ...formMov, tipo: e.target.value })}
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <p className="col-span-2 rounded bg-slate-50 px-3 py-2 text-xs text-muted">{info.ayuda}</p>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={formMov.fecha}
                onChange={(e) => setFormMov({ ...formMov, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Monto</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input text-right"
                value={formMov.monto}
                onChange={(e) => setFormMov({ ...formMov, monto: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Referencia (No. de boleta o cheque)</label>
              <input
                className="input"
                value={formMov.referencia}
                onChange={(e) => setFormMov({ ...formMov, referencia: e.target.value })}
              />
            </div>
            <div>
              {formMov.tipo === "Transferencia" ? (
                <>
                  <label className="label">Cuenta de destino</label>
                  <select
                    className="input"
                    value={formMov.idCuentaBancariaDestino}
                    onChange={(e) => setFormMov({ ...formMov, idCuentaBancariaDestino: e.target.value })}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {bancos
                      .filter((b) => b.activa && String(b.idCuentaBancaria) !== String(formMov.idCuentaBancaria))
                      .map((b) => (
                        <option key={b.idCuentaBancaria} value={b.idCuentaBancaria}>
                          {b.banco} · {b.numeroCuenta}
                        </option>
                      ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="label">Cuenta contable de contrapartida</label>
                  <select
                    className="input"
                    value={formMov.idCuentaContrapartida}
                    onChange={(e) => setFormMov({ ...formMov, idCuentaContrapartida: e.target.value })}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {contables
                      .filter((c) => !bancoOrigen || c.idCuenta !== bancoOrigen.idCuenta)
                      .map((c) => (
                        <option key={c.idCuenta} value={c.idCuenta}>
                          {c.codigo} - {c.nombre}
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>
            <div className="col-span-2">
              <label className="label">Concepto</label>
              <input
                className="input"
                value={formMov.concepto}
                onChange={(e) => setFormMov({ ...formMov, concepto: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setFormMov(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Registrar movimiento
              </button>
            </div>
          </form>
        </Modal>
      )}

      {anulando && (
        <Modal titulo="Anular movimiento bancario" onCerrar={() => setAnulando(null)} ancho="max-w-md">
          <p className="mb-3 text-sm">
            Se anulará el movimiento de <b>{dinero(anulando.monto)}</b> y su partida contable asociada.
          </p>
          <input
            className="input mb-3"
            placeholder="Motivo de anulación"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={() => setAnulando(null)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={anular} disabled={!motivo.trim()}>
              Anular
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}