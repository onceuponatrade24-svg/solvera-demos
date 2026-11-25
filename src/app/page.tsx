import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { PAGINAS_WEB, SOLUCIONES } from "@/data/soluciones";
import { MENSAJE_DIAGNOSTICO, MENSAJE_GENERAL, waLink } from "@/lib/whatsapp";

const GRUPO_LABEL = "text-xs font-bold uppercase tracking-[0.18em] text-muted";

export default function Inicio() {
  const grupos = [...new Set(SOLUCIONES.map((s) => s.grupo))];

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
          </div>

          <div className="grid gap-4">
            <h2 className={GRUPO_LABEL}>{PAGINAS_WEB.grupo}</h2>
            <Link
              className="card md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-[18px]"
              href={PAGINAS_WEB.liga}
            >
              <Icon name="web" />
              <div className="grid gap-2 md:flex-[1_1_320px]">
                <h3 className="text-xl font-extrabold leading-tight">{PAGINAS_WEB.nombre}</h3>
                <p className="text-[0.95rem] text-muted">{PAGINAS_WEB.texto}</p>
              </div>
              <div className="flex items-center justify-between gap-4 pt-4 text-[0.9rem] md:pt-0">
                <b className="font-extrabold">{PAGINAS_WEB.precio}</b>
                <span className="font-bold text-solar">Ver páginas →</span>
              </div>
            </Link>
          </div>

          {grupos.map((g) => (
            <div key={g} className="mt-[34px] grid gap-4">
              <h2 className={GRUPO_LABEL}>{g}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-5">
                {SOLUCIONES.filter((s) => s.grupo === g).map((s) => (
                  <Link key={s.id} className="card" href={`/demos/${s.id}`}>
                    <Icon name={s.icono} />
                    <h3 className="mt-2 text-xl font-extrabold leading-tight">{s.nombre}</h3>
                    <p className="text-[0.95rem] text-muted">{s.tarjeta}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[0.9rem]">
                      <b className="font-extrabold">{s.precio}</b>
                      <span className="font-bold text-solar">Probar demo →</span>
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
