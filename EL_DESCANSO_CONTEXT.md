# El Descanso del Héroe --- Contexto del proyecto

> Documento de contexto y criterios técnicos para el desarrollo de
> `app.eldescansodelheroe.com`. Este archivo sirve como referencia
> permanente para agentes de IA y desarrolladores que trabajen en este
> repositorio.

## 1. Visión general

**El Descanso del Héroe** es una cafetería temática mexicana orientada a
juegos de mesa, videojuegos y Dungeons & Dragons.

La intención es construir una plataforma digital que pueda convertirse
progresivamente en la infraestructura operativa del restaurante. El
primer alcance funcional es un sistema de reservaciones de mesas, pero
la arquitectura debe permitir agregar módulos futuros sin tener que
crear una aplicación independiente para cada necesidad.

La aplicación principal se publicará inicialmente en:

-   `app.eldescansodelheroe.com`

El sitio público actual se encuentra en:

-   `eldescansodelheroe.com`

La separación actual es intencional:

-   **Sitio público:** menú digital, landing page, información del
    restaurante, quiz, juegos y otros contenidos principalmente
    estáticos.
-   **Aplicación:** funciones que requieren datos, autenticación,
    permisos, operaciones de servidor o persistencia.

En el futuro podría decidirse consolidar ambas experiencias bajo un
único dominio. Por eso, evita acoplar la aplicación a su subdominio
actual y procura que la arquitectura permita esa evolución.

## 2. Objetivo inmediato: MVP de reservaciones

El primer módulo será un sistema para reservar lugares en mesas de
juegos de mesa.

El sistema reemplazará las encuestas de WhatsApp, que presentan
problemas de sincronización y orden de llegada: distintas personas
pueden ver horarios diferentes, creer que obtuvieron un lugar y quedarse
fuera cuando realmente ya se llenó la mesa.

La aplicación debe proporcionar una fuente única y confiable de
disponibilidad.

### Volumen esperado

-   Aproximadamente 20 personas por evento.
-   Máximo estimado de 30 personas.
-   El tráfico es bajo y no justifica una infraestructura compleja.
-   Aun con poco tráfico, la asignación de lugares debe ser correcta
    ante solicitudes simultáneas.

### Flujo esperado del cliente

1.  El cliente abre un enlace compartido, probablemente desde WhatsApp.
2.  Consulta los eventos disponibles.
3.  Selecciona un evento.
4.  Visualiza las mesas, sus capacidades y los lugares restantes.
5.  Escribe un nickname o alias.
6.  Selecciona una mesa y solicita un lugar.
7.  El sistema confirma la reservación únicamente después de que la
    operación haya sido aceptada correctamente.
8.  Si la mesa se llena antes de completar la operación, el cliente
    recibe un mensaje claro y puede elegir otra mesa.

La interfaz debe ser mobile-first, rápida y sencilla. La mayoría de los
clientes accederá desde un teléfono.

## 3. Eventos y mesas configurables

No existen cantidades fijas de eventos, mesas o lugares. Cada evento
puede tener una configuración diferente.

### Datos configurables del evento

-   Nombre.
-   Descripción.
-   Fecha del evento.
-   Fecha y hora de apertura de reservaciones.
-   Estado del evento.
-   Mesas asociadas.

### Datos configurables de cada mesa

-   Nombre o identificador visible.
-   Descripción opcional.
-   Capacidad total.
-   Lugares ocupados o reservados.
-   Lugares disponibles, calculados de forma consistente.
-   Estado.

Ejemplo ilustrativo:

**Evento de sábado** - Mesa A: 5 lugares. - Mesa B: 7 lugares. - Mesa C:
4 lugares.

Otro evento puede tener dos mesas, diez mesas o capacidades
completamente distintas. No hardcodear el número de mesas ni sus
capacidades.

### Apertura de reservaciones

La apertura habitual es a las **12:00 del mediodía**.

Raúl aclaró que la hora de apertura es más importante que la fecha del
evento. Aun así, ambos datos deben poder configurarse.

-   La hora debe ser configurable por evento.
-   La zona horaria del restaurante debe ser `America/Chihuahua`.
-   Antes de la apertura, los usuarios pueden consultar el evento, pero
    no reservar.
-   La hora oficial debe determinarse con una fuente confiable del
    servidor, no con el reloj del dispositivo del usuario.
-   Considerar correctamente horario de verano y cambios de zona horaria
    mediante identificadores IANA, no offsets fijos.

### Estados sugeridos

Los eventos pueden tener estados como:

-   `draft`: borrador, no visible para clientes.
-   `published`: publicado, todavía no abierto.
-   `open`: reservaciones abiertas.
-   `closed`: reservaciones cerradas.
-   `cancelled`: evento cancelado.

Las mesas pueden tener estados derivados de su disponibilidad o estados
administrativos explícitos. Evitar guardar datos redundantes que puedan
contradecirse. Definir claramente qué estados son persistidos y cuáles
se calculan.

## 4. Reglas críticas de reservación

La integridad de las reservaciones es el requisito técnico más
importante.

-   Nunca permitir que una mesa supere su capacidad.
-   Una reservación solo está confirmada cuando la operación del
    servidor termina correctamente.
-   Varias personas pueden intentar reservar el último lugar al mismo
    tiempo.
-   La asignación debe ser atómica y transaccional.
-   La disponibilidad que muestra el frontend es informativa; la
    validación final ocurre en el servidor.
-   Registrar timestamps con tiempo de servidor.
-   Evitar duplicados y definir qué significa que una persona pueda
    reservar más de un lugar.
-   Manejar errores de concurrencia sin mostrar confirmaciones falsas.
-   Si una reservación se cancela, definir cómo se libera el lugar y se
    actualiza la disponibilidad.
-   Considerar idempotencia para evitar que reintentos de red creen
    reservaciones duplicadas.

No implementar la asignación definitiva mediante un simple contador
actualizado directamente desde el navegador.

Usar transacciones de Firestore o un mecanismo de servidor equivalente.
Diseñar la operación para que la lectura de disponibilidad, la
validación de capacidad y la creación de la reservación sean
consistentes.

## 5. Identidad de usuarios: nickname ahora, Google después

Para el MVP se quiere una experiencia sencilla: los clientes se
identifican mediante un nickname, sin obligarlos a crear una cuenta
tradicional.

Sin embargo, la estructura debe permitir incorporar inicio de sesión con
Google en el futuro.

Recomendación de diseño:

-   No usar el nickname como identificador único.
-   Utilizar un identificador estable de usuario.
-   Guardar el nickname como atributo modificable.
-   Asociar las reservaciones al identificador estable.
-   Evaluar Firebase Authentication anónima para los clientes desde el
    inicio.
-   Permitir posteriormente vincular una cuenta anónima con Google
    Authentication, preservando la identidad y las reservaciones cuando
    el proceso de vinculación sea válido.
-   Administradores y personal deben utilizar autenticación y
    autorización apropiadas.

Si se decide no usar autenticación anónima en la primera versión,
documentar cómo se protegerá la consulta y modificación de las
reservaciones de invitados. No asumir que un nickname es una credencial.

## 6. Administración inicial

Raúl conoce Firebase y considera que, para comenzar, puede administrar
eventos directamente desde Firebase Console. Por eso, no es
indispensable construir un panel administrativo complejo en el MVP.

La aplicación debe dejar los datos estructurados para que los eventos y
mesas puedan crearse o modificarse sin cambiar el código.

No desarrollar un panel de administración completo a menos que se
solicite expresamente.

A futuro podría añadirse una interfaz administrativa para:

-   Crear y editar eventos.
-   Configurar apertura y cierre de reservaciones.
-   Crear mesas con capacidades variables.
-   Consultar reservaciones.
-   Cancelar o corregir reservaciones con permisos.
-   Administrar usuarios, empleados y roles.

Las operaciones administrativas deben estar protegidas en el backend y
mediante reglas de seguridad. Ocultar botones en la interfaz no
constituye control de acceso.

## 7. Diseño y relación con el sitio público

En el mismo workspace existe un proyecto separado que contiene el sitio
público actual de El Descanso del Héroe. También existe un diseño
inicial de esta aplicación generado previamente.

**El diseño inicial es la base visual que debe conservarse.** No
reconstruirlo ni rediseñarlo sin una razón concreta.

El sitio público debe utilizarse como referencia para mantener una
identidad visual coherente.

Revisar y reutilizar cuando sea apropiado:

-   Logotipo.
-   Paleta de colores.
-   Tipografías.
-   Imágenes de productos.
-   Sprites y recursos pixel art.
-   Iconografía.
-   Fondos y texturas.
-   Componentes y patrones visuales.
-   Animaciones y transiciones.

La aplicación debe sentirse como una extensión natural del sitio
público, no como un producto de otra marca.

No modificar el proyecto del sitio público mientras se trabaja en esta
aplicación, salvo autorización explícita.

Mantener una experiencia responsive y mobile-first. Priorizar
accesibilidad, contraste, jerarquía visual, estados de carga y mensajes
de error claros.

## 8. Stack tecnológico y decisiones de framework

El proyecto utiliza actualmente un stack basado en:

-   React 19.
-   TypeScript.
-   Vite.
-   TanStack Start.
-   TanStack Router.
-   Tailwind CSS 4.
-   `@tailwindcss/vite`.

También incluye herramientas de interfaz como Radix UI, Lucide React,
React Hook Form, Zod, Sonner y otras dependencias.

El `package.json` existente incluye, entre otras, estas herramientas de
desarrollo:

-   ESLint.
-   Prettier.
-   Vitest.
-   Testing Library.
-   TypeScript.

### Criterio recomendado

Conservar el stack existente si está funcionando y es adecuado. No
migrar a Astro ni reemplazar TanStack Start únicamente por preferencia.

React + TypeScript + Vite/TanStack Start es una base válida para una
aplicación con rutas, formularios, autenticación y futuras funciones
dinámicas.

Antes de decidir el despliegue, verificar la compatibilidad real de la
versión de TanStack Start, Vite y su adaptador con Cloudflare. No asumir
que cualquier configuración de Vite/TanStack Start se despliega
directamente en Cloudflare Pages sin ajustes.

Si el proyecto necesita capacidades de servidor, seleccionar y
documentar el runtime y adaptador de despliegue adecuados. No duplicar
lógica crítica en el cliente.

### Dependencias

-   Revisar las dependencias existentes antes de agregar otras.
-   Evitar paquetes duplicados o innecesarios.
-   Mantener versiones compatibles.
-   No actualizar masivamente dependencias sin comprobar compatibilidad.
-   Añadir Firebase cuando se inicie la integración real, no durante una
    etapa que solo requiere datos ficticios.

## 9. Firebase y backend previsto

Firebase es la opción prevista para el backend inicial por su facilidad
de uso, sincronización en tiempo real y adecuación al volumen esperado.

Servicios considerados:

-   **Firebase Authentication:** autenticación anónima o de invitados,
    administradores y futura vinculación con Google.
-   **Cloud Firestore:** eventos, mesas, usuarios y reservaciones.
-   **Cloud Functions:** operaciones privilegiadas o críticas que deban
    ejecutarse en servidor, cuando sea necesario.

No asumir que todos los servicios son gratuitos. Cloud Functions y otros
servicios pueden requerir habilitar el plan Blaze y asociar facturación.
Antes de implementarlos, explicar requisitos, costos potenciales,
límites y alternativas.

Diseñar las reglas de Firestore con mínimo privilegio. No permitir que
clientes escriban directamente campos sensibles como capacidad, contador
de lugares ocupados, rol administrativo o estado de confirmación.

La fuente de verdad para asignar lugares debe ser una operación segura
del servidor.

## 10. Hosting, dominio e infraestructura

La intención es utilizar:

-   **Cloudflare:** DNS, dominio y hosting del frontend cuando la
    arquitectura elegida sea compatible.
-   **Firebase:** autenticación, base de datos y servicios backend.

Dominio inicial de la aplicación: `app.eldescansodelheroe.com`.

Dominio del sitio público: `eldescansodelheroe.com`.

Mantener los proyectos y despliegues independientes inicialmente. La
aplicación no debe depender de rutas internas o archivos del proyecto
público durante el build.

Separar ambientes de desarrollo y producción. No incluir secretos en el
repositorio. Documentar las variables de entorno necesarias y el
procedimiento de despliegue.

La futura consolidación de dominios no debe requerir reescribir la
lógica de negocio.

## 11. Arquitectura escalable sin sobreingeniería

La plataforma puede incorporar en el futuro estos módulos:

-   Reservaciones y eventos.
-   Clientes y perfiles.
-   Historial de visitas.
-   Ventas y consumos.
-   Catálogo de productos.
-   Inventario.
-   Empleados.
-   Roles y permisos.
-   Reportes y estadísticas.
-   Otras operaciones del restaurante.

No construirlos ahora.

Preparar el código para que puedan agregarse como módulos
independientes. Separar responsabilidades y evitar dependencias
innecesarias entre funcionalidades.

Los modelos deben utilizar identificadores estables y relaciones claras.
Evitar duplicar información de clientes o productos en múltiples módulos
sin una razón de negocio.

No crear microservicios, capas abstractas o sistemas complejos que el
volumen actual no necesita. Priorizar una arquitectura modular sencilla
y bien documentada.

## 12. Calidad, formato y documentación

La calidad del código es un requisito permanente, no una tarea para el
final.

### Formato y análisis

Configurar y utilizar:

-   Prettier para formato automático.
-   ESLint para análisis estático.
-   TypeScript en modo estricto.
-   Scripts claros para desarrollo, build, lint, format y tests.

Asegurar que el formato sea consistente en todo el repositorio. No dejar
archivos nuevos sin formatear.

### Código mantenible

-   Nombres descriptivos y consistentes.
-   Componentes con responsabilidades claras.
-   Funciones pequeñas y enfocadas.
-   Separación entre interfaz, lógica de negocio y acceso a datos.
-   Tipos compartidos cuando corresponda.
-   Validación de entradas.
-   Manejo explícito de errores y estados de carga.
-   Evitar duplicación, código muerto y valores mágicos.
-   Evitar archivos excesivamente grandes.
-   No añadir comentarios que simplemente repitan el código.

### Documentación

Mantener documentación útil y actualizada:

-   `README.md`: propósito, requisitos, instalación, scripts y
    ejecución.
-   Documento de arquitectura: estructura y responsabilidades.
-   Configuración de entorno: variables requeridas y ejemplos sin
    secretos.
-   Modelos de datos y reglas de negocio.
-   Configuración y reglas de Firebase.
-   Procedimiento de pruebas y despliegue.
-   Decisiones arquitectónicas relevantes.

La documentación debe permitir que otro desarrollador comprenda, ejecute
y mantenga el proyecto sin depender de explicaciones informales.

## 13. Pruebas y confiabilidad

Incluir pruebas apropiadas para la complejidad real del proyecto.

Priorizar:

-   Asignación de lugares.
-   Intentos simultáneos de reservar el último lugar.
-   Mesa llena.
-   Evento todavía cerrado.
-   Evento cancelado.
-   Reservaciones duplicadas.
-   Cancelación y liberación de lugares.
-   Permisos de clientes y administradores.
-   Validaciones de datos.

No considerar un flujo terminado solo porque la interfaz parece
funcionar. Las operaciones críticas deben probarse en su capa real,
incluyendo reglas y lógica del servidor cuando corresponda.

## 14. Seguridad, privacidad y aspectos legales

Aplicar seguridad desde el diseño:

-   Validar datos en el servidor.
-   Aplicar mínimo privilegio.
-   Proteger credenciales y secretos.
-   Restringir operaciones administrativas.
-   No confiar en datos del cliente.
-   Evitar exponer información personal o reservaciones ajenas.
-   Registrar operaciones administrativas relevantes.
-   Preparar copias de seguridad y recuperación.

Como el restaurante opera en México, considerar la legislación mexicana
aplicable a protección de datos personales, incluyendo la necesidad de
un aviso de privacidad, tratamiento proporcional de datos y mecanismos
para ejercer derechos ARCO cuando corresponda.

Solicitar únicamente la información necesaria para la reservación.

Respetar licencias de dependencias, imágenes, fuentes, ilustraciones y
contenido de terceros. Revisar especialmente los derechos de uso
comercial de recursos relacionados con Dungeons & Dragons; no asumir que
todo material de esa franquicia puede reutilizarse libremente.

No copiar recursos de terceros sin verificar sus condiciones de uso.

## 15. Forma de trabajo para agentes de IA y desarrolladores

Antes de cambios importantes:

1.  Revisar el estado actual del repositorio.
2.  Comprender la estructura y convenciones existentes.
3.  Identificar los archivos afectados.
4.  Explicar brevemente el plan y los trade-offs relevantes.
5.  Evitar cambios destructivos o ajenos al alcance.

Trabajar de forma incremental y verificar cada etapa.

No reescribir el proyecto existente si puede conservarse y
refactorizarse de manera gradual.

No modificar el sitio público sin autorización.

No implementar módulos futuros hasta que sean solicitados.

No afirmar que una integración, prueba, compilación o despliegue
funcionó sin haberlo verificado.

Cuando una decisión tenga implicaciones de seguridad, costos, datos o
arquitectura, explicarla antes de implementarla.

## 16. Prioridad actual

La prioridad inmediata es convertir el proyecto existente en
una base técnica estable y lista para versionarse en su propio
repositorio.

En esta primera etapa:

-   Conservar el diseño y los flujos visuales existentes.
-   Utilizar datos ficticios o hardcodeados, separados de los
    componentes.
-   Mantener la aplicación independiente del sitio público.
-   Revisar y ordenar la estructura.
-   Configurar correctamente TypeScript, ESLint y Prettier.
-   Verificar scripts y dependencias.
-   Asegurar que el build de producción funcione.
-   Documentar instalación, estructura y configuración.
-   Dejar preparada la arquitectura para integrar Firebase
    posteriormente.

No conectar Firebase todavía si el alcance de la tarea es únicamente
preparar la base.

El resultado debe ser una aplicación independiente, legible, formateada,
documentada y lista para crear su repositorio GitHub.

------------------------------------------------------------------------

## Principio rector

**Construir una plataforma que pueda crecer con El Descanso del Héroe,
empezando por un MVP pequeño y confiable.**

Priorizar simplicidad, seguridad, mantenibilidad y coherencia visual.
Evitar tanto la improvisación técnica como la sobreingeniería.
