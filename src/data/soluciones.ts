/*
 * ARCHIVO DE DATOS DE LAS SOLUCIONES
 * ----------------------------------
 * Aquí viven todos los textos, precios y mensajes de WhatsApp.
 * Para cambiar un precio o un texto, edita solo este archivo.
 *
 * Para agregar una solución nueva:
 *   1. Agrega un registro en SOLUCIONES (copia uno y cambia los textos).
 *   2. Crea su demo en src/components/demos/ y regístralo en src/components/demos/index.ts.
 *
 * Videos: pon el archivo en public/videos/<id>.mp4 y su portada en public/videos/<id>.jpg,
 * y escribe aquí  video: { mp4: "/videos/<id>.mp4", portada: "/videos/<id>.jpg" }.
 * Mientras video sea null, la sección de video no aparece.
 */

export type Icono = "web" | "asistente" | "agenda" | "tablero" | "procesos" | "sistema";

export type Solucion = {
  /** Parte final de la liga: /demos/<id> */
  id: string;
  icono: Icono;
  /** Grupo en el dashboard */
  grupo: string;
  nombre: string;
  /** Frase bajo el título de la página */
  frase: string;
  /** Texto corto de la tarjeta del dashboard */
  tarjeta: string;
  precio: string;
  notaPrecio: string;
  /** Instrucción de la línea "Pruébalo" */
  pruebalo: string;
  /** Lo que dice "Qué está pasando" antes de que el cliente toque algo */
  narracionInicial: string;
  queEs: string;
  /** Exactamente 3 pasos */
  comoFunciona: [string, string, string];
  paraQuien: string;
  incluye: string[];
  /** ligas: página y redes del cliente real (solo ligas confirmadas) */
  caso?: { etiqueta: string; texto: string; ligas?: { texto: string; url: string }[] };
  /** Mensaje que se escribe solo al abrir WhatsApp */
  whatsapp: string;
  video: { mp4: string; portada: string } | null;
  /** Liga del demo funcional (con base de datos real). null mientras no esté publicado. */
  demoReal: string | null;
};

/** Página y redes de Gorilla Crown para su caso real. PENDIENTE: redes sociales (pedir ligas a Charlie). */
const GORILLA_CROWN = [{ texto: "Página web", url: "https://gorillacrown.com" }];

/** Tarjeta de páginas web: abre el portafolio dentro de este mismo sitio (/paginas-web). */
export const PAGINAS_WEB = {
  nombre: "Páginas web y tiendas en línea",
  grupo: "Páginas web",
  texto:
    "6 páginas de clientes en operación y 23 muestras por giro, con paquetes y precios. Ábrelas y navégalas aquí mismo.",
  precio: "desde $4,900",
  liga: "/paginas-web",
};

export const SOLUCIONES: Solucion[] = [
  {
    id: "asistente",
    icono: "asistente",
    grupo: "Automatización",
    nombre: "Asistente de redes y WhatsApp",
    frase:
      "Contesta solo los mensajes de Instagram, Facebook, TikTok y WhatsApp, con tus precios y tus respuestas.",
    tarjeta:
      "Contesta en segundos, a cualquier hora, y pasa la conversación a una persona cuando hace falta.",
    precio: "$8,900",
    notaPrecio: "implementación · $6,900 al mes · listo en 2 a 3 días",
    pruebalo: "Escribe como si fueras cliente o toca una pregunta. Pide hablar con una persona.",
    narracionInicial:
      "Son las 11:47 de la noche. El cliente preguntó precio y el asistente ya contestó.",
    queEs:
      "Un asistente entrenado con la información de tu negocio. Atiende todos tus canales desde un solo lugar y deja registrado qué pidió cada cliente.",
    comoFunciona: [
      "Nos das precios, horarios, ubicación y las preguntas que más te hacen.",
      "El asistente contesta al instante en todos tus canales, las 24 horas.",
      "Si el cliente pide algo fuera de lo normal, le pasa la conversación a tu equipo con el contexto.",
    ],
    paraQuien:
      "Negocios que reciben muchos mensajes y pierden ventas por contestar tarde o fuera de horario.",
    incluye: [
      "Respuestas 24/7 en redes y WhatsApp",
      "Entrenado con tus precios y productos",
      "Paso a una persona cuando hace falta",
      "Ajustes durante las primeras semanas",
    ],
    caso: { etiqueta: "Ya opera en:", texto: "Gorilla Crown y Perfumería Frizzia." },
    whatsapp: "Hola, vi el demo del asistente de redes de Solvera Labs y quiero informes",
    video: null,
    demoReal: null,
  },
  {
    id: "agenda",
    icono: "agenda",
    grupo: "Automatización",
    nombre: "Agenda automática de citas",
    frase:
      "Tus clientes apartan su cita solos, reciben confirmación y recordatorio, y tú ves la agenda llena.",
    tarjeta: "El cliente elige servicio, día y hora. Confirmación y recordatorio salen solos.",
    precio: "$5,900",
    notaPrecio: "pago único · $690 al mes",
    pruebalo: "Elige un negocio, aparta una cita con tus datos y recibe la confirmación real en tu correo y WhatsApp.",
    narracionInicial: "El cliente abre tu liga de citas. Solo ve los horarios que tienes libres.",
    queEs:
      "Una liga de citas con tus servicios y tus horarios reales. Cada cita cae directo en tu calendario y el cliente recibe sus avisos por WhatsApp.",
    comoFunciona: [
      "Definimos tus servicios, duración, precios y horarios de atención.",
      "El cliente aparta desde tu página, tu Instagram o un mensaje. Nadie puede tomar un horario ocupado.",
      "El sistema confirma, recuerda un día antes y te avisa de cada cita nueva.",
    ],
    paraQuien:
      "Consultorios, clínicas, estéticas, car wash, talleres y cualquier negocio que hoy agenda a mano por mensaje.",
    incluye: [
      "Liga de citas con tu marca",
      "Confirmación y recordatorio automáticos",
      "Citas directo en tu calendario",
      "Menos huecos y menos clientes que no llegan",
    ],
    caso: { etiqueta: "Ejemplos del demo:", texto: "un car wash, una estética y una clínica dental ficticios." },
    whatsapp: "Hola, vi el demo de agenda automática de Solvera Labs y quiero informes",
    video: null,
    demoReal: null,
  },
  {
    id: "tablero",
    icono: "tablero",
    grupo: "Automatización",
    nombre: "Organizador de proyectos",
    frase: "Un tablero donde todo tu equipo ve qué hay que hacer, quién lo lleva y para cuándo.",
    tarjeta: "Actividades, responsables, fechas y comentarios en un solo tablero para tu equipo.",
    precio: "$6,900",
    notaPrecio: "pago único · sin mensualidad",
    pruebalo: "Cambia el estado de una actividad, dicta una nueva por voz y mira el resumen que le llega a cada perfil.",
    narracionInicial: "Así arranca la semana: 16 actividades en 6 áreas, cada una con responsable y fecha compromiso. Dirección ve el avance sin pedir reportes.",
    queEs:
      "Un tablero en línea con las actividades de cada área, su responsable y su fecha compromiso. Se cargan a mano, por voz o pegando una lista, dentro del mismo tablero, y cada perfil recibe su resumen sin pedirlo.",
    comoFunciona: [
      "Cargamos tu plan de trabajo por área: actividades, responsables y fechas compromiso.",
      "Cada persona actualiza lo suyo desde el celular: escribiendo o dictando. Si mencionas a alguien, le llega aviso por correo.",
      "Cada perfil recibe su resumen de pendientes, avances, terminadas y atrasadas. Dirección ve todo.",
    ],
    paraQuien:
      "Equipos que llevan sus pendientes en chats y hojas sueltas, y dueños que quieren ver avances sin perseguir a nadie.",
    incluye: [
      "Tablero por área con acceso por usuario",
      "Alta de actividades a mano, por voz o pegando una lista",
      "Resumen automático por correo para cada perfil",
      "Comentarios con @mención y aviso por correo",
      "Tus datos quedan en tu propia hoja de cálculo",
    ],
    caso: {
      etiqueta: "Caso real:",
      texto: "el plan de mejora continua de Gorilla Crown se lleva en un tablero así.",
    },
    whatsapp: "Hola, vi el demo del organizador de proyectos de Solvera Labs y quiero informes",
    video: null,
    demoReal: null,
  },
  {
    id: "procesos",
    icono: "procesos",
    grupo: "Automatización",
    nombre: "Automatización de procesos",
    frase:
      "Las tareas repetitivas se hacen solas: leer correos, capturar datos, armar reportes, avisar al equipo.",
    tarjeta: "Lo que hoy alguien captura a mano, el sistema lo registra solo y sin errores.",
    precio: "desde $8,900",
    notaPrecio: "pago único · sin mensualidad, salvo herramientas con costo",
    pruebalo: "Lee facturas del correo, de las páginas de proveedores y del plan de surtido, mueve las reglas y mira los avisos que le llegan a Compras y a Almacén.",
    narracionInicial:
      "Hay facturas en el correo, pedidos en las páginas de proveedores y compras en el plan de surtido. Antes, alguien los capturaba uno por uno para saber qué venía en camino.",
    queEs:
      "Revisamos un proceso que hoy se hace a mano y lo dejamos corriendo solo. El ejemplo del demo es el archivo de arribos: el sistema junta las facturas pendientes, calcula cuándo llega cada cosa según tus reglas y avisa a Compras y a Almacén.",
    comoFunciona: [
      "Revisamos contigo el proceso actual, paso por paso.",
      "Conectamos tus correos, hojas de cálculo y sistemas para que los datos pasen solos.",
      "Tu equipo solo revisa las excepciones que el sistema marca.",
    ],
    paraQuien:
      "Negocios donde alguien pierde horas en Excel, correos o capturas que siempre son iguales.",
    incluye: [
      "Revisión del proceso actual",
      "Entradas, salidas o reportes automáticos",
      "Conexión entre hojas, correo o CRM",
      "Capacitación a tu equipo",
    ],
    caso: {
      etiqueta: "Caso real:",
      texto: "control de arribos de mercancía de Gorilla Crown.",
      ligas: GORILLA_CROWN,
    },
    whatsapp: "Hola, vi el demo de automatización de procesos de Solvera Labs y quiero informes",
    video: null,
    demoReal: null,
  },
  {
    id: "sistema",
    icono: "sistema",
    grupo: "Control total de tu empresa",
    nombre: "Sistema operativo de tu empresa",
    frase:
      "Una sola aplicación para toda tu operación: compras, almacén, pedidos y un asistente que responde con tus datos.",
    tarjeta:
      "Compras, almacén, pedidos y dirección en una sola aplicación hecha para tu forma de trabajar.",
    precio: "A la medida",
    // PENDIENTE con Charlie: ¿se quita la mención de consultoría aquí también?
    notaPrecio: "se cotiza después de una consultoría integral, desde $14,900",
    pruebalo: "Cambia de perfil: cuenta un pasillo como Almacén, apruébalo como Supervisor, arma una cotización en Ventas y mira cómo cambia todo en Dirección. Pregúntale al asistente.",
    narracionInicial: "Entraste como Dirección de Ruta Norte 4x4, una distribuidora ficticia. Ves objetivos, arribos, pagos, ventas y al equipo trabajando, en una pantalla.",
    queEs:
      "Tu propia aplicación, con un módulo por área y un usuario por persona. Todo está conectado: lo que recibe almacén actualiza el inventario, y lo que vende ventas lo descuenta.",
    comoFunciona: [
      "Hacemos sesiones con cada área para entender cómo trabaja de verdad.",
      "Construimos los módulos sobre esa información y los conectamos entre sí.",
      "Cada persona entra con su usuario y ve solo lo suyo. Dirección ve todo.",
    ],
    paraQuien:
      "Empresas con almacén, compras y ventas que hoy operan con varios archivos, chats y sistemas que no se hablan.",
    incluye: [
      "Módulos por área, conectados",
      "Usuarios y permisos por puesto",
      "Asistente con IA que consulta tus datos",
      "El costo de la consultoría se descuenta en soluciones de $50,000 o más",
    ],
    caso: {
      etiqueta: "Caso real:",
      texto: "este demo es una copia de la app de operaciones que usa Gorilla Crown, con una distribuidora ficticia.",
      ligas: GORILLA_CROWN,
    },
    whatsapp: "Hola, vi el demo del sistema operativo de empresa de Solvera Labs y quiero una consultoría",
    video: null,
    demoReal: null,
  },
];

export function buscarSolucion(id: string) {
  return SOLUCIONES.find((s) => s.id === id);
}
