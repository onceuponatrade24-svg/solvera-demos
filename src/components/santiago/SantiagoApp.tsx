"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import cifrado from "@/data/santiago.cifrado.json";
import { armarTablero, HOJA_SEGUIMIENTO, hoyMx } from "@/lib/santiago/datos";
import { ahoraMx, guardarMarcas, leerMarcas, marcasComoHoja, type Marca } from "@/lib/santiago/marcas";
import { TableroClientes } from "./TableroClientes";

type Datos = { hojas: Record<string, string[][]>; cargado: string };
const RECUERDA = "santiago-clave";

const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function abrir(clave: string): Promise<Datos> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveKey"]);
  const llave = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: deB64(cifrado.sal), iterations: cifrado.iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(cifrado.iv) }, llave, deB64(cifrado.datos));
  return JSON.parse(new TextDecoder().decode(claro));
}

export function SantiagoApp() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [estado, setEstado] = useState<"inicio" | "pide" | "abriendo">("inicio");
  const [error, setError] = useState("");

  const entrar = useCallback(async (clave: string, recordar: boolean) => {
    setEstado("abriendo");
    setError("");
    try {
      const d = await abrir(clave);
      setMarcas(leerMarcas());
      setDatos(d);
      try {
        if (recordar) localStorage.setItem(RECUERDA, clave);
      } catch {}
    } catch {
      try {
        localStorage.removeItem(RECUERDA);
      } catch {}
      setError("Contraseña incorrecta.");
      setEstado("pide");
    }
  }, []);

  useEffect(() => {
    let guardada: string | null = null;
    try {
      guardada = localStorage.getItem(RECUERDA);
    } catch {}
    if (guardada) entrar(guardada, true);
    else setEstado("pide");
  }, [entrar]);

  const tablero = useMemo(
    () => (datos ? armarTablero({ ...datos.hojas, [HOJA_SEGUIMIENTO]: marcasComoHoja(marcas) }, hoyMx()) : null),
    [datos, marcas],
  );

  const anotar = useCallback((m: Omit<Marca, "fecha">) => {
    const nuevas = [...leerMarcas(), { ...m, fecha: ahoraMx() }];
    const ok = guardarMarcas(nuevas);
    setMarcas(nuevas);
    return ok;
  }, []);

  const cargarRespaldo = useCallback((lista: Marca[]) => {
    const actuales = leerMarcas();
    const clave = (x: Marca) => `${x.fecha}|${x.cliente}|${x.resultado}|${x.nota}`;
    const vistos = new Set(actuales.map(clave));
    const juntas = [...actuales, ...lista.filter((x) => x && x.cliente && !vistos.has(clave(x)))];
    guardarMarcas(juntas);
    setMarcas(juntas);
    return juntas.length - actuales.length;
  }, []);

  const salir = useCallback(() => {
    try {
      localStorage.removeItem(RECUERDA);
    } catch {}
    setDatos(null);
    setEstado("pide");
  }, []);

  if (tablero && datos) {
    return (
      <TableroClientes
        tablero={tablero}
        cargado={datos.cargado}
        marcas={marcas}
        anotar={anotar}
        cargarRespaldo={cargarRespaldo}
        salir={salir}
      />
    );
  }
  if (estado === "inicio") return null;
  return <Entrar error={error} abriendo={estado === "abriendo"} entrar={entrar} />;
}

function Entrar({ error, abriendo, entrar }: { error: string; abriendo: boolean; entrar: (c: string, r: boolean) => void }) {
  const [clave, setClave] = useState("");
  const [recordar, setRecordar] = useState(true);
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (clave.trim()) entrar(clave.trim(), recordar);
        }}
        className="rounded-3xl border border-line bg-white p-7 shadow-[0_30px_60px_-40px_rgba(26,26,26,.35)]"
      >
        <p className="label text-solar">Privado</p>
        <h1 className="mt-1 text-2xl font-extrabold">Clientes de Santiago</h1>
        <p className="mt-1 text-[14.5px] text-muted">Escribe la contraseña para entrar.</p>
        <label className="mt-5 block text-sm font-semibold" htmlFor="clave">Contraseña</label>
        <input
          id="clave"
          type="password"
          autoComplete="current-password"
          autoCapitalize="none"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-line2 px-4 py-3 text-base outline-none focus:border-solar"
        />
        <label className="mt-3 flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="h-4 w-4 accent-[#ff6a00]" />
          Recordarme en este celular
        </label>
        {error && <p className="mt-2 text-sm font-semibold text-bad">{error}</p>}
        <button className="btn btn-pri mt-5 w-full" disabled={abriendo}>
          {abriendo ? "Abriendo…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
