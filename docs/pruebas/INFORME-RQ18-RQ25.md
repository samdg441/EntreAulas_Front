# Informe de pruebas — RQ18, RQ19, RQ22, RQ23, RQ24 y RQ25

Fecha de ejecución: 2026-10-10 · Back: `https://entreaulas-back.onrender.com` (plan gratuito de Render) · Node 22.15

RQ20 y RQ21 no forman parte de este conjunto (igual que en `src/test/regression/rq18-rq25-regresion.test.ts`).

## 1. Estructura

```
EntreAulas_Front/
├── src/test/
│   ├── unit/            Funciones puras por dominio (ya existía)
│   ├── integration/     Pantallas con Testing Library (ya existía)
│   ├── regression/      Suites transversales por requisito (antes unit/regresion)
│   ├── api/             Contrato HTTP de los clientes axios, sin red (servidor falso)
│   ├── security/        Control de acceso, entradas maliciosas, integridad, inyección en Excel
│   ├── performance/     Presupuestos de tiempo en el navegador (fuera de npm test)
│   └── helpers/         render.tsx, api-falsa.ts, medicion.ts
├── e2e/                 Proyecto Cypress aparte (npm ci del front no descarga Cypress)
│   └── cypress/
│       ├── e2e/regresion/   UI real con el back simulado (cy.intercept)
│       ├── e2e/api/         Back real con cy.request (seguridad y contrato)
│       ├── e2e/defectos/    Defectos abiertos: fallan hasta que se corrijan
│       ├── fixtures/        Respuestas del back con la forma real de producción
│       └── support/         Sesión, simulación del back, JWT falsos
├── carga/               Prueba de carga del back (Node puro, sin dependencias)
└── reports/             Salidas generadas (ignorado por git)
```

## 2. Qué se prueba en cada nivel

| Req. | Regresión (Vitest) | API (Vitest) | Seguridad (Vitest) | Rendimiento (Vitest) | E2E UI (Cypress) | API real (Cypress) | Carga |
|---|---|---|---|---|---|---|---|
| RQ18 QR por correo | ✓ | ✓ | ✓ CRLF, multi-destinatario, ids manipulados | — | ✓ flujo completo | ✓ 401 sin token | — |
| RQ19 Acceso por rol | ✓ | ✓ 401 limpia / 403 conserva | ✓ matriz + ProtectedRoute | — | ✓ login, forbidden, multirol | ✓ alg none, otra clave, CORS, 403 admin | ✓ 401 bajo carga |
| RQ22 Métricas | ✓ | ✓ | ✓ datos manipulados | ✓ 100k notas | ✓ 99 → 0.00, "Sin datos" | ✓ promedios en [0,5], 404 otra carrera | ✓ |
| RQ23 Histórico | ✓ | ✓ | ✓ periodos inválidos | ✓ 10k periodos | ✓ cambio de periodo | defecto DEF-API-02/03 | ✓ |
| RQ24 Resumen coord. | ✓ | ✓ | ✓ regex, XSS, inyección de parámetros | ✓ 10k docentes + escalabilidad | ✓ búsqueda, 500 | ✓ pageSize ≤ 50, comillas | ✓ |
| RQ25 Exportación | ✓ | ✓ | ✓ fórmulas como texto, permisos | ✓ 5k filas | ✓ descarga y lectura del .xlsx | ✓ filas exportables | ✓ |

RQ18 y RQ19 no tienen prueba de rendimiento: validan un formulario o una ruta, y su costo no depende del volumen de datos.

## 3. Resultados

### 3.1 Vitest (`npm run test:coverage`)

38 archivos, **369 pruebas en verde** (antes 288). `tsc`: 48 errores, los mismos que ya existían. `npm run build`: OK.

### 3.2 Rendimiento en el front (`npm run test:performance`)

| Req. | Escenario | Mediana | p95 | Presupuesto |
|---|---|---|---|---|
| RQ22 | calcularPromedio, 100.000 notas | 2,5 ms | 4,8 ms | 30 ms |
| RQ23 | rangoFechasPeriodo, 10.000 periodos | 1,7 ms | 2,8 ms | 20 ms |
| RQ24 | filtrarDocentes, 1.000 docentes | 0,12 ms | 0,13 ms | 5 ms |
| RQ24 | filtrarDocentes, 10.000 docentes | 1,2 ms | 2,2 ms | 15 ms |
| RQ25 | armarModeloExcelCoordinador, 5.000 filas | 1,6 ms | 3,2 ms | 150 ms |
| RQ25 | exportCoordinatorReportExcel, 5.000 filas | 324 ms | 366 ms | 2.500 ms |

**Interpretación:** el front no es el cuello de botella. La búsqueda escala de forma lineal (10 veces más docentes cuestan unas 10 veces más tiempo). Lo único perceptible es escribir el `.xlsx` (unos 0,3 s con 5.000 filas), y aun así está 8 veces por debajo del presupuesto.

### 3.3 Carga sobre el back real (`npm run test:carga`)

Etapas de 1, 5 y 10 usuarios concurrentes, 20 s cada una, sin pausas entre peticiones. Arranque en frío medido aparte: **12,5 s** en la primera petición tras inactividad.

| Usuarios | Escenario | Req. | p50 | p95 | Errores | Criterio p95 | Resultado |
|---|---|---|---|---|---|---|---|
| 1 | health | base | 231 ms | 233 ms | 0 % | ≤ 1.000 ms | Cumple |
| 1 | sin token → 401 | RQ19 | 232 ms | 232 ms | 0 % | ≤ 1.000 ms | Cumple |
| 1 | dashboard-summary | RQ24 | 1.302 ms | 3.130 ms | 0 % | ≤ 3.000 ms | No cumple* |
| 1 | reports-overview | RQ23/25 | 3.167 ms | 3.909 ms | 0 % | ≤ 8.000 ms | Cumple |
| 1 | profesor-stats | RQ22 | 1.589 ms | 1.660 ms | 0 % | ≤ 3.000 ms | Cumple |
| 5 | dashboard-summary | RQ24 | 1.390 ms | 1.702 ms | 0 % | ≤ 3.000 ms | Cumple |
| 5 | reports-overview | RQ23/25 | 3.421 ms | 4.710 ms | 0 % | ≤ 8.000 ms | Cumple |
| 5 | profesor-stats | RQ22 | 1.799 ms | 2.550 ms | 0 % | ≤ 3.000 ms | Cumple |
| 10 | health | base | 298 ms | 519 ms | 0 % | ≤ 1.000 ms | Cumple |
| 10 | sin token → 401 | RQ19 | 289 ms | 385 ms | 0 % | ≤ 1.000 ms | Cumple |
| 10 | dashboard-summary | RQ24 | 1.591 ms | 2.815 ms | 0 % | ≤ 3.000 ms | Cumple |
| 10 | reports-overview | RQ23/25 | 6.289 ms | 8.285 ms | 0 % | ≤ 8.000 ms | **No cumple** |
| 10 | profesor-stats | RQ22 | 2.039 ms | 4.494 ms | 0 % | ≤ 3.000 ms | **No cumple** |

\* Con 1 usuario solo hubo 3 muestras: el p95 es en la práctica el máximo, y lo dominó la primera petición. Con 5 usuarios el mismo endpoint cumple holgadamente.

**Interpretación:**

- **Sin errores en ninguna etapa:** 0 % de 5xx y de timeouts, y los 401 siguen siendo rápidos bajo carga. El control de acceso no se degrada.
- **Saturación entre 5 y 10 usuarios:** el rendimiento total pasa de unas 3,2 a 4,0 peticiones por segundo (solo un 25 % más), mientras la mediana de `reports-overview` se duplica (3,4 s → 6,3 s). Esa es la señal típica de que se alcanzó la capacidad: las peticiones nuevas esperan en cola.
- **El cuello de botella está en las consultas, no en la red:** `health` y el 401 rondan los 230 ms con cualquier carga, mientras que los endpoints que consultan Supabase son de 6 a 27 veces más lentos.
- **El arranque en frío (12,5 s)** es lo que más afecta al primer usuario del día.

**Mejoras propuestas, en orden de impacto:**

1. Desplegar la optimización de `coordinador.service.ts` que ya está en el back local (memoización por petición y lotes en paralelo). En local bajó `reports-overview` de 7,6 s a 2,7 s con la misma salida.
2. Ejecutar `scripts/indices-rendimiento.sql` en Supabase (índices de evaluaciones, respuestas, inscripciones y asignaciones).
3. Guardar en caché `reports-overview` por coordinador y periodo durante unos minutos: el reporte de un periodo cerrado no cambia.
4. Evitar repetir en cada petición la consulta de roles y permisos que hace `auth` (cuesta 550–900 ms): incluirlos en el JWT o cachearlos.
5. Evitar el arranque en frío con un plan pago de Render o un ping programado a `/health`.

Después de aplicar 1 y 2, se repite la misma prueba de carga para comparar contra esta línea base.

## 4. Defectos encontrados

| Id | Dónde | Hallazgo | Estado |
|---|---|---|---|
| DEF-FE-01 | Front `lib/storage.ts`, `api/auth.ts` | Un `user` corrupto en `localStorage` lanzaba un error en `AuthContext` y dejaba **toda la app en blanco**. | **Corregido**: se descarta la sesión. Lo cubren `security/rq19…` y Cypress `rq19…` |
| DEF-API-01 | Back `profesor-stats/:id` | `abc` → **500** con el texto de PostgreSQL (`invalid input syntax for type bigint`): expone detalles internos. Debe ser 400. | Abierto (`cy:defectos`) |
| DEF-API-02 | Back `reports-overview` | `period=2026-9` → 200 con datos **de todos los periodos**. La regla de RQ23 solo existe en el front. | Abierto |
| DEF-API-03 | Back `reports-overview` | `period=2026-1' OR '1'='1` → 200 con todos los periodos. No es inyección SQL (PostgREST parametriza las consultas), pero la entrada inválida se acepta en silencio. | Abierto |
| DEF-API-04 | Back `app.ts` | Faltan cabeceras de seguridad (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`): no se usa `helmet`. | Abierto |
| DEF-FE-02 | Front `context/AuthContext.tsx` | Abrir o recargar una página protegida (p. ej. F5 en `/reports`) mandaba al coordinador a `/login` y de ahí a su dashboard: la sesión guardada se leía en un `useEffect`, después del primer render. Encontrado al ejecutar Cypress. | **Corregido**: la sesión se lee en el primer render. Lo cubre Screenplay ("La sesión sobrevive…") |
| DEF-FE-03 | Front `DashboardCoordinador.tsx` | Una respuesta sin `stats` dejaba el dashboard en blanco (`Cannot read properties of undefined`). | **Corregido**: métricas vacías, igual que ante un error |
| BRECHA-01 | Front `App.tsx` | Solo las rutas de admin exigen rol. Un estudiante puede abrir `/dashboard-coordinador` o `/reports` (sin datos, porque el back responde 403). | Documentado en Cypress |
| BRECHA-02 | Front | `validarCorreoQr`/`decidirGeneracionQr` (RQ18) y `filtrarDocentes` (RQ24) solo se usan en las pruebas: las pantallas no las llaman. | Documentado |

## 5. E2E con el patrón Screenplay (`screenplay/`)

Serenity/JS 3.48 + Playwright + Cucumber, con la estructura del repositorio de referencia
[serenityjs-e2e-testing](https://github.com/mauricioramirezv/serenityjs-e2e-testing).

| Capa | Responsabilidad | Ubicación |
|---|---|---|
| Actores y abilities | Carlos (coordinador), Eva (estudiante) y Api: `BrowseTheWebWithPlaywright`, `CallAnApi`, `TakeNotes` | `features/support/serenity.config.ts` |
| Features | Comportamiento en Gherkin (español) | `features/*.feature` |
| Step definitions | Conectan Gherkin con Screenplay; sin selectores | `features/step-definitions/` |
| Tasks | Objetivos de negocio: `IniciarSesion`, `BuscarDocente`, `CambiarPeriodo`, `ExportarDatosExcel`, `ConsultarApi` | `test/tasks/` |
| Interactions | Lo que Serenity/JS no trae: back simulado, descargar un archivo | `test/interactions/` |
| Questions | `rutaActual`, `docentesVisibles`, `promedioDe`, `archivoDescargado`, parámetros enviados al back | `test/questions/`, `test/interactions/` |
| Lean Page Objects | Localizadores estables (tipo de campo, `aria-label`, texto visible) | `test/ui/` |

Escenarios web con back simulado (deterministas) y escenarios `@api` contra el back real:

| Feature | Exitosos | Alternativos |
|---|---|---|
| Inicio de sesión (RQ19) | Coordinador llega a su panel; la sesión sobrevive a abrir `/reports` directo | Credenciales inválidas; tipo de usuario que no coincide; correo mal escrito no llega al back; sin sesión → `/login` |
| Panel del coordinador (RQ22/24) | Buscar "  ana  " (viaja recortado, página 1) | Búsqueda sin resultados; borrar la búsqueda; promedios 99 → 0.00 y sin evaluaciones → "Sin datos" |
| Reportes (RQ23/25) | Abre con 2026-1; exporta `reporte-coordinador-2026-1.xlsx` | Cambiar a 2025-2 pide ese periodo |
| API real (RQ18/19/22/24) | Resumen paginado ≤ 8 docentes | Sin token 401 `NO_TOKEN`; login inexistente 401 genérico; QR inexistente 404; `/api/users` 403; docente de otra carrera 404 |

Resultado: **21/21 escenarios** (15 web + 6 API) en 54 s. Reporte: `reports/serenity-js/index.html`
(`npm --prefix screenplay run test:report`), con captura de pantalla de cada interacción.

## 6. Cómo reproducir

```bash
# Vitest (unit, integración, regresión, API, seguridad) + cobertura
npm run test:coverage
npm run test:performance          # escribe reports/rendimiento/front-rq22-rq25.json

# Carga (sin token solo prueba health y 401)
npm run test:carga
TOKEN_FILE=/ruta/token.txt PROFESOR_ID=13 ETAPAS=1,5,10 DURACION_S=20 npm run test:carga

# Cypress (una vez: cd e2e && npm install && npx cypress install)
cd e2e
npm run test:e2e                  # levanta el front en :3001 y corre regresión UI + API real
npm run cy:api                    # solo API real, sin front
CYPRESS_TOKEN_COORDINADOR=... npm run cy:api   # incluye el contrato con sesión
npm run cy:defectos               # defectos abiertos (fallan a propósito)
npm run cy:ci                     # reporte JUnit en reports/cypress/

# Screenplay (una vez: cd screenplay && npm install && npx playwright install chromium)
cd screenplay
npm test                          # levanta el front y corre web + API
npm run test:web                  # solo recorridos web
TOKEN_FILE=/ruta/token.txt npm run test:api   # API real con sesión de coordinador
npm run test:report               # abre el reporte en http://localhost:8080
```

Si Playwright no logra descargar Chromium, los escenarios usan Edge (`channel: 'msedge'`), que viene con Windows.

El token del coordinador nunca se escribe en archivos del repo: se genera en una variable o en un archivo temporal que se borra al terminar.
