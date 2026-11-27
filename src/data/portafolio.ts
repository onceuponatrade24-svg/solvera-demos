/*
 * PORTAFOLIO DE PÁGINAS WEB
 * -------------------------
 * Páginas de clientes y muestras por giro. Para agregar una página, copia un registro.
 * embebible: false cuando la página no se deja mostrar dentro de otra (se abre en pestaña nueva).
 */

export type Paquete = {
  id: string;
  etiqueta: string;
  nombre: string;
  precio: string;
  notaPrecio: string;
  texto: string;
  incluye: string[];
  mantenimiento: string;
  notaMantenimiento: string;
  tiempo: string;
};

export type Sitio = {
  id: string;
  nombre: string;
  /** Giro o tipo de página */
  tipo: string;
  texto: string;
  url: string;
  /** Paquete con el que se hizo. Vacío si no se muestra. */
  paquete?: { nombre: string; precio: string };
  embebible: boolean;
};

export const PAQUETES: Paquete[] = [
  {
    id: "basica",
    etiqueta: "Página básica",
    nombre: "Web Básica",
    precio: "$4,900",
    notaPrecio: "pago único",
    texto: "Una página profesional que presenta tu negocio y lleva a tus clientes directo a WhatsApp.",
    incluye: [
      "Diseño con tu marca: logo, colores y fotos",
      "Servicios, galería, opiniones y preguntas frecuentes",
      "Botón directo a WhatsApp y llamada",
      "Se ve perfecto en celular",
    ],
    mantenimiento: "$765 al mes",
    notaMantenimiento:
      "Página siempre en línea, protección contra hackeos, respaldo de tu información y reporte de visitas cada mes.",
    tiempo: "Lista en 2 a 3 días",
  },
  {
    id: "intermedia",
    etiqueta: "Página con catálogo",
    nombre: "Web Intermedia",
    precio: "$8,500",
    notaPrecio: "pago único",
    texto:
      "Tu catálogo completo en línea para que tus clientes vean productos y precios y te manden su pedido armado.",
    incluye: [
      "Todo lo de la Web Básica",
      "Catálogo de productos con fotos y precios",
      "Carrito o pedido directo por WhatsApp",
      "Opcional: agenda de citas en línea",
    ],
    mantenimiento: "$1,260 al mes",
    notaMantenimiento: "Todo lo de la Básica, más reporte de ventas cada mes con la base de datos de tus clientes.",
    tiempo: "Lista en 2 a 3 días",
  },
  {
    id: "medida",
    etiqueta: "Desarrollo a medida",
    nombre: "Sistema a tu medida",
    precio: "desde $25,000",
    notaPrecio: "según el proyecto",
    texto: "Un sistema de ventas hecho para cómo trabaja tu empresa, como el de Gorilla Crown.",
    incluye: [
      "Tienda en línea con miles de productos",
      "Cuentas de cliente y distribuidor, panel de administración",
      "Asistente virtual con inteligencia artificial",
      "Tickets, promociones, marcas y lo que tu negocio necesite",
    ],
    mantenimiento: "desde $1,728 al mes",
    notaMantenimiento:
      "Según lo que lleve tu proyecto. El asistente con IA te dice qué productos piden tus clientes y cuáles se venden más.",
    tiempo: "Tiempo según el proyecto",
  },
];

const BASICA = { nombre: "Página básica", precio: "$4,900" };
const CATALOGO = { nombre: "Página con catálogo", precio: "$8,500" };

export const CLIENTES: Sitio[] = [
  {
    id: "gorilla-crown",
    nombre: "Gorilla Crown",
    tipo: "Tienda en línea · Off-road",
    texto: "Más de 10,000 productos, cuentas de cliente y asistente con IA",
    url: "https://gorillacrown.com",
    paquete: { nombre: "Desarrollo a medida", precio: "desde $25,000" },
    embebible: true,
  },
  {
    id: "simpson-race-products",
    nombre: "Simpson Race Products México",
    tipo: "Tienda en línea · Equipo de competencia",
    texto: "Distribuidor autorizado: asientos, cascos y equipo de seguridad, con carrito y asesoría por WhatsApp",
    url: "https://simpsonraceproducts.com.mx",
    // PENDIENTE con Charlie: ¿con qué paquete se hizo? Mientras, no se muestra precio.
    embebible: true,
  },
  {
    id: "xolo",
    nombre: "XOLO Offroad Lighting",
    tipo: "Catálogo · Iluminación",
    texto: "Catálogo por categoría con fichas técnicas",
    url: "https://xolo-offroad-lighting.vercel.app",
    paquete: CATALOGO,
    embebible: true,
  },
  {
    id: "frizzia",
    nombre: "Perfumería Frizzia",
    tipo: "Tienda en línea · Perfumería",
    texto: "Catálogo con filtros, carrito y venta por WhatsApp",
    url: "https://www.perfumeriafrizzia.com/",
    paquete: CATALOGO,
    embebible: false,
  },
  {
    id: "gcpp",
    nombre: "GCPP Performance",
    tipo: "Catálogo · Iluminación LED",
    texto: "Catálogo de productos con certificaciones",
    url: "https://gcpperformance.com",
    paquete: CATALOGO,
    embebible: true,
  },
  {
    id: "owl-whips",
    nombre: "Owl Whips",
    tipo: "Marca · Accesorios LED",
    texto: "Sitio de marca con video y cotización por WhatsApp",
    url: "https://owlwhips.com",
    paquete: BASICA,
    embebible: true,
  },
];

const V = "https://solvera-vistas.vercel.app/vista/";
const muestra = (slug: string, tipo: string, nombre: string, texto: string): Sitio => ({
  id: slug,
  nombre,
  tipo,
  texto,
  url: `${V}${slug}/`,
  paquete: BASICA,
  embebible: true,
});

export const MUESTRAS: Sitio[] = [
  muestra("comercio-boutique", "Boutique y comercio", "Casa Oficio", "Florerías, uniformes, ropa, zapaterías"),
  muestra("clinicas-especialidad", "Clínicas y laboratorios", "Centro Médico Arboledas", "Clínicas, laboratorios, diagnóstico, pediatría"),
  muestra("academias", "Academias", "Academia La Higuera", "Danza, karate, idiomas, centros educativos"),
  muestra("escuelas", "Escuelas y colegios", "Colegio Arboleda", "Colegios, kínder, primarias, bachilleratos"),
  muestra("fitness-academias", "Gimnasios y deporte", "Club Deportivo La Cima", "Gimnasios, pilates, natación, crossfit, pádel"),
  muestra("dentistas", "Dentistas", "Clínica Dental Primavera", "Consultorios y clínicas dentales"),
  muestra("veterinarias", "Veterinarias", "Hospital Veterinario del Parque", "Clínicas veterinarias y estéticas caninas"),
  muestra("estetica-spa", "Estéticas y spas", "Estudio Lila Spa & Belleza", "Salones de belleza, uñas, spas, barberías"),
  muestra("restaurantes-cafes", "Restaurantes y cafés", "Casa Nixta Cocina & Café", "Restaurantes, cafeterías, comida"),
  muestra("alimentos-artesanales", "Alimentos artesanales", "La Alacena Jalisciense", "Productos artesanales, purificadoras, alimentos"),
  muestra("hoteles-boutique", "Hoteles", "Casona Santa Cecilia", "Hoteles y hospedaje"),
  muestra("tours-agencias", "Tours y agencias de viaje", "Viajes Cantera", "Agencias de viajes, tours, excursiones"),
  muestra("eventos-bodas", "Eventos y bodas", "Casa Magnolia Eventos", "Banquetes, salones, decoración, bodas"),
  muestra("inmobiliarias", "Inmobiliarias", "Raíz Urbana Bienes Raíces", "Bienes raíces, venta y renta"),
  muestra("arquitectura-construccion", "Arquitectura y construcción", "Estudio Terrena", "Constructoras, arquitectos, ingeniería"),
  muestra("talleres-automotrices", "Talleres automotrices", "Taller Mecánico La Central", "Talleres mecánicos, refaccionarias, autos"),
  muestra("seguridad-electronica", "Seguridad electrónica", "Centinela Seguridad", "Alarmas, CCTV, cámaras, seguridad"),
  muestra("servicios-hogar", "Servicios para hogar y oficina", "Multiservicios Robles", "Limpieza, mantenimiento, tintorerías, plomería"),
  muestra("manufactura-industrial", "Manufactura industrial", "Maquinados Occidente", "Maquinados, fábricas, imprentas"),
  muestra("logistica-aduanas", "Logística y aduanas", "Enlace Cargo", "Paquetería, fletes, agencias aduanales"),
  muestra("agro-campo", "Agro y campo", "Agrocentro El Surco", "Tractores, semillas, riego, agroquímicos"),
  muestra("ambiental-residuos", "Ambiental y residuos", "Ambiental Atemajac", "Recolección de residuos, reciclaje"),
  muestra("energia-solar", "Energía solar", "Solar de Occidente", "Paneles solares, calentadores, tratamiento de agua"),
];

export function buscarSitio(id: string) {
  return [...CLIENTES, ...MUESTRAS].find((s) => s.id === id);
}
