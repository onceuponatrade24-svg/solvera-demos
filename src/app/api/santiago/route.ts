import { NextResponse } from "next/server";
import { webcrypto } from "node:crypto";
import cifrado from "@/data/santiago.cifrado.json";

/*
 * Entrega la lista de Seguimiento de Ventas solo con el código correcto.
 * El código y la llave viven en Vercel (variable SANTIAGO_ACCESO = "código::llave"),
 * nunca en el código público. La lista se descifra aquí, en el servidor.
 * Freno contra adivinar: 5 intentos fallidos por IP cada 15 minutos.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS = 5;
const fallos = new Map<string, number[]>();
let cache: { llave: string; texto: string } | null = null;

function acceso() {
  const [codigo, llave] = (process.env.SANTIAGO_ACCESO ?? "").split("::");
  return codigo && llave ? { codigo: codigo.trim(), llave: llave.trim() } : null;
}

async function lista(llaveTexto: string) {
  if (cache?.llave === llaveTexto) return cache.texto;
  const b = (s: string) => Uint8Array.from(Buffer.from(s, "base64"));
  const s = webcrypto.subtle;
  const base = await s.importKey("raw", new TextEncoder().encode(llaveTexto), "PBKDF2", false, ["deriveKey"]);
  const llave = await s.deriveKey(
    { name: "PBKDF2", salt: b(cifrado.sal), iterations: cifrado.iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const claro = await s.decrypt({ name: "AES-GCM", iv: b(cifrado.iv) }, llave, b(cifrado.datos));
  cache = { llave: llaveTexto, texto: new TextDecoder().decode(claro) };
  return cache.texto;
}

export async function POST(req: Request) {
  const a = acceso();
  if (!a) return NextResponse.json({ ok: false, error: "Falta activar el acceso en Vercel." }, { status: 503 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sin-ip";
  const ahora = Date.now();
  const recientes = (fallos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAX_FALLOS) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  let codigo = "";
  try {
    codigo = String((await req.json())?.codigo ?? "").trim();
  } catch {}

  if (codigo !== a.codigo) {
    recientes.push(ahora);
    fallos.set(ip, recientes);
    if (fallos.size > 5000) fallos.clear();
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: "Código incorrecto." }, { status: 401 });
  }

  fallos.delete(ip);
  try {
    return new NextResponse(await lista(a.llave), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "La llave en Vercel no coincide con la lista." }, { status: 500 });
  }
}
