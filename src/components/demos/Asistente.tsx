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

/** 20 preguntas de ejemplo para el demo. El asistente real contesta cualquier pregunta. */
const PREGUNTAS: { q: string; tema: string; r: string }[] = [
  { q: "¿Cuánto cuesta un facial?", tema: "Facial", r: "El facial hidratante cuesta $650 (50 min) y el de limpieza profunda $850 (70 min). ¿Te aparto un horario?" },
  { q: "¿Qué facial me recomiendas para piel grasa?", tema: "Facial", r: "Para piel grasa va mejor la limpieza profunda ($850): incluye extracción, mascarilla purificante y alta frecuencia. Si es tu primera vez, te hacemos una valoración sin costo." },
  { q: "¿Qué tipos de masaje tienen?", tema: "Masajes", r: "Tenemos masaje relajante ($700, 60 min), descontracturante ($850, 60 min), con piedras calientes ($950, 75 min) y masaje para parejas ($1,500, 60 min)." },
  { q: "¿Tienen masaje para parejas?", tema: "Masajes", r: "Sí: masaje relajante para dos en la misma cabina, 60 minutos, $1,500 por pareja. Incluye té y aromaterapia. Conviene apartarlo con 2 días de anticipación." },
  { q: "¿Cuánto cuesta el manicure?", tema: "Uñas", r: "Manicure tradicional $280, manicure con gel $380 y pedicure spa $420. El combo mani + pedi con gel sale en $720." },
  { q: "¿Hacen uñas acrílicas?", tema: "Uñas", r: "Sí. Uñas acrílicas desde $550 (largo corto) y retoque desde $380. El diseño se cotiza según lo que quieras; mándanos una foto de referencia." },
  { q: "¿Cuánto cuesta la depilación con cera?", tema: "Depilación", r: "Depilación con cera: axila $180, media pierna $280, pierna completa $450, bikini $250 y rostro $150." },
  { q: "¿Tienen paquetes para novias?", tema: "Paquetes", r: "Sí, el paquete Novia incluye facial, manicure y pedicure con gel, peinado y maquillaje de prueba: $3,900. Para el día de la boda cotizamos servicio a domicilio." },
  { q: "¿Venden tarjetas de regalo?", tema: "Regalos", r: "Sí, desde $500 o por un servicio específico. Te la mandamos digital por aquí o la recoges impresa. Vigencia de 6 meses." },
  { q: "¿Qué horario tienen?", tema: "Horarios", r: "Abrimos de lunes a sábado de 10:00 a 20:00. Los domingos descansamos." },
  { q: "¿Abren en días festivos?", tema: "Horarios", r: "Abrimos casi todos los festivos de 10:00 a 15:00. Cerramos 25 de diciembre y 1 de enero." },
  { q: "¿Dónde están ubicados?", tema: "Ubicación", r: "Estamos en Av. Chapultepec 480, colonia Americana, Guadalajara. Hay estacionamiento a media cuadra." },
  { q: "¿Tienen estacionamiento?", tema: "Ubicación", r: "Tenemos convenio con el estacionamiento de la esquina: la primera hora es gratis presentando tu ticket en recepción." },
  { q: "Quiero agendar para mañana", tema: "Quiere cita", r: "Con gusto. Tengo libre mañana a las 11:00, 13:30 o 17:00. ¿Cuál te queda mejor y qué servicio te hago?" },
  { q: "¿Necesito dejar anticipo?", tema: "Pagos", r: "Solo para servicios de más de $1,500 o paquetes: anticipo de $300 por transferencia, que se descuenta del total." },
  { q: "¿Aceptan tarjeta?", tema: "Pagos", r: "Aceptamos efectivo, tarjeta de débito y crédito, y transferencia. Con tarjetas participantes hay 3 meses sin intereses en compras mayores a $2,000." },
  { q: "¿Tienen promociones este mes?", tema: "Promociones", r: "Este mes: 2x1 en manicure tradicional los martes y 15% de descuento en tu primer facial. ¿Te aparto alguno?" },
  { q: "¿Puedo cambiar mi cita?", tema: "Cambio de cita", r: "Claro. Puedes cambiarla sin costo con 24 horas de anticipación. Dime tu nombre y la nueva fecha que te gustaría y te la muevo." },
  { q: "¿Los productos que usan son veganos?", tema: "Productos", r: "Sí, trabajamos con línea mexicana vegana y libre de crueldad animal. Si tienes alguna alergia, avísanos antes del servicio." },
  { q: "¿Atienden a hombres?", tema: "Servicios", r: "¡Claro! Tenemos facial para caballero ($600), masajes, manicure y depilación. Muchos de nuestros clientes son hombres." },
];

const RAPIDAS = ["¿Qué horario tienen?", "¿Dónde están?", "Quiero agendar", "¿Aceptan tarjeta?", "Quiero hablar con una persona"];

/** Cómo se ve cada app: barra de arriba, fondo, burbujas y botón de enviar. */
type Skin = {
  barra: React.CSSProperties;
  sub: string;
  anillo: string;
  fondo: string;
  miBurbuja: React.CSSProperties;
  suBurbuja: React.CSSProperties;
  enviar: React.CSSProperties;
  placeholder: string;
  icono: string;
};
const SKIN: Record<Canal, Skin> = {
  WhatsApp: {
    barra: { background: "#075e54", color: "#fff" },
    sub: "en línea",
    anillo: "none",
    fondo: "#efeae2",
    miBurbuja: { background: "#d9fdd3", color: "#111b21" },
    suBurbuja: { background: "#ffffff", color: "#111b21" },
    enviar: { background: "#00a884", color: "#fff" },
    placeholder: "Mensaje",
    icono: "📞",
  },
  Instagram: {
    barra: { background: "#ffffff", color: "#000", borderBottom: "1px solid #efefef" },
    sub: "Activo ahora",
    anillo: "linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)",
    fondo: "#ffffff",
    miBurbuja: { background: "linear-gradient(135deg,#a033ff,#5b51f8 60%,#3797f0)", color: "#fff" },
    suBurbuja: { background: "#efefef", color: "#000" },
    enviar: { background: "#3797f0", color: "#fff" },
    placeholder: "Envía un mensaje…",
    icono: "📹",
  },
  Facebook: {
    barra: { background: "#ffffff", color: "#050505", borderBottom: "1px solid #e4e6eb" },
    sub: "Activo ahora · Messenger",
    anillo: "#1877f2",
    fondo: "#ffffff",
    miBurbuja: { background: "#0084ff", color: "#fff" },
    suBurbuja: { background: "#e4e6eb", color: "#050505" },
    enviar: { background: "#0084ff", color: "#fff" },
    placeholder: "Aa",
    icono: "📞",
  },
  TikTok: {
    barra: { background: "#ffffff", color: "#161823", borderBottom: "1px solid #f1f1f2" },
    sub: "Activo ahora",
    anillo: "linear-gradient(135deg,#25f4ee,#fe2c55)",
    fondo: "#ffffff",
    miBurbuja: { background: "#fe2c55", color: "#fff" },
    suBurbuja: { background: "#f1f1f2", color: "#161823" },
    enviar: { background: "#fe2c55", color: "#fff" },
    placeholder: "Enviar mensaje…",
    icono: "⋯",
  },
};

export default function Asistente({ narrar }: DemoProps) {
  const [canal, setCanal] = useState<Canal>("WhatsApp");
  const skin = SKIN[canal];
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

      const exacta = PREGUNTAS.find((p) => p.q.toLowerCase() === t.toLowerCase());
      if (exacta) {
        setMensajes((m) => [...m, { de: "asistente", texto: exacta.r }]);
        agregarTema(exacta.tema);
        narrar(`Contestó al instante con la información del spa y etiquetó el tema: ${exacta.tema}. Así sabes qué pregunta más la gente.`);
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
    narrar(`Así se ve en ${c}. Mismo asistente y mismo conocimiento en todos los canales, y todo llega a una sola bandeja.`);
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
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto_auto] overflow-hidden rounded-[20px] border border-line transition-colors duration-300" style={{ background: skin.fondo }}>
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[0.9rem] transition-colors duration-300" style={skin.barra}>
            <span className="shrink-0 rounded-full p-[2px]" style={{ background: skin.anillo }}>
              <Foto className="h-9 w-9 border-2 border-white" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate leading-tight">{NEGOCIO}</b>
              <span className="block truncate text-[0.74rem] opacity-75">
                {skin.sub} · {canal} · 11:47 p.m.
              </span>
            </span>
            <span className="shrink-0 text-lg opacity-80" aria-hidden>{skin.icono}</span>
          </div>

          <div ref={caja} className="grid h-[310px] grid-cols-[minmax(0,1fr)] content-start gap-2 overflow-y-auto p-3.5" aria-live="off">
            {mensajes.map((m, i) => (
              <Burbuja key={i} m={m} skin={skin} />
            ))}
            {escribiendo && <Burbuja m={{ de: "asistente", texto: "Escribiendo…" }} skin={skin} />}
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
              placeholder={skin.placeholder}
              aria-label="Mensaje"
              autoComplete="off"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit" className="rounded-full px-4 text-sm font-bold transition-colors duration-300" style={skin.enviar}>
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
          <div className="grid gap-2 border-t border-black/[0.07] pt-3">
            <b className="font-extrabold">Prueba con una de estas 20 preguntas</b>
            <div className="grid max-h-[260px] gap-1.5 overflow-y-auto pr-1">
              {PREGUNTAS.map((p) => (
                <button
                  key={p.q}
                  type="button"
                  onClick={() => enviar(p.q)}
                  disabled={escribiendo}
                  className="rounded-xl border border-line2 bg-white px-3 py-2 text-left text-[0.8rem] font-medium hover:border-solar hover:text-solar disabled:opacity-60"
                >
                  {p.q}
                </button>
              ))}
            </div>
            <p className="rounded-xl bg-white/70 p-2.5 text-[0.78rem] leading-snug text-muted">
              <b className="text-ink">Esto es un demo.</b> Aquí las preguntas vienen de ejemplo. El asistente real no usa preguntas prehechas: contesta cualquier duda, pregunta o aclaración de tus clientes con la información de tu negocio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Foto de perfil del negocio ficticio (salón de belleza). Si no carga, muestra sus iniciales. */
const FOTO = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=160&h=160&q=70";
function Foto({ className = "" }: { className?: string }) {
  const [falla, setFalla] = useState(false);
  return falla ? (
    <span className={`grid place-items-center rounded-full bg-[#f6d7e4] text-[11px] font-black text-[#a8326e] ${className}`}>EL</span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={FOTO} alt="" onError={() => setFalla(true)} className={`rounded-full object-cover ${className}`} />
  );
}

function Burbuja({ m, skin }: { m: Mensaje; skin: Skin }) {
  if (m.de === "sistema")
    return (
      <div className="justify-self-center rounded-[14px] bg-peach px-3 py-2 text-center text-[0.78rem] font-semibold text-warn">
        {m.texto}
      </div>
    );
  const cliente = m.de === "cliente";
  if (!cliente)
    return (
      <div className="flex max-w-[92%] items-end gap-1.5 justify-self-start">
        <Foto className="h-6 w-6 shrink-0" />
        <div className="whitespace-pre-line rounded-[14px] rounded-bl-[3px] px-[13px] py-[9px] text-[0.88rem] shadow-[0_1px_1px_rgba(0,0,0,0.06)]" style={skin.suBurbuja}>
          {m.texto}
        </div>
      </div>
    );
  return (
    <div
      className={`max-w-[86%] whitespace-pre-line rounded-[14px] px-[13px] py-[9px] text-[0.88rem] shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${
        cliente ? "justify-self-end rounded-br-[3px]" : "justify-self-start rounded-bl-[3px]"
      }`}
      style={cliente ? skin.miBurbuja : skin.suBurbuja}
    >
      {m.texto}
    </div>
  );
}
