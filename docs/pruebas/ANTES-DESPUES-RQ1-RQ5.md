# Antes y después de la refactorización de RQ1–RQ5

| Campo | Antes | Después |
|---|---|---|
| **Back** | Tag `v-antes-refactor` (`45a345a`) | `pruebas-Juliana` (`ddd31b2` para el código, `f54a6b0` para la documentación) |
| **Front** | Tag `v-antes-refactor` (`b14a263`) | `pruebas-Juliana` (`b2650bb` para el código) |

Para ver todos los cambios: `git diff v-antes-refactor..pruebas-Juliana -- src`.
- **Back:** 37 archivos, +719 / −264.
- **Front:** 12 archivos, +123 / −17.

Cada cambio nace de un hallazgo de las pruebas. La prueba del hallazgo fallaba antes (`docs/pruebas/antes/`) y pasa después (`docs/pruebas/despues/`).

---

## 1. Resumen de resultados

| Indicador | Antes | Después |
|---|---|---|
| Suite completa del back (Vitest) | 986/989 (3 timeouts intermitentes) | **1024/1024** |
| Evidencias del back RQ1–RQ5 (unit, API y seguridad) | 332/332 | **366/366** (+34 pruebas nuevas) |
| Pruebas de defectos del back de RQ1–RQ5 | **0/24** pasan | **23/24** (DEF-31: la parte del coordinador está fuera de alcance) |
| Pruebas de defectos del back (todo el equipo) | 16/86 | 39/86 |
| Suite completa del front | 574/574 | **578/578** |
| Evidencias del front RQ1–RQ5 | 251/251 | **255/255** |
| Pruebas de defectos del front | **0/23** | **25/25** (incluye DEF-FE-12 nuevo) |
| Cypress UI RQ1–RQ5 | 44/45 (DEF-FE-12) | **45/45** |
| Cypress API y seguridad | 21/25 + 5 *pending*, contra Render (fallan DEF-34, 35, 38 y 43) | **25/25** + 5 *pending*, contra el despliegue |
| Cypress accesibilidad (axe) | 4/8 (DEF-FE-08 a 11) | **8/8** |
| Cypress regresión del ciclo completo | 3/3 | 3/3 |
| BDD Gherkin + Screenplay | 35/35 | 35/35 |
| Playwright (agentes de IA) | 25/26 (DEF-FE-08) | **26/26** |
| Stagehand (act, observe y extract) | n/a (no existía para RQ1–RQ5) | 3/3 scripts (7 evidencias) |
| Cobertura RQ1–RQ5 del back (sentencias / ramas / funciones) | 80,97 % / 90,08 % / 76,05 % | 81,03 % / **92,13 %** / **77,77 %** |
| Cobertura RQ1–RQ5 del front (sentencias / ramas / funciones / líneas) | 78,23 / 79,05 / 65,83 / 80,37 % | 78,52 / 79,42 / 66,93 / 80,54 % |
| Sonar del back: Quality Gate / duplicación / *code smells* | OK / **1,7 %** / 0 | **OK / 0,0 % / 0** |
| Sonar del back: cobertura | 94,5 % | 94,5 % (código nuevo: 97,1 %) |
| Sonar del front: Quality Gate / cobertura / duplicación | OK / 96,6 % / 0 % | OK / 96,6 % (código nuevo: 100 %) / 0 % |
| Cabeceras de seguridad (API y front) | Ninguna | helmet (API) + CSP, HSTS, nosniff, XFO y Referrer-Policy (nginx y Vercel) |

---

## 2. Cambios en el back

| Defecto (severidad) | Hallazgo y prueba | Antes | Después | Commit |
|---|---|---|---|---|
| **DEF-39** (Crítica), RQ1 | `defects/DEF-39`: un anónimo se registraba como `admin` y recibía un JWT | `registerSchema` aceptaba `admin`, `coordinador` y `decano` | `TIPOS_AUTORREGISTRO = {estudiante}`; cualquier otro rol da **403** sin crear la cuenta | `5885d86` |
| **DEF-21** (Alta), RQ1 | `create-user` guardaba `superadmin` | Solo comprobaba que el campo existiera | Valida contra `VALID_USER_TYPES` y responde `400 tipo_usuario inválido` antes de tocar la base | `5885d86` |
| **DEF-45** (Baja), RQ1/RQ5 | El alta aceptaba `12345678` y el reset no | Dos políticas: longitud ≥ 8 en el alta y política completa en el reset | Una sola `validarPoliticaDeClave()` en `utils/passwordSecurity.ts`, usada por `create-user`, `register` y `reset-password` | `5885d86` |
| **DEF-34** (Alta), RQ2 | 30 logins fallidos seguidos, ninguno con 429 | Sin límite | `middleware/limite-de-intentos.ts`: 10 fallos por IP y correo cada 15 min → 429 con `Retry-After`; `trust proxy` para Render | `9f78787` |
| **DEF-43** (Alta), RQ3.1/RQ3.2/RQ5 | 40 solicitudes, validaciones o resets sin 429 | Sin límite | 5 solicitudes por IP y correo; 20 fallos de token por IP cada 15 min | `9f78787` |
| **DEF-41** (Media), RQ2 | Un correo inexistente respondía mucho más rápido (bcrypt solo si existía) | `if (!user) throw` inmediato | `igualarTiempoSinCuenta()`: bcrypt contra un hash ficticio del mismo coste | `54ad07f` |
| **DEF-44** (Baja), RQ3.1 | Dos solicitudes dejaban dos tokens vigentes | Solo insertaba | `invalidateResetTokens(email)` antes de insertar: solo vale el último enlace | `519740a` |
| **DEF-42** (Media), RQ5 | El JWT anterior seguía sirviendo después del reset | Sin control | `password_changed_at` se guarda en el reset; `authenticateToken` y `/me` rechazan los tokens con `iat` anterior (401 `TOKEN_REVOKED`). Es tolerante si falta la columna. Migración en `scripts/add-password-changed-at.sql` | `399d65b` |
| **DEF-40** (Media) y **DEF-31** (parcial) | Un 500 devolvía `duplicate key … usuarios_pkey … db.supabase.co` | `sendError` copiaba `error.message` en `details` | Los 5xx solo devuelven `{ error }` y el detalle va al log | `59c4e18` |
| **DEF-35** (Baja) | La API no enviaba cabeceras de seguridad | `x-powered-by` desactivado y nada más | `helmet` (nosniff, HSTS, XFO, Referrer-Policy…) sin CSP, con CORP `cross-origin` para el logo de los correos | `07c37b2` |
| **DEF-38** (Baja) | El JSON malformado devolvía una página HTML con la traza | Manejador por defecto de Express | `middleware/errores-del-cuerpo.ts`: 400, 413 o 415 en JSON | `07c37b2` |
| **DEF-47** (Baja), suite | 3 pruebas del login fallaban al azar (timeout de 5 s con bcrypt 12) | `testTimeout` por defecto | `testTimeout: 15_000`; se mantiene el coste 12 que exigen RQ1 y RQ13 | `ca920dd` |
| Mantenibilidad | `auth.routes.ts` de 523 líneas, con `any` y la lógica de sesión duplicada respecto de `auth.service.ts` | Rutas con helpers copiados y un `switch` para `/me` | Las rutas usan `resolverRolesUsuario`, `armarPerfilConRoles` e `infoPorTipoDeUsuario` de `auth.service.ts`; sin `any` | `886e825`, `ddd31b2` |

**Lección del refactor.** El primer intento (`886e825`) extrajo los helpers a un archivo nuevo, `sesion.ts`. SonarQube marcó la Quality Gate en **ERROR**: 7,4 % de duplicación en el código nuevo, porque esos helpers ya existían en `auth.service.ts`, y un *smell* S6551. La corrección (`ddd31b2`) reutiliza el servicio existente. El resultado fue Quality Gate en OK y una duplicación total del 1,7 % al **0,0 %**.

## 3. Cambios en el front

| Defecto (severidad) | Hallazgo y prueba | Antes | Después | Commit |
|---|---|---|---|---|
| **DEF-FE-04** (Baja), RQ2 | `redirectTo = https://evil.example` se seguía después del login | `if (redirectTo) navigate(redirectTo)` | `esRutaInterna()`: solo rutas `/…`; descarta `//`, `/\`, `javascript:` y URLs absolutas | `ceb44ea` |
| **DEF-FE-05** (Media) | `nginx.conf` y `vercel.json` sin cabeceras de seguridad ni gzip | Solo caché | CSP, HSTS, nosniff, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` (protege el token de la URL de reset), Permissions-Policy, `gzip` y `server_tokens off`; meta CSP mínima en `index.html` | `1b95b7d` |
| **DEF-FE-08** (Media), RQ5 | Botones del ojo sin nombre; el planner de Playwright, axe y Stagehand los detectaron | `<button>` solo con un icono | `aria-label` "Mostrar/Ocultar contraseña" y `aria-pressed` | `363c646` |
| **DEF-FE-09**, RQ2/3/5 | Los errores no se anunciaban al lector de pantalla | `<div>` sin rol | `role="alert"` en los errores de Login, ForgotPassword, ResetPassword y el alta | `363c646` |
| **DEF-FE-10**, RQ1/3/5 | El campo con error no lo declaraba | Sin ARIA | `Input`: `aria-invalid` + `aria-describedby` hacia el mensaje (`id={campo}-error`) | `363c646` |
| **DEF-FE-11**, RQ2 | Hacían falta 2 tabulaciones para llegar a "Iniciar sesión" | `motion.div whileTap` agregaba un `tabindex="0"` | Efecto de escala con CSS (`hover:scale`, `active:scale`) sin wrapper con foco | `363c646` |
| **DEF-FE-12** (Media), RQ1, **nuevo, encontrado con Cypress** | Al teclear `carla.ruiz@gmail.com` quedaba `carla.ruizgmail.com` | `usuarioDeCorreo()` en cada tecla | `siguienteUsuarioCorreo()` recuerda que se está escribiendo el dominio y lo descarta | `b2650bb` |

**Efecto en las herramientas de IA.** Después de DEF-FE-08, Stagehand con qwen2.5:7b dejó de confundir el botón "Actualizar contraseña" con los botones del ojo, que antes no tenían nombre. La accesibilidad mejoró también la automatización con IA.

## 4. Lo que queda pendiente

- **DEF-42 en producción:** hay que ejecutar `EntreAulas_Back/scripts/add-password-changed-at.sql` en Supabase (SQL Editor). Sin la columna, el reset funciona pero no revoca sesiones.
- **DEF-31, segunda parte** (validar `profesorId` en coordinador): pertenece a RQ22/RQ24.
- **Limitador en memoria:** si Render escala a más de una instancia, hay que moverlo a Redis.
- **Publicación:** el despliegue a Render y Vercel queda pendiente del push, que la integrante decidió no hacer en esta entrega.
