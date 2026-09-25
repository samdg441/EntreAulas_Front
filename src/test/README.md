# Pruebas Frontend — Regresión RQ1, RQ2, RQ3.1, RQ3.2, RQ4 y RQ5

Suite de regresión sobre el flujo de **autenticación y recuperación de
contraseña**. Framework: **Vitest** + **Testing Library** (jsdom), con
aserciones encadenadas (`expect(x).matcher()`) en estilo Given/When/Then.

## Matriz historia de usuario → módulo/componente real → archivo de test

| Req. | Historia de usuario | Módulo/componente real | Unit | Integración |
|---|---|---|---|---|
| RQ1 | Como admin, registrar usuarios con contraseña para habilitar su acceso | `gestionar-usuarios.ts`, `validatePasswordStrength`, `AdminUsersPage.tsx` | `unit/rq1-registro-usuarios-admin.test.ts` | `integration/rq1-registro-usuarios-admin.integration.test.tsx` |
| RQ2 | Como usuario, iniciar sesión y obtener un token según mi rol | `login-flow.ts`, `AuthContext.login`, `Login.tsx` | `unit/rq2-login.test.ts` | `integration/rq2-login.integration.test.tsx` (orquestación) + `integration/rq2-login-page.integration.test.tsx` (pantalla real) |
| RQ3.1 | Como usuario, que el sistema genere el token de recuperación (solicitud) | `password-reset-flow.ts` (`validarFormularioRequest`), `ForgotPassword.tsx` | `unit/rq3-1-solicitud-recuperacion.test.ts` | `integration/rq3-4-solicitud-y-envio-recuperacion.integration.test.tsx` |
| RQ3.2 | Validación de token de recuperación | `password-reset-flow.ts` (`debeValidarToken`), `api/passwordReset.ts` (`validateResetToken`) | `unit/rq3-2-validacion-token.test.ts` | cubierto dentro de `rq5-restablecer-contrasena.integration.test.tsx` (valida el token al montar `ResetPassword.tsx`) |
| RQ4 | Recibir el enlace de recuperación por correo (envío) | `api/passwordReset.ts` (`requestPasswordReset`), `ForgotPassword.tsx` | `unit/rq4-envio-correo-recuperacion.test.ts` | `integration/rq3-4-solicitud-y-envio-recuperacion.integration.test.tsx` |
| RQ5 | Con token válido, definir una nueva contraseña | `password-reset-flow.ts` (`validarFormularioReset`), `api/passwordReset.ts` (`resetPassword`), `ResetPassword.tsx` | `unit/rq5-restablecer-contrasena.test.ts` | `integration/rq5-restablecer-contrasena.integration.test.tsx` |

Técnica: partición de equivalencia + valores límite + tablas de decisión sobre
cada función exportada, más pruebas de integración con Testing Library sobre
los componentes reales cuando compilan y montan correctamente.

## Hallazgo corregido: DEF-01 — `ForgotPassword.tsx` no compilaba

`src/features/auth/ForgotPassword.tsx` (la pantalla real de "¿Olvidaste tu
contraseña?", ruteada en `/forgot-password`) tenía código muerto de un
segundo paso ("reset") que duplicaba a `ResetPassword.tsx` y referenciaba
variables que nunca se declaraban (`resetToken`, `userEmail`, `step`,
`formData`, `errors`, `setStep`, `setFormData`, `setErrors`, `handleSubmit`,
`FormData`, `FormErrors`). Montaba y lanzaba un `ReferenceError` de inmediato,
porque el primer `useEffect` evaluaba `[resetToken, userEmail]` como
dependencias en cada render.

**Corrección aplicada:** se quitó ese segundo paso muerto (el flujo de
restablecer contraseña ya vive, completo y probado, en `ResetPassword.tsx` /
`/reset-password`) y se conectó `validarFormularioRequest` — que ya estaba
importada pero nunca se usaba — a la validación del envío. El componente
ahora solo hace lo que su propio JSX siempre mostró: pedir el correo, validarlo
y llamar a `requestPasswordReset`.

La cobertura de esta corrección vive en
`integration/rq3-4-solicitud-y-envio-recuperacion.integration.test.tsx`
(monta sin lanzar, formato de correo inválido, éxito y error del backend).

## Cómo correrlas

```bash
npm install              # trae vitest, jsdom, testing-library y user-event

npm test                 # unit + integration, todas en verde
npm run test:watch
npm run test:coverage

npx vitest run src/test/unit/rq2-login.test.ts   # un archivo puntual
```
