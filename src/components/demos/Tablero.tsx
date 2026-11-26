"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoProps } from "./index";

/*
 * Demo simulado del Organizador de proyectos.
 * Empresa ficticia con actividades por área, responsables y fechas compromiso.
 * Las actividades se dan de alta a mano, por voz o por WhatsApp,
 * y cada perfil recibe su resumen. Todo vive en memoria.
 */

const AZUL = "#3b5bdb";
const EMPRESA = "Grupo Altavista";

type Estado = "Pendiente" | "En proceso" | "Completado";
const ESTADOS: Estado[] = ["Pendiente", "En proceso", "Completado"];

type Area = { id: string; nombre: string; color: string };
const AREAS: Area[] = [
  { id: "dir", nombre: "Dirección", color: "#e8590c" },
  { id: "ven", nombre: "Ventas", color: "#2f9e44" },
  { id: "com", nombre: "Compras", color: "#1c7ed6" },
  { id: "alm", nombre: "Almacén", color: "#7048e8" },
  { id: "mkt", nombre: "Marketing", color: "#d6336c" },
  { id: "sis", nombre: "Sistemas", color: "#0c8599" },
];

type Persona = { nombre: string; completo: string; area: string };
const PERSONAS: Persona[] = [
  { nombre: "Sofía", completo: "Sofía Medina", area: "dir" },
  { nombre: "Ana", completo: "Ana Ruiz", area: "ven" },
  { nombre: "Diego", completo: "Diego Torres", area: "com" },
  { nombre: "Jorge", completo: "Jorge Salas", area: "alm" },
  { nombre: "Laura", completo: "Laura Peña", area: "mkt" },
  { nombre: "Raúl", completo: "Raúl Castro", area: "sis" },
];

type Comentario = { autor: string; texto: string; aviso?: string };
type Actividad = {
  id: string;
  titulo: string;
  area: string;
  persona: string;
  estado: Estado;
  avance: number;
  /** Días desde hoy. Negativo = ya pasó. */
  dias: number;
  comentarios: Comentario[];
  origen?: "Manual" | "Voz" | "WhatsApp";
};

/** Arranque realista: avance a medias, algunas atrasadas, comentarios. */
const INICIALES: Actividad[] = [
  { id: "A-01", titulo: "Definir metas de venta del primer trimestre por zona", area: "dir", persona: "Sofía", estado: "En proceso", avance: 60, dias: 2, comentarios: [{ autor: "Ana", texto: "Ya mandé las cifras de Occidente." }] },
  { id: "A-02", titulo: "Revisar resultados del mes con cada área", area: "dir", persona: "Sofía", estado: "Completado", avance: 100, dias: -3, comentarios: [] },
  { id: "A-03", titulo: "Cotizar 40 equipos para Constructora Lerma", area: "ven", persona: "Ana", estado: "En proceso", avance: 40, dias: -1, comentarios: [{ autor: "Diego", texto: "@Ana el proveedor confirma precio el martes." }] },
  { id: "A-04", titulo: "Visitar a 5 clientes de la zona norte", area: "ven", persona: "Ana", estado: "Pendiente", avance: 0, dias: 5, comentarios: [] },
  { id: "A-05", titulo: "Cerrar convenio anual con Hotelera del Bajío", area: "ven", persona: "Ana", estado: "Completado", avance: 100, dias: -6, comentarios: [] },
  { id: "A-06", titulo: "Negociar precio de lámina con dos proveedores", area: "com", persona: "Diego", estado: "En proceso", avance: 70, dias: 1, comentarios: [] },
  { id: "A-07", titulo: "Dar de alta proveedor de empaque nuevo", area: "com", persona: "Diego", estado: "Pendiente", avance: 0, dias: -2, comentarios: [] },
  { id: "A-08", titulo: "Conteo cíclico de pasillos 1 a 4", area: "alm", persona: "Jorge", estado: "Completado", avance: 100, dias: -1, comentarios: [{ autor: "Jorge", texto: "Diferencia de 3 piezas en pasillo 2, ya se ajustó." }] },
  { id: "A-09", titulo: "Reacomodar mercancía de lento movimiento", area: "alm", persona: "Jorge", estado: "Pendiente", avance: 0, dias: 4, comentarios: [] },
  { id: "A-10", titulo: "Etiquetar ubicaciones del almacén nuevo", area: "alm", persona: "Jorge", estado: "En proceso", avance: 30, dias: -4, comentarios: [] },
  { id: "A-11", titulo: "Campaña de fin de año en redes", area: "mkt", persona: "Laura", estado: "En proceso", avance: 50, dias: 3, comentarios: [] },
  { id: "A-12", titulo: "Fotos de producto para el catálogo 2026", area: "mkt", persona: "Laura", estado: "Pendiente", avance: 0, dias: 8, comentarios: [] },
  { id: "A-13", titulo: "Actualizar precios en la página web", area: "mkt", persona: "Laura", estado: "Completado", avance: 100, dias: -2, comentarios: [] },
  { id: "A-14", titulo: "Respaldar base de datos de clientes", area: "sis", persona: "Raúl", estado: "Completado", avance: 100, dias: -5, comentarios: [] },
  { id: "A-15", titulo: "Conectar inventario con la hoja de pedidos", area: "sis", persona: "Raúl", estado: "En proceso", avance: 80, dias: 2, comentarios: [{ autor: "Sofía", texto: "@Raúl es prioridad para el cierre de mes." }] },
  { id: "A-16", titulo: "Dar accesos al equipo nuevo de ventas", area: "sis", persona: "Raúl", estado: "Pendiente", avance: 0, dias: -1, comentarios: [] },
];

const area = (id: string) => AREAS.find((a) => a.id === id)!;
const persona = (n: string) => PERSONAS.find((p) => p.nombre === n)!;
const atrasada = (a: Actividad) => a.estado !== "Completado" && a.dias < 0;
const avanceDeEstado = (e: Estado, actual: number) => (e === "Completado" ? 100 : e === "Pendiente" ? 0 : Math.min(Math.max(actual, 10), 90));
const estadoDeAvance = (v: number): Estado => (v >= 100 ? "Completado" : v <= 0 ? "Pendiente" : "En proceso");

/* ---------- Fechas ---------- */
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function fechaDe(hoy: Date, dias: number) {
  const d = new Date(hoy);
  d.setDate(d.getDate() + dias);
  return d;
}
const corta = (d: Date) => d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });

/* ---------- Lectura de lo que se dicta o se manda por WhatsApp ---------- */
function interpretar(textoOriginal: string, hoy: Date) {
  let t = " " + textoOriginal.trim().replace(/[.!]+$/, "") + " ";
  const bajo = t.toLowerCase();

  // Responsable
  // Límites de palabra que entienden acentos y ñ ("Ana" no debe encontrarse dentro de "mañana").
  const palabra = (w: string) => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, "iu");
  const p = PERSONAS.find((x) => palabra(x.nombre.toLowerCase()).test(bajo)) ?? null;

  // Área por palabra clave, si no la del responsable
  const claves: [string, string][] = [
    ["venta", "ven"], ["cliente", "ven"], ["cotiz", "ven"], ["compra", "com"], ["proveedor", "com"],
    ["almac", "alm"], ["inventario", "alm"], ["conteo", "alm"], ["redes", "mkt"], ["campaña", "mkt"],
    ["promoci", "mkt"], ["sistema", "sis"], ["página", "sis"], ["dirección", "dir"],
  ];
  const porClave = claves.find(([k]) => bajo.includes(k))?.[1];
  const areaId = p?.area ?? porClave ?? "dir";

  // Fecha compromiso
  let dias = 7;
  let frase = "";
  const enN = bajo.match(/en (\d+) d[ií]as/);
  if (/pasado mañana/.test(bajo)) { dias = 2; frase = "pasado mañana"; }
  else if (/\bmañana\b/.test(bajo)) { dias = 1; frase = "mañana"; }
  else if (/\bhoy\b/.test(bajo)) { dias = 0; frase = "hoy"; }
  else if (enN) { dias = +enN[1]; frase = enN[0]; }
  else if (/pr[oó]xima semana/.test(bajo)) { dias = 7; frase = bajo.match(/(la )?pr[oó]xima semana/)![0]; }
  else {
    const i = DIAS_SEMANA.findIndex((d) => bajo.includes(d) || bajo.includes(d.normalize("NFD").replace(/[̀-ͯ]/g, "")));
    if (i >= 0) {
      dias = ((i - hoy.getDay() + 7) % 7) || 7;
      frase = DIAS_SEMANA[i];
    }
  }

  // Título: quitamos responsable, fecha y muletillas
  if (frase) t = t.replace(new RegExp(`\\s*(para (el )?|el |antes del? )?${frase}`, "i"), " ");
  if (p) t = t.replace(new RegExp(`(?<!\\p{L})(que )?${p.nombre}(?!\\p{L})\\s*(tiene que|debe|va a|necesita|,)?`, "iu"), " ");
  t = t.replace(/^\s*(agrega|agregar|nueva actividad|actividad)[:,]?\s*/i, " ");
  t = t.replace(/\s+/g, " ").trim();
  const titulo = t ? t[0].toUpperCase() + t.slice(1) : "";

  return { titulo, persona: p?.nombre ?? PERSONAS.find((x) => x.area === areaId)!.nombre, area: areaId, dias };
}

const EJEMPLO_VOZ = "Laura tiene que publicar la promoción de fin de mes para el jueves";
const EJEMPLO_WA = "Agrega: Jorge recibir pedido de tornillería pasado mañana";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Reconocedor = any;

export default function Tablero({ narrar }: DemoProps) {
  const [hoy, setHoy] = useState<Date | null>(null);
  const [acts, setActs] = useState<Actividad[]>(INICIALES);
  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroPersona, setFiltroPersona] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [vista, setVista] = useState<"tabla" | "kanban">("tabla");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [alta, setAlta] = useState(false);
  const [perfil, setPerfil] = useState("Sofía");
  const [nueva, setNueva] = useState<string | null>(null);

  useEffect(() => setHoy(new Date()), []);

  const visibles = acts.filter(
    (a) =>
      (filtroArea === "todas" || a.area === filtroArea) &&
      (filtroPersona === "todas" || a.persona === filtroPersona) &&
      (filtroEstado === "todos" || (filtroEstado === "Atrasada" ? atrasada(a) : a.estado === filtroEstado))
  );

  const base = filtroArea === "todas" ? acts : acts.filter((a) => a.area === filtroArea);
  const kpi = {
    total: base.length,
    proceso: base.filter((a) => a.estado === "En proceso").length,
    hechas: base.filter((a) => a.estado === "Completado").length,
    atrasadas: base.filter(atrasada).length,
  };
  const avanceGlobal = Math.round(base.reduce((s, a) => s + a.avance, 0) / Math.max(base.length, 1));

  function actualizar(id: string, cambio: Partial<Actividad>) {
    setActs((xs) => xs.map((a) => (a.id === id ? { ...a, ...cambio } : a)));
  }

  function cambiarEstado(a: Actividad, e: Estado) {
    actualizar(a.id, { estado: e, avance: avanceDeEstado(e, a.avance) });
    if (e === "Completado")
      narrar(`${a.persona} marcó ${a.id} como completada. El avance del área y el de toda la empresa se recalcularon solos.`);
    else narrar(`${a.id} pasó a "${e}". Todos ven el cambio al momento; nadie tuvo que mandar un reporte.`);
  }

  function cambiarAvance(a: Actividad, v: number) {
    actualizar(a.id, { avance: v, estado: estadoDeAvance(v) });
    narrar(`Avance de ${a.id} en ${v}%. ${v >= 100 ? "Al llegar a 100% se marca como completada." : "La barra del área se mueve con cada ajuste."}`);
  }

  function comentar(a: Actividad, texto: string) {
    const mencion = PERSONAS.find((p) => texto.includes("@" + p.nombre));
    const c: Comentario = { autor: "Tú", texto, aviso: mencion ? `Aviso enviado a ${mencion.completo} por correo` : undefined };
    actualizar(a.id, { comentarios: [...a.comentarios, c] });
    narrar(
      mencion
        ? `Mencionaste a ${mencion.nombre}: le llegó un correo con el comentario y la liga directa a la actividad.`
        : "El comentario queda guardado en la actividad. Así la historia no se pierde en chats."
    );
  }

  function agregar(datos: { titulo: string; persona: string; area: string; dias: number }, origen: Actividad["origen"]) {
    const n = acts.length + 1;
    const id = `A-${String(n).padStart(2, "0")}`;
    setActs((xs) => [...xs, { id, ...datos, estado: "Pendiente", avance: 0, comentarios: [], origen }]);
    setNueva(id);
    setFiltroArea("todas");
    setFiltroPersona("todas");
    setFiltroEstado("todos");
    const cuando = hoy ? corta(fechaDe(hoy, datos.dias)) : "";
    const como = origen === "Voz" ? "Se dictó por voz y" : origen === "WhatsApp" ? "Llegó por WhatsApp y" : "Se capturó y";
    narrar(`${como} quedó como ${id} para ${datos.persona}, compromiso ${cuando}. Ya aparece en su resumen.`);
    return id;
  }

  if (!hoy) return <div className="h-[520px]" aria-hidden="true" />;

  const selector =
    "h-9 min-w-0 rounded-full border border-line2 bg-white px-3 text-[13px] font-semibold text-ink";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 text-[0.88rem]">
      {/* Barra del sistema */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-white" style={{ background: "#1b2240" }}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-[12px] font-black" style={{ background: AZUL }}>
            GA
          </span>
          <div className="leading-tight">
            <b className="block">{EMPRESA}</b>
            <span className="text-[0.75rem] text-white/60">Plan de trabajo 2026</span>
          </div>
        </div>
        <span className="text-[0.75rem] text-white/70">
          Avance general <b className="text-white tabular-nums">{avanceGlobal}%</b>
        </span>
      </div>

      {/* Áreas */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Área">
        {[{ id: "todas", nombre: "Todas", color: AZUL }, ...AREAS].map((a) => {
          const n = a.id === "todas" ? acts.length : acts.filter((x) => x.area === a.id).length;
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={filtroArea === a.id}
              onClick={() => {
                setFiltroArea(a.id);
                narrar(a.id === "todas" ? "Vista consolidada: todas las áreas en una sola pantalla." : `Tablero de ${a.nombre}: cada área ve lo suyo, con su propio avance.`);
              }}
              className="flex flex-none items-center gap-1.5 rounded-full border border-line2 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-muted aria-pressed:border-[#1b2240] aria-pressed:bg-[#1b2240] aria-pressed:text-white"
            >
              <i className="h-2 w-2 rounded-full" style={{ background: a.color }} />
              {a.nombre}
              <span className="tabular-nums opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { n: kpi.total, t: "Actividades", c: "#1a1a1a", b: "#f4f5f8" },
          { n: kpi.proceso, t: "En proceso", c: "#b45309", b: "#fff4e0" },
          { n: kpi.hechas, t: "Completadas", c: "#0f8a4f", b: "#e6f6ed" },
          { n: kpi.atrasadas, t: "Atrasadas", c: "#d93025", b: "#fde8e6" },
        ].map((k) => (
          <button
            key={k.t}
            type="button"
            onClick={() => {
              const f = k.t === "Actividades" ? "todos" : k.t === "Completadas" ? "Completado" : k.t === "Atrasadas" ? "Atrasada" : "En proceso";
              setFiltroEstado(f);
              narrar(k.t === "Atrasadas" ? "Las atrasadas salen en rojo. Son las que pasaron su fecha compromiso sin terminarse." : `Filtrado: ${k.t.toLowerCase()}.`);
            }}
            className="grid justify-items-center rounded-xl px-1 py-2.5"
            style={{ background: k.b }}
          >
            <b className="text-lg font-black tabular-nums leading-none" style={{ color: k.c }}>
              {k.n}
            </b>
            <span className="mt-1 text-[10.5px] font-semibold text-muted">{k.t}</span>
          </button>
        ))}
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setAlta((v) => !v);
            if (!alta) narrar("Una actividad nueva se puede capturar a mano, dictar por voz o mandar por WhatsApp.");
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white"
          style={{ background: AZUL }}
          aria-expanded={alta}
        >
          {alta ? "Cerrar" : "+ Nueva actividad"}
        </button>
        <div className="flex rounded-full border border-line2 bg-white p-0.5" role="group" aria-label="Vista">
          {(["tabla", "kanban"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vista === v}
              onClick={() => {
                setVista(v);
                narrar(v === "kanban" ? "Vista kanban: las mismas actividades acomodadas por estado." : "Vista de tabla: actividades agrupadas por área con su avance.");
              }}
              className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold capitalize text-muted aria-pressed:bg-[#eef1ff] aria-pressed:text-[#3b5bdb]"
            >
              {v}
            </button>
          ))}
        </div>
        <select aria-label="Persona" className={selector} value={filtroPersona} onChange={(e) => { setFiltroPersona(e.target.value); narrar(e.target.value === "todas" ? "Todas las personas." : `Solo lo de ${e.target.value}: así revisa cada quien sus pendientes.`); }}>
          <option value="todas">Todas las personas</option>
          {PERSONAS.map((p) => (
            <option key={p.nombre} value={p.nombre}>{p.completo}</option>
          ))}
        </select>
        <select aria-label="Estado" className={selector} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {[...ESTADOS, "Atrasada"].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {alta && <Alta hoy={hoy} onAgregar={agregar} narrar={narrar} />}

      {/* Actividades */}
      {visibles.length === 0 ? (
        <p className="rounded-2xl bg-[#f7f7f8] p-6 text-center text-muted">No hay actividades con ese filtro.</p>
      ) : vista === "tabla" ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {AREAS.filter((ar) => visibles.some((a) => a.area === ar.id)).map((ar) => {
            const deArea = acts.filter((a) => a.area === ar.id);
            const pct = Math.round(deArea.reduce((s, a) => s + a.avance, 0) / deArea.length);
            return (
              <div key={ar.id} className="grid grid-cols-[minmax(0,1fr)] overflow-clip rounded-2xl border border-line" style={{ borderLeft: `4px solid ${ar.color}` }}>
                <div className="flex items-center justify-between gap-3 bg-[#fafafa] px-3.5 py-2.5">
                  <b style={{ color: ar.color }}>
                    {ar.nombre} <span className="text-[0.75rem] font-medium text-muted">{deArea.length} actividades</span>
                  </b>
                  <span className="flex items-center gap-2 text-[0.78rem] font-bold tabular-nums">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e9ecef]">
                      <i className="block h-full rounded-full bg-[#12b76a] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </span>
                    {pct}%
                  </span>
                </div>
                {visibles.filter((a) => a.area === ar.id).map((a) => (
                  <Fila
                    key={a.id}
                    a={a}
                    hoy={hoy}
                    nueva={nueva === a.id}
                    abierta={abierta === a.id}
                    onAbrir={() => {
                      setAbierta(abierta === a.id ? null : a.id);
                      if (abierta !== a.id) narrar("Cada actividad tiene su historial de comentarios. Escribe @ y un nombre para avisarle.");
                    }}
                    onEstado={(e) => cambiarEstado(a, e)}
                    onAvance={(v) => cambiarAvance(a, v)}
                    onComentar={(t) => comentar(a, t)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
          {ESTADOS.map((e, i) => {
            const col = visibles.filter((a) => a.estado === e);
            return (
              <div key={e} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2 rounded-2xl bg-[#f6f7f9] p-2.5">
                <h5 className="flex justify-between px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                  {e} <span className="tabular-nums">{col.length}</span>
                </h5>
                {col.map((a) => (
                  <div key={a.id} className={`grid gap-2 rounded-xl border bg-white p-3 ${nueva === a.id ? "border-[#3b5bdb]" : "border-line"}`}>
                    <span className="text-[0.84rem] font-semibold leading-snug">{a.titulo}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.74rem] text-muted">
                      <i className="h-2 w-2 rounded-full" style={{ background: area(a.area).color }} />
                      {a.persona} · <span className={atrasada(a) ? "font-bold text-bad" : ""}>{corta(fechaDe(hoy, a.dias))}</span>
                    </span>
                    <div className="flex justify-between gap-1">
                      <button type="button" disabled={i === 0} onClick={() => cambiarEstado(a, ESTADOS[i - 1])} className="rounded-full border border-line2 px-2.5 py-1 text-[0.75rem] font-semibold disabled:invisible" aria-label={`Mover ${a.id} a ${ESTADOS[i - 1] ?? ""}`}>
                        ←
                      </button>
                      <button type="button" disabled={i === 2} onClick={() => cambiarEstado(a, ESTADOS[i + 1])} className="rounded-full border border-line2 px-2.5 py-1 text-[0.75rem] font-semibold disabled:invisible" aria-label={`Mover ${a.id} a ${ESTADOS[i + 1] ?? ""}`}>
                        {ESTADOS[i + 1] ? `${ESTADOS[i + 1]} →` : ""}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Resumen acts={acts} hoy={hoy} perfil={perfil} onPerfil={(p) => { setPerfil(p); narrar(p === "Sofía" ? "Dirección recibe el resumen de toda la empresa, por área, sin pedirlo." : `Así le llega el resumen a ${p}: solo lo suyo, con lo atrasado primero.`); }} />
    </div>
  );
}

/* ---------- Una actividad en la vista de tabla ---------- */
function Fila({
  a, hoy, nueva, abierta, onAbrir, onEstado, onAvance, onComentar,
}: {
  a: Actividad; hoy: Date; nueva: boolean; abierta: boolean;
  onAbrir: () => void; onEstado: (e: Estado) => void; onAvance: (v: number) => void; onComentar: (t: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const tarde = atrasada(a);
  const colorEstado = a.estado === "Completado" ? "#12b76a" : a.estado === "En proceso" ? "#f59f00" : "#868e96";
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-line px-3.5 py-3 ${nueva ? "bg-[#eef1ff]" : "bg-white"}`}>
      <button type="button" onClick={onAbrir} className="flex items-start gap-2 text-left" aria-expanded={abierta}>
        <span className="mt-px text-[0.72rem] font-bold tabular-nums text-muted">{a.id}</span>
        <span className="min-w-0 flex-1 font-semibold leading-snug">{a.titulo}</span>
        <span className="whitespace-nowrap text-[0.75rem] font-semibold text-[#3b5bdb]">💬 {a.comentarios.length}</span>
      </button>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-0 sm:pl-10">
        <span className="text-[0.78rem] text-muted">{a.persona}</span>
        <span className={`text-[0.78rem] tabular-nums ${tarde ? "font-bold text-bad" : "text-muted"}`}>
          {tarde ? "Atrasada · " : ""}
          {corta(fechaDe(hoy, a.dias))}
        </span>
        {a.origen && a.origen !== "Manual" && (
          <span className="rounded-full bg-[#eef1ff] px-2 py-0.5 text-[0.7rem] font-bold text-[#3b5bdb]">Llegó por {a.origen.toLowerCase()}</span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#e9ecef]">
            <i className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${a.avance}%`, background: colorEstado }} />
          </span>
          <span className="w-9 text-right text-[0.75rem] font-bold tabular-nums">{a.avance}%</span>
          <select
            aria-label={`Estado de ${a.id}`}
            value={a.estado}
            onChange={(e) => onEstado(e.target.value as Estado)}
            className="h-8 rounded-lg px-2 text-[0.75rem] font-bold text-white"
            style={{ background: colorEstado }}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="bg-white text-ink">{e}</option>
            ))}
          </select>
        </span>
      </div>

      {abierta && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 rounded-xl bg-[#f7f8fb] p-3 sm:ml-10">
          <label className="grid gap-1 text-[0.75rem] font-semibold text-muted">
            Avance: {a.avance}%
            <input type="range" min={0} max={100} step={10} value={a.avance} onChange={(e) => onAvance(+e.target.value)} style={{ accentColor: AZUL }} />
          </label>
          {a.comentarios.map((c, i) => (
            <div key={i} className="grid gap-1">
              <div className="rounded-lg bg-white px-3 py-2 text-[0.82rem]">
                <b className="text-[#3b5bdb]">{c.autor}:</b> {c.texto}
              </div>
              {c.aviso && <span className="text-[0.72rem] font-semibold text-ok">✓ {c.aviso}</span>}
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (texto.trim()) onComentar(texto.trim());
              setTexto("");
            }}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-full border border-line2 bg-white px-3.5 text-base"
              placeholder={`Comenta. Prueba con @${a.persona}`}
              aria-label="Comentario"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit" className="rounded-full px-4 text-[13px] font-semibold text-white" style={{ background: AZUL }}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- Alta de actividades: a mano, por voz o por WhatsApp ---------- */
function Alta({
  hoy, onAgregar, narrar,
}: {
  hoy: Date;
  onAgregar: (d: { titulo: string; persona: string; area: string; dias: number }, origen: Actividad["origen"]) => string;
  narrar: (t: string) => void;
}) {
  const [modo, setModo] = useState<"Manual" | "Voz" | "WhatsApp">("Voz");
  return (
    <div className="grid gap-3 rounded-2xl border border-[#d5dcff] bg-[#f7f8ff] p-3.5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cómo agregar">
        {(["Voz", "WhatsApp", "Manual"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => {
              setModo(m);
              narrar(m === "Voz" ? "Dicta la actividad como la dirías en voz alta. El sistema saca el responsable y la fecha." : m === "WhatsApp" ? "Manda un mensaje al número del sistema y la actividad se da de alta sola." : "Captura tradicional: título, área, responsable y fecha compromiso.");
            }}
            className="rounded-full border border-line2 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-muted aria-pressed:border-[#3b5bdb] aria-pressed:bg-[#3b5bdb] aria-pressed:text-white"
          >
            {m === "Voz" ? "🎙 Por voz" : m === "WhatsApp" ? "💬 Por WhatsApp" : "✏️ A mano"}
          </button>
        ))}
      </div>
      {modo === "Voz" && <PorVoz hoy={hoy} onAgregar={onAgregar} narrar={narrar} />}
      {modo === "WhatsApp" && <PorWhatsApp hoy={hoy} onAgregar={onAgregar} />}
      {modo === "Manual" && <AMano onAgregar={onAgregar} />}
    </div>
  );
}

function Vista({ hoy, texto }: { hoy: Date; texto: string }) {
  const d = interpretar(texto, hoy);
  if (!d.titulo) return null;
  return (
    <div className="grid gap-1 rounded-xl bg-white p-3 text-[0.8rem]">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">Así se va a guardar</span>
      <b className="text-[0.88rem]">{d.titulo}</b>
      <span className="text-muted">
        {area(d.area).nombre} · {persona(d.persona).completo} · compromiso {corta(fechaDe(hoy, d.dias))}
      </span>
    </div>
  );
}

function PorVoz({ hoy, onAgregar, narrar }: { hoy: Date; onAgregar: (d: any, o: Actividad["origen"]) => string; narrar: (t: string) => void }) {
  const [texto, setTexto] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const rec = useRef<Reconocedor>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    rec.current?.abort?.();
    if (timer.current) clearInterval(timer.current);
  }, []);

  /** Si el navegador no tiene dictado (por ejemplo, iPhone), se simula escribiendo un ejemplo. */
  function simular() {
    setEscuchando(true);
    setTexto("");
    let i = 0;
    timer.current = setInterval(() => {
      i += 2;
      setTexto(EJEMPLO_VOZ.slice(0, i));
      if (i >= EJEMPLO_VOZ.length) {
        clearInterval(timer.current!);
        setEscuchando(false);
      }
    }, 45);
  }

  function dictar() {
    if (escuchando) {
      rec.current?.stop?.();
      return;
    }
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) {
      simular();
      narrar("Este navegador no deja usar el micrófono aquí, así que simulamos el dictado. En el sistema real se dicta desde el celular.");
      return;
    }
    try {
      const r = new SR();
      r.lang = "es-MX";
      r.interimResults = true;
      r.onresult = (e: any) => setTexto(Array.from(e.results).map((x: any) => x[0].transcript).join(" "));
      r.onerror = () => { setEscuchando(false); simular(); };
      r.onend = () => setEscuchando(false);
      rec.current = r;
      setTexto("");
      setEscuchando(true);
      r.start();
      narrar("Escuchando. Di quién, qué y para cuándo, por ejemplo: “Diego tiene que pedir lámina para el viernes”.");
    } catch {
      simular();
    }
  }

  return (
    <div className="grid gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={dictar}
          className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white ${escuchando ? "animate-pulse" : ""}`}
          style={{ background: escuchando ? "#d93025" : AZUL }}
        >
          🎙 {escuchando ? "Escuchando… toca para terminar" : "Tocar para dictar"}
        </button>
        <button type="button" onClick={simular} className="text-[0.78rem] font-semibold text-[#3b5bdb] underline">
          Usar ejemplo
        </button>
      </div>
      <textarea
        className="min-h-[60px] rounded-xl border border-line2 bg-white p-3 text-base"
        placeholder="Lo que dictes aparece aquí. También puedes corregirlo."
        aria-label="Texto dictado"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {texto && !escuchando && <Vista hoy={hoy} texto={texto} />}
      <button
        type="button"
        disabled={!texto.trim() || escuchando || !interpretar(texto, hoy).titulo}
        onClick={() => { onAgregar(interpretar(texto, hoy), "Voz"); setTexto(""); }}
        className="h-10 w-fit rounded-full px-4 text-[13px] font-semibold text-white disabled:opacity-40"
        style={{ background: AZUL }}
      >
        Agregar actividad
      </button>
    </div>
  );
}

function PorWhatsApp({ hoy, onAgregar }: { hoy: Date; onAgregar: (d: any, o: Actividad["origen"]) => string }) {
  const [texto, setTexto] = useState(EJEMPLO_WA);
  const [chat, setChat] = useState<{ de: "yo" | "bot"; t: string }[]>([]);
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const d = interpretar(texto, hoy);
    if (!d.titulo) return;
    const id = onAgregar(d, "WhatsApp");
    setChat((c) => [
      ...c,
      { de: "yo", t: texto },
      { de: "bot", t: `Listo ✅ Agregué ${id} para ${d.persona}: “${d.titulo}”. Compromiso ${corta(fechaDe(hoy, d.dias))}.` },
    ]);
    setTexto("");
  }
  return (
    <div className="grid gap-2 rounded-xl bg-[#efeae2] p-2.5">
      <div className="text-[0.75rem] font-semibold text-muted">Chat con el número del sistema</div>
      {chat.map((m, i) => (
        <div
          key={i}
          className={`max-w-[88%] rounded-[12px] px-3 py-2 text-[0.82rem] ${m.de === "yo" ? "justify-self-end bg-[#d9fdd3]" : "justify-self-start bg-white"}`}
        >
          {m.t}
        </div>
      ))}
      <form onSubmit={enviar} className="flex gap-2">
        <input
          className="h-10 min-w-0 flex-1 rounded-full border border-line2 bg-white px-3.5 text-base"
          aria-label="Mensaje de WhatsApp"
          placeholder="Ej. Agrega: Ana llamar a Lerma mañana"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="rounded-full bg-[#128c7e] px-4 text-[13px] font-semibold text-white">
          Enviar
        </button>
      </form>
    </div>
  );
}

function AMano({ onAgregar }: { onAgregar: (d: any, o: Actividad["origen"]) => string }) {
  const [titulo, setTitulo] = useState("");
  const [quien, setQuien] = useState("Ana");
  const [dias, setDias] = useState(3);
  const campo = "h-10 min-w-0 rounded-xl border border-line2 bg-white px-3 text-base";
  return (
    <form
      className="grid gap-2 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!titulo.trim()) return;
        onAgregar({ titulo: titulo.trim(), persona: quien, area: persona(quien).area, dias }, "Manual");
        setTitulo("");
      }}
    >
      <input className={`${campo} sm:col-span-2`} placeholder="¿Qué hay que hacer?" aria-label="Actividad" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <select className={campo} aria-label="Responsable" value={quien} onChange={(e) => setQuien(e.target.value)}>
        {PERSONAS.map((p) => (
          <option key={p.nombre} value={p.nombre}>{p.completo} · {area(p.area).nombre}</option>
        ))}
      </select>
      <select className={campo} aria-label="Fecha compromiso" value={dias} onChange={(e) => setDias(+e.target.value)}>
        {[1, 2, 3, 5, 7, 14].map((d) => (
          <option key={d} value={d}>Compromiso en {d} {d === 1 ? "día" : "días"}</option>
        ))}
      </select>
      <button type="submit" disabled={!titulo.trim()} className="h-10 w-fit rounded-full px-4 text-[13px] font-semibold text-white disabled:opacity-40" style={{ background: AZUL }}>
        Agregar actividad
      </button>
    </form>
  );
}

/* ---------- Resumen que recibe cada perfil ---------- */
function Resumen({ acts, hoy, perfil, onPerfil }: { acts: Actividad[]; hoy: Date; perfil: string; onPerfil: (p: string) => void }) {
  const p = persona(perfil);
  const esDireccion = p.area === "dir";
  const mias = esDireccion ? acts : acts.filter((a) => a.persona === perfil);
  const tarde = mias.filter(atrasada);
  const semana = mias.filter((a) => a.estado !== "Completado" && a.dias >= 0 && a.dias <= 7).sort((x, y) => x.dias - y.dias);
  const hechas = mias.filter((a) => a.estado === "Completado");
  const proceso = mias.filter((a) => a.estado === "En proceso");
  const lunes = useMemo(() => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
    return corta(d);
  }, [hoy]);

  const Lista = ({ xs }: { xs: Actividad[] }) => (
    <ul className="grid gap-1">
      {xs.slice(0, 5).map((a) => (
        <li key={a.id} className="flex gap-2">
          <span className="text-muted tabular-nums">{a.id}</span>
          <span className="min-w-0 flex-1">{a.titulo}{esDireccion ? ` · ${a.persona}` : ""}</span>
          <span className="whitespace-nowrap text-muted">{corta(fechaDe(hoy, a.dias))}</span>
        </li>
      ))}
      {xs.length > 5 && <li className="text-muted">y {xs.length - 5} más…</li>}
    </ul>
  );

  return (
    <div className="grid gap-3 rounded-2xl bg-peach p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b className="font-extrabold">Resumen que le llega a cada perfil</b>
        <select
          aria-label="Perfil"
          className="h-9 rounded-full border border-line2 bg-white px-3 text-[13px] font-semibold"
          value={perfil}
          onChange={(e) => onPerfil(e.target.value)}
        >
          {PERSONAS.map((x) => (
            <option key={x.nombre} value={x.nombre}>
              {x.area === "dir" ? `${x.completo} · Dirección (todo)` : `${x.completo} · ${area(x.area).nombre}`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 rounded-xl border border-line bg-white p-4 text-[0.82rem]">
        <div className="grid gap-0.5 border-b border-line pb-2.5 text-[0.75rem] text-muted">
          <span><b className="text-ink">Para:</b> {p.completo} · correo y WhatsApp</span>
          <span><b className="text-ink">Cuándo:</b> cada lunes a las 8:00 (próximo: {lunes})</span>
          <span className="text-[0.88rem] font-bold text-ink">
            {esDireccion ? `Resumen semanal de ${EMPRESA}` : `${p.nombre}, estos son tus pendientes de la semana`}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { n: tarde.length, t: "Atrasadas", c: "#d93025" },
            { n: semana.length, t: "Esta semana", c: "#b45309" },
            { n: proceso.length, t: "En proceso", c: "#3b5bdb" },
            { n: hechas.length, t: "Terminadas", c: "#0f8a4f" },
          ].map((k) => (
            <div key={k.t} className="rounded-lg bg-[#f7f7f8] py-2">
              <b className="block text-base font-black tabular-nums" style={{ color: k.c }}>{k.n}</b>
              <span className="text-[10px] font-semibold text-muted">{k.t}</span>
            </div>
          ))}
        </div>

        {esDireccion && (
          <div className="grid gap-1.5">
            <b className="text-[0.75rem] uppercase tracking-[0.12em] text-muted">Avance por área</b>
            {AREAS.map((ar) => {
              const xs = acts.filter((a) => a.area === ar.id);
              const pct = Math.round(xs.reduce((s, a) => s + a.avance, 0) / Math.max(xs.length, 1));
              return (
                <div key={ar.id} className="flex items-center gap-2">
                  <span className="w-20 truncate">{ar.nombre}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e9ecef]">
                    <i className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: ar.color }} />
                  </span>
                  <span className="w-9 text-right font-bold tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}

        {tarde.length > 0 && (
          <div className="grid gap-1">
            <b className="text-[0.75rem] uppercase tracking-[0.12em] text-bad">Atrasadas</b>
            <Lista xs={tarde} />
          </div>
        )}
        {semana.length > 0 && (
          <div className="grid gap-1">
            <b className="text-[0.75rem] uppercase tracking-[0.12em] text-warn">Vencen esta semana</b>
            <Lista xs={semana} />
          </div>
        )}
        {tarde.length === 0 && semana.length === 0 && <p className="text-ok">Sin pendientes urgentes esta semana. 👏</p>}
      </div>
    </div>
  );
}
