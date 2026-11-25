export const WHATSAPP = "523310742087";

/** Liga de WhatsApp con el mensaje ya escrito. */
export function waLink(mensaje: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

export const MENSAJE_GENERAL = "Hola, vi los demos de Solvera Labs y quiero informes";
export const MENSAJE_DIAGNOSTICO =
  "Hola, quiero agendar mi diagnóstico gratuito de 30 minutos con Solvera Labs";
