import type { ComponentType } from "react";

/** Lo que recibe cada demo. Llama narrar("...") en cada acción para actualizar "Qué está pasando". */
export type DemoProps = { narrar: (texto: string) => void };

/*
 * Registro de demos: id de la solución → componente.
 * Paso 2 del plan: aquí se van agregando los 5 demos del prototipo, uno por uno.
 */
export const DEMOS: Record<string, ComponentType<DemoProps>> = {};
