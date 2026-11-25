"use client";

import { useState } from "react";
import { DEMOS } from "@/components/demos";
import type { Solucion } from "@/data/soluciones";

/** Demo + recuadro "Qué está pasando". El recuadro cambia con cada acción del cliente. */
export function DemoStage({ solucion }: { solucion: Solucion }) {
  const [narracion, setNarracion] = useState(solucion.narracionInicial);
  const Demo = DEMOS[solucion.id];

  return (
    <div className="grid min-w-0 gap-3.5" style={{ gridArea: "stage" }}>
      <p className="text-[0.95rem] text-muted">
        <b className="label mr-2 text-solar">Pruébalo</b>
        {solucion.pruebalo}
      </p>
      <div className="min-w-0 rounded-[24px] border border-line bg-white p-5 shadow-[0_30px_60px_-40px_rgba(26,26,26,0.25)]">
        {Demo ? (
          <Demo narrar={setNarracion} />
        ) : (
          <p className="py-10 text-center text-muted">El demo interactivo se está pasando a esta versión.</p>
        )}
      </div>
      <div className="grid gap-1 rounded-[20px] bg-peach px-5 py-4 text-[0.95rem]" aria-live="polite">
        <b className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-solar">Qué está pasando</b>
        <span>{narracion}</span>
      </div>
    </div>
  );
}
