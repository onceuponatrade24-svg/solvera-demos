import { VideoDemo } from "@/components/VideoDemo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DemoStage } from "@/components/DemoStage";
import { SOLUCIONES, buscarSolucion } from "@/data/soluciones";
import { waLink } from "@/lib/whatsapp";

type Params = Promise<{ solucion: string }>;

export function generateStaticParams() {
  return SOLUCIONES.map((s) => ({ solucion: s.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = buscarSolucion((await params).solucion);
  if (!s) return {};
  return { title: `${s.nombre} · Demos Solvera Labs`, description: s.frase };
}

const H4 = "mb-2 text-xs font-bold uppercase tracking-[0.18em] text-solar";

export default async function PaginaSolucion({ params }: { params: Params }) {
  const s = buscarSolucion((await params).solucion);
  if (!s) notFound();

  const palabras = s.nombre.split(" ");
  const ultima = palabras.pop();

  return (
    <>
      {/* 1. Encabezado con aura durazno */}
      <div className="aura">
        <div className="wrap">
          <Header />
          <div className="pb-11 pt-[22px]">
            <Link href="/" className="mb-[26px] inline-flex gap-2 text-[0.9rem] font-medium text-muted hover:text-solar">
              ← Todos los demos
            </Link>
            <div className="grid gap-4">
              <div className="eyebrow">{s.grupo}</div>
              <h1 className="max-w-[16ch] text-[clamp(2.1rem,6vw,4rem)] font-black leading-none tracking-[-0.025em]">
                {palabras.join(" ")} <span className="gradtxt">{ultima}</span>
              </h1>
              <p className="max-w-[60ch] text-[clamp(1.05rem,2.2vw,1.25rem)] text-muted">{s.frase}</p>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
                <span className="rounded-full border border-line2 bg-white px-[18px] py-2 text-[1.05rem] font-extrabold">
                  {s.precio}
                </span>
                <span className="text-[0.9rem] text-muted">{s.notaPrecio}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-16 pt-8">
        <div className="wrap">
          <div className="split">
            {/* 2-4. Pruébalo, demo y "Qué está pasando" */}
            <DemoStage solucion={s} />

            {/* 5. Brief */}
            <aside className="grid gap-[22px] rounded-[24px] border border-line bg-white p-7 text-[0.95rem]" style={{ gridArea: "brief" }}>
              <div>
                <h2 className={H4}>Qué es</h2>
                <p>{s.queEs}</p>
              </div>
              <div>
                <h2 className={H4}>Cómo funciona</h2>
                <ol className="grid gap-2.5">
                  {s.comoFunciona.map((paso, i) => (
                    <li key={i} className="relative pl-10">
                      <span className="gradtxt absolute -top-px left-0 text-lg font-black">0{i + 1}</span>
                      {paso}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h2 className={H4}>Para quién</h2>
                <p>{s.paraQuien}</p>
              </div>
              <div>
                <h2 className={H4}>Incluye</h2>
                <ul className="grid gap-2.5">
                  {s.incluye.map((x) => (
                    <li key={x} className="relative pl-5">
                      <span className="absolute left-0 top-[0.62em] h-2 w-2 rounded-full bg-gradient-to-r from-solar to-solar2" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* 6. Video: se agrega en el paso 3 (no aparece mientras no exista) */}
            <div style={{ gridArea: "video" }} hidden={!s.video}>
              {s.video && <VideoDemo video={s.video} titulo={s.nombre} />}
            </div>

            {/* 7-8. WhatsApp y caso real */}
            <div className="grid gap-4" style={{ gridArea: "cta" }}>
              {s.demoReal && (
                <a className="btn btn-lg" href={s.demoReal} target="_blank" rel="noopener">
                  Abrir el demo real ↗
                </a>
              )}
              <a className="btn btn-pri btn-lg" href={waLink(s.whatsapp)} target="_blank" rel="noopener">
                Quiero esto para mi negocio
              </a>
              {s.caso && (
                <p className="border-t border-line pt-4 text-[0.85rem] text-muted">
                  <b className="text-ink">{s.caso.etiqueta}</b> {s.caso.texto}
                  {s.caso.ligas && s.caso.ligas.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {s.caso.ligas.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-line bg-white px-3 py-1 text-[12px] font-bold text-ink hover:border-solar hover:text-solar"
                        >
                          {l.texto} ↗
                        </a>
                      ))}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
