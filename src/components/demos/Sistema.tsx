"use client";

import { useEffect, useMemo, useState } from "react";
import type { DemoProps } from "./index";

/*
 * Demo del Sistema operativo de empresa.
 * Clon de la app de operaciones que hicimos para Gorilla Crown, con una empresa ficticia:
 * "Ruta Norte 4x4", distribuidora de accesorios off-road. Todo vive en memoria.
 * Cada perfil ve solo sus módulos, y lo que hace uno le llega al otro al instante.
 */

type Rol = "direccion" | "gerente" | "supervisor" | "almacen" | "ventas";
type Persona = { id: string; nombre: string; rol: Rol; puesto: string; color: string };
type EstadoObj = "pendiente" | "enviado" | "validado" | "regresado";
type Objetivo = { id: string; para: string; titulo: string; puntos: number; dia: number; estado: EstadoObj; posiciones?: string[]; nota?: string };
type Renglon = { pos: string; sku: string; producto: string; sistema: number; contado: number; nota?: string };
type Reporte = { id: string; objetivo: string; de: string; titulo: string; renglones: Renglon[]; estado: "revisar" | "erp" | "capturado" | "regresado"; hora: string };
type Ubicacion = { pos: string; sku: string; producto: string; piezas: number };
type Arribo = { id: string; proveedor: string; sku: string; piezas: number; llega: string; recibido: boolean };
type Pago = { id: string; proveedor: string; factura: string; monto: string; dias: number; pagado: boolean };
type Evento = { id: number; texto: string; icono: string; hora: string };
type Cotizacion = { folio: string; cliente: string; vehiculo: string; paquete: string; total: number };

const PERSONAS: Persona[] = [
  { id: "mariana", nombre: "Mariana Ríos", rol: "direccion", puesto: "Dirección", color: "#ff7a00" },
  { id: "hector", nombre: "Héctor Luna", rol: "gerente", puesto: "Gerente de almacén", color: "#22c55e" },
  { id: "paola", nombre: "Paola Vega", rol: "supervisor", puesto: "Supervisora", color: "#a855f7" },
  { id: "ivan", nombre: "Iván Cruz", rol: "almacen", puesto: "Almacén", color: "#f59e0b" },
  { id: "lupita", nombre: "Lupita Soto", rol: "almacen", puesto: "Almacén", color: "#06b6d4" },
  { id: "andrea", nombre: "Andrea Mora", rol: "ventas", puesto: "Ventas", color: "#ec4899" },
];
const PERFILES: { rol: Rol; persona: string; app: string; lema: string }[] = [
  { rol: "direccion", persona: "mariana", app: "Centro de Operaciones", lema: "Toda la empresa en una pantalla" },
  { rol: "gerente", persona: "hector", app: "Pit Control", lema: "Objetivos y avance del equipo" },
  { rol: "supervisor", persona: "paola", app: "Validación", lema: "Revisa el trabajo y da ingresos" },
  { rol: "almacen", persona: "ivan", app: "Field", lema: "Misiones del día en el celular" },
  { rol: "ventas", persona: "andrea", app: "Connect", lema: "Cotiza en 3 paquetes" },
];
const MODULOS: Record<Rol, string[]> = {
  direccion: ["Centro de Operaciones", "Pagos a proveedores", "Ventas"],
  gerente: ["Tablero", "Nuevo objetivo"],
  supervisor: ["Validar reportes", "Recepción"],
  almacen: ["Inicio", "Mis misiones"],
  ventas: ["Cotizar", "Mis cotizaciones"],
};
const ICONO_MOD: Record<string, string> = {
  "Centro de Operaciones": "🏁", "Pagos a proveedores": "🧾", Ventas: "🛒", Tablero: "📊", "Nuevo objetivo": "🎯",
  "Validar reportes": "✅", Recepción: "📦", Inicio: "🏠", "Mis misiones": "🏆", Cotizar: "🧮", "Mis cotizaciones": "📄",
};

const UBICACIONES_INI: Ubicacion[] = [
  { pos: "P2-A-01", sku: "LED-42-RN", producto: "Barra LED 42 in", piezas: 12 },
  { pos: "P2-A-02", sku: "DEF-AC-TAC", producto: "Defensa delantera de acero", piezas: 4 },
  { pos: "P2-A-03", sku: "EST-AL-RAN", producto: "Estribos de aluminio", piezas: 9 },
  { pos: "RF-01-A", sku: "WIN-12K", producto: "Winch 12,000 lb", piezas: 6 },
  { pos: "RF-01-B", sku: "LLA-AT-33", producto: "Llanta A/T 33 in", piezas: 20 },
  { pos: "RF-01-C", sku: "SUS-LV-2", producto: "Kit de levante 2 in", piezas: 5 },
];
const ARRIBOS_INI: Arribo[] = [
  { id: "AR-214", proveedor: "LuzTec Iluminación", sku: "LED-42-RN", piezas: 24, llega: "Hoy", recibido: false },
  { id: "AR-215", proveedor: "Aceros del Bajío", sku: "DEF-AC-TAC", piezas: 6, llega: "Mañana", recibido: false },
  { id: "AR-216", proveedor: "Llantas Sierra", sku: "LLA-AT-33", piezas: 16, llega: "Jueves", recibido: false },
];
const PAGOS_INI: Pago[] = [
  { id: "p1", proveedor: "Fletes Rápidos del Norte", factura: "FRN-4821", monto: "$6,473 MXN", dias: -5, pagado: false },
  { id: "p2", proveedor: "Aceros del Bajío", factura: "AB-11920", monto: "$18,400 MXN", dias: -3, pagado: false },
  { id: "p3", proveedor: "LuzTec Iluminación", factura: "LT-3307", monto: "$2,150 USD", dias: 2, pagado: false },
  { id: "p4", proveedor: "Llantas Sierra", factura: "LS-0912", monto: "$41,200 MXN", dias: 6, pagado: false },
];
const OBJETIVOS_INI: Objetivo[] = [
  { id: "o1", para: "ivan", titulo: "Conteo cíclico pasillo 2", puntos: 5, dia: 1, estado: "pendiente", posiciones: ["P2-A-01", "P2-A-02", "P2-A-03"] },
  { id: "o2", para: "lupita", titulo: "Conteo cíclico RF-01", puntos: 5, dia: 0, estado: "enviado", posiciones: ["RF-01-A", "RF-01-B", "RF-01-C"] },
  { id: "o3", para: "lupita", titulo: "Etiquetar posiciones RF-04", puntos: 5, dia: -1, estado: "validado" },
  { id: "o4", para: "paola", titulo: "Dar ingreso a lo que llegó de LuzTec", puntos: 5, dia: 2, estado: "pendiente" },
  { id: "o5", para: "ivan", titulo: "Acomodar devoluciones", puntos: 3, dia: 3, estado: "pendiente" },
];
const REPORTES_INI: Reporte[] = [
  {
    id: "r1", objetivo: "o2", de: "lupita", titulo: "Conteo cíclico RF-01", estado: "revisar", hora: "9:12 a.m.",
    renglones: [
      { pos: "RF-01-A", sku: "WIN-12K", producto: "Winch 12,000 lb", sistema: 6, contado: 6 },
      { pos: "RF-01-B", sku: "LLA-AT-33", producto: "Llanta A/T 33 in", sistema: 20, contado: 18, nota: "Dos llantas en devoluciones" },
      { pos: "RF-01-C", sku: "SUS-LV-2", producto: "Kit de levante 2 in", sistema: 5, contado: 5 },
    ],
  },
];

const VEHICULOS = [
  { marca: "Toyota", modelo: "Tacoma" },
  { marca: "Ford", modelo: "Ranger" },
  { marca: "Jeep", modelo: "Wrangler" },
  { marca: "Nissan", modelo: "Frontier" },
];
const CATALOGO = [
  { n: "Estribos de aluminio", p: 6900 },
  { n: "Barra LED 42 in", p: 5400 },
  { n: "Faros auxiliares LED (par)", p: 3200 },
  { n: "Defensa delantera de acero", p: 18900 },
  { n: "Llantas A/T 33 in (juego de 4)", p: 21600 },
  { n: "Kit de levante 2 in", p: 14500 },
  { n: "Winch 12,000 lb", p: 16800 },
  { n: "Snorkel", p: 7900 },
];

const DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb"];
const pesos = (n: number) => "$" + n.toLocaleString("es-MX");
const iniciales = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");
const persona = (id: string) => PERSONAS.find((p) => p.id === id)!;
const corto = (id: string) => persona(id).nombre.split(" ")[0];

function armarPaquetes(presupuesto: number) {
  const metas = [
    { nombre: "Esencial", factor: 0.45 },
    { nombre: "Recomendado", factor: 0.75 },
    { nombre: "Completo", factor: 1 },
  ];
  return metas.map((m) => {
    const tope = presupuesto * m.factor;
    const piezas: { n: string; p: number }[] = [];
    let total = 0;
    for (const it of CATALOGO) {
      if (total + it.p <= tope) {
        piezas.push(it);
        total += it.p;
      }
    }
    return { nombre: m.nombre, piezas, total };
  });
}

export default function Sistema({ narrar }: DemoProps) {
  const [rol, setRol] = useState<Rol>("direccion");
  const [modulo, setModulo] = useState(MODULOS.direccion[0]);
  const [sol, setSol] = useState(false);
  const [elegirPerfil, setElegirPerfil] = useState(false);

  const [ubic, setUbic] = useState(UBICACIONES_INI);
  const [arribos, setArribos] = useState(ARRIBOS_INI);
  const [pagos, setPagos] = useState(PAGOS_INI);
  const [objetivos, setObjetivos] = useState(OBJETIVOS_INI);
  const [reportes, setReportes] = useState(REPORTES_INI);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([
    { id: 2, texto: "Lupita envió Conteo cíclico RF-01", icono: "📋", hora: "9:12" },
    { id: 1, texto: "Lupita cerró Etiquetar posiciones RF-04", icono: "✅", hora: "8:40" },
  ]);
  const [asistente, setAsistente] = useState(false);

  // Día de hoy de la semana laboral (0 = lunes), calculado en el navegador.
  const [hoy, setHoy] = useState(2);
  useEffect(() => {
    const d = new Date().getDay();
    setHoy(d === 0 ? 5 : Math.min(d - 1, 5));
  }, []);

  const perfil = PERFILES.find((p) => p.rol === rol)!;
  const yo = persona(perfil.persona);

  function evento(texto: string, icono: string) {
    const d = new Date();
    const hora = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    setEventos((e) => [{ id: Date.now() + Math.random(), texto, icono, hora }, ...e].slice(0, 8));
  }

  function cambiarRol(r: Rol) {
    setRol(r);
    setModulo(MODULOS[r][0]);
    setElegirPerfil(false);
    setAsistente(false);
    const p = PERFILES.find((x) => x.rol === r)!;
    narrar(
      r === "direccion"
        ? "Dirección ve toda la operación: objetivos, arribos, pagos, ventas y lo que el equipo hace en vivo."
        : `Entraste como ${persona(p.persona).nombre} (${persona(p.persona).puesto}). Solo aparecen sus módulos; lo demás ni lo ve.`,
    );
  }

  function irModulo(m: string) {
    setModulo(m);
    const textos: Record<string, string> = {
      "Pagos a proveedores": "Facturas por pagar con su vencimiento. Lo vencido sale en rojo y le llega un aviso a Dirección cada mañana.",
      Ventas: "Cada cotización que arma Ventas aparece aquí al momento, con su monto.",
      "Nuevo objetivo": "El gerente asigna objetivos con puntos y fecha compromiso. Le llegan al celular de la persona.",
      Recepción: "Lo que viene en camino. Al dar ingreso, el inventario sube solo.",
      "Mis misiones": "Cada persona ve sus objetivos de la semana y cuántos puntos lleva.",
      "Mis cotizaciones": "Historial de cotizaciones de este vendedor.",
    };
    if (textos[m]) narrar(textos[m]);
  }

  // ---------- Derivados ----------
  const porValidar = reportes.filter((r) => r.estado === "revisar");
  const porCapturar = reportes.filter((r) => r.estado === "erp");
  const validados = objetivos.filter((o) => o.estado === "validado").length;
  const atrasados = objetivos.filter((o) => o.estado !== "validado" && o.dia < hoy).length;
  const pagosVencidos = pagos.filter((p) => !p.pagado && p.dias < 0);
  const arribosPend = arribos.filter((a) => !a.recibido);
  const ventasHoy = cotizaciones.reduce((t, c) => t + c.total, 0);

  const puntosDe = (id: string) => objetivos.filter((o) => o.para === id && o.estado === "validado").reduce((t, o) => t + o.puntos, 0);
  const metaDe = (id: string) => objetivos.filter((o) => o.para === id).reduce((t, o) => t + o.puntos, 0);

  // ---------- Acciones conectadas ----------
  function enviarConteo(obj: Objetivo, renglones: Renglon[]) {
    const id = `r${Date.now()}`;
    setReportes((r) => [{ id, objetivo: obj.id, de: obj.para, titulo: obj.titulo, renglones, estado: "revisar", hora: "ahora" }, ...r]);
    setObjetivos((os) => os.map((o) => (o.id === obj.id ? { ...o, estado: "enviado", nota: undefined } : o)));
    const dif = renglones.filter((x) => x.contado !== x.sistema).length;
    evento(`${corto(obj.para)} envió ${obj.titulo}`, "📋");
    narrar(
      `Conteo enviado${dif ? ` con ${dif} diferencia${dif > 1 ? "s" : ""}` : " sin diferencias"}. A Paola (supervisora) ya le llegó a su bandeja para validarlo. Entra como Supervisor para verlo.`,
    );
  }

  function validar(rep: Reporte, aprobar: boolean, nota?: string) {
    setReportes((r) => r.map((x) => (x.id === rep.id ? { ...x, estado: aprobar ? "erp" : "regresado" } : x)));
    setObjetivos((os) => os.map((o) => (o.id === rep.objetivo ? { ...o, estado: aprobar ? "validado" : "regresado", nota: aprobar ? undefined : nota } : o)));
    if (aprobar) {
      // Lo contado pasa a ser la existencia real.
      setUbic((u) => u.map((x) => {
        const r = rep.renglones.find((y) => y.pos === x.pos);
        return r ? { ...x, piezas: r.contado } : x;
      }));
      const obj = objetivos.find((o) => o.id === rep.objetivo);
      evento(`Paola validó ${rep.titulo} de ${corto(rep.de)}`, "✅");
      narrar(`Aprobado. ${corto(rep.de)} sumó ${obj?.puntos ?? 0} puntos, el inventario se ajustó y el tablero del gerente y de dirección ya cambió, sin que nadie mande reportes.`);
    } else {
      evento(`Paola regresó ${rep.titulo} a ${corto(rep.de)}`, "↩️");
      narrar(`Regresado con nota. A ${corto(rep.de)} le aparece de nuevo en sus misiones con lo que tiene que corregir.`);
    }
  }

  function capturarErp(rep: Reporte) {
    setReportes((r) => r.map((x) => (x.id === rep.id ? { ...x, estado: "capturado" } : x)));
    evento(`Paola capturó en el ERP ${rep.titulo}`, "💾");
    narrar("Marcado como capturado en el ERP. Queda el registro de quién lo hizo y cuándo.");
  }

  function recibir(a: Arribo) {
    setArribos((x) => x.map((y) => (y.id === a.id ? { ...y, recibido: true } : y)));
    const u = ubic.find((x) => x.sku === a.sku);
    setUbic((x) => x.map((y) => (y.sku === a.sku ? { ...y, piezas: y.piezas + a.piezas } : y)));
    if (a.proveedor.startsWith("LuzTec")) setObjetivos((os) => os.map((o) => (o.id === "o4" ? { ...o, estado: "validado" } : o)));
    evento(`Paola dio ingreso a ${a.piezas} pzas de ${u?.producto ?? a.sku}`, "📦");
    narrar(`Ingreso registrado: ${u?.producto} pasó de ${u?.piezas} a ${(u?.piezas ?? 0) + a.piezas} piezas en ${u?.pos}. Ventas ya puede ofrecerlo.`);
  }

  function pagar(p: Pago) {
    setPagos((x) => x.map((y) => (y.id === p.id ? { ...y, pagado: true } : y)));
    evento(`Mariana marcó pagada la factura ${p.factura} de ${p.proveedor}`, "💳");
    narrar(`Factura ${p.factura} marcada como pagada. Sale de pendientes y del aviso de mañana.`);
  }

  function nuevoObjetivo(o: Omit<Objetivo, "id" | "estado">) {
    setObjetivos((os) => [...os, { ...o, id: `o${Date.now()}`, estado: "pendiente" }]);
    evento(`Héctor asignó "${o.titulo}" a ${corto(o.para)}`, "🎯");
    narrar(`Objetivo asignado. A ${corto(o.para)} le llegó el aviso al celular y ya lo ve en sus misiones con ${o.puntos} puntos en juego.`);
  }

  function guardarCotizacion(c: Cotizacion) {
    setCotizaciones((x) => [c, ...x]);
    evento(`Andrea cotizó ${pesos(c.total)} a ${c.cliente} (${c.vehiculo})`, "🧮");
    narrar(`Cotización ${c.folio} lista con liga para el cliente. Dirección ya la ve en Ventas, al momento.`);
  }

  function reportarRapido(texto: string) {
    evento(texto, "🚨");
    narrar("Reporte enviado. Le llega al supervisor con hora y quién lo hizo, en lugar de quedarse en un chat.");
  }

  // ---------- Tema ----------
  const tema = sol
    ? { "--bg": "#f3f2ef", "--card": "#ffffff", "--card2": "#f7f6f3", "--line": "#e4e2dd", "--tx": "#141414", "--mu": "#6b6b6b" }
    : { "--bg": "#0c0c0e", "--card": "#16171b", "--card2": "#1d1e23", "--line": "rgba(255,255,255,.09)", "--tx": "#f5f5f5", "--mu": "rgba(255,255,255,.58)" };

  const mods = MODULOS[rol];

  return (
    <div
      className="relative grid grid-cols-[minmax(0,1fr)] overflow-clip rounded-3xl border border-black/10 text-[var(--tx)] shadow-[0_24px_50px_-30px_rgba(0,0,0,.6)] md:grid-cols-[170px_minmax(0,1fr)]"
      style={{ ...(tema as React.CSSProperties), background: "var(--bg)" }}
    >
      {/* Barra lateral (computadora) */}
      <aside className="hidden flex-col border-r border-[var(--line)] p-3 md:flex">
        <Logo />
        <p className="mb-1.5 mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--mu)]">{perfil.app}</p>
        <nav className="grid gap-1">
          {mods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => irModulo(m)}
              aria-current={m === modulo ? "page" : undefined}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition ${m === modulo ? "bg-[#ff7a00] text-white shadow-[0_8px_20px_-8px_#ff7a00]" : "text-[var(--mu)] hover:bg-[var(--card2)]"}`}
            >
              <span aria-hidden>{ICONO_MOD[m]}</span>
              {m}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2">
          <Avatar p={yo} />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{yo.nombre}</p>
            <p className="truncate text-[10px] text-[var(--mu)]">
              <span className="text-[#22c55e]">●</span> {yo.puesto}
            </p>
          </div>
        </div>
      </aside>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start">
        {/* Barra superior */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="md:hidden"><Logo chico /></span>
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-condensada)] text-xl font-bold leading-none sm:text-2xl">{modulo}</p>
              <p className="truncate text-[11px] text-[var(--mu)]">Ruta Norte 4x4 · {yo.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSol((s) => !s);
                narrar(sol ? "Modo oscuro: el que se usa dentro de la bodega." : "Modo sol: para leer la pantalla en el patio o a pleno sol.");
              }}
              className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-bold"
              aria-pressed={sol}
            >
              {sol ? "🌙 Oscuro" : "☀️ Modo sol"}
            </button>
            <button
              type="button"
              onClick={() => setElegirPerfil((v) => !v)}
              aria-expanded={elegirPerfil}
              className="rounded-full border border-[#ff7a00] px-2.5 py-1 text-[11px] font-bold text-[#ff7a00]"
            >
              Cambiar perfil ⇄
            </button>
          </div>
        </header>

        {elegirPerfil && (
          <div className="grid grid-cols-1 gap-2 border-b border-[var(--line)] bg-[var(--card2)] p-3 sm:grid-cols-2">
            <p className="col-span-full font-[family-name:var(--font-condensada)] text-lg font-bold">¿Quién eres?</p>
            {PERFILES.map((p) => {
              const per = persona(p.persona);
              return (
                <button
                  key={p.rol}
                  type="button"
                  onClick={() => cambiarRol(p.rol)}
                  aria-pressed={p.rol === rol}
                  className="flex items-center gap-2 rounded-xl border bg-[var(--card)] p-2 text-left"
                  style={{ borderColor: p.rol === rol ? "#ff7a00" : "var(--line)" }}
                >
                  <Avatar p={per} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{per.puesto} · {per.nombre.split(" ")[0]}</span>
                    <span className="block truncate text-[11px] text-[var(--mu)]">{p.lema}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Pestañas (celular) */}
        <nav className="flex gap-1.5 overflow-x-auto border-b border-[var(--line)] px-3 py-2 md:hidden" aria-label="Módulos">
          {mods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => irModulo(m)}
              aria-current={m === modulo ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${m === modulo ? "bg-[#ff7a00] text-white" : "bg-[var(--card2)] text-[var(--mu)]"}`}
            >
              {ICONO_MOD[m]} {m}
            </button>
          ))}
        </nav>

        <main className="grid min-h-[420px] grid-cols-[minmax(0,1fr)] content-start gap-3 p-3 pb-20 sm:p-4 sm:pb-20">
          {modulo === "Centro de Operaciones" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Kpi icono="✅" titulo="Objetivos validados" valor={`${validados}`} de={`/${objetivos.length}`} pildora={`${Math.round((validados / objetivos.length) * 100)}%`} tono="naranja" />
                <Kpi icono="📦" titulo="Arribos por recibir" valor={`${arribosPend.length}`} pildora="esta semana" tono="naranja" />
                <Kpi icono="🧾" titulo="Pagos vencidos" valor={`${pagosVencidos.length}`} pildora={pagosVencidos.length ? "Atender" : "Al día"} tono={pagosVencidos.length ? "rojo" : "verde"} />
                <Kpi icono="🛒" titulo="Cotizado hoy" valor={cotizaciones.length ? pesos(ventasHoy) : "$0"} pildora={`${cotizaciones.length} cotiz.`} tono="verde" />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
                <Tarjeta titulo="Avance del equipo">
                  {PERSONAS.filter((p) => metaDe(p.id) > 0).map((p) => (
                    <Avance key={p.id} p={p} pts={puntosDe(p.id)} meta={metaDe(p.id)} />
                  ))}
                </Tarjeta>
                <Tarjeta titulo="El equipo en acción">
                  <Feed eventos={eventos} />
                </Tarjeta>
              </div>
              {pagosVencidos.length > 0 && (
                <button type="button" onClick={() => irModulo("Pagos a proveedores")} className="rounded-2xl border border-red-500/50 bg-red-500/10 p-3 text-left text-sm">
                  <b className="text-red-500">⚠ {pagosVencidos.length} pagos vencidos a proveedores.</b> <span className="text-[var(--mu)]">Toca para verlos →</span>
                </button>
              )}
            </>
          )}

          {modulo === "Pagos a proveedores" && (
            <Tarjeta titulo="Facturas por pagar">
              {pagos.map((p) => (
                <div key={p.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 ${p.pagado ? "border-[var(--line)] opacity-60" : p.dias < 0 ? "border-red-500/50 bg-red-500/[.07]" : "border-[var(--line)]"}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{p.proveedor}</p>
                    <p className={`text-xs ${p.pagado ? "text-[var(--mu)]" : p.dias < 0 ? "text-red-500" : "text-amber-500"}`}>
                      {p.pagado ? "Pagada" : p.dias < 0 ? `Vencida hace ${-p.dias} días` : `Vence en ${p.dias} días`} · {p.factura}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-condensada)] text-lg font-bold">{p.monto}</span>
                    {!p.pagado && <Boton chico onClick={() => pagar(p)}>Marcar pagada</Boton>}
                  </div>
                </div>
              ))}
            </Tarjeta>
          )}

          {modulo === "Ventas" && (
            <Tarjeta titulo="Cotizaciones de hoy">
              {cotizaciones.length === 0 ? (
                <Vacio texto="Todavía no hay cotizaciones hoy. Entra como Ventas, arma una y regresa aquí." />
              ) : (
                cotizaciones.map((c) => (
                  <div key={c.folio} className="flex flex-wrap justify-between gap-2 rounded-xl border border-[var(--line)] p-2.5 text-sm">
                    <span><b>{c.folio}</b> · {c.cliente} · {c.vehiculo} · {c.paquete}</span>
                    <b>{pesos(c.total)}</b>
                  </div>
                ))
              )}
            </Tarjeta>
          )}

          {modulo === "Tablero" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Kpi icono="✅" titulo="Objetivos cumplidos" valor={`${validados}`} de={`/${objetivos.length}`} pildora={`${Math.round((validados / objetivos.length) * 100)}%`} tono="naranja" />
                <Kpi icono="🚨" titulo="Vencidos sin entregar" valor={`${atrasados}`} pildora={atrasados ? "Revisar" : "Al día"} tono={atrasados ? "rojo" : "verde"} />
                <Kpi icono="📊" titulo="Reportes por validar" valor={`${porValidar.length}`} pildora="Supervisor" tono="naranja" />
                <Kpi icono="💾" titulo="Sin capturar en ERP" valor={`${porCapturar.length}`} pildora={porCapturar.length ? "Pendiente" : "Al día"} tono={porCapturar.length ? "naranja" : "verde"} />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
                <Tarjeta titulo="Avance del equipo" sub="Puntos validados de cada quien esta semana.">
                  {PERSONAS.filter((p) => ["almacen", "supervisor"].includes(p.rol)).map((p) => (
                    <Avance key={p.id} p={p} pts={puntosDe(p.id)} meta={metaDe(p.id)} />
                  ))}
                </Tarjeta>
                <Tarjeta titulo="El equipo en acción">
                  <Feed eventos={eventos} />
                </Tarjeta>
              </div>
              <Boton onClick={() => irModulo("Nuevo objetivo")}>🎯 Nuevo objetivo</Boton>
            </>
          )}

          {modulo === "Nuevo objetivo" && <FormaObjetivo hoy={hoy} onCrear={(o) => { nuevoObjetivo(o); irModulo("Tablero"); }} />}

          {modulo === "Validar reportes" && (
            <>
              <div className="flex items-center gap-3 rounded-2xl border border-[#ff7a00]/60 bg-[var(--card)] p-3">
                <span className="text-3xl" aria-hidden>✅</span>
                <div>
                  <p className="font-[family-name:var(--font-condensada)] text-2xl font-bold leading-none">{porValidar.length} por validar</p>
                  <p className="text-xs text-[var(--mu)]">Revisa, aprueba o regresa con una nota. Después se captura en el ERP.</p>
                </div>
              </div>
              {porValidar.length === 0 && <Vacio texto="Nada por validar. Entra como Almacén, cuenta el pasillo 2 y regresa." />}
              {porValidar.map((r) => (
                <TarjetaReporte key={r.id} r={r} onValidar={validar} />
              ))}
              {porCapturar.length > 0 && (
                <Tarjeta titulo="Por capturar en el ERP">
                  {porCapturar.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] p-2.5 text-sm">
                      <span>{r.titulo} · {corto(r.de)}</span>
                      <Boton chico onClick={() => capturarErp(r)}>Ya lo capturé</Boton>
                    </div>
                  ))}
                </Tarjeta>
              )}
            </>
          )}

          {modulo === "Recepción" && (
            <Tarjeta titulo="En camino" sub="Al dar ingreso, la existencia sube en su ubicación.">
              {arribos.map((a) => {
                const u = ubic.find((x) => x.sku === a.sku)!;
                return (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] p-2.5">
                    <div className="min-w-0 text-sm">
                      <p className="font-bold">{a.id} · {a.proveedor}</p>
                      <p className="text-xs text-[var(--mu)]">{a.piezas} pzas de {u.producto} → {u.pos} (hay {u.piezas}) · {a.llega}</p>
                    </div>
                    {a.recibido ? <Pildora tono="verde">Recibido</Pildora> : <Boton chico onClick={() => recibir(a)}>Dar ingreso</Boton>}
                  </div>
                );
              })}
            </Tarjeta>
          )}

          {modulo === "Inicio" && (
            <Field
              yo={yo}
              objetivos={objetivos.filter((o) => o.para === yo.id)}
              ubic={ubic}
              puntos={puntosDe(yo.id)}
              meta={metaDe(yo.id)}
              narrar={narrar}
              onEnviar={enviarConteo}
              onReportar={reportarRapido}
              irMisiones={() => irModulo("Mis misiones")}
            />
          )}

          {modulo === "Mis misiones" && (
            <Tarjeta titulo={`Misiones de ${yo.nombre.split(" ")[0]}`} sub={`${puntosDe(yo.id)} de ${metaDe(yo.id)} puntos validados.`}>
              {objetivos.filter((o) => o.para === yo.id).map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] p-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold">{o.titulo}</p>
                    <p className="text-xs text-[var(--mu)]">Compromiso {DIAS[Math.max(0, o.dia)]} · {o.puntos} pts{o.nota ? ` · Nota: ${o.nota}` : ""}</p>
                  </div>
                  <EstadoPildora e={o.estado} vencido={o.estado !== "validado" && o.dia < hoy} />
                </div>
              ))}
            </Tarjeta>
          )}

          {modulo === "Cotizar" && <Cotizador onGuardar={guardarCotizacion} narrar={narrar} ubic={ubic} />}

          {modulo === "Mis cotizaciones" && (
            <Tarjeta titulo="Mis cotizaciones">
              {cotizaciones.length === 0 ? <Vacio texto="Aún no armas ninguna. Ve a Cotizar." /> : cotizaciones.map((c) => (
                <div key={c.folio} className="flex flex-wrap justify-between gap-2 rounded-xl border border-[var(--line)] p-2.5 text-sm">
                  <span><b>{c.folio}</b> · {c.cliente} · {c.paquete}</span>
                  <b>{pesos(c.total)}</b>
                </div>
              ))}
            </Tarjeta>
          )}
        </main>
      </div>

      {/* Asistente flotante */}
      <button
        type="button"
        onClick={() => {
          setAsistente((v) => !v);
          if (!asistente) narrar("El asistente contesta con los datos de este momento y solo con lo que este perfil puede ver.");
        }}
        aria-expanded={asistente}
        aria-label="Asistente"
        className="absolute bottom-3 right-3 z-20 grid h-12 w-12 place-items-center rounded-full bg-[#ff7a00] text-xl text-white shadow-[0_10px_24px_-8px_#ff7a00] ring-2 ring-amber-300/60"
      >
        🎙
      </button>
      {asistente && (
        <Asistente
          rol={rol}
          responder={(pregunta) => responder(pregunta, { rol, yo, objetivos, reportes, arribos, pagos, cotizaciones, ubic, hoy, puntosDe, metaDe })}
          cerrar={() => setAsistente(false)}
          narrar={narrar}
        />
      )}
    </div>
  );
}

/* ================= Asistente ================= */

type Ctx = {
  rol: Rol; yo: Persona; objetivos: Objetivo[]; reportes: Reporte[]; arribos: Arribo[]; pagos: Pago[];
  cotizaciones: Cotizacion[]; ubic: Ubicacion[]; hoy: number; puntosDe: (id: string) => number; metaDe: (id: string) => number;
};

const PREGUNTAS: Record<Rol, string[]> = {
  direccion: ["¿Cómo vamos esta semana?", "¿Qué pagos están vencidos?", "¿Cuánto se ha cotizado hoy?", "¿Qué llega esta semana?"],
  gerente: ["¿Quién va atrasado?", "¿Cómo va cada persona?", "¿Qué falta por validar?"],
  supervisor: ["¿Qué tengo por validar?", "¿Qué llega esta semana?", "¿Qué falta capturar en el ERP?"],
  almacen: ["¿Qué me falta esta semana?", "¿Dónde está la barra LED?", "¿Cuántos puntos llevo?"],
  ventas: ["¿Hay winch en existencia?", "¿Dónde está la barra LED?", "¿Qué llega esta semana?"],
};

function responder(q: string, c: Ctx): string {
  const t = q.toLowerCase();
  const nom = (id: string) => persona(id).nombre.split(" ")[0];
  const buscar = c.ubic.find((u) => t.includes(u.producto.toLowerCase().split(" ")[0]) || t.includes(u.producto.toLowerCase().split(" ").slice(0, 2).join(" ")));
  if (/(dónde|donde|existencia|hay )/.test(t) && buscar) {
    return `${buscar.producto} (${buscar.sku}): ${buscar.piezas} piezas en ${buscar.pos}.`;
  }
  if (/pago|factura|proveedor/.test(t)) {
    if (c.rol !== "direccion") return "Los pagos a proveedores solo los ve Dirección.";
    const v = c.pagos.filter((p) => !p.pagado && p.dias < 0);
    return v.length ? `Hay ${v.length} vencidos:\n${v.map((p) => `· ${p.proveedor}: ${p.monto} (hace ${-p.dias} días)`).join("\n")}` : "No hay pagos vencidos. 👌";
  }
  if (/cotiz|vend/.test(t)) {
    if (c.rol === "almacen") return "Las cotizaciones las ven Ventas y Dirección.";
    const tot = c.cotizaciones.reduce((a, x) => a + x.total, 0);
    return c.cotizaciones.length ? `Hoy van ${c.cotizaciones.length} cotizaciones por ${pesos(tot)}.` : "Hoy todavía no hay cotizaciones.";
  }
  if (/llega|arribo|camino/.test(t)) {
    const p = c.arribos.filter((a) => !a.recibido);
    return p.length ? `Viene en camino:\n${p.map((a) => `· ${a.llega}: ${a.piezas} pzas de ${c.ubic.find((u) => u.sku === a.sku)?.producto} (${a.proveedor})`).join("\n")}` : "Ya se recibió todo lo de esta semana.";
  }
  if (/validar|revisar/.test(t)) {
    const r = c.reportes.filter((x) => x.estado === "revisar");
    return r.length ? `Por validar: ${r.map((x) => `${x.titulo} de ${nom(x.de)}`).join(", ")}.` : "No hay nada por validar.";
  }
  if (/erp|capturar/.test(t)) {
    const r = c.reportes.filter((x) => x.estado === "erp");
    return r.length ? `Falta capturar: ${r.map((x) => x.titulo).join(", ")}.` : "Todo está capturado en el ERP.";
  }
  if (/falta|me toca|pendiente/.test(t)) {
    const o = c.objetivos.filter((x) => x.para === c.yo.id && x.estado !== "validado");
    return o.length ? `Te faltan:\n${o.map((x) => `· ${x.titulo} (${x.estado})`).join("\n")}` : "No tienes pendientes. ¡Bien!";
  }
  if (/puntos/.test(t)) return `Llevas ${c.puntosDe(c.yo.id)} de ${c.metaDe(c.yo.id)} puntos validados esta semana.`;
  if (/atrasad|vencid/.test(t)) {
    const o = c.objetivos.filter((x) => x.estado !== "validado" && x.dia < c.hoy);
    return o.length ? `Atrasados:\n${o.map((x) => `· ${x.titulo} · ${nom(x.para)}`).join("\n")}` : "Nadie va atrasado. 👌";
  }
  if (/cómo|como|semana|persona|cada/.test(t)) {
    if (c.rol === "almacen" || c.rol === "ventas") return `Llevas ${c.puntosDe(c.yo.id)} de ${c.metaDe(c.yo.id)} puntos esta semana.`;
    const gente = PERSONAS.filter((p) => c.metaDe(p.id) > 0);
    const val = c.objetivos.filter((o) => o.estado === "validado").length;
    return `${val} de ${c.objetivos.length} objetivos validados.\n${gente.map((p) => `· ${nom(p.id)}: ${c.puntosDe(p.id)}/${c.metaDe(p.id)} pts`).join("\n")}`;
  }
  return "Puedo responder sobre existencias, arribos, objetivos, reportes por validar, pagos y cotizaciones. Pregúntame algo de eso.";
}

type Reconocedor = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void };

function Asistente({ rol, responder, cerrar, narrar }: { rol: Rol; responder: (q: string) => string; cerrar: () => void; narrar: (t: string) => void }) {
  const [msgs, setMsgs] = useState<{ de: "yo" | "bot"; t: string }[]>([{ de: "bot", t: "¿Qué necesitas? Pregúntame como a un compañero." }]);
  const [texto, setTexto] = useState("");
  const [oyendo, setOyendo] = useState(false);

  function preguntar(q: string) {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { de: "yo", t: q }, { de: "bot", t: responder(q) }]);
    setTexto("");
    narrar("El asistente no tiene respuestas grabadas: leyó los datos tal como están ahora, después de lo que hiciste.");
  }

  function dictar() {
    const w = window as unknown as { SpeechRecognition?: new () => Reconocedor; webkitSpeechRecognition?: new () => Reconocedor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      preguntar(PREGUNTAS[rol][0]);
      return;
    }
    const r = new SR();
    r.lang = "es-MX";
    r.interimResults = false;
    r.onresult = (e) => preguntar(e.results[0][0].transcript);
    r.onend = () => setOyendo(false);
    r.onerror = () => setOyendo(false);
    setOyendo(true);
    r.start();
  }

  return (
    <div className="absolute bottom-[70px] right-3 z-20 flex max-h-[70%] w-[min(340px,calc(100%-24px))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
        <p className="font-[family-name:var(--font-condensada)] text-lg font-bold">Asistente</p>
        <button type="button" onClick={cerrar} aria-label="Cerrar asistente" className="text-lg text-[var(--mu)]">×</button>
      </div>
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] content-start gap-2 overflow-y-auto p-3" aria-live="off">
        {msgs.map((m, i) => (
          <p key={i} className={`whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.de === "yo" ? "ml-8 justify-self-end bg-[#ff7a00] text-white" : "mr-6 bg-[var(--card2)]"}`}>{m.t}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-[var(--line)] p-2">
        {PREGUNTAS[rol].map((q) => (
          <button key={q} type="button" onClick={() => preguntar(q)} className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-semibold">{q}</button>
        ))}
      </div>
      <form className="flex gap-1.5 border-t border-[var(--line)] p-2" onSubmit={(e) => { e.preventDefault(); preguntar(texto); }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe o dicta…" aria-label="Pregunta al asistente" className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-transparent px-3 py-1.5 text-sm outline-none" />
        <button type="button" onClick={dictar} aria-label="Dictar" className={`grid h-8 w-8 place-items-center rounded-full ${oyendo ? "bg-red-500" : "bg-[var(--card2)]"}`}>🎙</button>
        <button type="submit" className="rounded-full bg-[#ff7a00] px-3 text-sm font-bold text-white">↑</button>
      </form>
    </div>
  );
}

/* ================= Almacén ================= */

function Field({ yo, objetivos, ubic, puntos, meta, narrar, onEnviar, onReportar, irMisiones }: {
  yo: Persona; objetivos: Objetivo[]; ubic: Ubicacion[]; puntos: number; meta: number; narrar: (t: string) => void;
  onEnviar: (o: Objetivo, r: Renglon[]) => void; onReportar: (t: string) => void; irMisiones: () => void;
}) {
  const [modo, setModo] = useState<"menu" | "contar" | "escanear" | "reportar" | "mover">("menu");
  const conteo = objetivos.find((o) => o.posiciones && (o.estado === "pendiente" || o.estado === "regresado"));
  const hechas = objetivos.filter((o) => o.estado === "validado" || o.estado === "enviado").length;

  if (modo === "contar" && conteo) {
    return <Conteo obj={conteo} ubic={ubic} narrar={narrar} cancelar={() => setModo("menu")} enviar={(r) => { onEnviar(conteo, r); setModo("menu"); }} />;
  }
  if (modo === "escanear") return <Escanear ubic={ubic} narrar={narrar} volver={() => setModo("menu")} />;
  if (modo === "reportar" || modo === "mover") {
    return (
      <ReporteRapido
        tipo={modo}
        ubic={ubic}
        volver={() => setModo("menu")}
        enviar={(t) => { onReportar(`${yo.nombre.split(" ")[0]} ${t}`); setModo("menu"); }}
      />
    );
  }

  const acciones: { icono: string; t: string; sub?: string; on: () => void; pri?: boolean }[] = [
    { icono: "🔫", t: "Escanear pieza", on: () => { setModo("escanear"); narrar("Con la cámara del celular lee el código y te dice qué es y dónde va."); }, pri: true },
    { icono: "📦", t: conteo ? "Contar mi pasillo" : "Sin conteos", sub: conteo?.posiciones?.join(" · "), on: () => { if (conteo) { setModo("contar"); narrar("Conteo cíclico paso a paso: una ubicación a la vez. El sistema compara contra lo que dice el inventario."); } else narrar("No tienes conteos pendientes."); } },
    { icono: "📍", t: "Cambiar de lugar", on: () => { setModo("mover"); narrar("Si mueves una pieza, se registra de dónde a dónde. Nadie la pierde."); } },
    { icono: "🚨", t: "Reportar no cuadra", on: () => { setModo("reportar"); narrar("Cuando algo no cuadra se reporta aquí, con ubicación, en lugar de decirlo de pasada."); } },
    { icono: "🏆", t: `Mis misiones (${objetivos.length - hechas})`, on: irMisiones },
  ];

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="rounded-2xl border border-[#ff7a00]/50 bg-[var(--card)] p-3">
          <p className="font-[family-name:var(--font-condensada)] text-2xl font-bold">¡Qué tal, {yo.nombre.split(" ")[0]}!</p>
          <p className="text-xs text-[var(--mu)]">Tus misiones de la semana</p>
          <Anillo valor={hechas} total={objetivos.length} />
          {conteo && (
            <button type="button" onClick={() => setModo("contar")} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-[#ff7a00]/40 bg-[#ff7a00]/10 p-2 text-left">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ff7a00] text-white">⚡</span>
              <span className="min-w-0 text-sm"><span className="block text-[11px] text-[var(--mu)]">Sigue con</span><b className="block truncate">{conteo.titulo}</b></span>
            </button>
          )}
          {objetivos.some((o) => o.estado === "regresado") && (
            <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-500">↩️ Te regresaron un conteo: {objetivos.find((o) => o.estado === "regresado")?.nota}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {acciones.map((a) => (
            <button
              key={a.t}
              type="button"
              onClick={a.on}
              className={`${a.t.startsWith("Mis misiones") ? "col-span-2 " : ""}flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition active:scale-[.97] ${a.pri ? "border-transparent bg-gradient-to-b from-[#ff9a2e] to-[#ff7a00] text-white shadow-[0_10px_24px_-10px_#ff7a00]" : "border-[var(--line)] bg-[var(--card)]"}`}
            >
              <span className="text-3xl" aria-hidden>{a.icono}</span>
              <span className="font-[family-name:var(--font-condensada)] text-lg font-bold leading-none">{a.t}</span>
              {a.sub && <span className="text-[10px] text-[var(--mu)]">{a.sub}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
        <div className="flex justify-between text-sm"><b>Meta de la semana</b><b className="font-[family-name:var(--font-condensada)] text-xl">{meta ? Math.round((puntos / meta) * 100) : 0}%</b></div>
        <Barra v={meta ? puntos / meta : 0} />
        <p className="mt-1 text-[11px] text-[var(--mu)]">{puntos} de {meta} puntos. Cuentan cuando el supervisor valida tu trabajo.</p>
      </div>
    </>
  );
}

function Conteo({ obj, ubic, narrar, cancelar, enviar }: { obj: Objetivo; ubic: Ubicacion[]; narrar: (t: string) => void; cancelar: () => void; enviar: (r: Renglon[]) => void }) {
  const lista = (obj.posiciones ?? []).map((p) => ubic.find((u) => u.pos === p)!);
  const [paso, setPaso] = useState(0);
  const [cant, setCant] = useState<number[]>(() => lista.map((u) => u.piezas));
  const [notas, setNotas] = useState<string[]>(() => lista.map(() => ""));
  const u = lista[paso];
  const fin = paso >= lista.length;

  if (fin) {
    const renglones: Renglon[] = lista.map((x, i) => ({ pos: x.pos, sku: x.sku, producto: x.producto, sistema: x.piezas, contado: cant[i], nota: notas[i] || undefined }));
    const dif = renglones.filter((r) => r.contado !== r.sistema).length;
    return (
      <Tarjeta titulo="Revisa y envía" sub={`${lista.length} ubicaciones · ${dif} diferencia${dif === 1 ? "" : "s"}`}>
        {renglones.map((r) => (
          <div key={r.pos} className={`flex justify-between gap-2 rounded-xl border p-2 text-sm ${r.contado !== r.sistema ? "border-red-500/50 bg-red-500/[.07]" : "border-[var(--line)]"}`}>
            <span className="min-w-0 truncate">{r.pos} · {r.producto}</span>
            <b>{r.contado}<span className="text-[var(--mu)]">/{r.sistema}</span></b>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <Boton secundario onClick={() => setPaso(0)}>Corregir</Boton>
          <Boton onClick={() => enviar(renglones)}>Enviar a revisión</Boton>
        </div>
      </Tarjeta>
    );
  }

  const difiere = cant[paso] !== u.piezas;
  return (
    <Tarjeta titulo={`Ubicación ${paso + 1} de ${lista.length}`} sub={obj.titulo}>
      <div className="rounded-xl bg-[var(--card2)] p-3 text-center">
        <p className="font-[family-name:var(--font-condensada)] text-3xl font-bold text-[#ff7a00]">{u.pos}</p>
        <p className="text-sm font-bold">{u.producto}</p>
        <p className="text-xs text-[var(--mu)]">{u.sku} · el inventario dice {u.piezas}</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button type="button" aria-label="Menos" onClick={() => setCant((c) => c.map((v, i) => (i === paso ? Math.max(0, v - 1) : v)))} className="h-12 w-12 rounded-full border border-[var(--line)] text-2xl font-bold">−</button>
        <span className="w-16 text-center font-[family-name:var(--font-condensada)] text-5xl font-bold" aria-live="polite">{cant[paso]}</span>
        <button type="button" aria-label="Más" onClick={() => setCant((c) => c.map((v, i) => (i === paso ? v + 1 : v)))} className="h-12 w-12 rounded-full border border-[var(--line)] text-2xl font-bold">+</button>
      </div>
      {difiere && (
        <input
          value={notas[paso]}
          onChange={(e) => setNotas((n) => n.map((v, i) => (i === paso ? e.target.value : v)))}
          placeholder="¿Qué pasó? Ej. dos piezas en devoluciones"
          aria-label="Motivo de la diferencia"
          className="rounded-xl border border-red-500/50 bg-transparent px-3 py-2 text-sm outline-none"
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Boton secundario onClick={() => (paso === 0 ? cancelar() : setPaso(paso - 1))}>{paso === 0 ? "Salir" : "Atrás"}</Boton>
        <Boton
          onClick={() => {
            if (difiere) narrar(`Diferencia en ${u.pos}: contaste ${cant[paso]} y el sistema dice ${u.piezas}. Queda marcada para que el supervisor la revise.`);
            setPaso(paso + 1);
          }}
        >
          {difiere ? "Hay diferencia · Siguiente" : "Cuadra · Siguiente"}
        </Boton>
      </div>
    </Tarjeta>
  );
}

function Escanear({ ubic, narrar, volver }: { ubic: Ubicacion[]; narrar: (t: string) => void; volver: () => void }) {
  const [leyendo, setLeyendo] = useState(false);
  const [pieza, setPieza] = useState<Ubicacion | null>(null);
  function leer() {
    setLeyendo(true);
    setPieza(null);
    setTimeout(() => {
      const u = ubic[Math.floor(Math.random() * ubic.length)];
      setPieza(u);
      setLeyendo(false);
      narrar(`Código leído: ${u.producto}. Va en ${u.pos} y hay ${u.piezas}. Sin buscar en papeles ni preguntar.`);
    }, 900);
  }
  return (
    <Tarjeta titulo="Escanear pieza">
      <div className="relative grid h-40 place-items-center overflow-hidden rounded-xl bg-black text-white">
        <div className="h-20 w-48 rounded-lg border-2 border-dashed border-[#ff7a00]" />
        {leyendo && <div className="absolute inset-x-6 top-1/2 h-0.5 animate-pulse bg-red-500" />}
        <p className="absolute bottom-2 text-xs text-white/70">{leyendo ? "Leyendo…" : "Apunta al código de barras"}</p>
      </div>
      {pieza && (
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-3 text-sm">
          <b>{pieza.producto}</b>
          <p className="text-[var(--mu)]">{pieza.sku} · {pieza.piezas} pzas en <b className="text-[var(--tx)]">{pieza.pos}</b></p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Boton secundario onClick={volver}>Volver</Boton>
        <Boton onClick={leer}>{pieza ? "Escanear otra" : "Simular lectura"}</Boton>
      </div>
    </Tarjeta>
  );
}

function ReporteRapido({ tipo, ubic, volver, enviar }: { tipo: "reportar" | "mover"; ubic: Ubicacion[]; volver: () => void; enviar: (t: string) => void }) {
  const [pos, setPos] = useState(ubic[0].pos);
  const [destino, setDestino] = useState("P3-B-02");
  const [nota, setNota] = useState("");
  const u = ubic.find((x) => x.pos === pos)!;
  return (
    <Tarjeta titulo={tipo === "mover" ? "Cambiar de lugar" : "Reportar no cuadra"}>
      <label className="grid gap-1 text-xs font-bold">
        Ubicación
        <select value={pos} onChange={(e) => setPos(e.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--card2)] px-3 py-2 text-sm font-normal">
          {ubic.map((x) => <option key={x.pos} value={x.pos}>{x.pos} · {x.producto}</option>)}
        </select>
      </label>
      {tipo === "mover" ? (
        <label className="grid gap-1 text-xs font-bold">
          Nueva ubicación
          <input value={destino} onChange={(e) => setDestino(e.target.value.toUpperCase())} className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-normal outline-none" />
        </label>
      ) : (
        <label className="grid gap-1 text-xs font-bold">
          ¿Qué no cuadra?
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. la caja está abierta y faltan piezas" className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-normal outline-none" />
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Boton secundario onClick={volver}>Volver</Boton>
        <Boton
          onClick={() => enviar(tipo === "mover" ? `movió ${u.producto} de ${pos} a ${destino}` : `reportó que no cuadra ${pos} (${u.producto})${nota ? `: ${nota}` : ""}`)}
        >
          Enviar
        </Boton>
      </div>
    </Tarjeta>
  );
}

/* ================= Supervisor ================= */

function TarjetaReporte({ r, onValidar }: { r: Reporte; onValidar: (r: Reporte, aprobar: boolean, nota?: string) => void }) {
  const [ver, setVer] = useState(false);
  const [regresando, setRegresando] = useState(false);
  const [nota, setNota] = useState("Vuelve a contar donde hubo diferencia");
  const dif = r.renglones.filter((x) => x.contado !== x.sistema).length;
  return (
    <div className="grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{r.titulo}</p>
          <p className="text-xs text-[var(--mu)]">{persona(r.de).nombre.split(" ")[0]} · {r.hora}</p>
        </div>
        <Pildora tono="naranja">Por revisar</Pildora>
      </div>
      <button type="button" onClick={() => setVer((v) => !v)} aria-expanded={ver} className="text-left text-sm">
        {r.renglones.length} renglones · {dif ? <b className="text-red-500">{dif} diferencia{dif > 1 ? "s" : ""}</b> : <b className="text-green-500">sin diferencias</b>} · <span className="text-[#ff7a00]">{ver ? "Ocultar" : "Ver detalle"} ›</span>
      </button>
      {ver && r.renglones.map((x) => (
        <div key={x.pos} className={`rounded-lg p-2 text-xs ${x.contado !== x.sistema ? "bg-red-500/10" : "bg-[var(--card2)]"}`}>
          <b>{x.pos}</b> · {x.producto}: contó <b>{x.contado}</b>, sistema {x.sistema}{x.nota ? ` · “${x.nota}”` : ""}
        </div>
      ))}
      {regresando ? (
        <div className="grid gap-2">
          <input value={nota} onChange={(e) => setNota(e.target.value)} aria-label="Nota para regresar" className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <Boton secundario onClick={() => setRegresando(false)}>Cancelar</Boton>
            <Boton rojo onClick={() => onValidar(r, false, nota)}>Regresar con nota</Boton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Boton rojo secundario onClick={() => setRegresando(true)}>‹ Regresar</Boton>
          <Boton verde onClick={() => onValidar(r, true)}>✓ Aprobar</Boton>
        </div>
      )}
    </div>
  );
}

/* ================= Gerente ================= */

function FormaObjetivo({ hoy, onCrear }: { hoy: number; onCrear: (o: Omit<Objetivo, "id" | "estado">) => void }) {
  const equipo = PERSONAS.filter((p) => ["almacen", "supervisor"].includes(p.rol));
  const [para, setPara] = useState(equipo[0].id);
  const [titulo, setTitulo] = useState("Etiquetar posiciones del pasillo 3");
  const [puntos, setPuntos] = useState(5);
  const [dia, setDia] = useState(Math.min(hoy + 1, 5));
  return (
    <Tarjeta titulo="Nuevo objetivo" sub="Le llega aviso al celular a la persona.">
      <label className="grid gap-1 text-xs font-bold">
        Para
        <select value={para} onChange={(e) => setPara(e.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--card2)] px-3 py-2 text-sm font-normal">
          {equipo.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.puesto}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-bold">
        Objetivo
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-normal outline-none" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs font-bold">
          Fecha compromiso
          <select value={dia} onChange={(e) => setDia(Number(e.target.value))} className="rounded-xl border border-[var(--line)] bg-[var(--card2)] px-3 py-2 text-sm font-normal">
            {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold">
          Puntos
          <select value={puntos} onChange={(e) => setPuntos(Number(e.target.value))} className="rounded-xl border border-[var(--line)] bg-[var(--card2)] px-3 py-2 text-sm font-normal">
            {[3, 5, 10].map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <Boton onClick={() => titulo.trim() && onCrear({ para, titulo: titulo.trim(), puntos, dia })}>Asignar objetivo</Boton>
    </Tarjeta>
  );
}

/* ================= Ventas ================= */

function Cotizador({ onGuardar, narrar, ubic }: { onGuardar: (c: Cotizacion) => void; narrar: (t: string) => void; ubic: Ubicacion[] }) {
  const [veh, setVeh] = useState(0);
  const [anio, setAnio] = useState("2024");
  const [presu, setPresu] = useState("60000");
  const [cliente, setCliente] = useState("Rodrigo Pérez");
  const [ver, setVer] = useState(false);
  const [elegido, setElegido] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);
  const monto = Math.max(10000, Number(presu.replace(/\D/g, "")) || 0);
  const paquetes = useMemo(() => armarPaquetes(monto), [monto]);
  const v = VEHICULOS[veh];
  const existencia = (n: string) => ubic.find((u) => n.toLowerCase().startsWith(u.producto.toLowerCase().split(" ").slice(0, 2).join(" ")));

  if (folio) {
    const p = paquetes.find((x) => x.nombre === elegido)!;
    return (
      <Tarjeta titulo={`Cotización ${folio}`} sub={`${cliente} · ${v.marca} ${v.modelo} ${anio}`}>
        {p.piezas.map((x) => <div key={x.n} className="flex justify-between text-sm"><span>{x.n}</span><span>{pesos(x.p)}</span></div>)}
        <div className="flex justify-between border-t border-[var(--line)] pt-2 font-bold"><span>Total paquete {p.nombre}</span><span>{pesos(p.total)}</span></div>
        <p className="rounded-xl bg-[var(--card2)] p-2 text-xs text-[var(--mu)]">🔗 Liga lista para mandarle al cliente: rutanorte4x4.mx/c/{folio.toLowerCase()}</p>
        <Boton secundario onClick={() => { setFolio(null); setVer(false); setElegido(null); }}>Nueva cotización</Boton>
      </Tarjeta>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
      <p className="font-[family-name:var(--font-condensada)] text-2xl font-bold">Arma 3 paquetes</p>
      <p className="text-xs font-bold text-[var(--mu)]">1 · Vehículo</p>
      <div className="grid grid-cols-2 gap-2">
        {VEHICULOS.map((x, i) => (
          <button key={x.modelo} type="button" aria-pressed={i === veh} onClick={() => setVeh(i)} className="rounded-xl border bg-[var(--card2)] p-2 text-left" style={{ borderColor: i === veh ? "#ff7a00" : "var(--line)" }}>
            <span className="block text-[10px] text-[var(--mu)]">{x.marca}</span>
            <span className="font-[family-name:var(--font-condensada)] text-xl font-bold leading-none">{x.modelo}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs font-bold text-[var(--mu)]">
          2 · Año
          <select value={anio} onChange={(e) => setAnio(e.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--card2)] px-3 py-2 text-sm text-[var(--tx)]">
            {["2026", "2025", "2024", "2023", "2022"].map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-[var(--mu)]">
          3 · Presupuesto (MXN)
          <input value={presu} onChange={(e) => { setPresu(e.target.value.replace(/\D/g, "").slice(0, 7)); setVer(false); }} inputMode="numeric" className="rounded-xl border border-[var(--line)] bg-[var(--card2)] px-3 py-2 text-sm text-[var(--tx)] outline-none" />
        </label>
      </div>
      <label className="grid gap-1 text-xs font-bold text-[var(--mu)]">
        4 · Cliente
        <input value={cliente} onChange={(e) => setCliente(e.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--card2)] px-3 py-2 text-sm text-[var(--tx)] outline-none" />
      </label>
      {!ver ? (
        <Boton onClick={() => { setVer(true); narrar(`Con ${pesos(monto)} de presupuesto el sistema armó 3 opciones con piezas del catálogo. El cliente elige, sin que el vendedor sume a mano.`); }}>Ver 3 paquetes</Boton>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {paquetes.map((p, i) => (
              <button key={p.nombre} type="button" aria-pressed={elegido === p.nombre} onClick={() => setElegido(p.nombre)} className="grid content-start gap-1 rounded-xl border bg-[var(--card2)] p-2.5 text-left" style={{ borderColor: elegido === p.nombre ? "#ff7a00" : "var(--line)" }}>
                <span className="flex items-center justify-between"><b className="font-[family-name:var(--font-condensada)] text-lg">{p.nombre}</b>{i === 1 && <Pildora tono="naranja">Sugerido</Pildora>}</span>
                <span className="font-[family-name:var(--font-condensada)] text-2xl font-bold text-[#ff7a00]">{pesos(p.total)}</span>
                {p.piezas.map((x) => {
                  const e = existencia(x.n);
                  return <span key={x.n} className="text-[11px] text-[var(--mu)]">· {x.n}{e ? ` (${e.piezas} en bodega)` : ""}</span>;
                })}
              </button>
            ))}
          </div>
          <Boton
            disabled={!elegido || !cliente.trim()}
            onClick={() => {
              const p = paquetes.find((x) => x.nombre === elegido)!;
              const f = `COT-${Math.floor(1000 + Math.random() * 9000)}`;
              setFolio(f);
              onGuardar({ folio: f, cliente: cliente.trim(), vehiculo: `${v.modelo} ${anio}`, paquete: p.nombre, total: p.total });
            }}
          >
            {elegido ? `Generar cotización ${elegido}` : "Elige un paquete"}
          </Boton>
        </>
      )}
    </div>
  );
}

/* ================= Piezas de interfaz ================= */

function Logo({ chico }: { chico?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" className={chico ? "h-6 w-6" : "h-7 w-7"} aria-hidden>
        <path d="M2 20 9 7l4 6 3-4 6 11z" fill="#ff7a00" />
        <path d="M9 7l2 3-2 1-2-1z" fill="#fff" opacity=".85" />
      </svg>
      {!chico && <span className="font-[family-name:var(--font-condensada)] text-xl font-extrabold italic tracking-tight">RUTA <span className="text-[#ff7a00]">OS</span></span>}
    </span>
  );
}

function Avatar({ p }: { p: Persona }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-[family-name:var(--font-condensada)] text-sm font-bold text-white" style={{ background: p.color }}>
      {iniciales(p.nombre)}
    </span>
  );
}

function Tarjeta({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] content-start gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
      <div>
        <p className="font-[family-name:var(--font-condensada)] text-xl font-bold leading-tight">{titulo}</p>
        {sub && <p className="text-xs text-[var(--mu)]">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

const TONOS = {
  naranja: "border-[#ff7a00]/40 text-[#ff7a00] bg-[#ff7a00]/10",
  verde: "border-green-500/40 text-green-500 bg-green-500/10",
  rojo: "border-red-500/40 text-red-500 bg-red-500/10",
};

function Pildora({ tono, children }: { tono: keyof typeof TONOS; children: React.ReactNode }) {
  return <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${TONOS[tono]}`}>{children}</span>;
}

function Kpi({ icono, titulo, valor, de, pildora, tono }: { icono: string; titulo: string; valor: string; de?: string; pildora: string; tono: keyof typeof TONOS }) {
  const borde = tono === "rojo" ? "border-red-500/50" : tono === "verde" ? "border-green-500/40" : "border-[#ff7a00]/40";
  return (
    <div className={`grid min-w-0 content-between gap-1 rounded-2xl border bg-[var(--card)] p-2.5 ${borde}`}>
      <div className="flex items-start gap-1.5">
        <span className="text-2xl leading-none" aria-hidden>{icono}</span>
        <span className="text-[11px] font-bold leading-tight">{titulo}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-1">
        <span className="font-[family-name:var(--font-condensada)] text-3xl font-bold leading-none">
          {valor}<span className="text-lg text-[var(--mu)]">{de}</span>
        </span>
        <Pildora tono={tono}>{pildora}</Pildora>
      </div>
    </div>
  );
}

function Barra({ v }: { v: number }) {
  return (
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--card2)]">
      <div className="h-full rounded-full bg-gradient-to-r from-[#ff7a00] to-[#ffb347] transition-all duration-500" style={{ width: `${Math.round(Math.min(1, v) * 100)}%` }} />
    </div>
  );
}

function Avance({ p, pts, meta }: { p: Persona; pts: number; meta: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <Avatar p={p} />
        <span className="min-w-0 flex-1 truncate font-semibold">{p.nombre.split(" ")[0]} <span className="text-[11px] text-[var(--mu)]">· {p.puesto}</span></span>
        <b className="font-[family-name:var(--font-condensada)] text-lg">{pts}<span className="text-[var(--mu)]">/{meta}</span></b>
      </div>
      <Barra v={meta ? pts / meta : 0} />
    </div>
  );
}

function Feed({ eventos }: { eventos: Evento[] }) {
  return (
    <ul className="grid gap-1.5">
      {eventos.map((e) => (
        <li key={e.id} className="flex items-start gap-2 text-sm">
          <span aria-hidden>{e.icono}</span>
          <span className="min-w-0 flex-1">{e.texto}</span>
          <span className="shrink-0 text-[10px] text-[var(--mu)]">{e.hora}</span>
        </li>
      ))}
    </ul>
  );
}

function Anillo({ valor, total }: { valor: number; total: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const f = total ? valor / total : 0;
  return (
    <div className="relative mx-auto my-2 h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} stroke="var(--card2)" strokeWidth="9" fill="none" />
        <circle cx="50" cy="50" r={r} stroke="#ff7a00" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <span>
          <span className="block font-[family-name:var(--font-condensada)] text-3xl font-bold leading-none">{valor}/{total}</span>
          <span className="text-[10px] text-[var(--mu)]">entregadas</span>
        </span>
      </div>
    </div>
  );
}

function EstadoPildora({ e, vencido }: { e: EstadoObj; vencido: boolean }) {
  if (e === "validado") return <Pildora tono="verde">Validado</Pildora>;
  if (e === "enviado") return <Pildora tono="naranja">En revisión</Pildora>;
  if (e === "regresado") return <Pildora tono="rojo">Regresado</Pildora>;
  return vencido ? <Pildora tono="rojo">Atrasado</Pildora> : <Pildora tono="naranja">Pendiente</Pildora>;
}

function Vacio({ texto }: { texto: string }) {
  return <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center text-sm text-[var(--mu)]">{texto}</p>;
}

function Boton({ children, onClick, chico, secundario, rojo, verde, disabled }: {
  children: React.ReactNode; onClick: () => void; chico?: boolean; secundario?: boolean; rojo?: boolean; verde?: boolean; disabled?: boolean;
}) {
  const color = secundario
    ? rojo
      ? "border border-red-500 text-red-500 bg-transparent"
      : "border border-[var(--line)] bg-[var(--card2)] text-[var(--tx)]"
    : rojo
      ? "bg-red-500 text-white"
      : verde
        ? "bg-green-500 text-white shadow-[0_6px_0_-2px_#15803d]"
        : "bg-[#ff7a00] text-white shadow-[0_6px_0_-2px_#c2410c]";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-xl font-bold transition active:translate-y-0.5 disabled:opacity-40 ${chico ? "px-3 py-1.5 text-xs" : "px-4 py-3 text-sm"} ${color}`}>
      {children}
    </button>
  );
}
