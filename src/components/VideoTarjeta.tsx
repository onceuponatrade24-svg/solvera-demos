"use client";

import { useEffect, useRef, useState } from "react";

/** Video de la tarjeta del inicio: muestra la portada y solo se reproduce (con sonido) cuando el visitante le pica play. */
export function VideoTarjeta({ src, portada, titulo }: { src: string; portada: string; titulo: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [jugando, setJugando] = useState(false);

  // Si otro video empieza a sonar, este se pausa para que no se encimen.
  useEffect(() => {
    const otro = (e: Event) => {
      if (e.target !== ref.current) ref.current?.pause();
    };
    document.addEventListener("play", otro, true);
    return () => document.removeEventListener("play", otro, true);
  }, []);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={ref}
        className={`h-full w-full ${jugando ? "object-contain" : "object-cover"}`}
        src={src}
        poster={portada}
        preload="none"
        playsInline
        controls={jugando}
        onEnded={() => setJugando(false)}
        aria-label={`Video: ${titulo}`}
      />
      {!jugando && (
        <button
          type="button"
          onClick={() => {
            setJugando(true);
            ref.current?.play().catch(() => {});
          }}
          className="group/play absolute inset-0 grid place-items-center bg-black/15 transition hover:bg-black/5"
          aria-label={`Reproducir video de ${titulo}`}
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 pl-1 text-xl text-solar shadow-lg transition group-hover/play:scale-110">▶</span>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">🔊 Ver video</span>
        </button>
      )}
    </div>
  );
}
