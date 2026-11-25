"use client";

import { useEffect, useState } from "react";
import type { DemoProps } from "./index";

/*
 * Demo simulado de la Agenda automática de citas.
 * Tres negocios ficticios. Cada uno con sus colores, servicios y horarios.
 * No usa base de datos: todo vive en memoria y arranca con citas ya apartadas.
 */

type Servicio = { id: string; nombre: string; min: number; precio: number };
type Negocio = {
  id: string;
  etiqueta: string;
  nombre: string;
  liga: string;
  direccion: string;
  color: string;
  colorSuave: string;
  servicios: Servicio[];
  horas: string[];
  /** Citas que ya existen, para que el demo nunca arranque vacío */
  otros: string[];
  semilla: number;
  quien: string;
};

const NEGOCIOS: Negocio[] = [
  {
    id: "carwash",
    etiqueta: "Car wash",
    nombre: "Autolavado Brillo Express",
    liga: "citas.brilloexpress.mx",
    direccion: "Av. Patria 1450, Zapopan",
    color: "#0a5cc2",
    colorSuave: "#e8f1fd",
    servicios: [
      { id: "ext", nombre: "Lavado exterior", min: 30, precio: 150 },
      { id: "comp", nombre: "Lavado completo", min: 60, precio: 280 },
      { id: "det", nombre: "Detallado interior", min: 120, precio: 950 },
    ],
    horas: ["09:00", "10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00"],
    otros: ["Lavado completo · Nissan Versa", "Lavado exterior · Mazda 3", "Detallado · Honda CR-V", "Lavado completo · Jeep Compass"],
    semilla: 2,
    quien: "el autolavado",
  },
  {
    id: "estetica",
    etiqueta: "Estética",
    nombre: "Estética Lúa",
    liga: "citas.esteticalua.mx",
    direccion: "Calle Lerdo de Tejada 2210, Guadalajara",
    color: "#a8326e",
    colorSuave: "#fbeaf3",
    servicios: [
      { id: "corte", nombre: "Corte de cabello", min: 60, precio: 280 },
      { id: "tinte", nombre: "Tinte completo", min: 120, precio: 950 },
      { id: "mani", nombre: "Manicure", min: 60, precio: 320 },
    ],
    horas: ["10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00", "19:00"],
    otros: ["Corte · Daniela R.", "Manicure · Sofía M.", "Tinte · Paola G.", "Corte · Andrea L."],
    semilla: 1,
    quien: "la estética",
  },
  {
    id: "dental",
    etiqueta: "Dentista",
    nombre: "Clínica Dental Primavera",
    liga: "citas.dentalprimavera.mx",
    direccion: "Av. Hidalgo 1820, Guadalajara",
    color: "#0e8577",
    colorSuave: "#e3f5f2",
    servicios: [
      { id: "val", nombre: "Valoración", min: 30, precio: 350 },
      { id: "limp", nombre: "Limpieza dental", min: 60, precio: 650 },
      { id: "blanq", nombre: "Blanqueamiento", min: 60, precio: 1900 },
    ],
    horas: ["10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00"],
    otros: ["Limpieza · Sra. Robles", "Valoración · J. Mendoza", "Ortodoncia · A. Lara", "Limpieza · C. Ibarra"],
    semilla: 0,
    quien: "el consultorio",
  },
];

type Cita = { negocio: string; servicio: string; dia: number; hora: string; nombre: string };

/** "de el autolavado" → "del autolavado" */
const de = (quien: string) => (quien.startsWith("el ") ? "del " + quien.slice(3) : "de " + quien);

const mxn = (n: number) => "$" + n.toLocaleString("es-MX");
const fecha = (d: Date) => d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });

/** Próximos 5 días abiertos (lunes a sábado). */
function proximosDias() {
  const out: Date[] = [];
  const d = new Date();
  while (out.length < 5) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(new Date(d));
  }
  return out;
}

/** Cuántos bloques de hora ocupa un servicio. */
const bloques = (min: number) => Math.max(1, Math.ceil(min / 60));

export default function Agenda({ narrar }: DemoProps) {
  const [dias, setDias] = useState<Date[]>([]);
  const [negId, setNegId] = useState("dental");
  const [svc, setSvc] = useState<string | null>(null);
  const [dia, setDia] = useState<number | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [mias, setMias] = useState<Cita[]>([]);
  const [confirmada, setConfirmada] = useState<Cita | null>(null);

  // Las fechas se calculan en el navegador para que siempre sean "a partir de mañana".
  useEffect(() => setDias(proximosDias()), []);

  const neg = NEGOCIOS.find((n) => n.id === negId)!;
  const servicio = neg.servicios.find((s) => s.id === svc) ?? null;

  /** ¿La hora ya está apartada? Mezcla citas de ejemplo con las que apartó el cliente. */
  const ocupadaBase = (di: number, h: string) => {
    const i = neg.horas.indexOf(h);
    return (di * 3 + i * 2 + neg.semilla) % 5 === 0 || (di + i + neg.semilla) % 7 === 0;
  };
  const deCliente = (di: number, h: string) =>
    mias.find((m) => m.negocio === negId && m.dia === di && m.hora === h);
  const ocupada = (di: number, h: string) => ocupadaBase(di, h) || !!deCliente(di, h);

  /** Libre si cabe el servicio completo sin encimarse con otra cita ni salirse del turno. */
  const libre = (di: number, h: string) => {
    if (!servicio) return false;
    const i = neg.horas.indexOf(h);
    for (let k = 0; k < bloques(servicio.min); k++) {
      const hk = neg.horas[i + k];
      if (!hk || ocupada(di, hk)) return false;
      if (k > 0 && parseInt(hk) - parseInt(neg.horas[i + k - 1]) !== 1) return false;
    }
    return true;
  };

  function cambiarNegocio(id: string) {
    const n = NEGOCIOS.find((x) => x.id === id)!;
    setNegId(id);
    setSvc(null);
    setDia(null);
    setHora(null);
    setConfirmada(null);
    narrar(`Mismo sistema, otro negocio: ${n.nombre} tiene sus propios servicios, horarios y colores.`);
  }

  function elegirServicio(id: string) {
    setSvc(id);
    setHora(null);
    const s = neg.servicios.find((x) => x.id === id)!;
    narrar(
      bloques(s.min) > 1
        ? `${s.nombre} dura ${s.min / 60} horas. El sistema solo ofrece horarios donde cabe completo, sin encimar citas.`
        : "Cada servicio tiene su duración. El sistema la usa para no encimar citas."
    );
  }

  function elegirDia(i: number) {
    setDia(i);
    setHora(null);
    narrar(`Los horarios tachados ya están ocupados en la agenda ${de(neg.quien)}. El cliente no puede tomarlos.`);
  }

  function elegirHora(h: string) {
    setHora(h);
    narrar("Horario elegido. Solo falta el nombre para confirmar.");
  }

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!servicio || dia === null || !hora) return;
    const cita: Cita = { negocio: negId, servicio: servicio.id, dia, hora, nombre: nombre.trim() || "Cliente" };
    // Una cita larga ocupa varias horas en la agenda.
    const i = neg.horas.indexOf(hora);
    const extras: Cita[] = [];
    for (let k = 1; k < bloques(servicio.min); k++) extras.push({ ...cita, hora: neg.horas[i + k] });
    setMias((m) => [...m, cita, ...extras]);
    setConfirmada(cita);
    narrar(
      `La cita quedó en la agenda ${de(neg.quien)}, el cliente recibió su confirmación por WhatsApp y el recordatorio ya está programado. Nadie contestó un solo mensaje.`
    );
  }

  function otraCita() {
    setConfirmada(null);
    setSvc(null);
    setDia(null);
    setHora(null);
    narrar("Nueva cita. El horario que apartaste antes ya aparece ocupado.");
  }

  const estiloNegocio = { "--biz": neg.color, "--biz-soft": neg.colorSuave } as React.CSSProperties;
  const opt =
    "grid gap-0.5 rounded-2xl border border-line2 bg-white px-3.5 py-3 text-left text-[0.88rem] transition-colors enabled:hover:border-[var(--biz)] aria-pressed:border-[var(--biz)] aria-pressed:bg-[var(--biz-soft)] aria-pressed:shadow-[inset_0_0_0_1px_var(--biz)] disabled:cursor-not-allowed disabled:opacity-35";
  const paso = "mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted";

  return (
    <div className="grid gap-4" style={estiloNegocio}>
      {/* Selector de negocio */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Negocio de ejemplo">
        {NEGOCIOS.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => cambiarNegocio(n.id)}
            aria-pressed={n.id === negId}
            className="rounded-full border border-line2 bg-white px-3.5 py-[7px] text-[13px] font-semibold text-muted aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {n.etiqueta}
          </button>
        ))}
      </div>

      {/* Encabezado del negocio */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ background: neg.colorSuave }}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-black text-white" style={{ background: neg.color }}>
            {neg.nombre[0]}
          </span>
          <b style={{ color: neg.color }}>{neg.nombre}</b>
        </div>
        <span className="text-[0.8rem] font-semibold tabular-nums text-muted">{neg.liga}</span>
      </div>

      {confirmada ? (
        <Confirmacion neg={neg} cita={confirmada} dias={dias} ocupadaBase={ocupadaBase} mias={mias} onOtra={otraCita} />
      ) : (
        <div className="grid gap-[18px]">
          <div>
            <div className={paso}>1 · Servicio</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))] gap-2">
              {neg.servicios.map((s) => (
                <button key={s.id} type="button" className={opt} aria-pressed={svc === s.id} onClick={() => elegirServicio(s.id)}>
                  <b className="font-bold">{s.nombre}</b>
                  <small className="text-muted">
                    {s.min >= 60 ? `${s.min / 60} h` : `${s.min} min`} · {mxn(s.precio)}
                  </small>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={paso}>2 · Día</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2">
              {dias.map((d, i) => (
                <button key={i} type="button" className={opt} aria-pressed={dia === i} disabled={!svc} onClick={() => elegirDia(i)}>
                  <b className="font-bold">{fecha(d)}</b>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={paso}>3 · Hora</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(78px,1fr))] gap-2">
              {neg.horas.map((h) => {
                const tachada = dia !== null && ocupada(dia, h);
                const disponible = dia !== null && libre(dia, h);
                return (
                  <button
                    key={h}
                    type="button"
                    className={`${opt} rounded-full text-center font-bold tabular-nums ${tachada ? "line-through" : ""}`}
                    aria-pressed={hora === h}
                    disabled={!disponible}
                    onClick={() => elegirHora(h)}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={confirmar} className="flex flex-wrap items-center gap-2">
            <input
              className="h-11 min-w-0 flex-[1_1_180px] rounded-full border border-line2 bg-white px-[18px] text-base"
              placeholder="Tu nombre"
              aria-label="Tu nombre"
              autoComplete="off"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <button
              type="submit"
              disabled={!hora}
              className="inline-flex min-h-[44px] flex-auto items-center justify-center rounded-full px-5 text-[14.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: neg.color }}
            >
              Confirmar cita{hora ? ` · ${hora}` : ""}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Confirmacion({
  neg,
  cita,
  dias,
  ocupadaBase,
  mias,
  onOtra,
}: {
  neg: Negocio;
  cita: Cita;
  dias: Date[];
  ocupadaBase: (di: number, h: string) => boolean;
  mias: Cita[];
  onOtra: () => void;
}) {
  const s = neg.servicios.find((x) => x.id === cita.servicio)!;
  const dia = dias[cita.dia];
  const filas = neg.horas
    .map((h, i) => {
      const mia = mias.find((m) => m.negocio === neg.id && m.dia === cita.dia && m.hora === h);
      if (mia) {
        const sm = neg.servicios.find((x) => x.id === mia.servicio)!;
        const nueva = mia.hora === cita.hora && mia.nombre === cita.nombre && mia.servicio === cita.servicio;
        return { h, texto: `${sm.nombre} · ${mia.nombre}`, mia: true, nueva };
      }
      if (ocupadaBase(cita.dia, h)) return { h, texto: neg.otros[i % neg.otros.length], mia: false, nueva: false };
      return null;
    })
    .filter(Boolean) as { h: string; texto: string; mia: boolean; nueva: boolean }[];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#e6f6ed] px-[11px] py-1 text-[11.5px] font-bold text-ok">Cita confirmada</span>
        <b>
          {s.nombre} · {fecha(dia)} · {cita.hora}
        </b>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">WhatsApp que recibe el cliente</div>
        <div className="w-fit max-w-full rounded-[14px] rounded-br-[3px] bg-[#d9fdd3] px-3.5 py-2.5 text-[0.88rem] text-[#10321a]">
          Hola {cita.nombre}, tu cita de {s.nombre} quedó para el {fecha(dia)} a las {cita.hora} en {neg.nombre}, {neg.direccion}. Te
          recordamos un día antes. Para cambiarla, responde a este mensaje.
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Agenda {de(neg.quien)} · {fecha(dia)}
        </div>
        <div className="overflow-hidden rounded-2xl border border-line">
          {filas.map((f) => (
            <div
              key={f.h}
              className="flex gap-3 border-b border-line px-3.5 py-2.5 text-[0.88rem] last:border-b-0"
              style={f.mia ? { background: neg.colorSuave, fontWeight: 600 } : undefined}
            >
              <b className="min-w-[52px] font-bold tabular-nums">{f.h}</b>
              <span className="min-w-0">
                {f.texto}
                {f.nueva ? " (nueva)" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn w-fit" onClick={onOtra}>
        Apartar otra cita
      </button>
    </div>
  );
}
