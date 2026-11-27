import Link from "next/link";
import type { Sitio } from "@/data/portafolio";
import { VistaPrevia } from "./VistaPrevia";

/** Tarjeta de una página del portafolio (cliente o muestra), con vista previa. Abre el visor interno. */
export function SitioCard({ sitio, cliente }: { sitio: Sitio; cliente?: boolean }) {
  return (
    <Link className="card gap-0 overflow-hidden p-0" href={`/paginas-web/ver/${sitio.id}`}>
      <VistaPrevia sitio={sitio} />
      <div className="flex flex-1 flex-col gap-2 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-solar">{sitio.tipo}</span>
        {cliente && (
          <span className="rounded-full bg-peach px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink">
            Cliente
          </span>
        )}
      </div>
      <h3 className="text-lg font-extrabold leading-tight">{sitio.nombre}</h3>
      <p className="text-[0.9rem] text-muted">{sitio.texto}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[0.85rem]">
        <span>
          {sitio.paquete && (
            <>
              <span className="text-muted">{sitio.paquete.nombre} · </span>
              <b className="font-extrabold">{sitio.paquete.precio}</b>
            </>
          )}
        </span>
        <span className="whitespace-nowrap font-bold text-solar">Ver página →</span>
      </div>
      </div>
    </Link>
  );
}
