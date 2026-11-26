/*
 * Utilidades de servidor para Seguimiento de Ventas: revisar el código de acceso
 * (con límite de intentos) y guardar las anotaciones en la base compartida (Upstash Redis).
 */

const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS = 5;
const fallos = new Map<string, number[]>();

export function acceso() {
  const [codigo, llave] = (process.env.SANTIAGO_ACCESO ?? "").split("::");
  return codigo && llave ? { codigo: codigo.trim(), llave: llave.trim() } : null;
}

export type Revision = { ok: true } | { ok: false; status: number; error: string };

/** Revisa el código. Cuenta los fallos por IP y bloquea 15 min después de 5. */
export async function revisarCodigo(req: Request, codigo: string): Promise<Revision> {
  const a = acceso();
  if (!a) return { ok: false, status: 503, error: "Falta activar el acceso en Vercel." };
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sin-ip";
  const ahora = Date.now();
  const recientes = (fallos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAX_FALLOS) return { ok: false, status: 429, error: "Demasiados intentos. Espera 15 minutos." };
  if (codigo.trim() !== a.codigo) {
    recientes.push(ahora);
    fallos.set(ip, recientes);
    if (fallos.size > 5000) fallos.clear();
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false, status: 401, error: "Código incorrecto." };
  }
  fallos.delete(ip);
  return { ok: true };
}

/* ---------- base compartida (Upstash Redis por REST) ---------- */

const CLAVE_HASH = "santiago:llamadas";

function redis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export function hayBase() {
  return redis() !== null;
}

async function comando(args: string[]) {
  const r = redis();
  if (!r) throw new Error("sin base");
  const res = await fetch(r.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${r.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const d = await res.json();
  if (!res.ok || d.error) throw new Error(d.error || `Redis ${res.status}`);
  return d.result;
}

export async function leerTodas(): Promise<Record<string, unknown>> {
  const plano: string[] = (await comando(["HGETALL", CLAVE_HASH])) ?? [];
  const salida: Record<string, unknown> = {};
  for (let i = 0; i + 1 < plano.length; i += 2) {
    try {
      salida[plano[i]] = JSON.parse(plano[i + 1]);
    } catch {}
  }
  return salida;
}

export async function guardarVarias(cambios: Record<string, unknown>) {
  const args = ["HSET", CLAVE_HASH];
  for (const [id, valor] of Object.entries(cambios)) args.push(id, JSON.stringify(valor));
  if (args.length > 2) await comando(args);
}
