import { NextResponse } from "next/server";
import { webcrypto } from "node:crypto";
import cifrado from "@/data/santiago.cifrado.json";
import { acceso, revisarCodigo } from "@/lib/santiago/servidor";

/*
 * Entrega la lista de Seguimiento de Ventas solo con el código correcto.
 * El código y la llave viven en Vercel (variable SANTIAGO_ACCESO = "código::llave"),
 * nunca en el código público. La lista se descifra aquí, en el servidor.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cache: { llave: string; texto: string } | null = null;

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
  let codigo = "";
  try {
    codigo = String((await req.json())?.codigo ?? "");
  } catch {}
  const rev = await revisarCodigo(req, codigo);
  if (!rev.ok) return NextResponse.json({ ok: false, error: rev.error }, { status: rev.status });

  try {
    return new NextResponse(await lista(acceso()!.llave), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "La llave en Vercel no coincide con la lista." }, { status: 500 });
  }
}
