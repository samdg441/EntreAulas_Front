# PRD: EntreAulas, autenticación y recuperación de contraseña (RQ1–RQ5)

> Documento de requisitos que se sube a TestSprite en la página de configuración. Limita las pruebas a estas seis funcionalidades.

## 1. Producto

EntreAulas es la plataforma de evaluación docente de la Universidad de Medellín.

- **Front:** React + Vite, servido por nginx en `http://localhost:3001`.
- **API:** Express en `http://localhost:3000`, con JWT y bcrypt. La base de datos es Supabase.

Usuarios por tipo:

| Tipo | Dominio del correo | Panel después del login |
|---|---|---|
| Estudiante | `@soyudemedellin.edu.co` | `/dashboard-estudiante` |
| Docente (profesor) | `@udemedellin.edu.co` | `/dashboard-profesor` |
| Coordinador | `@udemedellin.edu.co` | `/dashboard-coordinador` |
| Decano | `@udemedellin.edu.co` | `/dashboard-decano` |
| Administrador | `@soyudemedellin.edu.co` o `@udemedellin.edu.co` | `/dashboard-admin` |

## 2. Alcance

**Dentro:** RQ1, RQ2, RQ3.1, RQ3.2, RQ4 y RQ5, en las rutas `/login`, `/forgot-password`, `/reset-password` y `/admin/users`, y en los endpoints `/api/auth/*`.

**Fuera:** encuestas, reportes, cursos, QR, coordinador académico, perfiles y cualquier otra ruta.

## 3. Requisitos

### RQ1: Registro de usuarios desde el administrador

- En `/admin/users`, el administrador pulsa **Agregar usuario** y llena el formulario:
  - nombre;
  - apellido;
  - usuario del correo: el dominio se agrega solo según el tipo;
  - contraseña;
  - tipo de usuario.
- **El dominio cambia con el tipo:** estudiante y administrador usan `@soyudemedellin.edu.co`; profesor, coordinador y decano usan `@udemedellin.edu.co`.
- **Política de contraseña:** al menos 8 caracteres, con mayúscula, minúscula, número y carácter especial. Si falta el carácter especial se muestra «al menos un carácter especial» y el modal sigue abierto.
- **Correo duplicado:** se muestra «El correo ya está registrado».
- **Acceso:** solo el administrador entra a `/admin/users`. Cualquier otro rol ve «Acceso no permitido».
- **API:**
  - `POST /api/auth/create-user` exige un JWT de administrador y responde 403 a cualquier otro rol.
  - `POST /api/auth/register` solo permite el autorregistro como estudiante; con otro tipo responde 403.

### RQ2: Inicio de sesión

- En `/login`, el usuario elige su tipo en un selector (por defecto *Estudiante*), escribe el correo y la contraseña y pulsa **Iniciar sesión**.
- **Correo mal formado:** se muestra «Por favor, ingresa un correo electrónico válido».
- **Errores de acceso:** una contraseña incorrecta, un correo inexistente o una cuenta inactiva muestran el mismo mensaje, «Credenciales inválidas», y el usuario sigue en `/login`. Así no se revela qué cuentas existen.
- **Login correcto:** lleva al panel del rol y guarda el JWT. `GET /api/auth/me` devuelve el perfil.
- **Límite de intentos:** después de 10 intentos fallidos por IP y correo en 15 minutos, la API responde **429** con `Retry-After`. Es el comportamiento esperado, no un defecto.
- El parámetro `redirectTo` solo acepta rutas internas que empiezan por `/`. Las URL externas se ignoran.

### RQ3.1: Solicitud de recuperación

- En `/forgot-password`, el usuario escribe su correo y pulsa **Enviar enlace de recuperación**.
- **Correo con formato inválido:** se muestra «Por favor, ingresa un correo electrónico válido».
- **Correo válido:** se muestra **siempre** la misma confirmación, «Solicitud enviada» con el texto «Si el correo electrónico existe en nuestro sistema…», exista o no la cuenta.
- **Límite:** 5 solicitudes por IP y correo cada 15 minutos (429).
- **Un solo enlace vigente:** al pedir un enlace nuevo se invalidan los anteriores.

### RQ3.2: Validación del token

- `/reset-password?token=…&email=…` valida el token al cargar (`GET /api/auth/validate-reset-token/:token`).
- **Sin token o sin correo:** se muestra «El enlace de recuperación es inválido o está incompleto.»
- **Token inexistente, vencido o ya usado:** se muestra «Token inválido o ya utilizado» y un botón **Solicitar un nuevo enlace**.
- **Límite:** 20 fallos de token por IP cada 15 minutos (429).

### RQ4: Envío del enlace por correo

- Si el correo existe y la cuenta está activa, se envía «Recuperación de contraseña - EntreAulas» con un enlace `/reset-password?token=…&email=…` que vence en 1 hora.
- La respuesta de la API no revela si el correo se envió.

### RQ5: Restablecer contraseña

- Con un token válido, el usuario escribe la nueva contraseña dos veces y pulsa **Actualizar contraseña**.
- **Contraseñas distintas:** se muestra «Las contraseñas no coinciden».
- **Contraseña débil:** se aplica la misma política de RQ1.
- **Éxito:** se muestra «Contraseña actualizada» y se redirige al login.
- **Token de un solo uso:** al reutilizarlo, falla.
- **Efectos:** los JWT emitidos antes del cambio dejan de valer (401 `TOKEN_REVOKED`) y la nueva contraseña sirve para iniciar sesión.

## 4. Accesibilidad y seguridad esperadas

- Los mensajes de error están en una región con `role="alert"`.
- Los campos con error tienen `aria-invalid` y `aria-describedby`.
- Solo el formulario de restablecimiento (`/reset-password`) tiene botones para mostrar u ocultar la contraseña; se llaman «Mostrar contraseña» y «Ocultar contraseña». El login y el alta de usuarios no los tienen.
- **Front:** envía CSP, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` y `X-Content-Type-Options: nosniff`.
- **API:** envía las cabeceras de `helmet`, responde a un JSON malformado con 400 en JSON y nunca expone detalles internos en un 5xx.

## 5. Datos de prueba

- Las credenciales del administrador y del estudiante se ingresan en la página de configuración de TestSprite; no están en este documento.
- Los usuarios creados por las pruebas deben usar el prefijo `ts.` en el usuario del correo, por ejemplo `ts.1730000000`.
- No se debe cambiar la contraseña de las cuentas de prueba compartidas. RQ5 se prueba hasta donde no se necesite un enlace real de correo.
