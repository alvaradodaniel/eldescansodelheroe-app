# El Descanso del Héroe · Reservaciones

Aplicación de reservaciones con React 19, TypeScript, Vite, TanStack Router y Firebase. El frontend consulta eventos/mesas y la reserva y cancelación ocurren exclusivamente en Cloud Functions. El diseño actual se conserva.

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

Abre `http://localhost:5173`. Firebase CLI requiere Java 21 o superior. Si el
`java` predeterminado de la terminal apunta a una versión anterior, establece
`JAVA_HOME` al directorio de un JDK 21 antes de iniciar `npm run emulators`.

En desarrollo la app conecta Authentication (`127.0.0.1:9099`), Firestore (`127.0.0.1:8080`) y Functions (`127.0.0.1:5001`) usando exclusivamente `demo-el-descanso`; si se configura otro ID de proyecto, la app falla de forma cerrada. No se requiere `.env.local` para los emuladores. El comando `npm run emulators` compila Functions antes de iniciarlas. No despliegues desde este entorno.

## Configuración y datos

La configuración web de Firebase está centralizada en `src/lib/firebase.ts`. Para producción se requieren `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_APP_ID`; configura esos valores en el entorno de hosting, no los guardes en el repositorio. Analytics no está implementado. En desarrollo la conexión a emuladores está forzada.

Firestore contiene `events/{eventId}` (nombre, descripción, `startsAt`, `opensAt`, zona horaria y estado), `events/{eventId}/tables/{tableId}` (capacidad, `reservedCount`, estado y datos descriptivos) y `events/{eventId}/reservations/{uid}` (máximo una reserva por usuario y evento). Firestore está previsto en `northamerica-south1`; Functions 2nd gen en `us-south1`.

Las reglas productivas viven en `firestore.rules` y el emulador de pruebas de Functions conserva su configuración aislada en `firebase.emulator.json`/`firestore.emulator.rules`. Clientes pueden leer eventos publicados y sus mesas, consultar únicamente su reserva y no escribir documentos. Las callables `reserveSeat` y `cancelReservation` mantienen transaccionalmente el contador de la mesa y el estado de la reserva.

## Crear datos de prueba

Abre Firebase Emulator UI en `http://127.0.0.1:4000` (o Firestore en la pestaña correspondiente) y crea `events/{id}` con `name`, `tagline`, `description`, `startsAt` y `opensAt` como timestamps, `timezone: "America/Chihuahua"`, `status: "published"`, `band`, `createdAt` y `updatedAt`. Crea `events/{id}/tables/{tableId}` con `name`, `capacity` entero positivo, `reservedCount: 0`, `status: "active"`, `createdAt` y `updatedAt`; `description`, `game`, `host`, `level` son opcionales. El frontend inicia la sesión anónima en Auth Emulator. El estado publicado hace visible el evento; la callable permite reservar al alcanzar `opensAt`.

## Funcionalidades implementadas

- Inicio de sesión anónimo con persistencia local y UID de Firebase Auth.
- Consulta en tiempo real de eventos publicados, evento individual y mesas.
- Estados de carga, error y lista vacía.
- Reserva de un lugar y cancelación vía callable, con feedback de errores y protección transaccional ante solicitudes repetidas o concurrentes.
- Consulta en vivo de la reserva propia y reglas que bloquean escrituras directas.
- Pruebas de Functions existentes y pruebas de reglas de Firestore.

El nickname solo se usa para presentación. La sesión anónima no puede recuperarse en otro dispositivo. No hay inicio Google ni panel administrativo.

## Pruebas y verificaciones

```sh
npm test
npm run test:security
npm run functions:test
npm run functions:build
npm run functions:lint
npx tsc --noEmit
npm run lint
npm run build
```

La suite de Rules requiere el emulador; `npm run test:security` lo inicia con proyecto demo. La política actual de cancelación permite cancelar hasta `startsAt`, pero sigue siendo provisional y pendiente de aprobación del negocio. Antes de producción faltan aprobación de esa política, configuración/secretos de hosting, revisión operativa y validación con el proyecto Firebase real en un proceso separado.
