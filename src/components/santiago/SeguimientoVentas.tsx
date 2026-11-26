"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ANIOS,
  armarRegistros,
  CALENDARIO_EQUIPO,
  PRODUCTOS,
  guardarLlamadas,
  leerLlamadas,
  type Estatus,
  type Llamada,
  type Registro,
} from "@/lib/santiago/ventas";

const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function calendarioUrl(r: Registro, l: Llamada) {
  const detalles = [`Cliente: ${r.cliente}`];
  if (r.celular) detalles.push(`Celular: ${r.celular}`);
  if (r.ciudad) detalles.push(`Ciudad: ${r.ciudad}`);
  if (l.producto) detalles.push(`Producto ofrecido: ${l.producto}`);
  if (l.comentario) detalles.push(`Comentarios: ${l.comentario}`);
  detalles.push("", "Agendada desde Seguimiento de Ventas.");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `Videollamada · ${r.cliente}${l.producto ? ` · ${l.producto}` : ""}`,
    details: detalles.join("\n"),
    location: "Google Meet",
  });
  if (CALENDARIO_EQUIPO) q.set("add", CALENDARIO_EQUIPO);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function waUrl(tel: string) {
  const d = tel.replace(/\D/g, "");
  return `https://wa.me/${d.length === 10 ? "52" + d : d}`;
}

export function SeguimientoVentas({ hojas, salir }: { hojas: Record<string, string[][]>; salir: () => void }) {
  const registros = useMemo(() => armarRegistros(hojas), [hojas]);
  const [anio, setAnio] = useState<number>(2026);
  const [busca, setBusca] = useState("");
  const [llamadas, setLlamadas] = useState<Record<string, Llamada>>({});
  const [avisoGuardado, setAvisoGuardado] = useState(true);

  useEffect(() => setLlamadas(leerLlamadas()), []);

  const actualizar = (id: string, cambio: Partial<Llamada>) => {
    setLlamadas((prev) => {
      const actual: Llamada = prev[id] ?? { fecha: "", estatus: "" };
      const nuevas = { ...prev, [id]: { ...actual, ...cambio } };
      setAvisoGuardado(guardarLlamadas(nuevas));
      return nuevas;
    });
  };

  const porAnio = useMemo(() => {
    const m = new Map<number, Registro[]>();
    for (const a of ANIOS) m.set(a, []);
    for (const r of registros) m.get(r.anio)?.push(r);
    return m;
  }, [registros]);

  const filas = useMemo(() => {
    const q = sinAcentos(busca.trim());
    const lista = porAnio.get(anio) ?? [];
    if (!q) return lista;
    return lista.filter((r) => sinAcentos(`${r.cliente} ${r.ciudad} ${r.celular} ${r.medio} ${r.numVenta}`).includes(q));
  }, [porAnio, anio, busca]);

  // Numeración corrida del 1 en adelante dentro de cada año.
  const numero = useMemo(() => {
    const m = new Map<string, number>();
    for (const lista of porAnio.values()) lista.forEach((r, i) => m.set(r.id, i + 1));
    return m;
  }, [porAnio]);

  const conteo = (a: number) => {
    const lista = porAnio.get(a) ?? [];
    const seg = lista.filter((r) => llamadas[r.id]?.estatus === "seguimiento").length;
    return { total: lista.length, seg };
  };
  const c = conteo(anio);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="label text-solar">Privado</p>
          <h1 className="text-[26px] font-extrabold leading-tight">Seguimiento de Ventas</h1>
          <p className="text-[13px] text-muted">
            Registros de las hojas W y KT. Sin pendientes.
          </p>
        </div>
        <button className="btn !min-h-[38px] flex-none !px-3.5 !py-2 text-[13px]" onClick={salir}>
          Salir
        </button>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-line2 bg-white p-1" role="tablist" aria-label="Año">
          {ANIOS.map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={anio === a}
              onClick={() => setAnio(a)}
              className={`rounded-full px-5 py-2 text-[14px] font-bold transition-colors ${
                anio === a ? "bg-ink text-white" : "text-ink"
              }`}
            >
              Año {a} <span className={anio === a ? "text-solar3" : "text-muted"}>{conteo(a).total}</span>
            </button>
          ))}
        </div>
        <p className="text-[13px] text-muted">
          <span className="font-bold text-ok">{c.seg}</span> con seguimiento de {c.total}
        </p>
      </div>

      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar cliente, ciudad o celular…"
        aria-label="Buscar"
        className="mt-3 w-full rounded-2xl border border-line2 bg-white px-4 py-3 text-base outline-none focus:border-solar sm:max-w-md"
      />

      {!avisoGuardado && (
        <p className="mt-2 text-sm font-semibold text-bad">
          Este navegador no deja guardar cambios (¿modo incógnito?). Lo que anotes se perderá al cerrar.
        </p>
      )}

      <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[1320px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-line bg-[#faf8f5] text-[12px] uppercase tracking-[0.08em] text-muted">
              <th className="px-3 py-3 font-bold">No.</th>
              <th className="px-3 py-3 font-bold">Medio</th>
              <th className="px-3 py-3 font-bold">Cliente</th>
              <th className="px-3 py-3 font-bold">Celular</th>
              <th className="px-3 py-3 font-bold">Ciudad</th>
              <th className="px-3 py-3 font-bold">Fecha de llamada</th>
              <th className="px-3 py-3 font-bold">Estatus de llamada</th>
              <th className="px-3 py-3 font-bold">Producto ofrecido</th>
              <th className="px-3 py-3 font-bold">Comentarios</th>
              <th className="px-3 py-3 font-bold">Videollamada</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => {
              const l: Llamada = llamadas[r.id] ?? { fecha: "", estatus: "" as Estatus };
              return (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-semibold">{numero.get(r.id)}</span>{" "}
                    <span className="ml-1 rounded-full bg-[#f2f2f2] px-1.5 py-0.5 text-[10.5px] font-bold text-muted">{r.origen}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{r.medio}</td>
                  <td className="px-3 py-2.5 font-semibold">{r.cliente}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {r.celular ? (
                      <a href={waUrl(r.celular)} target="_blank" rel="noopener" className="text-ok underline-offset-2 hover:underline">
                        {r.celular}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{r.ciudad}</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="date"
                      value={l.fecha}
                      onChange={(e) => actualizar(r.id, { fecha: e.target.value })}
                      aria-label={`Fecha de llamada a ${r.cliente}`}
                      className="w-[150px] rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[14px] outline-none hover:border-line2 focus:border-solar"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <SelectorEstatus valor={l.estatus} cambiar={(estatus) => actualizar(r.id, { estatus })} cliente={r.cliente} />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={l.producto ?? ""}
                      onChange={(e) => actualizar(r.id, { producto: e.target.value })}
                      aria-label={`Producto ofrecido a ${r.cliente}`}
                      className={`w-[160px] rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[14px] outline-none hover:border-line2 focus:border-solar ${l.producto ? "" : "text-muted"}`}
                    >
                      <option value="">Elegir…</option>
                      {PRODUCTOS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <Comentario
                      valor={l.comentario ?? ""}
                      guardar={(comentario) => actualizar(r.id, { comentario })}
                      cliente={r.cliente}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <a
                      href={calendarioUrl(r, l)}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex whitespace-nowrap rounded-full border border-line2 px-3 py-1 text-[12.5px] font-bold text-ink hover:border-solar hover:text-solar"
                    >
                      Agendar
                    </a>
                  </td>
                </tr>
              );
            })}
            {filas.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted">
                  No hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12.5px] text-muted">Los cambios de fecha y estatus se guardan solos en este dispositivo.</p>
    </main>
  );
}

const ESTILO: Record<Exclude<Estatus, "">, string> = {
  "no-seguimiento": "bg-red-100 text-red-800 border-red-200",
  seguimiento: "bg-green-100 text-green-800 border-green-200",
};

function SelectorEstatus({ valor, cambiar, cliente }: { valor: Estatus; cambiar: (e: Estatus) => void; cliente: string }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={`Estatus de llamada de ${cliente}`}>
      {(
        [
          ["no-seguimiento", "No seguimiento"],
          ["seguimiento", "Seguimiento"],
        ] as const
      ).map(([id, texto]) => {
        const activo = valor === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => cambiar(activo ? "" : id)}
            className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-bold transition-colors ${
              activo ? ESTILO[id] : "border-line2 bg-transparent text-muted hover:text-ink"
            }`}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}

/** Texto libre que se guarda al salir del campo (no en cada tecla). */
function Comentario({ valor, guardar, cliente }: { valor: string; guardar: (v: string) => void; cliente: string }) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  return (
    <input
      type="text"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto !== valor && guardar(texto.slice(0, 500))}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      placeholder="Escribe un comentario…"
      aria-label={`Comentarios sobre ${cliente}`}
      className="w-[240px] rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[14px] outline-none placeholder:text-line2 hover:border-line2 focus:border-solar"
    />
  );
}
