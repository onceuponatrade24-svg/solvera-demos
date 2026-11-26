/*
 * Negocios ficticios del demo de Agenda automática.
 * Lo usan la pantalla del demo y el envío real (src/app/api/demos/agenda/route.ts).
 * El servidor toma nombre, precio y colores de aquí, no de lo que mande el navegador.
 */

export type ServicioAgenda = { id: string; nombre: string; duracion: string; minutos: number; precio: string };

export type NegocioAgenda = {
  id: "carwash" | "estetica" | "dentista";
  pestana: string;
  nombre: string;
  subdominio: string;
  direccion: string;
  color: string;
  colorSuave: string;
  colorTexto: string;
  foto: string;
  servicios: ServicioAgenda[];
  extra: { etiqueta: string; opciones: string[] };
  /** "del autolavado", "de la estética"... para los textos */
  de: string;
};

export const BUSINESS_THEMES: NegocioAgenda[] = [
  {
    id: "carwash",
    pestana: "Car wash",
    nombre: "AutoSpa Express",
    subdominio: "citas.autospagdl.mx",
    direccion: "Av. Patria 1450, Zapopan, Jal.",
    color: "#0284C7",
    colorSuave: "#F0F9FF",
    colorTexto: "#0369A1",
    foto: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1000&q=80",
    servicios: [
      { id: "express", nombre: "Lavado Express + Cera", duracion: "45 min", minutos: 45, precio: "$220" },
      { id: "interior", nombre: "Lavado Interior Profundo", duracion: "2 h", minutos: 120, precio: "$850" },
      { id: "ceramico", nombre: "Pulido y Encerado Cerámico", duracion: "3 h", minutos: 180, precio: "$1,600" },
    ],
    extra: { etiqueta: "Tipo de vehículo", opciones: ["Sedán", "SUV / Camioneta", "Pick-up"] },
    de: "del autolavado",
  },
  {
    id: "estetica",
    pestana: "Estética",
    nombre: "Aura Studio & Beauty",
    subdominio: "citas.aurastudio.mx",
    direccion: "Calle Lerdo de Tejada 2210, Guadalajara, Jal.",
    color: "#BE185D",
    colorSuave: "#FDF2F8",
    colorTexto: "#9D174D",
    foto: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
    servicios: [
      { id: "corte", nombre: "Corte y Styling", duracion: "1 h", minutos: 60, precio: "$450" },
      { id: "color", nombre: "Diseño de Color / Balayage", duracion: "3 h", minutos: 180, precio: "$2,200" },
      { id: "mani", nombre: "Manicure Gel + Spa", duracion: "1 h", minutos: 60, precio: "$380" },
    ],
    extra: { etiqueta: "Especialista", opciones: ["Cualquiera disponible", "Valeria M.", "Sofía R."] },
    de: "de la estética",
  },
  {
    id: "dentista",
    pestana: "Dentista",
    nombre: "Clínica Dental Primavera",
    subdominio: "citas.dentalprimavera.mx",
    direccion: "Av. Hidalgo 1820, Guadalajara, Jal.",
    color: "#0D9488",
    colorSuave: "#F0FDFA",
    colorTexto: "#0F766E",
    foto: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80",
    servicios: [
      { id: "valoracion", nombre: "Valoración", duracion: "30 min", minutos: 30, precio: "$350" },
      { id: "limpieza", nombre: "Limpieza dental", duracion: "1 h", minutos: 60, precio: "$650" },
      { id: "blanqueamiento", nombre: "Blanqueamiento", duracion: "1 h", minutos: 60, precio: "$1,900" },
    ],
    extra: { etiqueta: "Motivo", opciones: ["Primera vez", "Seguimiento", "Urgencia"] },
    de: "de la clínica",
  },
];

export const HORAS_AGENDA = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export function buscarNegocio(id: string) {
  return BUSINESS_THEMES.find((n) => n.id === id);
}

/** Número de WhatsApp de Solvera para la conversación de prueba. */
export const SOLVERA_WA = process.env.NEXT_PUBLIC_SOLVERA_WA_NUMBER || "5213310742087";
