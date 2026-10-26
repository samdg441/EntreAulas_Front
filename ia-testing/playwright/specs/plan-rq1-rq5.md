# Plan de pruebas de autenticación de EntreAulas (RQ1–RQ5)

Generado por el agente **playwright-test-planner** a partir de la exploración guardada en `specs/exploracion/*.aria.yml`.

**Semilla:** `seed.spec.ts`. Deja el front en `/login` con el back simulado (`fixtures/back-simulado.ts`).

**Cuentas sembradas** (clave `Clave#2026a`):

| Rol | Correo |
|---|---|
| admin | ada@udemedellin.edu.co |
| estudiante | eva@soyudemedellin.edu.co |
| profesor | pablo@udemedellin.edu.co |
| inactivo | inactivo@soyudemedellin.edu.co |

**Supuesto común:** cada escenario parte de un navegador limpio, sin sesión.

## Hallazgos de la exploración

- **H-1 (accesibilidad):** en `/reset-password`, los dos botones de "mostrar u ocultar contraseña" aparecen como `button` sin nombre en el árbol de accesibilidad (`rq3-2-rq5-reset-password.aria.yml`). Un lector de pantalla solo anuncia "botón". Coincide con **DEF-FE-08**.
- **H-2:** en el login, el campo cambia de etiqueta según el tipo elegido: "Correo Institucional" para estudiante y "Email Institucional" para los demás. Las pruebas deben localizarlo por su tipo o por un patrón de etiqueta.
- **H-3:** en el alta de usuario, el dominio no forma parte del campo "Correo". Es un texto aparte que depende del "Tipo de usuario".

## 1. RQ2 — Inicio de sesión

### 1.1 Estudiante inicia sesión y llega a su panel
1. Abrir `/login`.
2. Escribir `eva@soyudemedellin.edu.co` en "Correo Institucional" y `Clave#2026a` en "Contraseña".
3. Pulsar "Iniciar sesión como Estudiante".

**Resultado esperado:** la URL es `/dashboard-estudiante` y el `localStorage` tiene un token.

### 1.2 El profesor elige "Docente" y llega a su panel
1. Abrir `/login`.
2. Abrir el selector de tipo y elegir "Docente".
3. Escribir las credenciales del profesor y pulsar "Iniciar sesión como Docente".

**Resultado esperado:** la URL es `/dashboard-profesor`.

### 1.3 Clave incorrecta
1. Escribir el correo de Eva con la clave `Incorrecta#1` y enviar.

**Resultado esperado:** se ve "Credenciales inválidas", la URL sigue en `/login` y no hay token.

### 1.4 Cuenta inactiva
1. Iniciar sesión con la cuenta inactiva.

**Resultado esperado:** se ve el mismo mensaje "Credenciales inválidas", sin revelar el motivo.

### 1.5 Tipo de usuario incorrecto
1. Elegir "Docente" e iniciar sesión con la cuenta de Eva.

**Resultado esperado:** se ve "no coincide con tu cuenta" y no hay token.

### 1.6 Correo con formato inválido
1. Escribir `correo-sin-arroba` y enviar.

**Resultado esperado:** se ve "Por favor, ingresa un correo electrónico válido" y no hay ninguna petición a `/api/auth/login`.

## 2. RQ1 — Alta de usuarios por el administrador

### 2.1 Crear un estudiante
1. Con sesión de admin, abrir `/admin/users` y pulsar "Agregar usuario".
2. Escribir Nombre `nora`, Apellido `vélez`, Correo `nora.velez` y Contraseña `Clave#2026a`, y pulsar "Crear".

**Resultado esperado:** el modal se cierra y la tabla muestra `nora.velez@soyudemedellin.edu.co`. El back recibió los nombres en mayúsculas (`NORA`, `VÉLEZ`).

### 2.2 El dominio cambia con el tipo
1. Elegir "profesor" en "Tipo de usuario".

**Resultado esperado:** el sufijo visible pasa a `@udemedellin.edu.co`.

### 2.3 Correo duplicado
1. Crear un usuario con el usuario `eva`.

**Resultado esperado:** se ve "El email ya está registrado" y el modal sigue abierto.

### 2.4 Clave débil
1. Crear un usuario con la clave `debil`.

**Resultado esperado:** se ve el mensaje de política y no hay ninguna petición a `create-user`.

### 2.5 Un estudiante no entra a la administración
1. Con sesión de estudiante, abrir `/admin/users`.

**Resultado esperado:** la URL es `/forbidden` y se ve "Acceso no permitido".

## 3. RQ3.1 y RQ4 — Solicitud del enlace de recuperación

### 3.1 Correo registrado
1. Abrir `/forgot-password`, escribir el correo de Eva y pulsar "Enviar enlace de recuperación".

**Resultado esperado:** se ven "Solicitud enviada" y el mensaje genérico, y el buzón simulado tiene un correo para Eva con un enlace `/reset-password?token=…&email=…`.

### 3.2 Correo no registrado
1. Hacer la misma solicitud con `nadie@soyudemedellin.edu.co`.

**Resultado esperado:** la UI muestra lo mismo y el buzón no tiene correos.

### 3.3 Formato inválido
1. Escribir `usuario@dominio` y enviar.

**Resultado esperado:** se ve el error de formato y no hay ninguna petición.

## 4. RQ3.2 — Validación del token

### 4.1 Enlace vigente
1. Abrir el enlace del correo.

**Resultado esperado:** se ve "Crear nueva contraseña" y el correo aparece deshabilitado.

### 4.2 Enlace vencido
**Resultado esperado:** se ve "El token ha expirado" y el botón "Solicitar un nuevo enlace".

### 4.3 Enlace incompleto
1. Abrir `/reset-password` sin parámetros.

**Resultado esperado:** se ve "inválido o está incompleto".

## 5. RQ5 — Nueva contraseña

### 5.1 Cambio exitoso
1. Desde un enlace vigente, escribir `ClaveNueva#2027` dos veces y pulsar "Actualizar contraseña".

**Resultado esperado:** se ve "Contraseña actualizada". El login funciona con la clave nueva y falla con la anterior.

### 5.2 Enlace de un solo uso
1. Después del cambio, abrir de nuevo el mismo enlace.

**Resultado esperado:** se ve "Token inválido o ya utilizado".

### 5.3 Las contraseñas no coinciden
**Resultado esperado:** se ve "Las contraseñas no coinciden" y no hay ninguna petición.

### 5.4 Política de clave
Para `Ab#1`, `claveminus#1`, `CLAVEMAYUS#1`, `ClaveSinNum#` y `ClaveSinEsp1`, debe aparecer el mensaje de la regla que se incumple.

### 5.5 Mostrar u ocultar contraseña (H-1)
1. Pulsar el botón del ojo.

**Resultado esperado:** el campo pasa a `type=text`. El botón debería tener un nombre accesible (DEF-FE-08).
