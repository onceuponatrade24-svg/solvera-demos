import { NextResponse } from "next/server";
import { buscarNegocio, HORAS_AGENDA } from "@/data/agenda";

/*
 * Envío real del demo de Agenda.
 * POST /api/demos/agenda
 * - Correo: Resend (RESEND_API_KEY, RESEND_FROM_EMAIL).
 * - WhatsApp: webhook que dispara la plantilla aprobada (WHATSAPP_DEMO_WEBHOOK_URL).
 * Si falta alguna llave, no truena: responde success y dice qué no se mandó.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Freno simple contra abuso: máximo 5 citas por IP cada 10 minutos (por instancia).
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 5;
const intentos = new Map<string, number[]>();

function permitido(ip: string) {
  const ahora = Date.now();
  const lista = (intentos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (lista.length >= MAX_POR_VENTANA) {
    intentos.set(ip, lista);
    return false;
  }
  lista.push(ahora);
  intentos.set(ip, lista);
  if (intentos.size > 5000) intentos.clear();
  return true;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Datos inválidos." }, { status: 400 });
  }

  // Campo trampa: si un bot lo llena, fingimos éxito y no mandamos nada.
  if (texto(body.website, 200)) {
    return NextResponse.json({ success: true, folio: folio(), emailSent: false, whatsappSent: false });
  }

  const negocio = buscarNegocio(texto(body.businessId, 20));
  const servicio = negocio?.servicios.find((s) => s.id === texto(body.serviceId, 40));
  const extraOption = texto(body.extraOption, 60);
  const dayISO = texto(body.dayISO, 10);
  const day = texto(body.day, 30);
  const time = texto(body.time, 5);
  const customerName = texto(body.customerName, 60);
  const customerPhone = texto(body.customerPhone, 20).replace(/\D/g, "");
  const customerEmail = texto(body.customerEmail, 120);

  const valido =
    negocio &&
    servicio &&
    negocio.extra.opciones.includes(extraOption) &&
    /^\d{4}-\d{2}-\d{2}$/.test(dayISO) &&
    day.length > 3 &&
    HORAS_AGENDA.includes(time) &&
    customerName.length >= 2 &&
    customerPhone.length === 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customerEmail);

  if (!valido || !negocio || !servicio) {
    return NextResponse.json({ success: false, error: "Revisa los datos de la cita." }, { status: 400 });
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!permitido(ip)) {
    return NextResponse.json(
      { success: false, error: "Ya hiciste varias pruebas seguidas. Espera unos minutos y vuelve a intentar." },
      { status: 429 },
    );
  }

  const codigo = folio();
  const cita = {
    folio: codigo,
    businessId: negocio.id,
    businessName: negocio.nombre,
    subdomain: negocio.subdominio,
    accentColor: negocio.color,
    service: servicio.nombre,
    duration: servicio.duracion,
    price: servicio.precio,
    extraLabel: negocio.extra.etiqueta,
    extraOption,
    day,
    dayISO,
    time,
    customerName,
    customerPhone,
    customerEmail,
  };

  const calendario = ligaCalendario(cita, servicio.minutos, negocio.direccion);

  const [emailSent, whatsappSent] = await Promise.all([
    mandarCorreo(cita, calendario),
    mandarWhatsApp({ ...cita, whatsappNumber: `521${customerPhone}`, calendarUrl: calendario }),
  ]);

  return NextResponse.json({ success: true, folio: codigo, emailSent, whatsappSent });
}

function folio() {
  return `SLV-${Math.floor(1000 + Math.random() * 9000)}`;
}

type Cita = {
  folio: string;
  businessName: string;
  subdomain: string;
  accentColor: string;
  service: string;
  duration: string;
  price: string;
  extraLabel: string;
  extraOption: string;
  day: string;
  dayISO: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
};

function ligaCalendario(c: Cita, minutos: number, direccion: string) {
  const [y, m, d] = c.dayISO.split("-").map(Number);
  const [h, mi] = c.time.split(":").map(Number);
  const inicio = new Date(Date.UTC(y, m - 1, d, h, mi));
  const fin = new Date(inicio.getTime() + minutos * 60000);
  const f = (t: Date) => t.toISOString().replace(/[-:]/g, "").slice(0, 15); // hora local, sin Z
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${c.service} · ${c.businessName}`,
    dates: `${f(inicio)}/${f(fin)}`,
    ctz: "America/Mexico_City",
    details: `Folio #${c.folio}. Cita de demostración de la Agenda Automática de Solvera Labs.`,
    location: direccion,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function mandarCorreo(c: Cita, calendario: string) {
  const llave = process.env.RESEND_API_KEY;
  if (!llave) {
    console.warn("[agenda] Falta RESEND_API_KEY: no se mandó el correo.");
    return false;
  }
  const de = process.env.RESEND_FROM_EMAIL || "Solvera Labs Demos <demos@solveralabs.ai>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${llave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: de,
        to: [c.customerEmail],
        subject: `✅ Cita confirmada en ${c.businessName} (${c.day} - ${c.time})`,
        html: correoHtml(c, calendario),
      }),
    });
    if (!r.ok) {
      console.error("[agenda] Resend respondió", r.status, await r.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[agenda] Error al mandar correo", e);
    return false;
  }
}

async function mandarWhatsApp(datos: Cita & { whatsappNumber: string; calendarUrl: string }) {
  const url = process.env.WHATSAPP_DEMO_WEBHOOK_URL;
  if (!url) {
    console.warn("[agenda] Falta WHATSAPP_DEMO_WEBHOOK_URL: no se mandó el WhatsApp.");
    return false;
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!r.ok) {
      console.error("[agenda] Webhook de WhatsApp respondió", r.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[agenda] Error al llamar el webhook de WhatsApp", e);
    return false;
  }
}

function correoHtml(c: Cita, calendario: string) {
  const color = c.accentColor;
  const fila = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#787878;font-size:14px">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#1a1a1a;font-size:14px">${esc(v)}</td></tr>`;
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:${color};padding:22px 24px;color:#ffffff">
<div style="font-size:13px;opacity:.85">${esc(c.subdomain)}</div>
<div style="font-size:22px;font-weight:800;margin-top:4px">${esc(c.businessName)}</div>
</td></tr>
<tr><td style="padding:24px">
<div style="font-size:20px;font-weight:800;color:#1a1a1a">¡Hola ${esc(c.customerName)}, tu cita está confirmada!</div>
<div style="display:inline-block;margin-top:10px;padding:6px 12px;border-radius:999px;background:${color}1a;color:${color};font-weight:800;font-size:14px">Folio #${esc(c.folio)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:1px solid #ececec;border-bottom:1px solid #ececec">
${fila("Servicio", c.service)}${fila("Duración", c.duration)}${fila("Precio", c.price)}${fila("Día", c.day)}${fila("Hora", c.time)}${fila(c.extraLabel, c.extraOption)}
</table>
<div style="text-align:center;margin-top:22px">
<a href="${esc(calendario)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-weight:800;padding:13px 26px;border-radius:999px;font-size:15px">Agregar a Google Calendar</a>
</div>
<p style="margin-top:22px;font-size:13px;color:#787878;line-height:1.5">Un día antes te llegará tu recordatorio. Si necesitas cambiar la cita, responde a tu WhatsApp de confirmación.</p>
</td></tr>
<tr><td style="background:#fff6ee;padding:16px 24px;font-size:12px;color:#787878;line-height:1.5">
Esta es una demostración en vivo de la <b style="color:#ff6a00">Agenda Automática de Solvera Labs</b>. El negocio es ficticio y la cita no es real.<br>
¿Quieres esto para tu negocio? Escríbenos por WhatsApp al 33 1074 2087.
</td></tr>
</table></td></tr></table></body></html>`;
}
