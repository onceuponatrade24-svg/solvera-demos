import type { ComponentType } from "react";
import Agenda from "./Agenda";

/** Lo que recibe cada demo. Llama narrar("...") en cada acción para actualizar "Qué está pasando". */
export type DemoProps = { narrar: (texto: string) => void };

/*
 * Registro de demos: id de la solución → componente.
 * Para agregar un demo nuevo: crea su archivo en esta carpeta y agrégalo aquí.
 */
export const DEMOS: Record<string, ComponentType<DemoProps>> = {
  agenda: Agenda,
};
