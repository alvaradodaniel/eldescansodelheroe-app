# El Descanso del Héroe · Reservaciones

Aplicación de reservaciones con React, TypeScript, TanStack Start/Router y Firebase. El frontend lee eventos, mesas y la reserva propia. Las reservas, cancelaciones y operaciones administrativas se ejecutan en Cloud Functions.

## Ejecutar localmente

Requisitos: Node.js 22.12+, Java 21+ y npm.

```sh
npm ci --legacy-peer-deps
npm run functions:install
npm run emulators
```

En otra terminal, desde la raíz:

```sh
npm run dev
```

Abre `http://localhost:5173`. La app de desarrollo se conecta únicamente a los emuladores del proyecto `demo-el-descanso`: Authentication (`127.0.0.1:9099`), Firestore (`127.0.0.1:8080`) y Functions (`127.0.0.1:5001`). No necesita `.env.local` para este modo. `npm run emulators` compila Functions antes de iniciarlas. No uses este flujo para desplegar.

Firebase Emulator Suite requiere Java 21 o superior. Si `java` apunta a otra versión, configura `JAVA_HOME` con la ruta de un JDK 21 antes de iniciar los emuladores.

## Firebase y datos

La configuración web de Firebase está centralizada en `src/lib/firebase.ts`. Para producción se requieren `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_APP_ID`. En Cloudflare Workers Builds configúralas como variables de build. Son configuración pública del SDK web; nunca incluyas credenciales privadas de Admin SDK. Analytics no está implementado.

Firestore usa esta estructura:

- `events/{eventId}`: nombre, descripción, fechas (`startsAt`, `opensAt`), zona horaria y estado.
- `events/{eventId}/tables/{tableId}`: capacidad, contador `reservedCount`, estado y datos descriptivos opcionales.
- `events/{eventId}/reservations/{uid}`: una reserva por usuario y evento; el UID es el ID del documento.

Las fechas se muestran en `America/Chihuahua`. El color de los eventos y las mesas se calcula en el código; no se guarda en Firestore.

Los eventos publicados y cancelados se muestran en la vista pública durante el evento y hasta 48 horas después de su inicio. Los eventos cancelados se identifican como tales y no aceptan reservas. Los estados borrador y cerrado no son visibles al público.

Las reglas productivas viven en `firestore.rules`. Los clientes no escriben eventos, mesas ni reservaciones directamente. Las callables validan la autenticación, permisos y capacidad, y actualizan los contadores y reservas con transacciones. Las operaciones administrativas requieren el Custom Claim `admin: true`; consulta [ADMIN_SETUP.md](ADMIN_SETUP.md) para preparar la primera cuenta.

La configuración de emuladores de pruebas de Functions vive en `firebase.emulator.json` y `firestore.emulator.rules`, separada de las reglas productivas. El alias `default` de `.firebaserc` apunta al demo; el alias `production` apunta al proyecto productivo. Para comandos de producción selecciona el alias explícitamente.

## Pruebas y verificaciones

Ejecuta los grupos de pruebas de uno en uno. Cierra cualquier emulador que ya esté usando sus puertos (`8080` para Firestore, `9099` para Auth) antes de lanzar los comandos de pruebas de emuladores.

```sh
npm test
npm run test:security
npm run functions:test
npm run functions:build
npm run functions:lint
npx tsc --noEmit
npm run lint
npm run build
npm run preview
```

`npm test` ejecuta las pruebas unitarias del frontend; las pruebas de reglas requieren `npm run test:security`, que inicia Firestore Emulator con el proyecto demo. `npm run functions:test` inicia Auth y Firestore Emulator y ejecuta las pruebas de backend. `npm run preview` sirve localmente el build de Vite/Cloudflare. Estos comandos no despliegan.

La política actual permite cancelar una reserva hasta el inicio del evento; sigue pendiente de aprobación del negocio. Antes de producción revisa esa política, configura los dominios y variables de hosting, despliega Functions y reglas al proyecto correcto y valida el flujo con un evento de prueba.

## Despliegue

La aplicación web se publica como Cloudflare Worker. Revisa [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md). Firebase Functions y Firestore Rules se despliegan aparte; especifica `--project production` para no apuntar al proyecto demo.
