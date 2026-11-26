"use client";

import { useCallback, useEffect, useState } from "react";
import { SeguimientoVentas } from "./SeguimientoVentas";

type Datos = { hojas: Record<string, string[][]>; cargado: string };
const RECUERDA = "santiago-codigo";

async function abrir(codigo: string): Promise<Datos> {
  const r = await fetch("/api/santiago", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo }),
    cache: "no-store",
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.hojas) throw new Error(d?.error || "No pude abrir la lista. Revisa tu internet.");
  return d;
}

export function SantiagoApp() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [estado, setEstado] = useState<"inicio" | "pide" | "abriendo">("inicio");
  const [error, setError] = useState("");

  const entrar = useCallback(async (codigo: string) => {
    setEstado("abriendo");
    setError("");
    try {
      setDatos(await abrir(codigo));
      try {
        localStorage.setItem(RECUERDA, codigo);
      } catch {}
    } catch (e) {
      try {
        localStorage.removeItem(RECUERDA);
      } catch {}
      setError(e instanceof Error ? e.message : "No pude abrir la lista.");
      setEstado("pide");
    }
  }, []);

  useEffect(() => {
    let guardado: string | null = null;
    try {
      guardado = localStorage.getItem(RECUERDA);
    } catch {}
    if (guardado) entrar(guardado);
    else setEstado("pide");
  }, [entrar]);

  const salir = useCallback(() => {
    try {
      localStorage.removeItem(RECUERDA);
    } catch {}
    setDatos(null);
    setEstado("pide");
  }, []);

  if (datos) return <SeguimientoVentas hojas={datos.hojas} salir={salir} />;
  if (estado === "inicio") return null;
  return <Entrar error={error} abriendo={estado === "abriendo"} entrar={entrar} />;
}

function Entrar({ error, abriendo, entrar }: { error: string; abriendo: boolean; entrar: (c: string) => void }) {
  const [codigo, setCodigo] = useState("");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (codigo.trim()) entrar(codigo.trim());
        }}
        className="rounded-3xl border border-line bg-white p-7 shadow-[0_30px_60px_-40px_rgba(26,26,26,.35)]"
      >
        <p className="label text-solar">Privado</p>
        <h1 className="mt-1 text-2xl font-extrabold">Seguimiento de Ventas</h1>
        <p className="mt-1 text-[14.5px] text-muted">Escribe tu código para entrar.</p>
        <label className="mt-5 block text-sm font-semibold" htmlFor="codigo">
          Código
        </label>
        <input
          id="codigo"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-line2 px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:border-solar"
        />
        {error && <p className="mt-2 text-sm font-semibold text-bad">{error}</p>}
        <button className="btn btn-pri mt-5 w-full" disabled={abriendo}>
          {abriendo ? "Abriendo…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
