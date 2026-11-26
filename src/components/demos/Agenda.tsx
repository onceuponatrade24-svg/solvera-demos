"use client";

import { useEffect, useMemo, useState } from "react";
import type { DemoProps } from "./index";
import { BUSINESS_THEMES, HORAS_AGENDA, SOLVERA_WA, type NegocioAgenda } from "@/data/agenda";

/*
 * Demo de la Agenda automática de citas.
 * Tres negocios ficticios con su foto, colores y servicios.
 * Al confirmar, el servidor manda el pase real al correo y al WhatsApp de quien prueba
 * (si las llaves ya están puestas en Vercel; si no, lo dice con honestidad).
 */

type Dia = { iso: string; etiqueta: string };
type Resultado = { folio: string; emailSent: boolean; whatsappSent: boolean };

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Próximos 5 días hábiles, empezando mañana. */
function proximosDias(): Dia[] {
  const dias: Dia[] = [];
  const d = new Date();
  while (dias.length < 5) {
    d.setDate(d.getDate() + 1);
    const sem = d.getDay();
    if (sem === 0 || sem === 6) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dias.push({ iso, etiqueta: `${DIAS_CORTOS[sem]} ${d.getDate()} de ${MESES[d.getMonth()]}` });
  }
  return dias;
}

/** Dos horarios ocupados por día, siempre los mismos para el mismo negocio y día. */
function ocupadas(negocio: number, dia: number) {
  const a = (negocio * 3 + dia * 2 + 2) % HORAS_AGENDA.length;
  let b = (negocio + dia * 5 + 5) % HORAS_AGENDA.length;
  if (b === a) b = (b + 3) % HORAS_AGENDA.length;
  return new Set([HORAS_AGENDA[a], HORAS_AGENDA[b]]);
}

export default function Agenda({ narrar }: DemoProps) {
  const [idx, setIdx] = useState(0);
  const n: NegocioAgenda = BUSINESS_THEMES[idx];

  const [dias, setDias] = useState<Dia[]>([]);
  useEffect(() => setDias(proximosDias()), []);

  const [servicio, setServicio] = useState<string | null>(null);
  const [extra, setExtra] = useState(n.extra.opciones[0]);
  const [dia, setDia] = useState(0);
  const [hora, setHora] = useState<string | null>(null);
  const [apartadas, setApartadas] = useState<Record<string, true>>({});

  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [correo, setCorreo] = useState("");
  const [trampa, setTrampa] = useState(""); // campo oculto anti-bots
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [verDueno, setVerDueno] = useState(false);

  const serv = n.servicios.find((s) => s.id === servicio) ?? null;
  const ocupadasHoy = useMemo(() => ocupadas(idx, dia), [idx, dia]);
  const estaOcupada = (h: string) => ocupadasHoy.has(h) || !!apartadas[`${n.id}|${dia}|${h}`];

  const telLimpio = tel.replace(/\D/g, "");
  const telOk = telLimpio.length === 10;
  const correoOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim());
  const nombreOk = nombre.trim().length >= 2;
  const listo = !!serv && !!hora && dias.length > 0 && nombreOk && telOk && correoOk;

  function cambiarNegocio(i: number) {
    if (i === idx) return;
    const nuevo = BUSINESS_THEMES[i];
    setIdx(i);
    setServicio(null);
    setHora(null);
    setDia(0);
    setExtra(nuevo.extra.opciones[0]);
    setResultado(null);
    setError(null);
    setVerDueno(false);
    narrar(`Mismo sistema, otro negocio: ${nuevo.nombre} tiene su propia liga, colores, servicios y horarios.`);
  }

  function elegirServicio(id: string) {
    const s = n.servicios.find((x) => x.id === id)!;
    setServicio(id);
    narrar(`${s.nombre}: ${s.duracion}, ${s.precio}. El sistema ya sabe cuánto tiempo apartar en la agenda ${n.de}.`);
  }

  function elegirDia(i: number) {
    setDia(i);
    setHora(null);
    narrar(`Los horarios tachados ya están ocupados en la agenda ${n.de}. Nadie puede tomarlos dos veces.`);
  }

  function elegirHora(h: string) {
    setHora(h);
    narrar("Horario apartado mientras confirmas. Solo faltan tus datos para mandarte el pase.");
  }

  async function confirmar() {
    if (!listo || !serv || !hora || enviando) return;
    setEnviando(true);
    setError(null);
    narrar("Enviando: el sistema guarda la cita, genera el folio y manda los avisos.");
    try {
      const r = await fetch("/api/demos/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: n.id,
          serviceId: serv.id,
          extraOption: extra,
          dayISO: dias[dia].iso,
          day: dias[dia].etiqueta,
          time: hora,
          customerName: nombre.trim(),
          customerPhone: telLimpio,
          customerEmail: correo.trim(),
          website: trampa,
        }),
      });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok || !datos.success) throw new Error(datos.error || "No se pudo confirmar la cita.");
      setApartadas((a) => ({ ...a, [`${n.id}|${dia}|${hora}`]: true }));
      setResultado({ folio: datos.folio, emailSent: !!datos.emailSent, whatsappSent: !!datos.whatsappSent });
      const llego =
        datos.emailSent && datos.whatsappSent
          ? "Revisa tu correo y tu WhatsApp: el pase ya va en camino."
          : datos.emailSent
            ? "Revisa tu correo: el pase ya va en camino."
            : datos.whatsappSent
              ? "Revisa tu WhatsApp: la confirmación ya va en camino."
              : "La cita quedó registrada con su folio.";
      narrar(`Cita confirmada con folio #${datos.folio}. ${llego} Al negocio le llega su aviso al mismo tiempo.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo confirmar la cita.";
      setError(msg);
      narrar("Algo falló al enviar. Revisa tus datos e inténtalo otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  function otraPrueba() {
    setResultado(null);
    setServicio(null);
    setHora(null);
    setVerDueno(false);
    narrar("Nueva cita. El horario que apartaste antes ya aparece ocupado.");
  }

  const waPrueba = resultado
    ? `https://wa.me/${SOLVERA_WA}?text=${encodeURIComponent(
        `Hola, aparté una cita de prueba en ${n.nombre} con folio #${resultado.folio} y quiero probar reagendarla.`,
      )}`
    : "#";

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)] gap-4 overflow-clip rounded-3xl border p-3 transition-colors duration-300 sm:p-5"
      style={{ background: n.colorSuave, borderColor: `${n.color}33` }}
    >
      {/* Selector de giro */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Elige un negocio">
        {BUSINESS_THEMES.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={i === idx}
            onClick={() => cambiarNegocio(i)}
            className="rounded-full border px-4 py-2 text-sm font-bold transition-all duration-300"
            style={
              i === idx
                ? { background: n.color, borderColor: n.color, color: "#fff" }
                : { background: "#fff", borderColor: "#e5e5e5", color: "#1a1a1a" }
            }
          >
            {b.pestana}
          </button>
        ))}
      </div>

      {/* Banner */}
      <div className="relative h-36 overflow-hidden rounded-2xl bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={n.id} src={n.foto} alt="" onError={(e) => (e.currentTarget.style.display = "none")} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-black text-white ring-2 ring-white/70"
              style={{ background: n.color }}
              aria-hidden
            >
              {n.nombre[0]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight text-white">{n.nombre}</p>
              <p className="truncate text-xs text-white/80">{n.direccion}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs text-white backdrop-blur-md">{n.subdominio}</span>
        </div>
      </div>

      {resultado && serv && hora ? (
        <Comprobante
          n={n}
          folio={resultado.folio}
          servicio={serv.nombre}
          duracion={serv.duracion}
          precio={serv.precio}
          dia={dias[dia]?.etiqueta ?? ""}
          hora={hora}
          extra={extra}
          nombre={nombre.trim()}
          correo={correo.trim()}
          tel={telLimpio}
          emailSent={resultado.emailSent}
          whatsappSent={resultado.whatsappSent}
          waPrueba={waPrueba}
          verDueno={verDueno}
          alternarDueno={() => {
            setVerDueno((v) => !v);
            if (!verDueno) narrar(`Así le llega el aviso al dueño ${n.de}: la cita nueva ya está en su calendario, sin que nadie la capture.`);
          }}
          otra={otraPrueba}
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 rounded-2xl bg-white/70 p-3 sm:p-4">
          {/* 1. Servicio */}
          <section>
            <p className="mb-2 text-xs font-extrabold tracking-wider" style={{ color: n.colorTexto }}>1. SERVICIO</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {n.servicios.map((s) => {
                const activo = s.id === servicio;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => elegirServicio(s.id)}
                    className="rounded-xl bg-white p-3 text-left transition-all duration-200"
                    style={{ border: activo ? `2px solid ${n.color}` : "2px solid #ececec", boxShadow: activo ? `0 6px 18px ${n.color}22` : undefined }}
                  >
                    <span className="block text-sm font-bold text-ink">{s.nombre}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {s.duracion} · {s.precio}
                    </span>
                  </button>
                );
              })}
            </div>
            <label className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-ink">{n.extra.etiqueta}:</span>
              <select
                value={extra}
                onChange={(e) => {
                  setExtra(e.target.value);
                  narrar(`${n.extra.etiqueta}: ${e.target.value}. Cada giro pide el dato que le sirve, y queda en la cita.`);
                }}
                className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm"
              >
                {n.extra.opciones.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </section>

          {/* 2. Día */}
          <section>
            <p className="mb-2 text-xs font-extrabold tracking-wider" style={{ color: n.colorTexto }}>2. DÍA</p>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {dias.map((d, i) => {
                const [sem, ...resto] = d.etiqueta.split(" ");
                const activo = i === dia;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    aria-pressed={activo}
                    aria-label={d.etiqueta}
                    onClick={() => elegirDia(i)}
                    className="rounded-xl bg-white px-1 py-2 text-center text-xs leading-tight transition-all duration-200 sm:text-sm"
                    style={{ border: activo ? `2px solid ${n.color}` : "2px solid #ececec", color: activo ? n.colorTexto : "#1a1a1a" }}
                  >
                    <span className="block font-bold">{sem} {resto[0]}</span>
                    <span className="block text-muted">{resto.slice(1).join(" ")}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Hora */}
          <section>
            <p className="mb-2 text-xs font-extrabold tracking-wider" style={{ color: n.colorTexto }}>3. HORA</p>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {HORAS_AGENDA.map((h) => {
                const ocup = estaOcupada(h);
                const activo = h === hora;
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={ocup}
                    aria-pressed={activo}
                    aria-label={ocup ? `${h} ocupado` : h}
                    onClick={() => elegirHora(h)}
                    className={
                      ocup
                        ? "cursor-not-allowed rounded-full border border-transparent bg-gray-100 py-2 text-sm text-gray-400 line-through"
                        : "rounded-full border bg-white py-2 text-sm font-semibold transition-all duration-200"
                    }
                    style={ocup ? undefined : activo ? { background: n.color, borderColor: n.color, color: "#fff" } : { borderColor: "#e5e5e5" }}
                  >
                    {ocup ? "Ocupado" : h}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Datos */}
          <section>
            <p className="mb-2 text-xs font-extrabold tracking-wider" style={{ color: n.colorTexto }}>4. TUS DATOS PARA CONFIRMACIÓN REAL</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Campo etiqueta="Tu nombre" error={nombre && !nombreOk ? "Escribe tu nombre" : null}>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Carlos Mendoza" autoComplete="name" className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" />
              </Campo>
              <Campo etiqueta="Tu WhatsApp (10 dígitos)" error={tel && !telOk ? "Deben ser 10 números" : null}>
                <span className="pl-3 text-sm text-muted">+52</span>
                <input
                  value={tel}
                  onChange={(e) => setTel(e.target.value.replace(/[^\d\s]/g, "").slice(0, 14))}
                  placeholder="33 1234 5678"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="w-full min-w-0 bg-transparent px-2 py-2.5 text-sm outline-none"
                />
              </Campo>
              <Campo etiqueta="Tu correo electrónico" error={correo && !correoOk ? "Revisa tu correo" : null}>
                <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Ej. carlos@empresa.com" type="email" autoComplete="email" className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" />
              </Campo>
            </div>
            {/* Campo trampa para bots: las personas no lo ven */}
            <input
              value={trampa}
              onChange={(e) => setTrampa(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              name="website"
            />
          </section>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{error}</p>}

          <div>
            <button
              type="button"
              onClick={confirmar}
              disabled={!listo || enviando}
              className="w-full rounded-full py-3.5 text-base font-bold text-white transition-all duration-300 disabled:opacity-45"
              style={{ background: n.color }}
            >
              {enviando ? "Enviando confirmación..." : "Confirmar cita"}
            </button>
            {!listo && !enviando && (
              <p className="mt-2 text-center text-xs text-muted">
                {!serv ? "Elige un servicio" : !hora ? "Elige una hora" : "Llena tus datos"} para confirmar.
              </p>
            )}
            <p className="mt-2 text-center text-xs font-semibold text-ink">
              Prueba real: recibirás tu pase de cita en tu WhatsApp y correo en segundos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ etiqueta, error, children }: { etiqueta: string; error: string | null; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold text-ink">{etiqueta}</span>
      <span className={`flex items-center rounded-xl border bg-white ${error ? "border-bad" : "border-line"}`}>{children}</span>
      {error && <span className="mt-1 block text-xs text-bad">{error}</span>}
    </label>
  );
}

function Comprobante(p: {
  n: NegocioAgenda;
  folio: string;
  servicio: string;
  duracion: string;
  precio: string;
  dia: string;
  hora: string;
  extra: string;
  nombre: string;
  correo: string;
  tel: string;
  emailSent: boolean;
  whatsappSent: boolean;
  waPrueba: string;
  verDueno: boolean;
  alternarDueno: () => void;
  otra: () => void;
}) {
  const { n } = p;
  const telBonito = `${p.tel.slice(0, 2)} ${p.tel.slice(2, 6)} ${p.tel.slice(6)}`;
  const filas: [string, string][] = [
    ["Negocio", n.nombre],
    ["Servicio", `${p.servicio} · ${p.duracion} · ${p.precio}`],
    ["Día", p.dia],
    ["Hora", p.hora],
    [n.extra.etiqueta, p.extra],
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 animate-[pop_.4s_ease-out] place-items-center rounded-full text-2xl text-white" style={{ background: n.color }} aria-hidden>
          ✓
        </span>
        <div>
          <p className="text-xl font-black text-ink">¡Cita confirmada!</p>
          <p className="text-sm font-bold" style={{ color: n.colorTexto }}>Folio #{p.folio}</p>
        </div>
      </div>

      <dl className="grid gap-1.5 rounded-xl p-3 text-sm" style={{ background: n.colorSuave }}>
        {filas.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className={`rounded-full px-3 py-1.5 ${p.emailSent ? "bg-green-50 text-ok" : "bg-amber-50 text-warn"}`}>
          {p.emailSent ? `✉️ Pase enviado a ${p.correo}` : "✉️ El envío por correo se está activando"}
        </span>
        <span className={`rounded-full px-3 py-1.5 ${p.whatsappSent ? "bg-green-50 text-ok" : "bg-amber-50 text-warn"}`}>
          {p.whatsappSent ? `💬 Confirmación enviada a +52 ${telBonito}` : "💬 El envío por WhatsApp se está activando"}
        </span>
      </div>

      <a href={p.waPrueba} target="_blank" rel="noopener noreferrer" className="rounded-full py-3 text-center text-sm font-bold text-white" style={{ background: "#16a34a" }}>
        Probar conversación en mi WhatsApp
      </a>

      <div className="rounded-xl border border-line">
        <button type="button" onClick={p.alternarDueno} aria-expanded={p.verDueno} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-bold text-ink">
          Ver aviso que recibe el dueño del negocio
          <span aria-hidden>{p.verDueno ? "−" : "+"}</span>
        </button>
        {p.verDueno && (
          <div className="border-t border-line bg-neutral-50 p-3">
            <div className="max-w-sm rounded-2xl rounded-tl-sm bg-white p-3 text-sm shadow-sm">
              <p className="text-xs font-bold" style={{ color: n.colorTexto }}>📅 Nueva cita · {n.nombre}</p>
              <p className="mt-1 text-ink">
                <b>{p.nombre}</b> apartó <b>{p.servicio}</b> el <b>{p.dia}</b> a las <b>{p.hora}</b>.
              </p>
              <p className="mt-1 text-muted">
                {n.extra.etiqueta}: {p.extra} · Folio #{p.folio}
              </p>
              <p className="mt-1 text-muted">Ya está en tu calendario. Recordatorio al cliente: un día antes.</p>
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={p.otra} className="rounded-full border border-line py-2.5 text-sm font-bold text-ink">
        Hacer otra prueba
      </button>
    </div>
  );
}
