"use client";

import { useRef, useState } from "react";

/** Video corto del demo: muestra la portada y se reproduce al tocarlo (con sonido y controles). */
export function VideoDemo({ video, titulo }: { video: { mp4: string; portada: string; vertical?: boolean }; titulo: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [jugando, setJugando] = useState(false);
  return (
    <div className="grid gap-2">
      <b className="label text-solar">Míralo en acción</b>
      <div className={`relative overflow-hidden rounded-[24px] border border-line bg-ink ${video.vertical ? "mx-auto aspect-[9/16] w-full max-w-[340px]" : "aspect-video w-full"}`}>
        <video
          ref={ref}
          className="h-full w-full object-cover"
          src={video.mp4}
          poster={video.portada}
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
              ref.current?.play();
            }}
            className="absolute inset-0 grid place-items-center bg-black/20 transition hover:bg-black/10"
            aria-label={`Reproducir video de ${titulo}`}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-2xl text-solar shadow-lg">▶</span>
          </button>
        )}
      </div>
    </div>
  );
}
