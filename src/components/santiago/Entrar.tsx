"use client";

import { useActionState } from "react";
import { entrar } from "@/app/santiago/acciones";

export function Entrar() {
  const [estado, accion, enviando] = useActionState(entrar, null);
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <form action={accion} className="rounded-3xl border border-line bg-white p-7 shadow-[0_30px_60px_-40px_rgba(26,26,26,.35)]">
        <p className="label text-solar">Privado</p>
        <h1 className="mt-1 text-2xl font-extrabold">Clientes de Santiago</h1>
        <p className="mt-1 text-[14.5px] text-muted">Escribe la contraseña para entrar.</p>
        <label className="mt-5 block text-sm font-semibold" htmlFor="clave">Contraseña</label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-2xl border border-line2 px-4 py-3 text-base outline-none focus:border-solar"
        />
        {estado?.error && <p className="mt-2 text-sm font-semibold text-bad">{estado.error}</p>}
        <button className="btn btn-pri mt-5 w-full" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
