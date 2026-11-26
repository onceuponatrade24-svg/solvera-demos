/*
 * Seguimiento que anota Santiago. Se guarda en su propio celular (localStorage),
 * con opción de descargar y cargar un respaldo.
 */
export type Marca = {
  fecha: string; // yyyy-mm-dd HH:mm
  cliente: string;
  celular: string;
  resultado: string;
  nota: string;
  proximo: string; // yyyy-mm-dd o ""
};

const LLAVE = "santiago-seguimiento-v1";

export function leerMarcas(): Marca[] {
  try {
    const v = JSON.parse(localStorage.getItem(LLAVE) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function guardarMarcas(m: Marca[]) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(m));
    return true;
  } catch {
    return false;
  }
}

/** Las marcas en el formato de la pestaña de seguimiento que entiende armarTablero. */
export function marcasComoHoja(m: Marca[]): string[][] {
  return [
    ["Fecha", "Cliente", "Celular", "Resultado", "Nota", "Próximo contacto"],
    ...m.map((x) => [x.fecha, x.cliente, x.celular, x.resultado, x.nota, x.proximo]),
  ];
}

export function ahoraMx() {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}`;
}
