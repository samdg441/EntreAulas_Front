# Registro de defectos — Frontend (V&V)

Defectos detectados durante la validación de los requisitos RQ6, RQ14–RQ17 y RQ18–RQ24
en la capa de presentación. Cada uno tiene una prueba ejecutable que **falla mientras el
defecto siga abierto**.

```bash
npm run test:defects
```

Está separado de la suite de requisitos a propósito: `npm test` valida el alcance
entregado (verde) y `npm run test:defects` reporta los defectos (rojo).
Los defectos del backend se registran en `EntreAulas_Back/src/test/HALLAZGOS.md`.

## Resumen

| ID | Defecto | RQ | Severidad | Estado |
|----|---------|----|-----------|--------|
| DEF-09 | Respuesta incompleta deja el dashboard en blanco | RQ24 | **Alta** | ABIERTO |
| DEF-10 | Paginación nula se muestra vacía en pantalla | RQ24 | Media | ABIERTO |
| DEF-11 | QR sin datos abre la encuesta igual | RQ18 | Media | ABIERTO |
| DEF-12 | La calificación no se valida contra la escala 0–5 | RQ22 | Baja | ABIERTO |
| DEF-16 | Un estudiante abre dashboards de otro rol | RQ19 | **Alta** | ABIERTO |
| DEF-17 | Programar encuesta no llama al backend | RQ18 | **Alta** | ABIERTO |
| DEF-18 | Fechas de vigencia del QR no salen del cliente | RQ18 | **Alta** | ABIERTO |
| DEF-19 | Rol `Admin` no abre el dashboard de admin | RQ19 | Media | ABIERTO |
| DEF-21 | Un 403 no redirige a `/forbidden` | RQ6 | Media | ABIERTO |
| DEF-27 | Un 401 en auto-enroll no va a `/login` | RQ14 | Media | ABIERTO |
| DEF-28 | Fechas/período no viajan en el lote de Admin QR | RQ15 | **Alta** | ABIERTO |
| DEF-29 | Email inválido se envía igual | RQ16 | Baja | ABIERTO |
| DEF-30 | GET de token vacío abre el formulario | RQ17 | Media | ABIERTO |

Camino fallido por requisito asignado: RQ6 → DEF-21 · RQ14 → DEF-27 · RQ15 → DEF-28 · RQ16 → DEF-29 · RQ17 → DEF-30.

Técnica de detección: inyección de respuestas degradadas de la API (campos
faltantes, valores nulos, valores fuera de rango) para comprobar la robustez del
render. DEF-10 y DEF-11 son además defectos de integración: nacen de que ninguna
de las dos capas valida el contrato que la otra le entrega.

---

## DEF-09 — Una respuesta incompleta deja el dashboard del coordinador en blanco

| Campo | Valor |
|---|---|
| Requisito afectado | RQ24 — Ver resumen del coordinador |
| Severidad | Alta |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-09-dashboard-en-blanco.test.tsx` |
| Archivo | `src/features/dashboard-coordinator/DashboardCoordinador.tsx:119` y `:483` |

**Descripción.** El componente accede a `t.promedio.toFixed(2)` y guarda
`response.stats` sin comprobar que existan. Si el backend omite cualquiera de los
dos, el render lanza una excepción, React desmonta el árbol completo y el usuario
ve una **pantalla totalmente en blanco**, sin mensaje de error ni forma de
recuperarse salvo recargar.

**Pasos para reproducir.**
1. Que la API devuelva un docente con `totalEvaluaciones > 0` pero sin `promedio`.
2. O que devuelva una respuesta sin el objeto `stats`.

**Resultado esperado.** La pantalla se muestra, con "Sin datos" en la celda que falte.
**Resultado obtenido.** `document.body` queda vacío (0 caracteres).

**Impacto.** Un único registro mal formado en la base de datos inutiliza el
dashboard completo para ese coordinador.

**Corrección propuesta.** Usar `Number(t.promedio ?? 0).toFixed(2)`, dar valor por
defecto a `stats` igual que ya se hace con `teachers` y `pagination`, y envolver la
página en un *error boundary*.

---

## DEF-10 — La paginación nula del backend se muestra vacía en pantalla

| Campo | Valor |
|---|---|
| Requisito afectado | RQ24 — Ver resumen del coordinador |
| Severidad | Media |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-10-paginacion-null-en-ui.test.tsx` |
| Relacionado | DEF-03 (backend) |

**Descripción.** Cuando el backend devuelve `pagination` con `null` (ver DEF-03),
el pie de la tabla renderiza literalmente `Página  de `, sin números.

**Resultado esperado.** Un número de página visible siempre.
**Resultado obtenido.** `Página  de `.

**Verificado y descartado.** Se sospechó que los botones de navegación quedarían
habilitados, pero la prueba demostró lo contrario: `null >= null` se evalúa como
`0 >= 0`, así que sí se deshabilitan correctamente.

**Corrección propuesta.** Normalizar la paginación al recibirla
(`Number(p.page) || 1`), además de corregir DEF-03 en el origen.

---

## DEF-11 — Un QR con respuesta vacía abre la encuesta igual

| Campo | Valor |
|---|---|
| Requisito afectado | RQ18 — Validar QR vencido o inválido |
| Severidad | Media |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-11-qr-payload-vacio.test.tsx` |
| Archivo | `src/features/evaluations/QrEvaluationEntry.tsx:37` |

**Descripción.** El componente hace `(await getQrEvaluation(token)) || {}` y navega
al formulario sin comprobar que lleguen `profesorId`, `cursoId` y `grupoId`. Con una
respuesta vacía el estudiante llega a una encuesta con identificadores `undefined`,
y el fallo aparece más tarde, al intentar enviarla.

**Resultado esperado.** Mensaje "No se pudo abrir la encuesta".
**Resultado obtenido.** Navega al formulario de evaluación.

**Corrección propuesta.** Validar los campos obligatorios de la respuesta antes de
navegar y, si faltan, tratarlo como QR inválido.

---

## DEF-12 — La calificación no se valida contra la escala 0–5

| Campo | Valor |
|---|---|
| Requisito afectado | RQ22 — Calcular métricas de evaluación |
| Severidad | Baja |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-12-calificacion-fuera-de-rango.test.tsx` |
| Archivo | `src/features/dashboard-teacher/DashboardProfesor.tsx:312` |

**Descripción.** `averageRating > 0 ? \`${averageRating}/5.0\` : '0.0/5.0'` no
comprueba el rango. Un promedio de 99 se muestra como `99/5.0`, y un valor negativo
cae en la rama del `else` y se muestra como `0.0/5.0`, indistinguible de "sin
evaluaciones".

**Corrección propuesta.** Acotar el valor al rango y mostrar un indicador de dato
inválido cuando quede fuera.

---

## DEF-16 — Un estudiante autenticado abre dashboards de otro rol

| Campo | Valor |
|---|---|
| Requisito afectado | RQ19 — Redirigir al dashboard según el rol |
| Severidad | Alta |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-16-dashboard-sin-control-de-rol.test.tsx` |
| Archivo | `src/App.tsx:125-148` |

**Descripción.** RQ19 no termina al *calcular* la ruta: también hay que *impedir* que
quien ya está dentro entre a un panel que no le toca. `ProtectedRoute` implementa
eso con `allowedRoles`, y `/dashboard-admin` lo usa. Los otros cuatro paneles no:

- `/dashboard-estudiante` — solo `user ? … : login`
- `/dashboard-profesor` — igual
- `/dashboard-coordinador` — igual
- `/dashboard-decano` — `ProtectedRoute` sin `allowedRoles` (cualquier sesión pasa)

El control de la prueba que **sí pasa** monta `/dashboard-admin` con
`allowedRoles={['admin']}`: el estudiante es redirigido a "Acceso no permitido".
Los otros dos casos esperan lo mismo y fallan: con la sesión hidratada, el
estudiante ve "Panel coordinador" y "Panel profesor".

**Pasos para reproducir.** Iniciar sesión como estudiante, escribir en la barra de
direcciones `/dashboard-coordinador` (o navegar ahí desde un enlace).

**Resultado esperado.** Redirección a `/forbidden`.
**Resultado obtenido.** Se monta el dashboard del coordinador.

**Corrección propuesta.** Envolver cada dashboard con
`ProtectedRoute allowedRoles={[rol]}` como ya se hace en `/dashboard-admin`.

---

## DEF-17 — "Programar encuesta" no llama al backend

| Campo | Valor |
|---|---|
| Requisito afectado | RQ18 — Validar QR vencido o inválido |
| Severidad | Alta |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-17-programar-encuesta-sin-api.test.tsx` |
| Archivo | `src/features/evaluations/ScheduleSurveys.tsx:256` |

**Descripción.** El botón "Programar encuesta" exige fecha de inicio, fecha de cierre
y período. Si están llenos, muestra `Encuesta programada correctamente` y navega al
dashboard. El `try` está vacío: el comentario dice "Aquí iría la llamada real a tu
endpoint". No hay POST. El coordinador cree que dejó una ventana de vigencia y no
se guardó nada. Encaja con DEF-14 del backend: el vencimiento no existe porque
nunca se persiste.

**Resultado esperado.** Llamada a la API de programación/QR y ningún mensaje de
éxito si esa llamada no ocurrió.
**Resultado obtenido.** `alert('Encuesta programada correctamente')` sin tocar el
servidor.

**Corrección propuesta.** Llamar a `createQrEvaluationsBatch` (o al endpoint de
programación) con las fechas, y solo entonces mostrar el éxito.

---

## DEF-18 — Las fechas de vigencia del QR no salen del cliente

| Campo | Valor |
|---|---|
| Requisito afectado | RQ18 — Validar QR vencido o inválido |
| Severidad | Alta |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-18-fechas-qr-no-se-envian.test.tsx` |
| Archivo | `src/api/evaluations.api.ts:16` y `ScheduleSurveys.tsx:258` |
| Relacionado | DEF-14 y DEF-15 (backend) |

**Descripción.** Dos fallos en la misma ventana:

1. `createQrEvaluationsBatch` solo envía `{ grupoIds }`. Las fechas que el
   coordinador acaba de escribir no viajan.
2. El formulario no compara inicio y cierre. `2026-12-31` → `2026-01-01` se
   acepta y dispara el mensaje de éxito (encima de DEF-17).

El input `type="date"` sí descarta un mes 13, pero eso es el navegador, no el
producto. El rango invertido pasa.

**Resultado esperado.** El POST lleva `startDate` y `endDate`; un cierre anterior
al inicio se rechaza.
**Resultado obtenido.** POST `{ grupoIds }` (o ningún POST, ver DEF-17) y éxito
con el rango invertido.

---

## DEF-19 — El cálculo de dashboard en el front distingue mayúsculas

| Campo | Valor |
|---|---|
| Requisito afectado | RQ19 — Redirigir al dashboard según el rol |
| Severidad | Media |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-19-rol-sensible-mayusculas.test.tsx` |
| Archivo | `src/context/AuthContext.tsx:180` |
| Relacionado | DEF-05 (backend) |

**Descripción.** `getDashboardPathForUser` compara roles con `includes` exacto y
`tipo_usuario` con `.toLowerCase()`. Un usuario con `roles: ['Admin']` termina
en `/dashboard`. Es el mismo defecto que DEF-05, duplicado en el cliente: si el
backend algún día normaliza y el front no (o al revés), las capas discrepan.

`hasRole` sí normaliza a minúsculas, así que el guardia de `/dashboard-admin`
podría dejar pasar a `Admin` mientras el cálculo de ruta lo manda a `/dashboard`.

**Resultado esperado.** `/dashboard-admin`.
**Resultado obtenido.** `/dashboard`.

**Corrección propuesta.** Normalizar roles igual que `tipo_usuario` (y igual que
`hasRole`), en un solo mapa compartido.

---

## DEF-21 — Un 403 no redirige a `/forbidden`

| Campo | Valor |
|---|---|
| Requisito afectado | RQ6 — Control de acceso por roles |
| Severidad | Media |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-21-403-sin-forbidden.test.ts` |
| Archivo | `src/api/client.ts` (rama 403 del interceptor) |

**Descripción.** El contrato de integración de RQ6 indica que un 403 debe llevar
a `/forbidden`. El interceptor solo emite `console.warn` y deja la petición
rechazada; no cambia la ruta.

**Resultado esperado.** `window.location` incluye `/forbidden`; el token se conserva.
**Resultado obtenido.** No hay redirección.

**Corrección propuesta.** En el interceptor 403, redirigir a `/forbidden` (sin
borrar `token`/`user`).

---

## DEF-27 — Un 401 en auto-enroll no lleva al login

| Campo | Valor |
|---|---|
| Requisito afectado | RQ14 — Auto-inscripción por QR |
| Severidad | Media |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-27-401-auto-enroll-sin-login.test.tsx` |
| Archivo | `src/features/evaluations/QrEvaluationEntry.tsx` (catch del `useEffect`) |

**Descripción.** El grafo de RQ14 indica que un 401 debe ir a `/login` y
conservar el retorno al QR. Si `autoEnrollQrEvaluation` falla con 401 (sesión
caducada a mitad del flujo), el catch pinta «No se pudo abrir la encuesta» y
un botón opcional. No redirige ni escribe `redirectTo`.

**Resultado esperado.** Pantalla de login y `localStorage.redirectTo` con la URL del QR.
**Resultado obtenido.** Error en la misma ruta `/qr-evaluacion`.

**Causa raíz.** El `catch` no distingue `response.status === 401` del resto de errores.

**Corrección propuesta.** Si el status es 401, guardar `redirectTo` y
`navigate('/login', { replace: true })`, igual que el camino «sin sesión».

---

## DEF-28 — Fechas y período no viajan en el lote de Admin QR

| Campo | Valor |
|---|---|
| Requisito afectado | RQ15 — Generación masiva de QR |
| Severidad | Alta |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-28-fechas-batch-admin-qr.test.tsx` |
| Archivo | `src/features/dashboard-admin/AdminQrPage.tsx` (`ensureTokensForGrupoIds`) y `src/api/evaluations.api.ts` (`createQrEvaluationsBatch`) |
| Relacionado | DEF-18 (misma causa en la pantalla de programar encuesta) |

**Descripción.** El formulario de Admin QR obliga a llenar inicio, cierre y
período, pero `ensureTokensForGrupoIds` llama `createQrEvaluationsBatch(missing)`
y la API solo POSTea `{ grupoIds }`. El backend genera tokens sin vigencia
(DEF-14 / DEF-15).

**Resultado esperado.** El POST incluye `grupoIds`, `startDate`, `endDate` y `period`.
**Resultado obtenido.** Solo se envía el array de ids.

**Causa raíz.** La firma de `createQrEvaluationsBatch` no acepta fechas; la UI
las valida y las descarta.

**Corrección propuesta.** Ampliar el payload del cliente y usarlo desde
`ensureTokensForGrupoIds` (y alinear el backend, ver DEF-14/15).

---

## DEF-29 — El modal de correo no valida el formato del destinatario

| Campo | Valor |
|---|---|
| Requisito afectado | RQ16 — Distribución de QR por correo |
| Severidad | Baja |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-29-email-invalido-se-envia.test.tsx` |
| Archivo | `src/features/dashboard-admin/AdminQrPage.tsx` (`sendShareEmail`) |

**Descripción.** RQ16 C1 exige destinatario válido. La UI solo comprueba que
`to.trim()` no esté vacío: `"hola-sin-arroba"` dispara `shareQrEvaluationsEmail`.
El formato, si acaso, lo rechaza el 400 del backend.

**Resultado esperado.** Alerta de correo inválido y **no** llamar a la API.
**Resultado obtenido.** Se llama `shareQrEvaluationsEmail` con `to: 'hola-sin-arroba'`.

**Causa raíz.** No hay regex ni `type="email"` efectivo antes del POST.

**Corrección propuesta.** Validar el destinatario en cliente (mismo criterio que
el backend) y abortar con alerta si no coincide.

---

## DEF-30 — Un GET de token vacío abre el formulario

| Campo | Valor |
|---|---|
| Requisito afectado | RQ17 — Resolución de token QR |
| Severidad | Media |
| Estado | ABIERTO |
| Evidencia | `defects/DEF-30-qr-payload-vacio-rq17.test.tsx` |
| Archivo | `src/features/evaluations/QrEvaluationEntry.tsx` |
| Relacionado | DEF-11 (mismo síntoma etiquetado RQ18) |

**Descripción.** El grafo de RQ17 exige `profesorId`, `cursoId` y `grupoId` para
continuar. El cliente hace `(await getQrEvaluation(token)) || {}` y navega a
`/evaluate/form` con identificadores `undefined`.

**Resultado esperado.** «No se pudo abrir la encuesta»; no entrar al formulario.
**Resultado obtenido.** Navega a `/evaluate/form`.

**Causa raíz.** No se valida el contrato del GET antes de `navigate`.

**Corrección propuesta.** Si faltan `profesorId`, `cursoId` o `grupoId`,
`setError` y no navegar (misma corrección que DEF-11).

---

## Limitación conocida del alcance de las pruebas

Las pruebas del frontend sustituyen la capa de API por dobles, así que **no
verifican que el backend realmente devuelva la forma esperada**. Los defectos
DEF-10 y DEF-11 se detectaron simulando respuestas degradadas, no observando el
sistema real. Confirmar el contrato entre capas requiere pruebas de extremo a
extremo con el backend levantado, nivel que hoy solo existe como esqueleto en
`src/test/e2e/`.
