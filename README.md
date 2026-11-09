# El Descanso del Héroe · Reservaciones

Aplicación independiente de reservaciones, construida con React, TypeScript, Vite,
TanStack Router y Tailwind CSS. El flujo actual utiliza datos ficticios locales;
no hay conexión a Firebase ni a ningún backend.

## Desarrollo

Requiere Node.js 22.12 o superior.

```sh
npm install
npm run dev
```

La gestión de dependencias y el bloqueo de versiones se realizan exclusivamente
con `package.json` y `package-lock.json`. Para una instalación reproducible usa
`npm ci`.

## Verificación y producción

```sh
npm run lint
npm run test
npm run build
npm run preview
```

`npm run build` genera el cliente y servidor en `dist/`; `npm run preview`
lo levanta localmente para revisar las rutas antes de publicarlo.

Los datos y reglas del dominio de reservaciones viven en
`src/features/reservations/`. Los recursos gráficos independientes se sirven desde
`public/images/brand/`. El sitio público Astro ubicado en el proyecto vecino no es
modificado por esta aplicación.

## Estructura

- `src/features/`: módulos de negocio aislados; reservaciones es el primer módulo.
- `src/components/layout/`: shell compartido de la aplicación.
- `src/components/ui/`: componentes visuales reutilizables.
- `src/routes/`: vistas y rutas de TanStack Router.
- `src/styles.css`: tokens de marca y utilidades Tailwind pixel-RPG.
