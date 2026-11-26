/*
 * Seguimiento de Ventas: convierte las pestañas de ventas (W y KT) en registros
 * para la tabla de llamadas. Nunca incluye pendientes.
 */

import { PAGINAS_WEB, SOLUCIONES } from "@/data/soluciones";

export type Origen = "W" | "KT";

export type Registro = {
  id: string;
  origen: Origen;
  anio: number;
  numVenta: string;
  medio: string;
  cliente: string;
  celular: string;
  ciudad: string;
};

const PESTANAS: { nombre: string; origen: Origen }[] = [
  { nombre: "VENTAS EDGAR WE", origen: "W" },
  { nombre: "VENTAS EDGAR KT", origen: "KT" },
];
export const ANIOS = [2025, 2026] as const;

const txt = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

/** Año de "01/ene/2026", "29/04/2026" o "7/jun/2025". */
function anioDe(fecha: string): number | null {
  const m = txt(fecha).match(/\/(\d{4})\b/);
  return m ? +m[1] : null;
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

    celdas.slice(iEnc + 1).forEach((f, i) => {
      const anio = anioDe(v(f, c.anticipo)) ?? anioDe(v(f, c.entrega)) ?? anioAnterior;
      if (anio) anioAnterior = anio;
      const cliente = v(f, c.cliente);
      // Solo registros con cliente; fuera los pendientes.
      if (!cliente || !anio) return;
      if (/pendiente/i.test(v(f, c.entrega))) return;
      if (!(ANIOS as readonly number[]).includes(anio)) return;
      salida.push({
        id: `${origen}-${i}-${v(f, c.num)}-${cliente}`.toLowerCase().replace(/\s+/g, "-"),
        origen,
        anio,
        numVenta: v(f, c.num),
        medio: v(f, c.medio),
        cliente,
        celular: v(f, c.cel),
        ciudad: v(f, c.ciudad),
      });
    });
  }
  return salida;
}

/* ---------- llamadas (se guardan en el navegador) ---------- */

export type Estatus = "" | "seguimiento" | "no-seguimiento";
export type Llamada = { fecha: string; estatus: Estatus; producto?: string; comentario?: string; videollamada?: string };

/** Soluciones de Solvera que se le pueden ofrecer al cliente (mismas que en el dashboard). */
export const PRODUCTOS: string[] = [PAGINAS_WEB.nombre, ...SOLUCIONES.map((s) => s.nombre), "Otro"];

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
