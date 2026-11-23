# Administrador inicial

No existe registro público de administradores. El acceso se concede únicamente con Firebase Authentication (correo y contraseña) y el Custom Claim `admin: true`.

## Crear el primer administrador

1. En Firebase Console, habilita el proveedor **Email/Password** en Authentication.
2. Crea la cuenta administrativa desde Firebase Console (no desde la aplicación).
3. Ejecuta este script en un entorno privado y confiable donde esté instalado `firebase-admin` y configurada Application Default Credentials para el proyecto correcto. Nunca pongas la clave de servicio en el frontend ni en el repositorio.

```ts
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const app = initializeApp({ credential: applicationDefault() });
const auth = getAuth(app);
const user = await auth.getUserByEmail("admin@example.com");
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
console.log(
  `Granted admin to ${user.uid}. Ask the user to sign out and back in to refresh the token.`,
);
```

Revoca el permiso usando `setCustomUserClaims(uid, { ...otherClaims, admin: false })` o reemplazando los claims con el conjunto autorizado. Los cambios se aplican cuando Firebase renueva el ID token.

## Reglas de seguridad

Las lecturas administrativas requieren el claim booleano `admin: true`. Todas las escrituras y la cancelación administrativa pasan por Cloud Functions que verifican el mismo claim. Las reglas del cliente mantienen bloqueadas las escrituras para que no se puedan alterar contadores o reservas desde DevTools.
