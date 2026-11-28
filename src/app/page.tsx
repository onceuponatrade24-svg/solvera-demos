import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { VistaPrevia } from "@/components/VistaPrevia";
import { VideoTarjeta } from "@/components/VideoTarjeta";
import { CLIENTES } from "@/data/portafolio";
import { PAGINAS_WEB, SOLUCIONES } from "@/data/soluciones";
import { MENSAJE_DIAGNOSTICO, MENSAJE_GENERAL, waLink } from "@/lib/whatsapp";

const GRUPO_LABEL = "text-xs font-bold uppercase tracking-[0.18em] text-muted";

export default function Inicio() {
  const grupos = [...new Set(SOLUCIONES.map((s) => s.grupo))];
  const gorila = CLIENTES.find((c) => c.id === "gorilla-crown")!;
  const otros = CLIENTES.filter((c) => ["simpson-race-products", "xolo"].includes(c.id));

  return (
    <>
      <div className="aura">
        <div className="wrap">
          <Header />
          <section className="grid gap-[22px] pb-16 pt-10">
            <div className="eyebrow">Demos en vivo · Guadalajara</div>
            <h1 className="max-w-[13ch] text-[clamp(2.5rem,8vw,5.6rem)] font-black leading-[0.98] tracking-[-0.025em]">
              Pruébalo antes de <span className="gradtxt">contratarlo.</span>
            </h1>
            <p className="max-w-[60ch] text-[clamp(1.05rem,2.2vw,1.25rem)] text-muted">
              Estas soluciones ya trabajan en negocios reales. Abre cualquiera, pícale y mira{" "}
              <b className="font-bold text-ink">cómo funcionaría en tu empresa.</b> Los demos usan negocios y
              datos de ejemplo.
            </p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <a className="btn btn-pri btn-lg" href={waLink(MENSAJE_GENERAL)} target="_blank" rel="noopener">
                Escríbenos por WhatsApp
              </a>
              <Link className="btn btn-lg" href={PAGINAS_WEB.liga}>
                Ver páginas web →
              </Link>
            </div>
          </section>
        </div>
      </div>

      <div className="py-16">
        <div className="wrap">
          <div className="mb-8 grid max-w-[760px] gap-3.5">
            <div className="eyebrow">Soluciones</div>
            <h2 className="text-[clamp(1.9rem,4.6vw,3rem)] font-black leading-[1.04] tracking-[-0.025em]">
              Una solución para cada parte de tu operación
            </h2>
            <p className="text-[1.05rem] text-muted">
              Cada demo trae una explicación corta de qué es, cómo funciona y para quién sirve.
            </p>
            <p className="w-fit rounded-full bg-peach px-4 py-2 text-[0.95rem] font-bold text-ink">
              ▶ Todos se pueden probar en vivo: entra a cualquiera y pícale.
            </p>
          </div>

          <div className="grid gap-4">
            <h2 className={GRUPO_LABEL}>{PAGINAS_WEB.grupo}</h2>
            <Link
              className="card group grid gap-0 overflow-hidden p-0 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
              href={PAGINAS_WEB.liga}
            >
              {/* Vistas previas reales: Gorilla Crown grande y dos clientes más */}
              <div className="grid gap-2 border-b border-line bg-peach p-3 md:border-b-0 md:border-r">
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-transform duration-500 group-hover:scale-[1.01]">
                  <VistaPrevia sitio={gorila} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {otros.map((c) => (
                    <div key={c.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                      <VistaPrevia sitio={c} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 p-6">
                <Icon name="web" />
                <h3 className="text-xl font-extrabold leading-tight">{PAGINAS_WEB.nombre}</h3>
                <p className="text-[0.95rem] text-muted">{PAGINAS_WEB.texto}</p>
                <p className="text-[0.85rem] text-muted">
                  <b className="text-ink">Clientes:</b> {CLIENTES.map((c) => c.nombre).join(", ")}.
                </p>
                <div className="mt-auto flex items-center justify-between gap-4 pt-2 text-[0.9rem]">
                  <b className="whitespace-nowrap font-extrabold">{PAGINAS_WEB.precio}</b>
                  <span className="whitespace-nowrap font-bold text-solar">Ver páginas →</span>
                </div>
              </div>
            </Link>
          </div>

          {grupos.map((g) => (
            <div key={g} className="mt-[34px] grid gap-4">
              <h2 className={GRUPO_LABEL}>{g}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(290px,100%),1fr))] gap-5">
                {SOLUCIONES.filter((s) => s.grupo === g).map((s) => (
                  <Link key={s.id} className="card group gap-0 overflow-hidden p-0" href={`/demos/${s.id}`}>
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-peach">
                      {s.video ? (
                        <VideoTarjeta src={s.video.tarjeta} portada={s.video.portada} />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/previews/${s.id}.webp`}
                          alt={`Vista previa del demo ${s.nombre}`}
                          loading="lazy"
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex items-center gap-3">
                        <Icon name={s.icono} />
                        <h3 className="text-lg font-extrabold leading-tight">{s.nombre}</h3>
                      </div>
                      <p className="text-[0.93rem] text-muted">{s.tarjeta}</p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[0.9rem]">
                        <b className="whitespace-nowrap font-extrabold">{s.precio}</b>
                        <span className="whitespace-nowrap font-bold text-solar">Probar demo →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="peach-band py-16">
        <div className="wrap">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] bg-ink p-[clamp(28px,6vw,64px)] text-white">
            <div>
              <h3 className="text-[clamp(1.7rem,4vw,2.6rem)] font-black leading-[1.05] tracking-[-0.02em]">
                ¿No sabes cuál <span className="gradtxt">necesitas?</span>
              </h3>
              <p className="mt-3 max-w-[56ch] text-[#bdbdbd]">
                Diagnóstico gratuito de 30 minutos. Revisamos tu operación y te decimos qué conviene automatizar
                primero.
              </p>
            </div>
            <a className="btn btn-pri btn-lg" href={waLink(MENSAJE_DIAGNOSTICO)} target="_blank" rel="noopener">
              Agendar mi diagnóstico
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
