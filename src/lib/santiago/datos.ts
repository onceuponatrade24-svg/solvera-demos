/*
 * Tablero de clientes de Santiago.
 * Convierte las pestañas de la hoja "VENTAS EDGAR" (tal como se ven en pantalla)
 * en una lista de clientes con su historial, pendientes y seguimiento.
 * No guarda datos: todo se lee en vivo desde la hoja.
 */

export const HOJAS_VENTAS = ["VENTAS EDGAR KT", "VENTAS EDGAR WE"] as const;
export const HOJA_PENDIENTES = "PENDIENTES";
export const HOJA_SEGUIMIENTO = "SEGUIMIENTO SANTIAGO";

/** Días sin comprar para que un cliente aparezca en "Recontactar". */
export const DIAS_PARA_RECONTACTAR = 60;
/** Si Santiago ya lo contactó en estos días, no se vuelve a sugerir. */
export const DIAS_DESCANSO_TRAS_CONTACTO = 14;

export type EstadoPieza = "entregado" | "por-entregar" | "pendiente" | "cancelado";

export type Pieza = {
  hoja: string;
  numVenta: string;
  anticipo: string | null; // yyyy-mm-dd
  entrega: string | null; // yyyy-mm-dd
  entregaTexto: string;
  estado: EstadoPieza;
  marca: string;
  modelo: string;
  comentario: string;
};

export type Pendiente = {
  fila: string;
  ciudad: string;
  cliente: string;
  situacion: string;
  modelos: string[];
  fecha: string;
  notas: string;
  clienteId: string | null;
};

export type Seguimiento = {
  fecha: string; // como quedó escrito (yyyy-mm-dd HH:mm)
  resultado: string;
  nota: string;
  proximo: string | null; // yyyy-mm-dd
};

export type Cliente = {
  id: string;
  nombre: string;
  telefonos: string[];
  ciudad: string;
  piezas: Pieza[]; // más reciente primero
  totalPiezas: number; // sin cancelados
  pedidos: number; // ventas distintas sin cancelar
  cancelados: number;
  primeraCompra: string | null;
  ultimaCompra: string | null;
  diasSinComprar: number | null;
  marcas: { marca: string; veces: number }[];
  pendientes: Pendiente[];
  seguimiento: Seguimiento[]; // más reciente primero
  proximoContacto: string | null;
  ultimoContacto: string | null; // yyyy-mm-dd
};

export type Tablero = {
  hoy: string;
  clientes: Cliente[];
  pendientes: Pendiente[];
  resumen: {
    clientes: number;
    piezas: number;
    pendientes: number;
    recontactar: number;
    hoyToca: number;
  };
};

type Celdas = string[][];

/* ---------- utilidades ---------- */

const MESES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
};

const txt = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

/** "01/ene/2026", "29/04/2026", "7/jun/2025", "2026-12-01" → "2026-01-01" */
export function leerFecha(valor: string): string | null {
  const v = txt(valor).toLowerCase();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = v.match(/^(\d{1,2})\/([a-z]+|\d{1,2})\.?\/(\d{4})/);
  if (!m) return null;
  const mes = /^\d+$/.test(m[2]) ? +m[2] : MESES[m[2]];
  if (!mes || mes > 12) return null;
  return iso(+m[3], mes, +m[1]);
}

function iso(a: number, m: number, d: number) {
  if (d < 1 || d > 31) return null;
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function diasEntre(desde: string, hasta: string) {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000);
}

/** Fecha de hoy en la Ciudad de México, yyyy-mm-dd. */
export function hoyMx(ahora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(ahora);
}

/** Nombre para comparar: sin acentos, sin mayúsculas ni espacios de más. */
export function claveNombre(nombre: string) {
  return txt(nombre)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/** Solo dígitos, últimos 10 (para comparar celulares). */
function claveTel(tel: string) {
  const d = tel.replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}

/** Número para wa.me: 10 dígitos → México (+52); con lada de país se respeta. */
export function telWhatsApp(tel: string) {
  const d = tel.replace(/\D/g, "");
  if (d.length === 10) return "52" + d;
  return d;
}

/* ---------- lectura de las pestañas ---------- */

type Fila = { hoja: string; datos: Record<string, string> };

function leerVentas(hoja: string, celdas: Celdas) {
  const iEnc = celdas.findIndex((f) => f.some((c) => txt(c) === "Cliente") && f.some((c) => txt(c) === "Marca"));
  if (iEnc < 0) return [] as { pieza: Pieza; nombre: string; tel: string; ciudad: string }[];
  const enc = celdas[iEnc].map(txt);
  const col = (nombre: string) => enc.findIndex((c) => c.toLowerCase().startsWith(nombre.toLowerCase()));
  const c = {
    num: col("Num"), medio: col("Medio"), anticipo: col("Fecha Anticipo"), entrega: col("Fecha Entrega"),
    cliente: col("Cliente"), cel: col("Celular"), ciudad: col("Ciudad"), marca: col("Marca"),
    modelo: col("Modelo"), coment: col("Comentarios"),
  };
  const v = (f: string[], i: number) => (i >= 0 ? txt(f[i]) : "");

  const salida: { pieza: Pieza; nombre: string; tel: string; ciudad: string }[] = [];
  let anterior: { nombre: string; tel: string; ciudad: string; anticipo: string | null; num: string } | null = null;

  for (const f of celdas.slice(iEnc + 1)) {
    const marca = v(f, c.marca);
    const modelo = v(f, c.modelo);
    if (!marca && !modelo) {
      // Renglón de mes ("Febrero") o vacío.
      continue;
    }
    let nombre = v(f, c.cliente);
    let tel = v(f, c.cel);
    let ciudad = v(f, c.ciudad);
    let anticipo = leerFecha(v(f, c.anticipo));
    let num = v(f, c.num);
    if (!nombre) {
      // Renglón sin cliente: es otra pieza del pedido de arriba (si no trae su propio medio de venta).
      if (!anterior || v(f, c.medio)) continue;
      nombre = anterior.nombre;
      tel = anterior.tel;
      ciudad = ciudad || anterior.ciudad;
      anticipo = anticipo ?? anterior.anticipo;
      num = anterior.num;
    }
    const entregaTexto = v(f, c.entrega);
    const entrega = leerFecha(entregaTexto);
    const up = entregaTexto.toUpperCase();
    const estado: EstadoPieza = up.includes("CANCEL")
      ? "cancelado"
      : entrega
        ? "entregado"
        : "pendiente";

    salida.push({
      nombre,
      tel,
      ciudad,
      pieza: {
        hoja,
        numVenta: num,
        anticipo,
        entrega,
        entregaTexto,
        estado,
        marca,
        modelo,
        comentario: v(f, c.coment),
      },
    });
    anterior = { nombre, tel, ciudad, anticipo, num };
  }
  return salida;
}

function leerPendientes(celdas: Celdas): Pendiente[] {
  const iEnc = celdas.findIndex((f) => f.some((c) => txt(c) === "Cliente") && f.some((c) => txt(c).startsWith("Situaci")));
  if (iEnc < 0) return [];
  const enc = celdas[iEnc].map((c) => txt(c).toLowerCase());
  const col = (n: string) => enc.findIndex((c) => c.startsWith(n));
  const c = { fila: col("fila"), ciudad: col("ciudad"), cliente: col("cliente"), sit: col("situaci"), modelo: col("modelo"), fecha: col("fecha"), notas: col("notas") };
  const v = (f: string[], i: number) => (i >= 0 ? txt(f[i]) : "");
  const lista: Pendiente[] = [];
  for (const f of celdas.slice(iEnc + 1)) {
    const cliente = v(f, c.cliente);
    const modelo = v(f, c.modelo);
    if (!cliente) {
      if (modelo && lista.length) lista[lista.length - 1].modelos.push(modelo);
      continue;
    }
    lista.push({
      fila: v(f, c.fila),
      ciudad: v(f, c.ciudad),
      cliente,
      situacion: v(f, c.sit),
      modelos: modelo ? [modelo] : [],
      fecha: v(f, c.fecha),
      notas: v(f, c.notas),
      clienteId: null,
    });
  }
  return lista;
}

function leerSeguimiento(celdas: Celdas) {
  // Columnas: Fecha | Cliente | Celular | Resultado | Nota | Próximo contacto | Registró
  const porNombre = new Map<string, Seguimiento[]>();
  for (const f of celdas.slice(1)) {
    const cliente = txt(f[1]);
    if (!cliente) continue;
    const s: Seguimiento = {
      fecha: txt(f[0]),
      resultado: txt(f[3]),
      nota: txt(f[4]),
      proximo: leerFecha(txt(f[5])),
    };
    const k = claveNombre(cliente);
    porNombre.set(k, [...(porNombre.get(k) ?? []), s]);
  }
  return porNombre;
}

/* ---------- armado del tablero ---------- */

export function armarTablero(hojas: Record<string, Celdas>, hoy = hoyMx()): Tablero {
  const filas = HOJAS_VENTAS.flatMap((h) => leerVentas(h, hojas[h] ?? []));

  // Agrupar: mismo cliente si coincide el nombre o el celular.
  const padre = new Map<string, string>();
  const raiz = (x: string): string => {
    const p = padre.get(x) ?? x;
    if (p === x) return x;
    const r = raiz(p);
    padre.set(x, r);
    return r;
  };
  const unir = (a: string, b: string) => {
    const ra = raiz(a), rb = raiz(b);
    if (ra !== rb) padre.set(ra, rb);
  };
  for (const f of filas) {
    const n = "n:" + claveNombre(f.nombre);
    padre.set(n, padre.get(n) ?? n);
    const t = claveTel(f.tel);
    if (t) {
      padre.set("t:" + t, padre.get("t:" + t) ?? "t:" + t);
      unir(n, "t:" + t);
    }
  }

  const grupos = new Map<string, typeof filas>();
  for (const f of filas) {
    const r = raiz("n:" + claveNombre(f.nombre));
    grupos.set(r, [...(grupos.get(r) ?? []), f]);
  }

  const seguimiento = leerSeguimiento(hojas[HOJA_SEGUIMIENTO] ?? []);
  const pendientes = leerPendientes(hojas[HOJA_PENDIENTES] ?? []);

  const clientes: Cliente[] = [];
  const porNombre = new Map<string, Cliente>();
  for (const [, lista] of grupos) {
    const orden = [...lista].sort((a, b) => (b.pieza.anticipo ?? "").localeCompare(a.pieza.anticipo ?? ""));
    const reciente = orden[0];
    const piezas = orden.map((f) => ({
      ...f.pieza,
      estado: f.pieza.estado === "entregado" && f.pieza.entrega && f.pieza.entrega > hoy ? ("por-entregar" as const) : f.pieza.estado,
    }));
    const validas = piezas.filter((p) => p.estado !== "cancelado");
    const fechas = validas.map((p) => p.anticipo).filter(Boolean) as string[];
    const ultima = fechas.length ? fechas.reduce((a, b) => (a > b ? a : b)) : null;
    const primera = fechas.length ? fechas.reduce((a, b) => (a < b ? a : b)) : null;

    const conteo = new Map<string, number>();
    for (const p of validas) conteo.set(p.marca, (conteo.get(p.marca) ?? 0) + 1);

    const telefonos = [...new Set(orden.map((f) => f.tel).filter(Boolean))];
    const nombres = new Set(orden.map((f) => claveNombre(f.nombre)));
    const seg = [...nombres].flatMap((n) => seguimiento.get(n) ?? []).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const id = claveNombre(reciente.nombre).replace(/ /g, "-") + "-" + (claveTel(telefonos[0] ?? "") || "s");

    const cliente: Cliente = {
      id,
      nombre: reciente.nombre,
      telefonos,
      ciudad: orden.find((f) => f.ciudad)?.ciudad ?? "",
      piezas,
      totalPiezas: validas.length,
      pedidos: new Set(validas.map((p) => `${p.hoja}|${p.anticipo}|${p.numVenta}`)).size,
      cancelados: piezas.length - validas.length,
      primeraCompra: primera,
      ultimaCompra: ultima,
      diasSinComprar: ultima ? diasEntre(ultima, hoy) : null,
      marcas: [...conteo].map(([marca, veces]) => ({ marca, veces })).sort((a, b) => b.veces - a.veces),
      pendientes: [],
      seguimiento: seg,
      proximoContacto: seg.find((s) => s.proximo)?.proximo ?? null,
      ultimoContacto: seg[0] ? leerFecha(seg[0].fecha) : null,
    };
    clientes.push(cliente);
    for (const n of nombres) porNombre.set(n, cliente);
  }

  // Ligar pendientes con su cliente.
  for (const p of pendientes) {
    const c = porNombre.get(claveNombre(p.cliente));
    if (c) {
      p.clienteId = c.id;
      c.pendientes.push(p);
    }
  }

  clientes.sort((a, b) => (b.ultimaCompra ?? "").localeCompare(a.ultimaCompra ?? ""));

  return {
    hoy,
    clientes,
    pendientes,
    resumen: {
      clientes: clientes.length,
      piezas: clientes.reduce((s, c) => s + c.totalPiezas, 0),
      pendientes: pendientes.length,
      recontactar: clientes.filter((c) => tocaRecontactar(c, hoy)).length,
      hoyToca: clientes.filter((c) => c.proximoContacto && c.proximoContacto <= hoy).length,
    },
  };
}

export function tocaRecontactar(c: Cliente, hoy: string) {
  if (c.totalPiezas === 0 || c.diasSinComprar === null) return false;
  if (c.diasSinComprar < DIAS_PARA_RECONTACTAR) return false;
  if (c.pendientes.length || c.piezas.some((p) => p.estado === "pendiente" || p.estado === "por-entregar")) return false;
  if (c.ultimoContacto) {
    const ultimo = c.seguimiento[0]?.resultado ?? "";
    // Si ya le vendió, o dijo que no, se le deja descansar más tiempo.
    const descanso = /vendi/i.test(ultimo) ? DIAS_PARA_RECONTACTAR : /no le interesa/i.test(ultimo) ? 90 : DIAS_DESCANSO_TRAS_CONTACTO;
    if (diasEntre(c.ultimoContacto, hoy) < descanso) return false;
  }
  if (c.proximoContacto && c.proximoContacto > hoy) return false;
  return true;
}
