"use client";

import { useEffect, useState } from "react";
import type { DemoProps } from "./index";
import { waLink } from "@/lib/whatsapp";

/*
 * Demo de Automatización de procesos: el archivo de arribos.
 * El sistema lee facturas y avisos de 3 fuentes (correo, páginas de proveedores, plan de surtido),
 * calcula la llegada tentativa con las reglas de la empresa y avisa a Compras y a Almacén.
 * Empresa y proveedores ficticios. Todo vive en memoria.
 */

type Origen = "nacional" | "usa" | "china";
type FuenteId = "correo" | "portal" | "plan";
type Registro = {
  id: string;
  fuente: FuenteId;
  proveedor: string;
  documento: string;
  producto: string;
  piezas: number;
  monto: number;
  origen: Origen;
  /** días respecto a hoy; null = el documento no trae fecha de embarque */
  embarque: number | null;
};
type Elemento = Registro & { titulo: string; detalle: string };

const ORIGEN_TXT: Record<Origen, string> = { nacional: "Nacional (terrestre)", usa: "Estados Unidos", china: "China (marítimo)" };

const FUENTES: { id: FuenteId; icono: string; nombre: string; quePasa: string; elementos: Elemento[] }[] = [
  {
    id: "correo",
    icono: "📧",
    nombre: "Correo de compras",
    quePasa: "Lee los correos de proveedores, abre la factura adjunta y saca proveedor, piezas, monto y fecha de embarque.",
    elementos: [
      { id: "c1", fuente: "correo", titulo: "Factura LT-3307 · Barras LED", detalle: "facturacion@luztec.mx · 📎 LT-3307.pdf", proveedor: "LuzTec Iluminación", documento: "Factura LT-3307", producto: "Barra LED 42 in", piezas: 40, monto: 86000, origen: "nacional", embarque: -1 },
      { id: "c2", fuente: "correo", titulo: "Commercial Invoice CI-2291 — shipped", detalle: "export@sierratires.com · 📎 CI-2291.pdf · guía 1Z88…", proveedor: "Sierra Tires (USA)", documento: "Invoice CI-2291", producto: "Llanta A/T 33 in", piezas: 120, monto: 312000, origen: "usa", embarque: -3 },
      { id: "c3", fuente: "correo", titulo: "Factura AB-11920", detalle: "ventas@acerosbajio.mx · 📎 AB-11920.pdf", proveedor: "Aceros del Bajío", documento: "Factura AB-11920", producto: "Defensa delantera de acero", piezas: 18, monto: 97200, origen: "nacional", embarque: null },
    ],
  },
  {
    id: "portal",
    icono: "🌐",
    nombre: "Páginas de proveedores",
    quePasa: "Entra a los portales donde compran, revisa el estado de cada pedido y toma la fecha de envío.",
    elementos: [
      { id: "p1", fuente: "portal", titulo: "Pedido SZ-5531 · En tránsito marítimo", detalle: "Portal Shenzhen Lighting · contenedor MSKU 7710…", proveedor: "Shenzhen Lighting", documento: "Pedido SZ-5531", producto: "Faros auxiliares LED", piezas: 300, monto: 141000, origen: "china", embarque: -24 },
      { id: "p2", fuente: "portal", titulo: "Order WP-8812 · Ready to ship", detalle: "Portal Winch Pro USA · envío programado", proveedor: "Winch Pro USA", documento: "Pedido WP-8812", producto: "Winch 12,000 lb", piezas: 25, monto: 410000, origen: "usa", embarque: 2 },
    ],
  },
  {
    id: "plan",
    icono: "📋",
    nombre: "Plan de surtido",
    quePasa: "Lee el plan de surtido (o de producción) y agrega lo que ya está pedido con su fecha programada.",
    elementos: [
      { id: "s1", fuente: "plan", titulo: "Snorkel · 60 pzas · pedido colocado", detalle: "Hoja “Plan de surtido diciembre”, renglón 14", proveedor: "Accesorios Querétaro", documento: "OC-1043", producto: "Snorkel", piezas: 60, monto: 474000, origen: "nacional", embarque: 4 },
      { id: "s2", fuente: "plan", titulo: "Kit de levante 2 in · 30 pzas", detalle: "Hoja “Plan de surtido diciembre”, renglón 15", proveedor: "Ningbo Suspension", documento: "OC-1038", producto: "Kit de levante 2 in", piezas: 30, monto: 435000, origen: "china", embarque: -33 },
    ],
  },
];

type Reglas = { nacional: number; usa: number; china: number; aduana: number; colchon: number };
const REGLAS_INI: Reglas = { nacional: 3, usa: 7, china: 35, aduana: 2, colchon: 1 };

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const pesos = (n: number) => "$" + n.toLocaleString("es-MX");

function fecha(hoy: Date | null, offset: number) {
  if (!hoy) return "…";
  const d = new Date(hoy);
  d.setDate(d.getDate() + offset);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

function llegada(r: Registro, g: Reglas): number | null {
  if (r.embarque === null) return null;
  return r.embarque + g[r.origen] + (r.origen === "nacional" ? 0 : g.aduana) + g.colchon;
}

type Estado = { texto: string; clase: string; orden: number };
function estado(eta: number | null): Estado {
  if (eta === null) return { texto: "Revisar: sin fecha de embarque", clase: "bg-red-50 text-bad", orden: 0 };
  if (eta < 0) return { texto: "Atrasado: ya debió llegar", clase: "bg-red-50 text-bad", orden: 1 };
  if (eta <= 7) return { texto: "Llega esta semana", clase: "bg-amber-50 text-warn", orden: 2 };
  return { texto: "En camino", clase: "bg-green-50 text-ok", orden: 3 };
}

export default function Procesos({ narrar }: DemoProps) {
  const [hoy, setHoy] = useState<Date | null>(null);
  useEffect(() => setHoy(new Date()), []);

  const [fuente, setFuente] = useState<FuenteId>("correo");
  const [leidos, setLeidos] = useState<Record<string, true>>({});
  const [leyendo, setLeyendo] = useState<string | null>(null);
  const [reglas, setReglas] = useState<Reglas>(REGLAS_INI);
  const [avisos, setAvisos] = useState(false);
  const [quien, setQuien] = useState<"compras" | "almacen">("compras");

  const f = FUENTES.find((x) => x.id === fuente)!;
  const todos = FUENTES.flatMap((x) => x.elementos);
  const archivo = todos
        .filter((e) => leidos[e.id])
        .map((e) => {
          const eta = llegada(e, reglas);
          return { ...e, eta, est: estado(eta) };
        })
        .sort((a, b) => a.est.orden - b.est.orden || (a.eta ?? 0) - (b.eta ?? 0));
  const pendientes = f.elementos.filter((e) => !leidos[e.id]);
  const excepciones = archivo.filter((r) => r.est.orden <= 1);
  const semana = archivo.filter((r) => r.est.orden === 2);

  function procesar(ids: string[]) {
    if (!ids.length || leyendo) return;
    setLeyendo(ids[0]);
    setAvisos(false);
    setTimeout(() => {
      setLeidos((l) => ({ ...l, ...Object.fromEntries(ids.map((id) => [id, true as const])) }));
      setLeyendo(null);
      const nuevos = todos.filter((e) => ids.includes(e.id));
      const sinFecha = nuevos.filter((e) => e.embarque === null);
      narrar(
        `${f.nombre}: se leyeron ${nuevos.length} documento${nuevos.length > 1 ? "s" : ""} y pasaron solos al archivo de arribos con su llegada tentativa.` +
          (sinFecha.length ? ` ${sinFecha.map((e) => e.documento).join(", ")} no trae fecha de embarque: queda marcado para que Compras lo revise.` : " Nadie capturó nada."),
      );
    }, 900);
  }

  function cambiarRegla(k: keyof Reglas, v: number) {
    setReglas((r) => ({ ...r, [k]: v }));
    setAvisos(false);
    const nombres: Record<keyof Reglas, string> = { nacional: "tránsito nacional", usa: "tránsito desde Estados Unidos", china: "tránsito desde China", aduana: "días de aduana", colchon: "días de colchón" };
    narrar(`Cambiaste ${nombres[k]} a ${v} días. Todas las fechas tentativas se recalcularon. Estas reglas se ajustan a cómo trabaja tu empresa.`);
  }

  function enviarAvisos() {
    setAvisos(true);
    narrar(`Avisos listos: Compras recibe el archivo completo con montos y ${excepciones.length} pendiente${excepciones.length === 1 ? "" : "s"} por revisar; Almacén recibe solo lo que llega y cuándo, para preparar espacio y gente. Sale solo cada mañana.`);
  }

  function reiniciar() {
    setLeidos({});
    setReglas(REGLAS_INI);
    setAvisos(false);
    setFuente("correo");
    narrar("Demo reiniciado: las tres fuentes vuelven a tener documentos sin leer.");
  }

  const totalLeidos = Object.keys(leidos).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {/* Paso 1: fuentes */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-3xl border border-line bg-white p-3 sm:p-4">
        <Paso n={1} titulo="De dónde sale la información" sub="El sistema revisa estas fuentes solo, varias veces al día." />
        <div className="grid grid-cols-3 gap-2" role="tablist">
          {FUENTES.map((x) => {
            const sinLeer = x.elementos.filter((e) => !leidos[e.id]).length;
            return (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={x.id === fuente}
                onClick={() => {
                  setFuente(x.id);
                  narrar(x.quePasa);
                }}
                className={`rounded-2xl border p-2 text-center transition ${x.id === fuente ? "border-solar bg-peach" : "border-line bg-white"}`}
              >
                <span className="block text-2xl" aria-hidden>{x.icono}</span>
                <span className="block text-[12px] font-bold leading-tight sm:text-sm">{x.nombre}</span>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${sinLeer ? "bg-solar text-white" : "bg-green-50 text-ok"}`}>
                  {sinLeer ? `${sinLeer} sin leer` : "al día ✓"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-2xl bg-[#faf8f5] p-2.5">
          <p className="text-xs text-muted">{f.quePasa}</p>
          {f.elementos.map((e) => {
            const ok = !!leidos[e.id];
            return (
              <div key={e.id} className={`flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2.5 ${ok ? "border-green-200" : "border-line"}`}>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${ok ? "text-muted" : "font-bold text-ink"}`}>{e.titulo}</p>
                  <p className="truncate text-[11px] text-muted">{e.detalle}</p>
                  {ok && (
                    <p className="mt-1 text-[11px] text-ok">
                      ✓ Leído: {e.piezas} pzas · {pesos(e.monto)} · {e.embarque === null ? <b className="text-bad">sin fecha de embarque</b> : `embarque ${fecha(hoy, e.embarque)}`}
                    </p>
                  )}
                </div>
                {!ok && (
                  <button type="button" onClick={() => procesar([e.id])} disabled={!!leyendo} className="rounded-full border border-solar px-3 py-1.5 text-xs font-bold text-solar disabled:opacity-50">
                    {leyendo === e.id ? "Leyendo…" : "Leer"}
                  </button>
                )}
              </div>
            );
          })}
          {pendientes.length > 1 && (
            <button type="button" onClick={() => procesar(pendientes.map((e) => e.id))} disabled={!!leyendo} className="btn btn-pri w-full justify-center disabled:opacity-50">
              {leyendo ? "Leyendo documentos…" : `Leer los ${pendientes.length} de ${f.nombre.toLowerCase()}`}
            </button>
          )}
        </div>
      </section>

      {/* Paso 2: reglas */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-3xl border border-line bg-white p-3 sm:p-4">
        <Paso n={2} titulo="Las reglas de tu empresa" sub="Con esto se calcula la llegada tentativa. Muévelas y mira cómo cambian las fechas." />
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Regla etiqueta="Tránsito nacional" valor={reglas.nacional} max={10} on={(v) => cambiarRegla("nacional", v)} />
          <Regla etiqueta="Tránsito desde EUA" valor={reglas.usa} max={20} on={(v) => cambiarRegla("usa", v)} />
          <Regla etiqueta="Tránsito desde China" valor={reglas.china} max={60} on={(v) => cambiarRegla("china", v)} />
          <Regla etiqueta="Aduana (importación)" valor={reglas.aduana} max={10} on={(v) => cambiarRegla("aduana", v)} />
          <Regla etiqueta="Colchón de seguridad" valor={reglas.colchon} max={5} on={(v) => cambiarRegla("colchon", v)} />
        </div>
        <p className="rounded-xl bg-peach px-3 py-2 text-[12px] text-ink">
          Llegada tentativa = fecha de embarque + días de tránsito + aduana (si es importado) + colchón.
        </p>
      </section>

      {/* Paso 3: archivo */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-3xl border border-line bg-white p-3 sm:p-4">
        <Paso n={3} titulo="Archivo de arribos" sub="Se llena solo y se ordena: primero lo que hay que revisar." />
        {archivo.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
            Todavía está vacío. Lee algún documento en el paso 1.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-[12px] font-bold">
              <span className="rounded-full bg-[#f4f4f4] px-3 py-1">{archivo.length} en el archivo</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-warn">{semana.length} llegan esta semana</span>
              <span className="rounded-full bg-red-50 px-3 py-1 text-bad">{excepciones.length} por revisar</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[620px] text-left text-[12.5px]">
                <thead className="bg-[#faf8f5] text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="p-2">Fuente</th>
                    <th className="p-2">Proveedor · documento</th>
                    <th className="p-2">Producto</th>
                    <th className="p-2 text-right">Piezas</th>
                    <th className="p-2">Origen</th>
                    <th className="p-2">Embarque</th>
                    <th className="p-2">Llegada tentativa</th>
                    <th className="p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {archivo.map((r) => (
                    <tr key={r.id} className="border-t border-line align-top">
                      <td className="p-2 text-lg" title={FUENTES.find((x) => x.id === r.fuente)?.nombre}>{FUENTES.find((x) => x.id === r.fuente)?.icono}</td>
                      <td className="p-2"><b>{r.proveedor}</b><br /><span className="text-muted">{r.documento}</span></td>
                      <td className="p-2">{r.producto}</td>
                      <td className="p-2 text-right font-bold">{r.piezas}</td>
                      <td className="p-2 text-muted">{ORIGEN_TXT[r.origen]}</td>
                      <td className="p-2">{r.embarque === null ? <span className="text-bad">—</span> : fecha(hoy, r.embarque)}</td>
                      <td className="p-2 font-bold">{r.eta === null ? "—" : fecha(hoy, r.eta)}</td>
                      <td className="p-2"><span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${r.est.clase}`}>{r.est.texto}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted">Desliza la tabla a los lados en el celular. Este archivo vive en tu propia hoja de cálculo.</p>
          </>
        )}
      </section>

      {/* Paso 4: avisos */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-3xl border border-line bg-white p-3 sm:p-4">
        <Paso n={4} titulo="Avisos a cada quien" sub="Compras ve todo con montos; Almacén solo lo que llega y cuándo." />
        {!avisos ? (
          <button type="button" onClick={enviarAvisos} disabled={archivo.length === 0} className="btn btn-pri w-full justify-center disabled:opacity-40">
            {archivo.length ? "Generar avisos de hoy" : "Primero lee algún documento"}
          </button>
        ) : (
          <>
            <div className="flex gap-2" role="tablist">
              {(["compras", "almacen"] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  role="tab"
                  aria-selected={quien === q}
                  onClick={() => {
                    setQuien(q);
                    narrar(q === "compras" ? "Compras recibe el archivo completo con montos y lo que hay que perseguir con el proveedor." : "Almacén no ve precios: solo qué llega, cuántas piezas y qué día, para tener lugar y gente lista.");
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${quien === q ? "bg-ink text-white" : "border border-line bg-white"}`}
                >
                  {q === "compras" ? "🧾 Compras · Laura" : "📦 Almacén · Jorge"}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-line bg-[#faf8f5] p-3 text-sm">
              <p className="text-[11px] text-muted">
                Para: {quien === "compras" ? "Laura Peña (Compras)" : "Jorge Salas y equipo de Almacén"} · por correo, todos los días a las 7:00
              </p>
              <p className="mt-1 font-bold">{quien === "compras" ? `Arribos de hoy: ${archivo.length} en camino, ${excepciones.length} por revisar` : `Lo que llega a almacén (${semana.length} esta semana)`}</p>
              {quien === "compras" ? (
                <div className="mt-2 grid gap-1.5">
                  {excepciones.length > 0 && (
                    <div className="rounded-xl bg-red-50 p-2 text-[12.5px] text-bad">
                      <b>Revisar hoy:</b>
                      {excepciones.map((r) => (
                        <p key={r.id}>· {r.proveedor} ({r.documento}): {r.eta === null ? "no trae fecha de embarque, pedirla al proveedor" : `debió llegar el ${fecha(hoy, r.eta)}`}</p>
                      ))}
                    </div>
                  )}
                  {archivo.filter((r) => r.est.orden > 1).map((r) => (
                    <p key={r.id} className="flex flex-wrap justify-between gap-x-3 text-[12.5px]">
                      <span>· {r.producto} · {r.piezas} pzas · {r.proveedor}</span>
                      <span className="text-muted">{pesos(r.monto)} · llega {fecha(hoy, r.eta!)}</span>
                    </p>
                  ))}
                  <p className="mt-1 text-[11px] text-muted">📎 archivo-de-arribos.xlsx adjunto</p>
                </div>
              ) : (
                <div className="mt-2 grid gap-1.5">
                  {semana.length === 0 && <p className="text-[12.5px] text-muted">Esta semana no llega nada. Te avisamos en cuanto cambie.</p>}
                  {semana.map((r) => (
                    <p key={r.id} className="rounded-xl bg-white p-2 text-[12.5px]">
                      <b>{fecha(hoy, r.eta!)}</b> · {r.piezas} pzas de {r.producto}
                      <span className="block text-[11px] text-muted">De {r.proveedor} · prepara espacio y gente para descargar</span>
                    </p>
                  ))}
                  {archivo.filter((r) => r.est.orden === 3).length > 0 && (
                    <p className="text-[11px] text-muted">Más adelante: {archivo.filter((r) => r.est.orden === 3).map((r) => `${r.producto} (${fecha(hoy, r.eta!)})`).join(", ")}.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <Implementar narrar={narrar} />

      {totalLeidos > 0 && (
        <button type="button" onClick={reiniciar} className="justify-self-start text-sm font-bold text-muted underline">
          Reiniciar demo
        </button>
      )}
    </div>
  );
}

/* ---------- ¿Cómo se implementa en tu empresa? ---------- */

const OPC_FUENTES = ["Correo con facturas", "Páginas de proveedores", "Plan de producción o surtido", "Mi sistema o ERP", "Archivos de Excel"];
const OPC_DESTINOS = ["Hoja de cálculo compartida", "Correo diario", "Mi sistema o ERP", "Tablero en línea"];
const OPC_QUIEN = ["Compras", "Almacén", "Dirección", "Ventas"];

function Implementar({ narrar }: { narrar: (t: string) => void }) {
  const [fuentes, setFuentes] = useState<string[]>([]);
  const [destinos, setDestinos] = useState<string[]>([]);
  const [quien, setQuien] = useState<string[]>([]);
  const [frec, setFrec] = useState("Cada mañana");
  const listo = fuentes.length > 0 && destinos.length > 0 && quien.length > 0;

  const alternar = (lista: string[], set: (v: string[]) => void, v: string) => set(lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
  const unir = (l: string[]) => (l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} y ${l[l.length - 1]}`).toLowerCase();

  const resumen = listo
    ? `Leer ${unir(fuentes)}; armar el archivo de arribos con las reglas de la empresa; dejarlo en ${unir(destinos)}; avisar a ${unir(quien)} ${frec.toLowerCase()}.`
    : "";

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-3xl border border-solar/40 bg-peach p-3 sm:p-4">
      <Paso n={5} titulo="¿Cómo sería en tu empresa?" sub="Elige lo que aplica y te decimos cómo lo armaríamos." />
      <Chips titulo="¿De dónde sale hoy la información?" opciones={OPC_FUENTES} sel={fuentes} on={(v) => alternar(fuentes, setFuentes, v)} />
      <Chips titulo="¿Dónde lo quieres ver?" opciones={OPC_DESTINOS} sel={destinos} on={(v) => alternar(destinos, setDestinos, v)} />
      <Chips titulo="¿A quién le avisamos?" opciones={OPC_QUIEN} sel={quien} on={(v) => alternar(quien, setQuien, v)} />
      <label className="flex flex-wrap items-center gap-2 text-sm font-bold">
        ¿Cada cuándo?
        <select value={frec} onChange={(e) => setFrec(e.target.value)} className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-normal">
          {["Cada mañana", "Dos veces al día", "Cada hora", "Cada que llegue un documento"].map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      {listo ? (
        <div className="grid gap-2 rounded-2xl bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-solar">Así lo armaríamos</p>
          <p className="text-sm text-ink">{resumen}</p>
          <a
            href={waLink(`Hola, vi el demo de automatización de Solvera Labs. Quiero algo así: ${resumen}`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => narrar("Te abrimos WhatsApp con tu plan ya escrito, para platicarlo con nosotros.")}
            className="btn btn-pri w-full justify-center"
          >
            Quiero esto en mi empresa
          </a>
        </div>
      ) : (
        <p className="text-[12px] text-muted">Elige al menos una opción de cada pregunta.</p>
      )}
    </section>
  );
}

function Chips({ titulo, opciones, sel, on }: { titulo: string; opciones: string[]; sel: string[]; on: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-bold">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {opciones.map((o) => (
          <button key={o} type="button" aria-pressed={sel.includes(o)} onClick={() => on(o)} className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold ${sel.includes(o) ? "border-solar bg-solar text-white" : "border-line bg-white"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Paso({ n, titulo, sub }: { n: number; titulo: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-black text-white">{n}</span>
      <div>
        <p className="font-extrabold leading-tight">{titulo}</p>
        <p className="text-[12.5px] text-muted">{sub}</p>
      </div>
    </div>
  );
}

function Regla({ etiqueta, valor, max, on }: { etiqueta: string; valor: number; max: number; on: (v: number) => void }) {
  return (
    <label className="grid gap-1 text-[12px] font-bold">
      <span className="flex justify-between gap-2">
        {etiqueta}
        <span className="text-solar">{valor} días</span>
      </span>
      <input type="range" min={0} max={max} value={valor} onChange={(e) => on(Number(e.target.value))} className="accent-[#ff6a00]" />
    </label>
  );
}
