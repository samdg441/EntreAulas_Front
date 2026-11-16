# 13. Pruebas de seguridad

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas |
| Integrante | Esteban Arias |
| Funcionalidades | Creación de encuestas · Selección de la encuesta a usar · Notificaciones |
| Requisitos | RF-ENC-32, RF-ENC-33, RF-EVAL-11, RF-EVAL-12, RF-ACA-27, RF-NOT-34, RF-NOT-35 |
| Marco | OWASP Top 10 (2021) |
| Fecha | 16 de noviembre de 2026 |
| Herramientas | SonarQube 26.9 (estático) · Vitest + Supertest y Testing Library (dinámico, en proceso) · Cypress `cy.request` y `curl` (dinámico, contra el servidor) · `npm audit` (dependencias) |

## 1. Resumen

| Técnica | Resultado |
|---|---|
| Análisis estático, SonarQube back | Quality Gate **OK** · 0 vulnerabilidades · 0 hotspots · seguridad **A** · 0 issues nuevos |
| Análisis estático, SonarQube front | Quality Gate **OK** · 0 vulnerabilidades · 0 hotspots · seguridad **A** · 0 issues nuevos |
| Pruebas OWASP del back (Supertest) | **32/32** |
| Pruebas OWASP del front (Vitest + Testing Library) | **18/18** |
| Análisis dinámico contra el servidor (Cypress) | **9/9** |
| Dependencias (`npm audit --omit=dev`) | Back: 1 crítica, 5 altas · Front: 1 alta |
| Hallazgos | **2 corregidos** (SEC-07, SEC-17) · **4 abiertos** con recomendación (SEC-04, SEC-12, SEC-16, SEC-18) |
| Suites completas después de las correcciones | Back 1113/1113 · Front 860/860 · Cypress UI 14/14 · BDD 17/17 |

## 2. Superficie analizada

| Activo | Entrada del atacante | Quién puede usarla |
|---|---|---|
| `POST /api/evaluations/questions` y `/categories` | Cuerpo JSON | admin, coordinador |
| `PUT` y `DELETE /api/evaluations/questions/:id`, `PUT /categories/:id` | Id en la ruta y cuerpo JSON | admin, coordinador |
| `GET /api/evaluations/questions`, `/categories`, `/api/teachers`, `/api/periodos/evaluacion` | Token | cualquier usuario autenticado |
| `/admin/surveys` (front) | Textos que devuelve la API | admin |
| `/evaluate/selection` (front) | Docentes y materias que devuelve la API | estudiante |
| Campana de notificaciones | Ventanas de la API y `localStorage` (`notificaciones-leidas`) | cualquier usuario autenticado |

## 3. Análisis estático — SonarQube

Los dos proyectos se analizaron en el SonarQube local (el mismo del pipeline del punto 9), con la cobertura de toda la suite. Antes del análisis se agregaron `preguntas-encuesta.ts`, `seleccion-encuesta.ts` y `TeacherSelection.tsx` a `sonar.inclusions` del front: el código nuevo no se estaba analizando.

### 3.1 Primera corrida: Quality Gate en ERROR

| Proyecto | Condición que falló | Issues nuevos |
|---|---|---|
| Back | `new_violations = 1` | `evaluations.controller.ts:55`, `typescript:S6551`: `String(cambios.texto_pregunta ?? '')` puede producir «[object Object]» |
| Front | `new_violations = 9` | `TeacherSelection.tsx`: 4 ternarios anidados (S3358), complejidad cognitiva 16 > 15 (S3776), tarjeta de grupo `<div onClick>` sin teclado (S1082, bug) ni rol (S6848). `AdminSurveysPage.tsx`: `role="dialog"` en lugar de `<dialog>` (S6819) y un ternario anidado |

El issue del back **no era solo estilo**. Al validarlo con una prueba se confirmó un defecto real: SEC-17 (sección 6).

### 3.2 Correcciones

| Issue | Cambio |
|---|---|
| S6551 (back) | `textoDePregunta()` exige una cadena; se aplica también al `POST` |
| S3358, S3776 | `claseDocente`, `claseGrupo` y `sufijoMateria`; la lista de grupos pasa al componente `GruposDelCurso` |
| S1082, S6848 | Cada grupo es un `<button type="button">` con `aria-pressed`: se elige con el teclado |
| S6819 | `<dialog open aria-modal>` nativo; los selectores de Cypress pasan a `dialog[open]` |
| S6759 (apareció en la segunda corrida) | Props de `GruposDelCurso` como `Readonly<…>` |

### 3.3 Corrida final

| Métrica | Back | Front |
|---|---|---|
| Quality Gate | **OK** | **OK** |
| Vulnerabilidades | 0 | 0 |
| Security hotspots | 0 | 0 |
| Security rating / review rating | A / A | A / A |
| Bugs / reliability | 0 / A | 0 / A |
| Cobertura del código nuevo | 98,6 % | 91,3 % |
| Duplicación del código nuevo | 0,0 % | 0,0 % |
| Issues nuevos | 0 | 0 |

Evidencias: `evidencias/seguridad/sonar-resultado.json.txt` y `sonar-scan-front.txt`, y las del back en `EntreAulas_Back/docs/pruebas/evidencias/seguridad/`.

## 4. Análisis dinámico

### 4.1 Back — `src/test/security/rf-enc-32-33.security.test.ts` (Supertest, 32 casos)

La app Express, el middleware JWT y helmet son los reales. Solo el repositorio se espía, para comprobar que el ataque **no llega a la base**.

| ID | OWASP | Ataque | Resultado esperado y obtenido |
|---|---|---|---|
| SEC-01 | A01 | Las 5 escrituras sin token | 401 `NO_TOKEN`, sin escritura |
| SEC-02 | A01 | Estudiante y profesor en las 5 escrituras | 403 en todas, sin escritura |
| SEC-03 | A01 | JWT válido de un estudiante que dice `tipo_usuario: admin` | 403: el rol sale de la base, no del token |
| SEC-04 | A01 | Coordinador de la carrera 1 corrige una pregunta de la carrera 2 | **200: hallazgo abierto** |
| SEC-05 | A07 | JWT `alg: none`, firmado con otra clave, vencido y con el payload cambiado | 401, sin mencionar la librería JWT |
| SEC-06 | A07 | Token válido de un admin desactivado | 401 |
| SEC-07 | A03 | Id `8 OR 1=1`, `8;DROP TABLE…`, `8'--`, `0x8`, `1e1` | 400, sin escritura (`0x8` y `1e1` fallaban: **corregido**) |
| SEC-08 | A03 | `'; DROP TABLE preguntas_evaluacion; --` como texto | Se guarda como texto literal (consulta parametrizada), sin error SQL |
| SEC-09 | A03 | `<img onerror>` como texto | Se guarda tal cual en JSON; el escape lo prueba el front (SEC-FE-01) |
| SEC-17 | A03/A04 | Texto como objeto, lista, número o solo espacios (PUT y POST) | 400 (antes 200 con «[object Object]»: **corregido**) |
| SEC-10 | A04 | `__proto__`, `constructor`, `id` y `activa` en el cuerpo | Solo `texto_pregunta` llega al repositorio; `Object.prototype` intacto |
| SEC-11 | A04 | Cuerpo de 120 KB | 413 sin stack ni escritura |
| SEC-12 | A04 | `tipo_pregunta: "tipo-inventado"` | **201: hallazgo abierto** |
| SEC-13 | A05 | La base falla con SQL y rutas internas en el mensaje | 500 sin `preguntas_evaluacion`, `node_modules`, stack ni código |
| SEC-14 | A05 | JSON mal formado | 400 en JSON, sin `SyntaxError` |
| SEC-15 | A05 | Cabeceras | `nosniff`, `X-Frame-Options`, sin `X-Powered-By` |
| SEC-16 | A05 | Preflight desde `https://evil.example` sin `CORS_ORIGIN` | **`*`: hallazgo abierto** |

### 4.2 Front — `src/test/security/esteban-encuestas.security.test.tsx` (18 casos)

| ID | OWASP | Ataque | Resultado |
|---|---|---|---|
| SEC-FE-01 | A03 | Pregunta `<img src=x onerror=…>` y encuesta `<script>` desde la API | Se pintan como texto; no hay `<img>` ni `<script>` y no se ejecuta |
| SEC-FE-02 | A03 | Docente, departamento y materia con HTML | Texto plano en la selección |
| SEC-FE-03 | A03 | Ventana de evaluación con HTML en sus datos | La campana no inyecta nada |
| SEC-FE-04 | A01 | `/admin/surveys` con estudiante, profesor y coordinador; `/evaluate/selection` con admin y profesor | «Acceso denegado» (7 combinaciones, incluidas las permitidas) |
| SEC-FE-05 | A01 | Sin sesión | Login; la pantalla no se pinta |
| SEC-FE-06 | A01 | Roles extraños (`<script>`, `javascript:alert(1)`) en los avisos | La acción siempre es una ruta interna `/…`: no hay redirección abierta |
| SEC-FE-07 | A08 | `notificaciones-leidas` alterado (`no-es-json`, objeto, `null`…) | La campana funciona y no oculta el aviso |
| SEC-FE-08 | A04 | La API devuelve `id`, `activa` y un campo `es_admin` | El PUT envía solo los 7 campos editables |

### 4.3 Contra el servidor en ejecución — `e2e/cypress/e2e/security/esteban-seguridad-api.cy.ts`

Back local (`API_URL=http://localhost:3000`, con la base real). Sin credenciales: ningún ataque escribe.

| ID | Prueba | Resultado |
|---|---|---|
| SEC-D-01 | Cabeceras de seguridad | `nosniff`, `X-Frame-Options: SAMEORIGIN`, HSTS, sin `X-Powered-By` |
| SEC-D-02 | CORS desde `https://evil.example` | `Access-Control-Allow-Origin: *` con `Allow-Credentials: true` (confirma SEC-16) |
| SEC-D-03 | JSON mal formado | 400 en JSON sin stack |
| SEC-D-04 | Cuerpo de 120 KB | 413 sin stack |
| SEC-D-05 | 4 tokens falsificados | 401 sin detalles de la librería |
| SEC-D-06 | Inyección en la ruta sin sesión | 401/404, sin errores de base |

```text
9 passing (1s)   ✔  All specs passed!
```

Evidencias: `evidencias/seguridad/cypress-dast.txt` y `curl-cors-cabeceras.txt`.

## 5. Revisión de dependencias — `npm audit --omit=dev`

| Repo | Paquete | Severidad | Directa | ¿Afecta a estas funcionalidades? | Arreglo |
|---|---|---|---|---|---|
| Back | `proxy-addr` | Crítica | No | No directamente: suplantación de IP vía `trust proxy` (límite de intentos del login) | Sí, sin salto de versión mayor |
| Back | `body-parser` | Alta | No | **Sí**: `express.json()` procesa los cuerpos de `/questions`. DoS con cuerpo comprimido | Sí |
| Back | `axios` | Alta | Sí | No en el back de encuestas | Sí |
| Back | `follow-redirects` | Alta | No | No | Sí |
| Back | `nodemailer` | Alta | Sí | No (correo de recuperación y QR) | Sí |
| Back | `zod` | Alta | Sí | No: estas rutas no usan zod | Solo `zod@4` (cambio mayor) |
| Front | `xlsx` | Alta | Sí | No: exportación de reportes, no estas pantallas | **Sin arreglo publicado** |

Ninguna llegó con estos requisitos y no se actualizaron en este punto. `npm audit fix --omit=dev --dry-run` en el back proponía también **quitar** dependencias de desarrollo, así que no es un cambio seguro para aplicar a ciegas.

Evidencias: `evidencias/seguridad/npm-audit.json` en cada repositorio.

## 6. Hallazgos, severidad y validación

| ID | Hallazgo | OWASP | Severidad | Cómo se validó | Estado |
|---|---|---|---|---|---|
| SEC-07 | Un id `0x8` o `1e1` corregía otra pregunta: la corrección de DEF-49 usaba `Number()` | A03 | Baja | SEC-07 en rojo (`supertest-owasp-rojo.txt`: `expected 200 to be 400`) y luego en verde | **Corregido**: `/^\d+$/` y `isSafeInteger` |
| SEC-17 | Un texto que no es cadena se guardaba como «[object Object]»; el POST aceptaba solo espacios | A03/A04 | Media | Origen: Sonar S6551. Prueba SEC-17 en rojo (`sec-17-rojo.txt`) y en verde | **Corregido**: `textoDePregunta()` en POST y PUT |
| SEC-04 | Un coordinador puede modificar preguntas de otra carrera y las generales | A01 | Media | SEC-04 valida que hoy responde 200 | **Abierto**: hay que decidir la regla de negocio |
| SEC-12 | La API acepta cualquier `tipo_pregunta`; la pantalla, la base y el formulario del estudiante usan catálogos distintos | A04 | Baja | SEC-12 valida el 201 | **Abierto** |
| SEC-16 | CORS `*` con `credentials: true` si falta `CORS_ORIGIN` | A05 | Baja (API con Bearer, sin cookies) | SEC-16 y SEC-D-02 contra el servidor | **Abierto** |
| SEC-18 | Crear, corregir o retirar preguntas no deja auditoría; el front llama a `/api/coordinador/auditoria`, que el back no tiene | A09 | Media | Revisión de código: no hay ruta ni tabla de eventos | **Abierto** |

El detalle de cada uno está en `EntreAulas_Back/src/test/HALLAZGOS.md`. Los casos abiertos tienen una prueba que fija el comportamiento actual: si alguien lo corrige, la prueba falla y avisa que hay que actualizar este informe.

## 7. Recomendaciones

1. **SEC-04.** Antes de escribir, leer la pregunta y permitir al coordinador solo las de su `carrera_id`. Las generales (`id_carrera = null`) quedan para el administrador.
2. **SEC-18.** Registrar en cada escritura de preguntas y encuestas quién, cuándo, qué pregunta, valor anterior y valor nuevo. Así se puede saber quién cambió el instrumento de evaluación.
3. **SEC-16.** En producción, fallar cerrado si falta `CORS_ORIGIN` y verificar que Render la tenga definida.
4. **SEC-12.** Un catálogo único de tipos de pregunta, con `CHECK` en la base y lista blanca en la API, alineado con lo que pinta `EvaluationForm`.
5. **Dependencias.** Actualizar `body-parser` (afecta estas rutas) y `proxy-addr` en un cambio aparte, con la suite completa como red. Para `xlsx`, cambiar a la distribución oficial de SheetJS o a otra librería.
6. **Mantener** las prácticas que las pruebas confirmaron: rol desde la base y no desde el token, lista blanca de campos, errores sin detalles internos, helmet y límite de 100 KB en el cuerpo.

## 8. Cómo reproducirlo

```bash
# Back
cd EntreAulas_Back && npx vitest run src/test/security/rf-enc-32-33.security.test.ts
npm audit --omit=dev

# Front
cd EntreAulas_Front && node scripts/vitest.mjs run src/test/security/esteban-encuestas.security.test.tsx
npm audit --omit=dev

# Análisis dinámico contra el servidor (back levantado con npm run dev)
cd EntreAulas_Front/e2e && API_URL=http://localhost:3000 npx cypress run --e2e --config-file cypress.api.config.ts --spec cypress/e2e/security/esteban-seguridad-api.cy.ts

# SonarQube (docker compose -f ci/docker-compose.ci.yml up -d sonarqube)
SONAR_TOKEN=<token> npm run sonar        # en cada repositorio
```
