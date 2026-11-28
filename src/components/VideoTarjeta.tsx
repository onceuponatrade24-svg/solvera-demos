"use client";

import { useEffect, useRef } from "react";

/** Video de la tarjeta del inicio: sin sonido, en bucle, y solo corre mientras se ve en pantalla. */
export function VideoTarjeta({ src, portada }: { src: string; portada: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true; // React no pone "muted" en el HTML; sin esto el navegador no deja que arranque solo
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      src={src}
      poster={portada}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
