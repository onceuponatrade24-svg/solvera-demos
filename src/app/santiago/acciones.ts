"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE, guardarEnHoja, huella, sesionValida } from "@/lib/santiago/hoja";

export async function entrar(_prev: { error: string } | null, form: FormData) {
  const clave = process.env.SANTIAGO_CLAVE;
  const escrita = String(form.get("clave") ?? "").trim();
  // Pausa corta para que no se pueda adivinar la contraseña a lo loco.
  await new Promise((r) => setTimeout(r, 600));
  if (!clave || escrita !== clave) return { error: "Contraseña incorrecta." };
  (await cookies()).set(COOKIE, huella(clave), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/santiago",
    maxAge: 60 * 60 * 24 * 60, // 60 días en su celular
  });
  revalidatePath("/santiago");
  return null;
}

export async function salir() {
  (await cookies()).delete({ name: COOKIE, path: "/santiago" });
  revalidatePath("/santiago");
}

export async function anotarSeguimiento(datos: {
  cliente: string;
  celular: string;
  resultado: string;
  nota: string;
  proximo: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await sesionValida())) return { ok: false, error: "Tu sesión se cerró. Vuelve a entrar." };
  const limpio = {
    cliente: datos.cliente.slice(0, 120),
    celular: datos.celular.slice(0, 40),
    resultado: datos.resultado.slice(0, 60),
    nota: datos.nota.slice(0, 1000),
    proximo: /^\d{4}-\d{2}-\d{2}$/.test(datos.proximo) ? datos.proximo : "",
  };
  if (!limpio.cliente || !limpio.resultado) return { ok: false, error: "Falta el cliente o el resultado." };
  try {
    await guardarEnHoja(limpio);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se guardó." };
  }
  revalidatePath("/santiago");
  return { ok: true };
}
