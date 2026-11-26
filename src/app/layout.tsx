import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

/** Letra condensada del demo de Sistema operativo (estilo de app de operación). */
const condensada = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-condensada",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Demos Solvera Labs · Pruébalo antes de contratarlo",
  description:
    "Prueba cada solución de Solvera Labs antes de contratarla: asistente de redes, agenda de citas, organizador de proyectos, automatización de procesos y sistema operativo de tu empresa.",
  icons: { icon: "/brand/symbol.png" },
  openGraph: {
    title: "Pruébalo antes de contratarlo · Solvera Labs",
    description: "Abre cualquier solución, pícale y mira cómo funcionaría en tu empresa.",
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${montserrat.variable} ${condensada.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
