import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SitioCard } from "@/components/SitioCard";
import { CLIENTES, MUESTRAS, PAQUETES } from "@/data/portafolio";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Páginas web y tiendas en línea · Demos Solvera Labs",
  description: "Páginas de clientes en operación y muestras por giro, con paquetes y precios.",
};

const MENSAJE = "Hola, vi el portafolio de páginas web de Solvera Labs y quiero informes";
const H2 = "text-[clamp(1.6rem,4vw,2.4rem)] font-black leading-[1.05] tracking-[-0.025em]";

export default function PaginasWeb() {
  return (
    <>
      <div className="aura">
        <div className="wrap">
          <Header />
          <div className="pb-11 pt-[22px]">
            <Link href="/" className="mb-[26px] inline-flex gap-2 text-[0.9rem] font-medium text-muted hover:text-solar">
              ← Todos los demos
            </Link>
            <div className="grid gap-4">
              <div className="eyebrow">Páginas web</div>
              <h1 className="max-w-[16ch] text-[clamp(2.1rem,6vw,4rem)] font-black leading-none tracking-[-0.025em]">
                Páginas web y tiendas en <span className="gradtxt">línea</span>
              </h1>
              <p className="max-w-[60ch] text-[clamp(1.05rem,2.2vw,1.25rem)] text-muted">
                Así puede verse tu negocio en internet. Abre cualquier página para navegarla en vivo, aquí mismo.
              </p>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
                <span className="rounded-full border border-line2 bg-white px-[18px] py-2 text-[1.05rem] font-extrabold">desde $4,900</span>
                <span className="text-[0.9rem] text-muted">pago único · lista en 2 a 3 días</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-14">
        <div className="wrap grid gap-6">
          <div className="grid gap-2">
            <div className="eyebrow">Clientes</div>
            <h2 className={H2}>Páginas que ya están trabajando</h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-5">
            {CLIENTES.map((s) => (
              <SitioCard key={s.id} sitio={s} cliente />
            ))}
          </div>
        </div>
      </div>

      <div className="peach-band py-14">
        <div className="wrap grid gap-6">
          <div className="grid gap-2">
            <div className="eyebrow">Paquetes</div>
            <h2 className={H2}>Paquetes y precios</h2>
            <p className="text-muted">Precios antes de IVA. Si necesitas factura, se suma el IVA.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
            {PAQUETES.map((p) => (
              <div key={p.id} className="grid content-start gap-4 rounded-[24px] border border-line bg-white p-7">
                <div className="grid gap-1">
                  <span className="label text-solar">{p.etiqueta}</span>
                  <h3 className="text-xl font-extrabold">{p.nombre}</h3>
                  <p>
                    <b className="text-2xl font-black tracking-[-0.02em]">{p.precio}</b>{" "}
                    <span className="text-[0.9rem] text-muted">{p.notaPrecio}</span>
                  </p>
                </div>
                <p className="text-[0.95rem] text-muted">{p.texto}</p>
                <ul className="grid gap-2 text-[0.92rem]">
                  {p.incluye.map((x) => (
                    <li key={x} className="relative pl-5">
                      <span className="absolute left-0 top-[0.62em] h-2 w-2 rounded-full bg-gradient-to-r from-solar to-solar2" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="grid gap-1 rounded-2xl bg-peach p-4 text-[0.88rem]">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Mantenimiento</span>
                  <b className="font-extrabold">{p.mantenimiento}</b>
                  <span className="text-muted">{p.notaMantenimiento}</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">{p.tiempo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-14">
        <div className="wrap grid gap-6">
          <div className="grid gap-2">
            <div className="eyebrow">Muestras por giro</div>
            <h2 className={H2}>Así se vería la página de tu negocio</h2>
            <p className="text-muted">Negocios de ejemplo. Tu página lleva tu marca, tus fotos y tus textos.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-4">
            {MUESTRAS.map((s) => (
              <SitioCard key={s.id} sitio={s} />
            ))}
          </div>
          <a className="btn btn-pri btn-lg w-fit" href={waLink(MENSAJE)} target="_blank" rel="noopener">
            Quiero mi página
          </a>
        </div>
      </div>

      <Footer />
    </>
  );
}
