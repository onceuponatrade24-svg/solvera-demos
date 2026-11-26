import { createHash } from "node:crypto";
import { cookies } from "next/headers";

/*
 * Conexión con la hoja de Google a través del Apps Script que Charlie pega en la hoja.
 * Variables en Vercel:
 *   SANTIAGO_HOJA_URL   liga del Apps Script publicado como app web (termina en /exec)
 *   SANTIAGO_HOJA_TOKEN la misma clave secreta que trae el Apps Script
 *   SANTIAGO_CLAVE      contraseña con la que entra Santiago
 */

export const COOKIE = "santiago_sesion";

export function configurado() {
  return Boolean(process.env.SANTIAGO_HOJA_URL && process.env.SANTIAGO_HOJA_TOKEN && process.env.SANTIAGO_CLAVE);
}

/** Valor de la cookie de sesión: huella de la contraseña (cambia si cambia la contraseña). */
export function huella(clave: string) {
  return createHash("sha256").update(`santiago:${clave}:${process.env.SANTIAGO_HOJA_TOKEN ?? ""}`).digest("hex");
}

export async function sesionValida() {
  const clave = process.env.SANTIAGO_CLAVE;
  if (!clave) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return c === huella(clave);
}

export async function leerHoja(): Promise<{ hojas: Record<string, string[][]>; actualizado: string }> {
  const url = new URL(process.env.SANTIAGO_HOJA_URL!);
  url.searchParams.set("token", process.env.SANTIAGO_HOJA_TOKEN!);
  const r = await fetch(url, { cache: "no-store", redirect: "follow" });
  const texto = await r.text();
  let datos: { ok?: boolean; error?: string; hojas?: Record<string, string[][]>; actualizado?: string };
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error("La hoja no respondió como se esperaba. Revisa que el Apps Script esté publicado para \"Cualquier persona\".");
  }
  if (!datos.ok || !datos.hojas) throw new Error(datos.error || "La hoja no mandó datos.");
  return { hojas: datos.hojas, actualizado: datos.actualizado ?? new Date().toISOString() };
}

export async function guardarEnHoja(registro: {
  cliente: string;
  celular: string;
  resultado: string;
  nota: string;
  proximo: string;
}) {
  const r = await fetch(process.env.SANTIAGO_HOJA_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: process.env.SANTIAGO_HOJA_TOKEN, ...registro }),
    cache: "no-store",
    redirect: "follow",
  });
  let d: { ok?: boolean; error?: string } = {};
  try {
    d = JSON.parse(await r.text());
  } catch {
    throw new Error("La hoja no respondió. Intenta de nuevo.");
  }
  if (!d.ok) throw new Error(d.error || "No se guardó en la hoja.");
}
