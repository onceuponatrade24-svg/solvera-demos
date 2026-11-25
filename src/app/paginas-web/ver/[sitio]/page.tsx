import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CLIENTES, MUESTRAS, buscarSitio } from "@/data/portafolio";
import { Visor } from "@/components/Visor";

type Params = Promise<{ sitio: string }>;

export function generateStaticParams() {
  return [...CLIENTES, ...MUESTRAS].map((s) => ({ sitio: s.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = buscarSitio((await params).sitio);
  return s ? { title: `${s.nombre} · Páginas web Solvera Labs` } : {};
}

export default async function VerSitio({ params }: { params: Params }) {
  const s = buscarSitio((await params).sitio);
  if (!s) notFound();
  return <Visor sitio={s} esCliente={CLIENTES.some((c) => c.id === s.id)} />;
}
