"use client";

import { useEffect, useRef, useState } from "react";
import type { Sitio } from "@/data/portafolio";

const ANCHO = 1280;
const ALTO = 800;

/**
 * Vista previa real de la página: la carga en vivo (como computadora, 1280 px)
 * y la achica al tamaño de la tarjeta. Solo carga cuando la tarjeta se ve en pantalla.
 * Si la página no se deja mostrar dentro de otra, enseña una portada con su dominio.
 */
export function VistaPrevia({ sitio }: { sitio: Sitio }) {
  const caja = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.25);
  const [visible, setVisible] = useState(false);
  const [lista, setLista] = useState(false);
  const [falloFoto, setFalloFoto] = useState(false);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setEscala(el.clientWidth / ANCHO);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const dominio = sitio.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div
      ref={caja}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[inherit] border-b border-line bg-[#f4f1ec]"
      aria-hidden="true"
    >
      {sitio.embebible ? (
        <>
          {visible && (
            <iframe
              src={sitio.url}
              title={`Vista previa de ${sitio.nombre}`}
              loading="lazy"
              tabIndex={-1}
              scrolling="no"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setLista(true)}
              className="pointer-events-none absolute left-0 top-5 origin-top-left border-0 bg-white"
              style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})` }}
            />
          )}
          {!lista && (
            <div className="absolute inset-0 grid place-items-center text-[12px] font-semibold text-muted">Cargando vista…</div>
          )}
        </>
      ) : (
        <>
          <div className="absolute inset-0 grid place-content-center gap-1 bg-gradient-to-br from-peach to-white p-4 text-center">
            <span className="text-xl font-black tracking-[-0.02em]">{sitio.nombre}</span>
            <span className="text-[12px] font-semibold text-muted">{dominio}</span>
          </div>
          {visible && !falloFoto && (
            // Captura real de la página (la página no se deja mostrar dentro de otra).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://image.thum.io/get/width/${ANCHO}/crop/${ALTO}/noanimate/${sitio.url}`}
              alt=""
              loading="lazy"
              onError={() => setFalloFoto(true)}
              className="absolute inset-x-0 bottom-0 top-5 h-[calc(100%-1.25rem)] w-full object-cover object-top"
            />
          )}
        </>
      )}
      {/* barra tipo navegador */}
      <div className="absolute inset-x-0 top-0 flex h-5 items-center gap-1 bg-white/90 px-2 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#febc2e]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate text-[9.5px] text-muted">{dominio}</span>
      </div>
    </div>
  );
}
