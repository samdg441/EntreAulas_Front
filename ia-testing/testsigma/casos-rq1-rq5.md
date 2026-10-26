# Casos de prueba de Testsigma para RQ1–RQ5

**Sintaxis de Testsigma:**

| Notación | Significado |
|---|---|
| `@|param|` | Parámetro del perfil de datos `cuentas-entreaulas` |
| `~|random|` | Dato aleatorio |
| `*|url|` | Variable del entorno |

Los nombres de los elementos (por ejemplo `campo correo`) se crean con el Recorder la primera vez y Testsigma los reutiliza.

## RQ2: Inicio de sesión

### TS-RQ2-01: El estudiante inicia sesión y llega a su panel (exitoso)
1. Navigate to `*|url|`/login
2. Enter `@|estudiante_email|` in the `campo correo` field
3. Enter `@|estudiante_password|` in the `campo contraseña` field
4. Click on `botón iniciar sesión`
5. Wait until the current page URL contains `/dashboard-estudiante`
6. Verify that the current page URL contains `/dashboard-estudiante`

### TS-RQ2-02: El administrador elige su tipo y entra (exitoso)
1. Navigate to `*|url|`/login
2. Click on `selector tipo de usuario`
3. Click on `opción Administrador`
4. Verify that the `botón iniciar sesión` displays text `Iniciar sesión como Administrador`
5. Enter `@|admin_email|` in the `campo correo` field
6. Enter `@|admin_password|` in the `campo contraseña` field
7. Click on `botón iniciar sesión`
8. Verify that the current page URL contains `/dashboard-admin`

### TS-RQ2-03: Clave incorrecta (error)
1. Navigate to `*|url|`/login
2. Enter `@|estudiante_email|` in the `campo correo` field
3. Enter `Incorrecta#~|random|` in the `campo contraseña` field
4. Click on `botón iniciar sesión`
5. Verify that the current page displays text `Credenciales inválidas`
6. Verify that the current page URL contains `/login`

### TS-RQ2-04: Correo inexistente: el mismo mensaje que una clave incorrecta (alternativo)
1. Navigate to `*|url|`/login
2. Enter `nadie.~|random|@soyudemedellin.edu.co` in the `campo correo` field
3. Enter `@|clave_valida|` in the `campo contraseña` field
4. Click on `botón iniciar sesión`
5. Verify that the current page displays text `Credenciales inválidas`

### TS-RQ2-05: Correo sin arroba (error)
1. Navigate to `*|url|`/login
2. Enter `correo-sin-arroba` in the `campo correo` field
3. Verify that the current page displays text `Por favor, ingresa un correo electrónico válido`

## RQ1: Registro de usuarios desde el administrador

### TS-RQ1-01: El admin crea un estudiante (exitoso)
1. Execute step group `Login como admin` (pasos 1 a 7 de TS-RQ2-02)
2. Navigate to `*|url|`/admin/users
3. Click on `botón Agregar usuario`
4. Enter `TESTSIGMA` in the `campo nombre` field
5. Enter `PRUEBA` in the `campo apellido` field
6. Enter `ts.~|random|` in the `campo usuario del correo` field and store it in runtime variable `usuario_creado`
7. Enter `@|clave_valida|` in the `campo contraseña alta` field
8. Click on `botón Crear`
9. Enter `$|usuario_creado|` in the `buscador de usuarios` field
10. Verify that the current page displays text `$|usuario_creado|@soyudemedellin.edu.co`

### TS-RQ1-02: El dominio cambia con el tipo (alternativo)
1. Execute step group `Login como admin`
2. Navigate to `*|url|`/admin/users
3. Click on `botón Agregar usuario`
4. Verify that the current page displays text `@soyudemedellin.edu.co`
5. Select option by text `profesor` in the `lista tipo de usuario` list
6. Verify that the current page displays text `@udemedellin.edu.co`

### TS-RQ1-03: Correo duplicado (error)
1. Execute step group `Login como admin`
2. Navigate to `*|url|`/admin/users
3. Click on `botón Agregar usuario`
4. Enter `DUPLICADO`, `PRUEBA`, the local part of `@|estudiante_email|` and `@|clave_valida|` in the form fields
5. Click on `botón Crear`
6. Verify that the current page displays text `ya está registrado`

### TS-RQ1-04: Clave sin carácter especial (error)
1. Execute step group `Login como admin`
2. Navigate to `*|url|`/admin/users
3. Click on `botón Agregar usuario`
4. Fill in the form with the key `ClaveSegura2026`
5. Click on `botón Crear`
6. Verify that the current page displays text `al menos un carácter especial`

### TS-RQ1-05: Un estudiante no entra a la administración (error)
1. Execute step group `Login como estudiante` (pasos 1 a 4 de TS-RQ2-01)
2. Navigate to `*|url|`/admin/users
3. Verify that the current page displays text `Acceso no permitido`

## RQ3.1 y RQ4: Solicitud y envío del enlace

### TS-RQ3-01: Correo registrado recibe la confirmación genérica (exitoso)
1. Navigate to `*|url|`/forgot-password
2. Enter `@|estudiante_email|` in the `campo correo recuperación` field
3. Click on `botón Enviar enlace de recuperación`
4. Verify that the current page displays text `Solicitud enviada`
5. Verify that the current page displays text `Si el correo electrónico existe en nuestro sistema`

### TS-RQ3-02: Correo no registrado recibe la misma confirmación (alternativo)
1. Navigate to `*|url|`/forgot-password
2. Enter `nadie.~|random|@soyudemedellin.edu.co` in the `campo correo recuperación` field
3. Click on `botón Enviar enlace de recuperación`
4. Verify that the current page displays text `Solicitud enviada`

### TS-RQ3-03: Formato inválido (error)
1. Navigate to `*|url|`/forgot-password
2. Enter `usuario@dominio` in the `campo correo recuperación` field
3. Click on `botón Enviar enlace de recuperación`
4. Verify that the current page displays text `Por favor, ingresa un correo electrónico válido`

### TS-RQ4-01: El correo llega con el enlace (exitoso, con buzón real)
1. Ejecutar TS-RQ3-01 con un correo de prueba al que se tenga acceso.
2. Abrir el buzón y comprobar que llegó "Recuperación de contraseña - EntreAulas" con un enlace `/reset-password?token=…&email=…`.
3. En Testsigma, usar **Email Testing / Mailbox**, si el plan lo incluye. Si no, adjuntar la captura del correo en `evidencias/`.

## RQ3.2: Validación del token

### TS-RQ32-01: Token inexistente (error)
1. Navigate to `*|url|`/reset-password?token=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff&email=`@|estudiante_email|`
2. Verify that the current page displays text `Token inválido o ya utilizado`
3. Verify that the `botón Solicitar un nuevo enlace` is displayed

### TS-RQ32-02: Enlace incompleto (error)
1. Navigate to `*|url|`/reset-password
2. Verify that the current page displays text `inválido o está incompleto`

## RQ5: Restablecer contraseña

### TS-RQ5-01: Nueva clave con un enlace real (exitoso)
1. Abrir el enlace recibido en TS-RQ4-01 (Navigate to `$|enlace_recuperacion|`).
2. Enter `ClaveNueva#~|random|` in the `campo nueva contraseña` field and store it in `clave_nueva`.
3. Enter `$|clave_nueva|` in the `campo confirmar contraseña` field.
4. Click on `botón Actualizar contraseña`.
5. Verify that the current page displays text `Contraseña actualizada`.
6. Execute TS-RQ2-01 with the password `$|clave_nueva|`.

### TS-RQ5-02: Las contraseñas no coinciden (error)
1. Abrir un enlace vigente (como en TS-RQ5-01).
2. Enter `ClaveNueva#2027` in the `campo nueva contraseña` field and `OtraClave#2027` in the `campo confirmar contraseña` field.
3. Click on `botón Actualizar contraseña`.
4. Verify that the current page displays text `Las contraseñas no coinciden`.

## Prompts para Copilot (generación con IA)

Pega cada uno en **Generate with AI**:

- **RQ1:** "Como administrador de https://entre-aulas-front.vercel.app/admin/users quiero crear usuarios con nombre, apellido, usuario del correo (el dominio se agrega solo según el tipo), contraseña con mayúscula, minúscula, número y carácter especial, y tipo de usuario. Genera casos exitosos, alternativos y de error."
- **RQ2:** "En https://entre-aulas-front.vercel.app/login el usuario elige su tipo (Estudiante, Docente, Coordinador, Decano, Administrador), escribe correo y contraseña e inicia sesión; cada rol va a su panel. Genera casos de credenciales inválidas, tipo equivocado y correo mal formado."
- **RQ3.1 / RQ4:** "En /forgot-password el usuario pide un enlace de recuperación; el mensaje debe ser igual exista o no el correo. Genera casos."
- **RQ3.2 / RQ5:** "En /reset-password?token=…&email=… se valida el token; si es válido se pide una nueva contraseña dos veces con la política de seguridad. Genera casos de token inválido, vencido, incompleto, contraseñas distintas y política."
