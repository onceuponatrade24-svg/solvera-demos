/*
 * Seguimiento de Ventas: convierte las pestañas de ventas (W y KT) en registros
 * para la tabla de llamadas. Nunca incluye pendientes.
 * MDT = ventas de vendedores MDT (archivo "Ventas vendedores MDT").
 */

import { PAQUETES } from "@/data/portafolio";
import { PAGINAS_WEB, SOLUCIONES } from "@/data/soluciones";

export type Origen = "W" | "KT" | "MDT";

export type Registro = {
  id: string;
  origen: Origen;
  anio: number;
  /** Fecha de contacto (anticipo) en formato AAAA-MM-DD; vacío si no se sabe. */
  fechaContacto: string;
  numVenta: string;
  medio: string;
  cliente: string;
  celular: string;
  ciudad: string;
  /** Cuántas compras tiene este teléfono en todo el listado (1 = una sola). */
  compras: number;
  /** De qué hojas salieron esas compras. */
  origenes: Origen[];
};

const PESTANAS: { nombre: string; origen: Origen }[] = [
  { nombre: "VENTAS EDGAR WE", origen: "W" },
  { nombre: "VENTAS EDGAR KT", origen: "KT" },
  { nombre: "VENTAS MDT", origen: "MDT" },
];
export const ANIOS = [2025, 2026] as const;

const txt = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

/** Año de "01/ene/2026", "29/04/2026" o "7/jun/2025". */
function anioDe(fecha: string): number | null {
  const m = txt(fecha).match(/\/(\d{4})\b/);
  return m ? +m[1] : null;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "01/ene/2026", "29/04/2026" → "2026-01-01", "2026-04-29". */
function fechaDe(fecha: string): string {
  const m = txt(fecha).toLowerCase().match(/^(\d{1,2})\/([a-z]{3}|\d{1,2})\/(\d{4})/);
  if (!m) return "";
  const mes = /\d/.test(m[2]) ? +m[2] : MESES.indexOf(m[2]) + 1;
  if (mes < 1 || mes > 12) return "";
  return `${m[3]}-${String(mes).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** "2026-04-29" → "29/04/2026". */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return iso ? `${d}/${m}/${a}` : "";
}

export function armarRegistros(hojas: Record<string, string[][]>): Registro[] {
  const salida: Registro[] = [];
  for (const { nombre, origen } of PESTANAS) {
    const celdas = hojas[nombre] ?? [];
    const iEnc = celdas.findIndex((f) => f.some((c) => txt(c) === "Cliente") && f.some((c) => txt(c) === "Ciudad"));
    if (iEnc < 0) continue;
    const enc = celdas[iEnc].map((c) => txt(c).toLowerCase());
    const col = (n: string) => enc.findIndex((c) => c.startsWith(n));
    const c = {
      num: col("num"),
      medio: col("medio"),
      anticipo: col("fecha anticipo"),
      entrega: col("fecha entrega"),
      cliente: col("cliente"),
      cel: col("celular"),
      ciudad: col("ciudad"),
    };
    const v = (f: string[], i: number) => (i >= 0 ? txt(f[i]) : "");
    let anioAnterior: number | null = null;
    let fechaAnterior = "";

    celdas.slice(iEnc + 1).forEach((f, i) => {
      const anio = anioDe(v(f, c.anticipo)) ?? anioDe(v(f, c.entrega)) ?? anioAnterior;
      if (anio) anioAnterior = anio;
      let fechaContacto = fechaDe(v(f, c.anticipo)) || fechaDe(v(f, c.entrega));
      if (fechaContacto && +fechaContacto.slice(0, 4) !== anio) fechaContacto = "";
      if (fechaContacto) fechaAnterior = fechaContacto;
      else if (fechaAnterior.startsWith(String(anio))) fechaContacto = fechaAnterior;
      const cliente = v(f, c.cliente);
      // Solo registros con cliente; fuera los pendientes.
      if (!cliente || !anio) return;
      if (/pendiente/i.test(v(f, c.entrega))) return;
      if (!(ANIOS as readonly number[]).includes(anio)) return;
      salida.push({
        id: `${origen}-${i}-${v(f, c.num)}-${cliente}`.toLowerCase().replace(/\s+/g, "-"),
        origen,
        anio,
        fechaContacto,
        numVenta: v(f, c.num),
        medio: v(f, c.medio),
        cliente,
        celular: v(f, c.cel),
        ciudad: v(f, c.ciudad),
        compras: 1,
        origenes: [origen],
      });
    });
  }
  // Por año y fecha de contacto (las de igual fecha conservan su orden original).
  const ordenadas = salida
    .map((r, i) => ({ r, i }))
    .sort((a, b) => a.r.anio - b.r.anio || (a.r.fechaContacto || "9").localeCompare(b.r.fechaContacto || "9") || a.i - b.i)
    .map((x) => x.r);
  return sinRepetidos(ordenadas);
}

/** Últimos 10 dígitos del teléfono; vacío si no hay un número completo. */
const telClave = (t: string) => {
  const d = t.replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
};

/**
 * Un solo renglón por teléfono: se queda la compra más reciente (año y fecha de
 * contacto) y se anota cuántas compras hubo. Sin teléfono no se junta nada.
 */
function sinRepetidos(lista: Registro[]): Registro[] {
  const grupos = new Map<string, Registro[]>();
  for (const r of lista) {
    const k = telClave(r.celular);
    if (!k) continue;
    const g = grupos.get(k);
    if (g) g.push(r);
    else grupos.set(k, [r]);
  }
  const quitar = new Set<Registro>();
  for (const g of grupos.values()) {
    if (g.length < 2) continue;
    const ultima = g[g.length - 1];
    if (ultima.cliente.replace(/[^\p{L}]/gu, "").length < 3) {
      ultima.cliente = g.reduce((a, r) => (r.cliente.length > a.length ? r.cliente : a), ultima.cliente);
    }
    if (!ultima.ciudad) ultima.ciudad = g.find((r) => r.ciudad)?.ciudad ?? "";
    ultima.compras = g.length;
    ultima.origenes = (["W", "KT", "MDT"] as Origen[]).filter((o) => g.some((r) => r.origen === o));
    for (const r of g) if (r !== ultima) quitar.add(r);
  }
  return lista.filter((r) => !quitar.has(r));
}

/* ---------- llamadas (se guardan en el navegador) ---------- */

export type Estatus = "" | "seguimiento" | "no-seguimiento";
export type Llamada = { fecha: string; estatus: Estatus; producto?: string; nivelWeb?: string; comentario?: string; videollamada?: string };

/** Soluciones de Solvera que se le pueden ofrecer al cliente (mismas que en el dashboard). */
export const PRODUCTOS: string[] = [PAGINAS_WEB.nombre, ...SOLUCIONES.map((s) => s.nombre), "Otro"];
export const PRODUCTO_WEB = PAGINAS_WEB.nombre;

/** Niveles de página web (salen de src/data/portafolio.ts). */
export const NIVELES_WEB = PAQUETES.map((p) => ({ nombre: p.nombre, precio: p.precio, nota: p.notaPrecio }));

/**
 * Precio que se llena solo según el producto. Sale de src/data/soluciones.ts:
 * para cambiar un precio, se cambia ahí y se actualiza aquí y en el dashboard.
 */
export function precioDe(producto?: string, nivelWeb?: string): { precio: string; nota: string } | null {
  if (!producto || !PRODUCTOS.includes(producto)) return null;
  if (producto === PRODUCTO_WEB) {
    const n = NIVELES_WEB.find((x) => x.nombre === nivelWeb);
    return n ? { precio: n.precio, nota: n.nota } : null;
  }
  const s = SOLUCIONES.find((x) => x.nombre === producto);
  if (!s) return null;
  // La nota trae extras ("listo en 2 a 3 días"); se queda con la parte del cobro.
  const nota = s.notaPrecio.split(" · ").filter((t) => /\$|pago|mensualidad|implementación|desde/i.test(t)).join(" · ");
  return { precio: s.precio, nota };
}

/**
 * Calendario compartido del equipo: si se pone un correo aquí, se agrega como invitado
 * a cada videollamada que agende Santiago. Vacío = solo en el calendario de quien agenda.
 */
export const CALENDARIO_EQUIPO = "solveralabs.ai@gmail.com";

const LLAVE = "santiago-llamadas-v1";

export function leerLlamadas(): Record<string, Llamada> {
  try {
    const v = JSON.parse(localStorage.getItem(LLAVE) ?? "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function guardarLlamadas(l: Record<string, Llamada>) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(l));
    return true;
  } catch {
    return false;
  }
}
