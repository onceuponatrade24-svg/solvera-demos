"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoProps } from "./index";

/*
 * Demo simulado del Asistente de redes y WhatsApp.
 * Spa ficticio a las 11:47 p.m. El asistente contesta con lo que sabe del negocio,
 * no inventa respuestas y pasa la conversación a una persona cuando hace falta.
 */

type Mensaje = { de: "cliente" | "asistente" | "sistema"; texto: string };

const CANALES = ["WhatsApp", "Instagram", "Facebook", "TikTok"] as const;
type Canal = (typeof CANALES)[number];

const NEGOCIO = "Estudio Lila Spa & Belleza";
const PERSONA = "Mariana";

const INICIO: Mensaje[] = [
  { de: "cliente", texto: "Hola, ¿cuánto cuesta un facial?" },
  {
    de: "asistente",
    texto:
      "¡Hola! Soy el asistente de Estudio Lila 🌿\nEl facial hidratante cuesta $650 y dura 50 minutos. El de limpieza profunda, $850.\n¿Quieres que te aparte un horario?",
  },
];

/** Lo que sabe el asistente. Cada tema se etiqueta para que el negocio vea qué pregunta la gente. */
const CONOCIMIENTO = [
  {
    claves: ["precio", "cuesta", "cuánto", "cuanto", "facial", "costo"],
    tema: "Facial",
    respuesta: "El facial hidratante cuesta $650 (50 min) y el de limpieza profunda $850 (70 min). ¿Te aparto un horario?",
  },
  {
    claves: ["horario", "abren", "cierran", "hora"],
    tema: "Horarios",
    respuesta: "Abrimos de lunes a sábado de 10:00 a 20:00. Los domingos descansamos.",
  },
  {
    claves: ["dónde", "donde", "ubic", "direcc", "llegar"],
    tema: "Ubicación",
    respuesta: "Estamos en Av. Chapultepec 480, colonia Americana, Guadalajara. Hay estacionamiento a media cuadra.",
  },
  {
    claves: ["agendar", "cita", "apartar", "reserv", " sí ", " si "],
    tema: "Quiere cita",
    respuesta: "Con gusto. Tengo libre mañana a las 11:00, 13:30 o 17:00. ¿Cuál te queda mejor?",
  },
  {
    claves: ["11", "13", "17", "mañana"],
    tema: "Cita apartada",
    respuesta: "Listo, quedó apartado. Te mando un recordatorio un día antes. ¿A nombre de quién lo registro?",
  },
  {
    claves: ["masaje", "uñas", "unas", "manicure", "depil"],
    tema: "Otros servicios",
    respuesta: "Sí lo manejamos: masaje relajante $700, manicure $280 y depilación desde $180.",
  },
  {
    claves: ["pago", "tarjeta", "transfer", "efectivo"],
    tema: "Formas de pago",
    respuesta: "Aceptamos efectivo, tarjeta y transferencia. Puedes pagar al llegar.",
  },
];

const RAPIDAS = ["¿Qué horario tienen?", "¿Dónde están?", "Quiero agendar", "¿Aceptan tarjeta?", "Quiero hablar con una persona"];

/** Colores de cada canal para la barra del chat. */
const COLOR: Record<Canal, string> = {
  WhatsApp: "#128c7e",
  Instagram: "#c13584",
  Facebook: "#1877f2",
  TikTok: "#111111",
};

export default function Asistente({ narrar }: DemoProps) {
  const [canal, setCanal] = useState<Canal>("WhatsApp");
  const [mensajes, setMensajes] = useState<Mensaje[]>(INICIO);
  const [temas, setTemas] = useState<string[]>(["Facial"]);
  const [conPersona, setConPersona] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const caja = useRef<HTMLDivElement>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Siempre mostrar el último mensaje.
  useEffect(() => {
    const el = caja.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes, escribiendo]);

  useEffect(() => () => {
    if (espera.current) clearTimeout(espera.current);
  }, []);

  const agregarTema = (t: string) => setTemas((ts) => (ts.includes(t) ? ts : [...ts, t]));

  function enviar(entrada: string) {
    const t = entrada.trim();
    if (!t || escribiendo) return;
    setMensajes((m) => [...m, { de: "cliente", texto: t }]);
    setTexto("");
    setEscribiendo(true);

    espera.current = setTimeout(() => {
      const bajo = " " + t.toLowerCase() + " ";
      setEscribiendo(false);

      if (conPersona) {
        setMensajes((m) => [...m, { de: "sistema", texto: `${PERSONA} ya tiene la conversación. Aquí contestaría ella.` }]);
        narrar("Cuando una persona toma la conversación, el asistente deja de contestar para no encimarse.");
        return;
      }

      if (/persona|humano|alguien|asesor|queja|reclam/.test(bajo)) {
        setConPersona(true);
        agregarTema("Pidió persona");
        setMensajes((m) => [
          ...m,
          {
            de: "asistente",
            texto: `Claro, te comunico con ${PERSONA} del equipo. Ya le pasé lo que platicamos para que no tengas que repetirlo.`,
          },
          { de: "sistema", texto: `Conversación asignada a ${PERSONA} · aviso enviado a su celular` },
        ]);
        narrar(
          "El asistente reconoció que hacía falta una persona, le pasó la conversación con todo el contexto y le avisó a su celular."
        );
        return;
      }

      const tema = CONOCIMIENTO.find((e) => e.claves.some((k) => bajo.includes(k)));
      if (tema) {
        setMensajes((m) => [...m, { de: "asistente", texto: tema.respuesta }]);
        agregarTema(tema.tema);
        narrar(
          `Contestó en 2 segundos con la información del negocio y etiquetó el tema: ${tema.tema}. Así sabes qué pregunta más la gente.`
        );
      } else {
        setMensajes((m) => [
          ...m,
          {
            de: "asistente",
            texto: "Esa no me la sé todavía. Le paso tu pregunta al equipo y te contestan en cuanto abran, a las 10:00.",
          },
        ]);
        agregarTema("Pregunta nueva");
        narrar(
          "No inventó una respuesta. Avisó al cliente y guardó la pregunta para que el equipo la conteste y el asistente la aprenda."
        );
      }
    }, 750);
  }

  function cambiarCanal(c: Canal) {
    setCanal(c);
    narrar(`Mismo asistente, mismo conocimiento, ahora en ${c}. Todos los canales llegan a una sola bandeja.`);
  }

  function reiniciar() {
    if (espera.current) clearTimeout(espera.current);
    setEscribiendo(false);
    setConPersona(false);
    setTemas(["Facial"]);
    setMensajes(INICIO);
    narrar("Conversación reiniciada. Son las 11:47 de la noche y el asistente sigue contestando.");
  }

  const fila = "flex justify-between gap-2.5 border-b border-black/[0.07] pb-2.5";

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Canal">
        {CANALES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => cambiarCanal(c)}
            aria-pressed={canal === c}
            className="rounded-full border border-line2 bg-white px-3.5 py-[7px] text-[13px] font-semibold text-muted aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Teléfono */}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto_auto] overflow-hidden rounded-[20px] border border-line bg-[#efeae2]">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-4 py-3 text-[0.9rem] text-white" style={{ background: COLOR[canal] }}>
            <b className="min-w-0">{NEGOCIO}</b>
            <span className="whitespace-nowrap text-[0.78rem] font-semibold tabular-nums opacity-90">
              {canal} · 11:47 p.m.
            </span>
          </div>

          <div ref={caja} className="grid h-[310px] grid-cols-[minmax(0,1fr)] content-start gap-2 overflow-y-auto p-3.5" aria-live="off">
            {mensajes.map((m, i) => (
              <Burbuja key={i} m={m} />
            ))}
            {escribiendo && <Burbuja m={{ de: "asistente", texto: "Escribiendo…" }} />}
          </div>

          <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
            {RAPIDAS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => enviar(q)}
                className="rounded-full border border-line2 bg-white px-3 py-1.5 text-[0.8rem] font-medium hover:border-solar hover:text-solar"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-line bg-white px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
          >
            <input
              className="h-11 min-w-0 flex-1 rounded-full border border-line2 bg-white px-4 text-base"
              placeholder="Escribe como cliente…"
              aria-label="Mensaje"
              autoComplete="off"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit" className="btn btn-pri px-4">
              Enviar
            </button>
          </form>
        </div>

        {/* Lo que ve el negocio */}
        <div className="grid content-start gap-3 rounded-[20px] bg-peach p-5 text-[0.88rem]">
          <b className="font-extrabold">Lo que ve el negocio</b>
          <div className={fila}>
            <span className="text-muted">Canal</span>
            <span>{canal}</span>
          </div>
          <div className={fila}>
            <span className="text-muted">Atendió</span>
            <span>{conPersona ? `${PERSONA} (persona)` : "Asistente"}</span>
          </div>
          <div className={fila}>
            <span className="text-muted">Tiempo de respuesta</span>
            <span className="font-semibold tabular-nums">2 s</span>
          </div>
          <div>
            <span className="text-[0.8rem] text-muted">Temas del cliente</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {temas.map((t) => (
                <span key={t} className="rounded-full bg-[#f1f1f1] px-[11px] py-1 text-[11.5px] font-bold text-[#555]">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className={`w-fit rounded-full px-[11px] py-1 text-[11.5px] font-bold ${
              conPersona ? "bg-[#fff1d6] text-warn" : "bg-[#e6f6ed] text-ok"
            }`}
          >
            {conPersona ? `Esperando a ${PERSONA}` : "Resuelto sin intervención"}
          </span>
          <button type="button" className="btn min-h-[36px] w-fit px-3.5 py-[7px] text-[13px]" onClick={reiniciar}>
            Reiniciar conversación
          </button>
        </div>
      </div>
    </div>
  );
}

function Burbuja({ m }: { m: Mensaje }) {
  if (m.de === "sistema")
    return (
      <div className="justify-self-center rounded-[14px] bg-peach px-3 py-2 text-center text-[0.78rem] font-semibold text-warn">
        {m.texto}
      </div>
    );
  const cliente = m.de === "cliente";
  return (
    <div
      className={`max-w-[86%] whitespace-pre-line rounded-[14px] px-[13px] py-[9px] text-[0.88rem] shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${
        cliente ? "justify-self-end rounded-br-[3px] bg-[#d9fdd3]" : "justify-self-start rounded-bl-[3px] bg-white"
      }`}
    >
      {m.texto}
    </div>
  );
}
