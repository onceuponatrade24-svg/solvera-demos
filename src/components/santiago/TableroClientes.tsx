"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  claveNombre,
  DIAS_PARA_RECONTACTAR,
  telWhatsApp,
  tocaRecontactar,
  type Cliente,
  type Pieza,
  type Tablero,
} from "@/lib/santiago/datos";
import { anotarSeguimiento, salir } from "@/app/santiago/acciones";

type Vista = "hoy" | "pendientes" | "recontactar" | "todos";
type Orden = "reciente" | "compras";

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function fecha(iso: string | null) {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${+d} ${MES[+m - 1]} ${a}`;
}

function hace(dias: number | null) {
  if (dias === null) return "sin compras";
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 60) return `hace ${dias} días`;
  const meses = Math.round(dias / 30);
  return meses < 12 ? `hace ${meses} meses` : `hace ${(dias / 365).toFixed(1).replace(".0", "")} años`;
}

function primerNombre(nombre: string) {
  return nombre.split(" ")[0] ?? nombre;
}

function waUrl(tel: string, nombre: string) {
  const texto = `Hola ${primerNombre(nombre)}, ¿cómo estás? Te saluda Santiago.`;
  return `https://wa.me/${telWhatsApp(tel)}?text=${encodeURIComponent(texto)}`;
}

const RESULTADOS = ["Le escribí", "Me contestó", "Interesado", "Va a comprar", "No le interesa por ahora", "No contestó"];

export function TableroClientes({ tablero, actualizado }: { tablero: Tablero; actualizado: string }) {
  const { clientes, hoy, resumen } = tablero;
  const [vista, setVista] = useState<Vista>(resumen.hoyToca ? "hoy" : "pendientes");
  const [busca, setBusca] = useState("");
  const [orden, setOrden] = useState<Orden>("reciente");
  const [abierto, setAbierto] = useState<string | null>(null);
  const router = useRouter();
  const [recargando, startRecarga] = useTransition();

  const porId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  const lista = useMemo(() => {
    const q = claveNombre(busca);
    let l = clientes;
    if (!q) {
      if (vista === "hoy") l = l.filter((c) => c.proximoContacto && c.proximoContacto <= hoy);
      if (vista === "recontactar")
        l = l.filter((c) => tocaRecontactar(c, hoy)).sort((a, b) => b.totalPiezas - a.totalPiezas || (b.ultimaCompra ?? "").localeCompare(a.ultimaCompra ?? ""));
      if (vista === "hoy") l = [...l].sort((a, b) => (a.proximoContacto ?? "").localeCompare(b.proximoContacto ?? ""));
    } else {
      l = l.filter((c) =>
        claveNombre(
          [c.nombre, c.ciudad, c.telefonos.join(" "), ...c.piezas.map((p) => `${p.marca} ${p.modelo}`)].join(" "),
        ).includes(q),
      );
    }
    if ((vista === "todos" || q) && orden === "compras") l = [...l].sort((a, b) => b.totalPiezas - a.totalPiezas);
    return l;
  }, [clientes, busca, vista, orden, hoy]);

  const cliente = abierto ? porId.get(abierto) ?? null : null;

  useEffect(() => {
    document.body.style.overflow = cliente ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cliente]);

  const pestañas: { id: Vista; texto: string; n: number }[] = [
    { id: "hoy", texto: "Hoy toca", n: resumen.hoyToca },
    { id: "pendientes", texto: "Pendientes", n: resumen.pendientes },
    { id: "recontactar", texto: "Recontactar", n: resumen.recontactar },
    { id: "todos", texto: "Todos", n: resumen.clientes },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="label text-solar">Seguimiento</p>
          <h1 className="text-[26px] font-extrabold leading-tight">Clientes de Santiago</h1>
          <p className="text-[13px] text-muted">
            Datos en vivo de la hoja · {new Date(actualizado).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex flex-none gap-2">
          <button className="btn !min-h-[38px] !px-3.5 !py-2 text-[13px]" onClick={() => startRecarga(() => router.refresh())} disabled={recargando}>
            {recargando ? "…" : "Actualizar"}
          </button>
          <form action={salir}>
            <button className="btn !min-h-[38px] !px-3.5 !py-2 text-[13px]">Salir</button>
          </form>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <Dato n={resumen.clientes} texto="clientes" />
        <Dato n={resumen.piezas} texto="relojes vendidos" />
        <Dato n={resumen.recontactar} texto="por recontactar" acento />
      </section>

      <div className="sticky top-0 z-10 -mx-4 mt-4 bg-[#faf8f5]/95 px-4 pb-2 pt-2 backdrop-blur">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar nombre, ciudad, celular o reloj…"
          className="w-full rounded-2xl border border-line2 bg-white px-4 py-3 text-base outline-none focus:border-solar"
          aria-label="Buscar cliente"
        />
        {!busca && (
          <nav className="mt-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Vistas">
            {pestañas.map((p) => (
              <button
                key={p.id}
                onClick={() => setVista(p.id)}
                className={`flex-none rounded-full border px-3.5 py-2 text-[13.5px] font-semibold ${
                  vista === p.id ? "border-ink bg-ink text-white" : "border-line2 bg-white text-ink"
                }`}
                aria-pressed={vista === p.id}
              >
                {p.texto} <span className={vista === p.id ? "text-solar3" : "text-muted"}>{p.n}</span>
              </button>
            ))}
          </nav>
        )}
        {(vista === "todos" || busca) && (
          <div className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
            Ordenar:
            {(["reciente", "compras"] as Orden[]).map((o) => (
              <button key={o} onClick={() => setOrden(o)} className={`font-semibold ${orden === o ? "text-solar underline" : ""}`}>
                {o === "reciente" ? "compra más reciente" : "más compras"}
              </button>
            ))}
          </div>
        )}
      </div>

      {!busca && vista === "pendientes" ? (
        <Pendientes tablero={tablero} abrir={setAbierto} />
      ) : (
        <>
          {!busca && <Explicacion vista={vista} />}
          {lista.length === 0 ? (
            <p className="mt-8 text-center text-muted">
              {vista === "hoy" && !busca ? "Nada agendado para hoy. Revisa “Recontactar”." : "No encontré clientes."}
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {lista.slice(0, 300).map((c) => (
                <li key={c.id}>
                  <TarjetaCliente c={c} hoy={hoy} abrir={() => setAbierto(c.id)} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {cliente && <Ficha c={cliente} hoy={hoy} cerrar={() => setAbierto(null)} />}
    </main>
  );
}

function Dato({ n, texto, acento }: { n: number; texto: string; acento?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-3">
      <p className={`text-2xl font-extrabold leading-none ${acento ? "text-solar" : ""}`}>{n}</p>
      <p className="mt-1 text-[12px] leading-tight text-muted">{texto}</p>
    </div>
  );
}

function Explicacion({ vista }: { vista: Vista }) {
  const t: Record<Vista, string> = {
    hoy: "Clientes que quedaste de buscar hoy o antes.",
    pendientes: "",
    recontactar: `Llevan ${DIAS_PARA_RECONTACTAR} días o más sin comprar y no tienen pedido abierto. Primero los que más han comprado.`,
    todos: "Todos los clientes de las dos hojas de ventas.",
  };
  return <p className="mt-2 text-[13px] text-muted">{t[vista]}</p>;
}

function TarjetaCliente({ c, hoy, abrir }: { c: Cliente; hoy: string; abrir: () => void }) {
  const tel = c.telefonos[0];
  const vencido = c.proximoContacto && c.proximoContacto <= hoy;
  return (
    <div className="flex items-stretch gap-2 rounded-2xl border border-line bg-white">
      <button onClick={abrir} className="min-w-0 flex-1 px-4 py-3 text-left">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-bold">{c.nombre}</p>
          <p className="flex-none text-[12px] font-semibold text-muted">{c.totalPiezas} {c.totalPiezas === 1 ? "reloj" : "relojes"}</p>
        </div>
        <p className="truncate text-[13px] text-muted">
          {c.ciudad || "Sin ciudad"} · última compra {hace(c.diasSinComprar)}
        </p>
        <p className="mt-0.5 truncate text-[12.5px]">
          {c.marcas.slice(0, 3).map((m) => m.marca).join(", ")}
        </p>
        {(vencido || c.pendientes.length > 0 || c.seguimiento[0]) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {vencido && <Etiqueta color="solar">Toca buscarlo · {fecha(c.proximoContacto)}</Etiqueta>}
            {c.pendientes.length > 0 && <Etiqueta color="warn">Pedido en curso</Etiqueta>}
            {c.seguimiento[0] && !vencido && <Etiqueta color="gris">{c.seguimiento[0].resultado}</Etiqueta>}
          </div>
        )}
      </button>
      {tel && (
        <a
          href={waUrl(tel, c.nombre)}
          target="_blank"
          rel="noopener"
          className="flex w-14 flex-none items-center justify-center rounded-r-2xl border-l border-line text-ok"
          aria-label={`WhatsApp a ${c.nombre}`}
        >
          <IconoWa />
        </a>
      )}
    </div>
  );
}

function Etiqueta({ color, children }: { color: "solar" | "warn" | "gris" | "ok" | "bad"; children: React.ReactNode }) {
  const cls = {
    solar: "bg-peach text-solar",
    warn: "bg-[#fff4e0] text-warn",
    gris: "bg-[#f2f2f2] text-ink",
    ok: "bg-[#e8f6ee] text-ok",
    bad: "bg-[#fdeceb] text-bad",
  }[color];
  return <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${cls}`}>{children}</span>;
}

function Pendientes({ tablero, abrir }: { tablero: Tablero; abrir: (id: string) => void }) {
  const porId = new Map(tablero.clientes.map((c) => [c.id, c]));
  if (!tablero.pendientes.length) return <p className="mt-8 text-center text-muted">No hay pedidos pendientes.</p>;
  return (
    <>
      <p className="mt-2 text-[13px] text-muted">Pedidos de la pestaña PENDIENTES, con la nota de Edgar.</p>
      <ul className="mt-2 flex flex-col gap-2">
        {tablero.pendientes.map((p, i) => {
          const c = p.clienteId ? porId.get(p.clienteId) : undefined;
          const tel = c?.telefonos[0];
          return (
            <li key={i} className="flex items-stretch rounded-2xl border border-line bg-white">
              <button className="min-w-0 flex-1 px-4 py-3 text-left" onClick={() => c && abrir(c.id)} disabled={!c}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-bold">{p.cliente}</p>
                  <p className="flex-none text-[12px] text-muted">{p.ciudad}</p>
                </div>
                {p.modelos.map((m) => (
                  <p key={m} className="text-[13.5px]">{m}</p>
                ))}
                <div className="mt-1 flex flex-wrap gap-1">
                  <Etiqueta color={/camino/i.test(p.situacion) ? "ok" : "warn"}>{p.situacion || "Sin situación"}</Etiqueta>
                  {p.fecha && <Etiqueta color="gris">{p.fecha}</Etiqueta>}
                </div>
                {p.notas && <p className="mt-1 text-[12.5px] text-muted">Edgar: {p.notas}</p>}
              </button>
              {tel && c && (
                <a href={waUrl(tel, c.nombre)} target="_blank" rel="noopener" className="flex w-14 flex-none items-center justify-center rounded-r-2xl border-l border-line text-ok" aria-label={`WhatsApp a ${c.nombre}`}>
                  <IconoWa />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function estadoPieza(p: Pieza) {
  switch (p.estado) {
    case "cancelado":
      return <Etiqueta color="bad">Cancelado</Etiqueta>;
    case "pendiente":
      return <Etiqueta color="warn">{p.entregaTexto ? p.entregaTexto.toLowerCase() : "pendiente"}</Etiqueta>;
    case "por-entregar":
      return <Etiqueta color="warn">Entrega {fecha(p.entrega)}</Etiqueta>;
    default:
      return <Etiqueta color="ok">Entregado {fecha(p.entrega)}</Etiqueta>;
  }
}

function Ficha({ c, hoy, cerrar }: { c: Cliente; hoy: string; cerrar: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [cerrar]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center" onClick={cerrar} role="dialog" aria-modal="true" aria-label={c.nombre}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold leading-tight">{c.nombre}</h2>
            <p className="text-[13.5px] text-muted">{c.ciudad || "Sin ciudad"}</p>
          </div>
          <button onClick={cerrar} className="btn !min-h-[38px] !px-3.5 !py-2 text-[13px]">Cerrar</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {c.telefonos.map((t) => (
            <span key={t} className="flex gap-2">
              <a href={waUrl(t, c.nombre)} target="_blank" rel="noopener" className="btn btn-pri !min-h-[40px] !py-2 text-[13.5px]">
                <IconoWa /> {t}
              </a>
              <a href={`tel:+${telWhatsApp(t)}`} className="btn !min-h-[40px] !py-2 text-[13.5px]">Llamar</a>
            </span>
          ))}
          {!c.telefonos.length && <p className="text-sm text-muted">Sin celular en la hoja.</p>}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Dato n={c.totalPiezas} texto={c.totalPiezas === 1 ? "reloj" : "relojes"} />
          <Dato n={c.pedidos} texto={c.pedidos === 1 ? "compra" : "compras"} />
          <Dato n={c.cancelados} texto="cancelados" />
        </div>
        <p className="mt-2 text-[13px] text-muted">
          Cliente desde {fecha(c.primeraCompra)} · última compra {fecha(c.ultimaCompra)} ({hace(c.diasSinComprar)})
        </p>
        {c.marcas.length > 0 && (
          <p className="mt-1 text-[13px]">
            Le gusta: {c.marcas.map((m) => `${m.marca} (${m.veces})`).join(", ")}
          </p>
        )}

        {c.pendientes.map((p, i) => (
          <div key={i} className="mt-3 rounded-2xl bg-[#fff4e0] px-4 py-3 text-[13.5px]">
            <p className="font-bold text-warn">Pedido en curso · {p.situacion}</p>
            <p>{p.modelos.join(" + ")}</p>
            {p.notas && <p className="text-muted">Edgar: {p.notas} {p.fecha && `· ${p.fecha}`}</p>}
          </div>
        ))}

        <Anotar c={c} hoy={hoy} />

        {c.seguimiento.length > 0 && (
          <section className="mt-5">
            <h3 className="label text-muted">Seguimiento de Santiago</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {c.seguimiento.map((s, i) => (
                <li key={i} className="rounded-2xl border border-line px-4 py-2.5 text-[13.5px]">
                  <p className="font-semibold">
                    {s.resultado} <span className="font-normal text-muted">· {s.fecha}</span>
                  </p>
                  {s.nota && <p>{s.nota}</p>}
                  {s.proximo && <p className="text-[12.5px] text-solar">Próximo contacto: {fecha(s.proximo)}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          <h3 className="label text-muted">Historial de compras</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {c.piezas.map((p, i) => (
              <li key={i} className="rounded-2xl border border-line px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{p.marca}</p>
                  <p className="flex-none text-[12px] text-muted">{fecha(p.anticipo)}</p>
                </div>
                <p className="text-[13.5px]">{p.modelo}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {estadoPieza(p)}
                  <span className="text-[11.5px] text-muted">{p.hoja.replace("VENTAS EDGAR ", "Hoja ")}</span>
                </div>
                {p.comentario && p.estado !== "cancelado" && <p className="mt-0.5 text-[12.5px] text-muted">{p.comentario}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function sumarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function Anotar({ c, hoy }: { c: Cliente; hoy: string }) {
  const [abierto, setAbierto] = useState(false);
  const [resultado, setResultado] = useState(RESULTADOS[0]);
  const [nota, setNota] = useState("");
  const [proximo, setProximo] = useState(sumarDias(hoy, 7));
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, start] = useTransition();
  const router = useRouter();

  if (!abierto) {
    return (
      <button className="btn mt-4 w-full" onClick={() => setAbierto(true)}>
        + Anotar seguimiento
      </button>
    );
  }

  const guardar = () =>
    start(async () => {
      setMsg(null);
      const r = await anotarSeguimiento({ cliente: c.nombre, celular: c.telefonos[0] ?? "", resultado, nota, proximo });
      if (r.ok) {
        setMsg({ ok: true, texto: "Guardado en la hoja." });
        setNota("");
        setAbierto(false);
        router.refresh();
      } else setMsg({ ok: false, texto: r.error });
    });

  return (
    <div className="mt-4 rounded-2xl border border-line2 p-4">
      <p className="font-bold">Anotar seguimiento</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {RESULTADOS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setResultado(r)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${resultado === r ? "border-solar bg-peach text-solar" : "border-line2"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="¿Qué te dijo? ¿Qué modelo busca?"
        rows={3}
        className="mt-2 w-full rounded-2xl border border-line2 px-3 py-2 text-base outline-none focus:border-solar"
      />
      <label className="mt-2 block text-[13px] font-semibold">
        Volver a buscarlo el
        <input
          type="date"
          value={proximo}
          min={hoy}
          onChange={(e) => setProximo(e.target.value)}
          className="ml-2 rounded-xl border border-line2 px-2 py-1.5 text-base"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button className="btn btn-pri flex-1" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button className="btn" onClick={() => setAbierto(false)} disabled={guardando}>
          Cancelar
        </button>
      </div>
      {msg && <p className={`mt-2 text-sm font-semibold ${msg.ok ? "text-ok" : "text-bad"}`}>{msg.texto}</p>}
    </div>
  );
}

function IconoWa() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
