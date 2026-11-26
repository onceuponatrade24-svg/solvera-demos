import { NextResponse } from "next/server";
import { guardarVarias, hayBase, leerTodas, revisarCodigo } from "@/lib/santiago/servidor";

/*
 * Anotaciones compartidas de Seguimiento de Ventas.
 * GET  → todas las anotaciones.     Encabezado x-codigo con el código de acceso.
 * POST → { cambios: { [id]: anotación } } guarda una o varias filas.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sinBase = () =>
  NextResponse.json({ ok: false, error: "Todavía no hay base compartida." }, { status: 503 });

export async function GET(req: Request) {
  const rev = await revisarCodigo(req, req.headers.get("x-codigo") ?? "");
  if (!rev.ok) return NextResponse.json({ ok: false, error: rev.error }, { status: rev.status });
  if (!hayBase()) return sinBase();
  try {
    return NextResponse.json({ ok: true, llamadas: await leerTodas() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "No pude leer la base compartida." }, { status: 502 });
  }
}

const limpiar = (v: unknown, max: number) => String(v ?? "").slice(0, max);

export async function POST(req: Request) {
  const rev = await revisarCodigo(req, req.headers.get("x-codigo") ?? "");
  if (!rev.ok) return NextResponse.json({ ok: false, error: rev.error }, { status: rev.status });
  if (!hayBase()) return sinBase();

  let cambios: Record<string, Record<string, unknown>> = {};
  try {
    cambios = (await req.json())?.cambios ?? {};
  } catch {}
  const entradas = Object.entries(cambios).slice(0, 1000);
  const limpio: Record<string, unknown> = {};
  for (const [id, l] of entradas) {
    if (!id || id.length > 200 || typeof l !== "object" || !l) continue;
    limpio[id] = {
      fecha: limpiar(l.fecha, 10),
      estatus: ["seguimiento", "no-seguimiento"].includes(String(l.estatus)) ? l.estatus : "",
      producto: limpiar(l.producto, 80),
      comentario: limpiar(l.comentario, 500),
      videollamada: limpiar(l.videollamada, 16),
      cambio: new Date().toISOString(),
    };
  }
  try {
    await guardarVarias(limpio);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No pude guardar en la base compartida." }, { status: 502 });
  }
}
