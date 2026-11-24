# Arquitectura de Firebase

La app mantiene el dominio de reservaciones en `src/features/reservations/`. Las rutas ensamblan vistas; los tipos visuales, lógica, hooks, componentes y adaptadores viven en el feature. La conversión entre documentos Firestore y modelos de UI ocurre en el límite Firebase. `src/lib/firebase.ts` inicializa el SDK web. El Admin SDK se usa únicamente en `functions/`.

## Datos y estados

- `events/{eventId}` contiene `name`, `description`, `startsAt`, `opensAt`, `timezone`, `status` y marcas de tiempo. Los estados administrativos son `draft`, `published`, `closed` y `cancelled`.
- `events/{eventId}/tables/{tableId}` contiene nombre, capacidad, `reservedCount`, estado (`active` o `closed`) y campos descriptivos opcionales como `game`, `host` y `description`.
- `events/{eventId}/reservations/{uid}` contiene la reserva del usuario, con nickname de presentación, mesa, estado y marcas de tiempo. El ID del documento es el UID autenticado.

Las fechas se guardan como Firestore `Timestamp` y se presentan usando `America/Chihuahua`. Los colores de banda de eventos y mesas se derivan del día y del orden en el código; no son datos persistidos.

## Lecturas públicas y administración

El cliente escucha eventos cuyo estado es `published` o `cancelled`. Los eventos se muestran hasta 48 horas después de su inicio. Un evento cancelado se puede consultar para mostrar su estado, pero no admite reservaciones. Las lecturas de sus mesas también están permitidas para ese aviso. Los eventos `draft` y `closed` no son legibles por usuarios públicos.

Los clientes autenticados solo leen su propio documento de reserva. Las reglas niegan las escrituras directas de clientes en eventos, mesas y reservas. Las lecturas administrativas requieren un token con Custom Claim booleano `admin: true`.

El panel privado gestiona eventos, mesas, reservaciones y plantillas semanales. Las callables administrativas validan el claim en backend; las escrituras usan Admin SDK. `adminDeleteEvent` cierra primero el evento dentro de una transacción para impedir nuevas reservas y después elimina recursivamente el evento, mesas y reservas. Esta acción es destructiva y solo está disponible para administradores.

## Reservas, concurrencia y cancelación

`reserveSeat` toma la identidad de Firebase Auth, valida la apertura, el estado del evento y de la mesa, que el evento no haya comenzado y que quede capacidad. En una transacción actualiza el contador y la reserva del UID; el ID estable de reserva impide que un usuario tenga dos mesas activas en el mismo evento.

La callable no acepta el UID desde el navegador. El nickname solo sirve para presentación y el backend valida su contenido y longitud.

`cancelReservation` lee el evento, la reserva confirmada y la mesa dentro de una transacción. Antes del inicio del evento, marca la reserva como cancelada y decrementa el contador exactamente una vez, incluso ante llamadas concurrentes. La política de permitir cancelaciones hasta `startsAt` todavía requiere aprobación del negocio.

## Reglas y Functions

Las reglas productivas están en `firestore.rules` y se verifican con Firestore Emulator:

- público: leer eventos publicados o cancelados, y sus mesas;
- usuarios autenticados: leer únicamente su propia reserva;
- administradores con `admin: true`: leer los datos administrativos;
- clientes: ninguna escritura directa de eventos, mesas o reservas;
- rutas no declaradas: denegadas.

Las callables públicas son `reserveSeat` y `cancelReservation`. Las callables administrativas viven en `functions/src/admin.ts` y validan permisos antes de acceder a datos. Las operaciones que cambian reservas y contadores usan transacciones. La región de Functions 2nd gen está configurada como `us-south1`.

## Emuladores y producción

En desarrollo, el SDK web usa Authentication Emulator en `9099`, Firestore Emulator en `8080` y Functions Emulator en `5001`, con el proyecto demo `demo-el-descanso`. `npm run emulators` usa `firebase.json` y compila Functions antes de iniciar. Las pruebas de Functions usan `firebase.emulator.json` y `firestore.emulator.rules`; esa configuración deniega las lecturas y escrituras del SDK cliente y no cambia las reglas productivas.

La aplicación espera Firestore en `northamerica-south1`; verifica la región de la base productiva antes de usarla, ya que no se puede mover después de crearla. El archivo `.firebaserc` asigna `default` a `demo-el-descanso` y `production` al proyecto real `eldescansodelheroe-e3f9b`; selecciona explícitamente el alias de producción para despliegues. El frontend se publica como Cloudflare Worker y requiere las seis variables públicas `VITE_FIREBASE_*` durante el build; consulta `CLOUDFLARE_DEPLOYMENT.md`.

El primer administrador se crea desde Firebase Authentication y recibe el Custom Claim `admin: true` con Admin SDK en un entorno confiable. No hay registro público de administradores ni credenciales privadas en el frontend. Los pasos están en `ADMIN_SETUP.md`.

## Validación local

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

Las pruebas de seguridad y Functions inician emuladores en puertos locales; ciérralos antes de repetirlas. Ninguno de estos comandos despliega a Firebase o Cloudflare.
