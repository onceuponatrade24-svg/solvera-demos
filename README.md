# Demos Solvera Labs

Dashboard público donde un prospecto prueba cada solución de Solvera Labs antes de contratarla.
Next.js (App Router) + Tailwind. Se publica en Vercel.

## Dónde cambiar cosas

| Quiero cambiar… | Archivo |
|---|---|
| Un precio, un texto, el mensaje de WhatsApp o el caso real | `src/data/soluciones.ts` |
| El video de una solución | Pon `public/videos/<id>.mp4` y `<id>.jpg`, y llena el campo `video` en `src/data/soluciones.ts` |
| La liga del demo real (con base de datos) | Campo `demoReal` en `src/data/soluciones.ts` |
| Un demo interactivo | `src/components/demos/` |
| Colores y estilos de marca | `tailwind.config.ts` y `src/app/globals.css` |

## Agregar una solución nueva

1. Copia un registro en `src/data/soluciones.ts` y cambia sus textos.
2. Crea su demo en `src/components/demos/` y regístralo en `src/components/demos/index.ts`.

## Verlo en tu computadora

Necesitas Node.js 20 o más nuevo.

```
npm install
npm run dev
```

Abre http://localhost:3000

## Carpetas que no se publican

`agenda-solvera/` (demo funcional, va en su propio despliegue) y `referencia/` (prototipo original).
Están en `.vercelignore`.
