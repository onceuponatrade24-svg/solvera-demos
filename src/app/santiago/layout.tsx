import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguimiento de Ventas",
  description: "Seguimiento de ventas (privado).",
  robots: { index: false, follow: false, nocache: true },
  openGraph: null,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#faf8f5]">{children}</div>;
}
