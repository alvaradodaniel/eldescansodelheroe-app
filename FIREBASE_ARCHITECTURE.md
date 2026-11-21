# Arquitectura del MVP de reservaciones

La aplicación mantiene el código de reservas dentro de `src/features/reservations/`. Las rutas ensamblan la interfaz y el módulo contiene sus tipos visuales, lógica de disponibilidad, componentes y adaptadores de Firebase. `src/lib/firebase.ts` es el único punto de inicialización del SDK web. El Admin SDK solo se usa en `functions/`.

## Datos actuales

- `events/{eventId}`: `name`, `tagline`, `description`, `startsAt`, `opensAt`, `timezone`, `status` y `band`.
- `events/{eventId}/tables/{tableId}`: `name`, `capacity`, `reservedCount`, `status` y los datos descriptivos opcionales de la mesa.
- `events/{eventId}/reservations/{uid}`: como máximo una reserva activa por usuario y evento. El ID del documento es el UID de Firebase Auth; el nickname es texto de presentación.

El cliente consulta eventos con `status == "published"`, escucha el evento y sus mesas con Firestore, y observa únicamente su propio documento de reserva. Las mesas y eventos se administran manualmente en Firebase Console; no existe panel administrativo.

## Reservas y concurrencia

`reserveSeat` valida la identidad, apertura, estado de mesa y capacidad dentro de una transacción. La transacción lee el contador y la reserva del UID, y actualiza ambos de forma atómica. Los intentos concurrentes al último lugar compiten por el mismo documento de mesa: Firestore reintenta la transacción y el servidor rechaza cualquier intento que ya no tenga capacidad. El ID de reserva por UID también impide que una persona mantenga dos reservas activas para el mismo evento.

La callable no acepta UID del navegador. Firebase Auth aporta la identidad. El navegador genera el nickname y el backend limita su longitud, pero nunca usa el nickname como identidad.

No se conserva un ledger de `requestId`. Ese ledger repetía una respuesta anterior, pero no es necesario para evitar reservas duplicadas: una reejecución encuentra la reserva activa del usuario y responde `already-exists`. La UI escucha el documento propio para reconocer una operación confirmada aunque se pierda la respuesta de red. En ese caso, el usuario ve su reserva activa y no puede enviar otra.

`cancelReservation` lee la reserva confirmada y la mesa dentro de una transacción; solo si la reserva sigue confirmada marca su estado como cancelado y decrementa `reservedCount`. Una llamada repetida no puede liberar el mismo lugar dos veces. El backend permite cancelar hasta `startsAt`; esta política sigue pendiente de aprobación del negocio.

## Seguridad

Las reglas productivas están en `firestore.rules` y se prueban con Firestore Emulator:

- clientes leen solo eventos publicados y sus mesas;
- usuarios autenticados leen su propio documento de reserva;
- el cliente no escribe eventos, mesas ni reservas;
- cualquier ruta restante queda denegada.

Las callables con Admin SDK son la única vía de reserva y cancelación. La configuración de pruebas de Functions usa `firebase.emulator.json` y `firestore.emulator.rules`, que bloquea todo acceso de cliente y queda separada de las reglas productivas.

## Entorno local y regiones

El frontend conecta a Authentication (`9099`), Firestore (`8080`) y Functions (`5001`) cuando corre en modo desarrollo, y exige el ID `demo-el-descanso`. `npm run emulators` compila Functions e inicia esos tres emuladores con la configuración de `firebase.json`; la raíz de la aplicación no requiere `.env.local` para el modo demo.

Firestore se mantiene en `northamerica-south1`; Cloud Functions 2nd gen usa `us-south1`. No se cambia ninguna región ni se despliega desde el flujo local.

Consulta el README para instalación, datos de prueba y comandos de ejecución.
