"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Sitio } from "@/data/portafolio";
import { waLink } from "@/lib/whatsapp";

/** Muestra una página del portafolio dentro del dashboard, en vista de celular o computadora. */
export function Visor({ sitio, esCliente }: { sitio: Sitio; esCliente: boolean }) {
  const [vista, setVista] = useState<"celular" | "computadora">("celular");
  const mensaje = esCliente
    ? `Hola, vi la página de ${sitio.nombre} en el portafolio de Solvera Labs y quiero una así`
    : `Hola, vi la muestra de ${sitio.tipo.toLowerCase()} en el portafolio de Solvera Labs y quiero una página así`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f4f4]">
      <header className="sticky top-0 z-10 border-b border-line bg-white">
        <div className="mx-auto flex max-w-wrap flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/paginas-web" aria-label="Volver a páginas web" className="flex items-center gap-2 text-[0.9rem] font-semibold text-muted hover:text-solar">
            <Image src="/brand/symbol.png" alt="" width={24} height={24} />←<span className="hidden sm:inline"> Páginas web</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.95rem] font-extrabold">{sitio.nombre}</div>
            <div className="truncate text-[0.75rem] text-muted">{sitio.tipo}</div>
          </div>
          {sitio.embebible && (
            <div className="hidden gap-1.5 sm:flex" role="group" aria-label="Tamaño de pantalla">
              {(["celular", "computadora"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVista(v)}
                  aria-pressed={vista === v}
                  className="rounded-full border border-line2 bg-white px-3.5 py-[7px] text-[13px] font-semibold capitalize text-muted aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          <a className="btn btn-pri min-h-[38px] px-4 py-2 text-[13px]" href={waLink(mensaje)} target="_blank" rel="noopener">
            Quiero una así
          </a>
        </div>
      </header>

      {sitio.embebible ? (
        <div className="flex flex-1 justify-center p-0 sm:p-6">
          <iframe
            key={vista}
            src={sitio.url}
            title={sitio.nombre}
            loading="lazy"
            className={`h-[calc(100dvh-64px)] w-full bg-white sm:h-[calc(100dvh-120px)] sm:rounded-[20px] sm:border sm:border-line sm:shadow-[0_30px_60px_-30px_rgba(26,26,26,0.35)] ${
              vista === "celular" ? "sm:max-w-[400px]" : "sm:max-w-[1280px]"
            }`}
          />
        </div>
      ) : (
        <div className="grid flex-1 place-items-center p-6">
          <div className="grid max-w-md gap-4 rounded-[24px] border border-line bg-white p-7 text-center">
            <h1 className="text-xl font-extrabold">{sitio.nombre}</h1>
            <p className="text-muted">Esta página no se puede mostrar dentro del portafolio. Ábrela en vivo:</p>
            <a className="btn btn-pri btn-lg" href={sitio.url} target="_blank" rel="noopener">
              Abrir {sitio.nombre} ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
