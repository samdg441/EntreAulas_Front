# Informe final de pruebas: EntreAulas, RQ1–RQ5

| Campo | Valor |
|---|---|
| Responsable | Juliana Franco (JulianaFranco140) |
| Fecha de cierre | 2026-10-26 |
| Versiones | Antes: tag `v-antes-refactor` (back `45a345a`, front `b14a263`)<br>Después: rama `pruebas-Juliana` (back `f54a6b0`, front `7848d62`) |
| Entorno de ejecución | Node 26 · Vitest 3 · Cypress 16.1.1 (Chromium) · Playwright 1.63 · Stagehand 4.3 + Ollama qwen2.5:7b (CPU) · SonarQube Community (Docker) · Docker (node:22, nginx:1.27) |
| Documentos relacionados | [Plan](PLAN-DE-PRUEBAS-RQ1-RQ5.md) · [Matriz](MATRIZ-TRAZABILIDAD-RQ1-RQ5.md) · [Antes/después](ANTES-DESPUES-RQ1-RQ5.md) · [IA](../../ia-testing/ANALISIS-IA.md) · [Registro de defectos del back](../../../EntreAulas_Back/src/test/HALLAZGOS.md) |

---

## 1. Resumen ejecutivo

- Se probaron las **seis funcionalidades** de autenticación con **11 tipos de prueba**:
  - unitaria, integración y componente, API, seguridad, regresión,
  - E2E UI, BDD, accesibilidad, rendimiento y carga,
  - IA y Stagehand.
- Se usaron **12 herramientas**.
- Hay **20 defectos** con prueba automatizada:
  - 13 del back, incluido DEF-47 de la suite;
  - 7 del front, contando DEF-FE-08 a 11 como cuatro.
- **Dos son nuevos de esta entrega:**
  - DEF-FE-12, hallado con Cypress.
  - DEF-47, hallado al correr la suite completa.
- Se corrigieron **19**. DEF-31 quedó parcial porque su segunda parte pertenece a otro requisito.
- El defecto **crítico** (DEF-39: un anónimo podía crear administradores) y los dos **altos** de fuerza bruta (DEF-34 y DEF-43) quedaron cerrados y verificados contra el despliegue.
- SonarQube cerró con la **Quality Gate en OK** en los dos proyectos:
  - Back: duplicación del **1,7 % → 0 %**.
  - Front: cobertura del código nuevo del 100 %.
- El último despliegue (contenedores `healthy`) pasó todas las suites posteriores, sin Stagehand, **sin fallos**.

---

## 2. Pruebas ejecutadas y resultados

### 2.1 Back (`EntreAulas_Back`)

| Suite | Comando | Antes | Después | Evidencia |
|---|---|---|---|---|
| Completa (unit, integración, regresión, API y seguridad) | `npx vitest run` | 986/989 (3 timeouts, DEF-47) | **1024/1024** | `docs/pruebas/{antes,despues}/back-suite-completa.txt` |
| Evidencias RQ1–RQ5 (21 → 24 archivos) | `npm run test:evidencias` | 332/332 | **366/366** | `back-evidencias.txt` |
| Defectos de RQ1–RQ5 (DEF-21, 31, 34, 35, 38–45) | `npm run test:defects` | 0/24 | **23/24** | `back-defects.txt` |
| Carga smoke de RQ1–RQ5 | `PERFIL=smoke node carga/carga-api.mjs` | Cumple (Render) | Cumple: p95 de 3–4 ms y **429 bajo ráfaga** | `carga-smoke-local.md` |

### 2.2 Front (`EntreAulas_Front`)

| Suite | Herramienta | Antes | Después | Evidencia |
|---|---|---|---|---|
| Completa | Vitest | 574/574 | **578/578** | `docs/pruebas/{antes,despues}/front-suite.txt` |
| Evidencias RQ1–RQ5 | Vitest | 251/251 | **255/255** | `front-evidencias.txt` |
| Defectos (DEF-FE-04, 05, 08–12) | Vitest | 0/23 | **25/25** | `front-defects.txt` |
| UI (5 specs, 45 casos) | Cypress | 44/45 | **45/45** | `antes/cypress-ui-rq1-rq5.txt` → `despues/cypress-despues-rq1-rq5.txt` |
| Regresión del ciclo de vida de la cuenta | Cypress | 3/3 | 3/3 | Ídem |
| Accesibilidad WCAG 2.1 AA (axe y teclado) | Cypress | 4/8 | **8/8** | `antes/cypress-a11y-rq1-rq5.txt` |
| API y contrato | Cypress | 12 pasan, 5 *pending* | 12 pasan, 5 *pending* | `antes/cypress-api-seguridad-render.txt` |
| Seguridad | Cypress | 9/13 (Render) | **13/13** (despliegue) | Ídem |
| BDD Gherkin + Screenplay (35 escenarios) | Cypress + cucumber | 35/35 | 35/35 | `evidencias/cypress/cucumber-bdd-rq1-rq5.html`, `despues/cucumber-bdd-despues.html` |
| Generadas con IA (26) | Playwright agents | 25/26 | **26/26** | `evidencias/playwright/`, `despues/playwright-*` |
| IA *low-code*: Testsigma (18) | Testsigma | Preparadas | Preparadas | `ia-testing/testsigma/resultados.md` (las ejecuta la integrante) |
| IA *low-code*: BugBug (11 de 16 ejecutadas) | BugBug, en la nube | **11/11** (solo 4 con aserción real) | Pendiente de publicar | `ia-testing/bugbug/resultados.md` y `evidencias/All_tests_2026-10-26_2.pdf` |
| act, observe y extract (3 scripts) | Stagehand + Ollama | n/a | **3/3** | `evidencias/stagehand/` |
| E2E previas | Selenium + Serenity | Pasan (entrega anterior) | Sin cambios | `screenplay-selenium/` |

**Casos *pending*.** Los 5 casos positivos de API (crear usuario real, login del admin, `/me`, contrato del alta y forgot de una cuenta real) necesitan `CYPRESS_ADMIN_EMAIL` y `CYPRESS_ADMIN_PASSWORD` del entorno real, y no se contó con esa cuenta. Están cubiertos por Vitest (contrato) y por el BDD y la regresión con el back simulado.

### 2.3 Totales

| Momento | Ejecutadas | Pasan | Fallan | *Pending* | Éxito |
|---|---|---|---|---|---|
| Antes (funcionales: back completa, front completa, Cypress UI, API, seguridad, regresión, a11y y BDD, Playwright) | 1710 | 1692 | 13 | 5 | 99,2 % |
| Antes (pruebas de defectos de RQ1–RQ5, que fallan a propósito) | 47 | 0 | 47 | — | 0 % |
| **Después** (mismas funcionales + Stagehand) | 1752 | **1747** | **0** | 5 | **100 %** de las ejecutadas |
| **Después** (defectos de RQ1–RQ5) | 49 | **48** | 1 (DEF-31, fuera de alcance) | — | 98 % |

---

## 3. Métricas

### 3.1 Cobertura de RQ1–RQ5

| | Sentencias | Ramas | Funciones | Líneas |
|---|---|---|---|---|
| Back antes | 80,97 % | 90,08 % | 76,05 % | 80,97 % |
| Back después | 81,03 % | **92,13 %** | **77,77 %** | 81,03 % |
| Front antes | 78,23 % | 79,05 % | 65,83 % | 80,37 % |
| Front después | 78,52 % | 79,42 % | 66,93 % | 80,54 % |

### 3.2 SonarQube (`localhost:9000`)

| Proyecto | Momento | Quality Gate | Bugs | Vulnerab. | Smells | Hotspots | Cobertura | Duplicación | Deuda | Calificaciones (R, S, M) |
|---|---|---|---|---|---|---|---|---|---|---|
| EntreAulas_Back | antes | OK | 0 | 0 | 0 | 0 | 94,5 % | 1,7 % | 0 min | A, A, A |
| EntreAulas_Back | 1.er refactor | **ERROR** | 0 | 0 | 1 | 0 | 94,5 % | 1,9 % (7,4 % en código nuevo) | 5 min | A, A, A |
| EntreAulas_Back | **final** | **OK** | 0 | 0 | 0 | 0 | 94,5 % (nuevo: 97,1 %) | **0,0 %** | 0 min | A, A, A |
| EntreAulas_Front | antes | OK | 0 | 0 | 0 | 0 | 96,6 % | 0,0 % | 0 min | A, A, A |
| EntreAulas_Front | **final** | **OK** | 0 | 0 | 0 | 0 | 96,6 % (nuevo: 100 %) | 0,0 % | 0 min | A, A, A |

**Lectura.** SonarQube no detectó ninguno de los defectos de seguridad: escalada de privilegios, fuerza bruta, enumeración por tiempo y sesiones no revocadas. Todos salieron de **pruebas dinámicas**. Sonar, a su vez, sí detectó la duplicación que introdujo el primer refactor. Las dos fuentes se complementan.

### 3.3 Densidad y eficacia

| Métrica | Valor |
|---|---|
| Defectos por funcionalidad | 20 / 6 ≈ **3,3** |
| Defectos por severidad | Crítica 1, Alta 3, Media 10, Baja 6 |
| Tasa de corrección | 19/20 = **95 %**; el 100 % de los que pertenecen a RQ1–RQ5 |
| Origen de los defectos | 18 registrados en entregas anteriores con Vitest (seguridad y componentes)<br>2 nuevos: DEF-FE-12 (Cypress) y DEF-47 (suite completa bajo carga)<br>Cypress confirmó en producción (Render) DEF-34, 35, 38 y 43<br>axe y el planner de Playwright confirmaron DEF-FE-08 a 11 |
| Tiempo de respuesta (carga smoke, despliegue) | p95 de 3–4 ms; presupuesto entre 1000 y 2000 ms |
| Stagehand: inferencias en CPU | 40–225 s cada una; 0 usos del respaldo determinístico en la ejecución final |

---

## 4. Defectos y correcciones

| ID | Severidad | RQ | Defecto | Corrección | Estado |
|---|---|---|---|---|---|
| DEF-39 | Crítica | RQ1 | `/register` público creaba cuentas admin, coordinador y decano con JWT | Autorregistro solo como estudiante; otro rol da 403 | ✅ |
| DEF-34 | Alta | RQ2 | Login sin límite de intentos | Limitador: 10 fallos por IP y correo cada 15 min → 429 | ✅ |
| DEF-43 | Alta | RQ3.1, RQ3.2, RQ5 | Recuperación sin límite (adivinar tokens) | 5 solicitudes y 20 fallos de token cada 15 min → 429 | ✅ |
| DEF-21 | Alta | RQ1 | `create-user` aceptaba `tipo_usuario` inválido | 400 `tipo_usuario inválido` | ✅ |
| DEF-40 | Media | RQ1, RQ2 | Los 500 exponían el mensaje de la base de datos | `sendError` sin `details` en 5xx | ✅ |
| DEF-41 | Media | RQ2 | Enumeración de cuentas por tiempo | bcrypt contra un hash ficticio | ✅ |
| DEF-42 | Media | RQ5 | El JWT sobrevivía al reset | `password_changed_at` + rechazo por `iat` | ✅ (falta la migración en Supabase) |
| DEF-FE-05 | Media | Transversal | El front sin CSP, HSTS, nosniff, XFO ni Referrer-Policy | Cabeceras en nginx, Vercel e `index.html` | ✅ |
| DEF-FE-08 | Media | RQ5 | Botones del ojo sin nombre accesible | `aria-label` y `aria-pressed` | ✅ |
| DEF-FE-09 | Media | RQ2, RQ3, RQ5 | Errores no anunciados | `role="alert"` | ✅ |
| DEF-FE-10 | Media | RQ1, RQ3, RQ5 | Campo con error sin `aria-invalid` | `aria-invalid` y `aria-describedby` en `Input` | ✅ |
| DEF-FE-11 | Media | RQ2 | Dos tabulaciones para llegar al botón de login | Se quitó el wrapper con `tabindex` | ✅ |
| DEF-FE-12 | Media | RQ1 | El dominio tecleado se pegaba al usuario del correo | `siguienteUsuarioCorreo()` | ✅ (nuevo) |
| DEF-31 | Media | RQ22, RQ24 | 500 con detalle; `profesorId` sin validar | Parte del detalle corregida | ◐ Parcial |
| DEF-35 | Baja | Transversal | API sin cabeceras de seguridad | helmet | ✅ |
| DEF-38 | Baja | Transversal | JSON malformado respondía HTML | Middleware de errores del cuerpo | ✅ |
| DEF-44 | Baja | RQ3.1 | Los tokens anteriores seguían vigentes | `invalidateResetTokens` | ✅ |
| DEF-45 | Baja | RQ1, RQ5 | Política de clave distinta en alta y reset | `validarPoliticaDeClave` única | ✅ |
| DEF-FE-04 | Baja | RQ2 | Redirección abierta después del login | `esRutaInterna` | ✅ |
| DEF-47 | Baja | Suite RQ2 | Pruebas del login intermitentes | `testTimeout` de 15 s | ✅ |

El detalle de cada cambio, con el antes y el después del código, está en [`ANTES-DESPUES-RQ1-RQ5.md`](ANTES-DESPUES-RQ1-RQ5.md).

---

## 5. Pruebas con IA y Stagehand

- **Playwright con agentes (planner, generator y healer):**
  - El plan y las 26 pruebas se generaron con IA.
  - El planner detectó DEF-FE-08 desde el árbol ARIA.
  - El healer reparó 4 localizadores ambiguos.
  - Se decidió, a mano, **no** "curar" la prueba de un defecto real.
  - Resultado: 25/26 → 26/26.
- **Testsigma** (18 casos NLP, CSV importable y prompts para Copilot) y **BugBug** (16 guiones con variables y componente de login) quedaron listos para ejecutarse en la nube contra Vercel y Render.
- **Stagehand + Ollama:** tres scripts cubren las seis funcionalidades con `observe` (descubrir controles), `act` (ejecutar acciones observadas) y `extract` (leer mensajes, tablas y confirmaciones con esquemas Zod). Las aserciones finales son determinísticas: ruta, token y payload recibido por el back.
  - Hallazgos de la herramienta:
    1. `act("instrucción")` no funciona con un modelo de 7B en CPU; el patrón observe → act sí.
    2. `extract` debe acotarse con `locator`.
    3. Después de corregir DEF-FE-08, el modelo dejó de confundir el botón de envío con los del ojo.
- El análisis completo de propósito, configuración, aportes y limitaciones está en [`ia-testing/ANALISIS-IA.md`](../../ia-testing/ANALISIS-IA.md).

---

## 6. Último despliegue y pruebas posteriores

Se ejecutaron en local las mismas etapas de los `Jenkinsfile`. La integrante decidió **no hacer push** en esta entrega, y el Jenkins local no tiene Docker, Node ni los hooks de Render y Vercel.

| Etapa | Resultado |
|---|---|
| Tests y cobertura | Back 1024/1024 · Front 578/578 |
| SonarQube + Quality Gate | Back **OK** · Front **OK** |
| Build Docker | `entreaulas-back:latest` (node:22 slim) · `entreaulas-front:latest` (nginx 1.27, `VITE_API_URL=http://localhost:3000`) |
| Deploy | `entreaulas-back-container` en `:3000` (`--env-file`) · `entreaulas-front-container` en `:3001` |
| Verify | Los dos contenedores en estado **healthy** · `GET /health` → `{"ok":true,"commit":"4ebbc92…"}` |
| Cabeceras verificadas con `curl -I` | API: nosniff, HSTS, `X-Frame-Options`, `Referrer-Policy`, sin `X-Powered-By`<br>Front: CSP completa, `X-Frame-Options: DENY`, `no-referrer`, HSTS, `Server: nginx` sin versión |

**Pruebas posteriores al despliegue (sin Stagehand), todas en verde:**
- Cypress UI, regresión, a11y, API y seguridad: 81 pasan y 5 *pending*.
- BDD: 35/35.
- Playwright: 26/26.
- Vitest del back y del front, y suites de defectos.
- Carga smoke.

Esto verifica las **correcciones** (los casos `[DEF-xx]` que fallaban contra Render ahora pasan) y la **ausencia de regresiones** (las suites que ya pasaban siguen pasando).

---

## 7. Conclusiones

1. Las seis funcionalidades **cumplen sus criterios de aceptación** en la versión final y en todos los niveles de prueba.
2. Las pruebas funcionales "felices" pasaban desde la línea base. **El valor de esta etapa estuvo en las pruebas negativas, de seguridad, de accesibilidad y E2E**: encontraron una escalada de privilegios crítica, dos vectores de fuerza bruta y cuatro barreras de accesibilidad que ni las unitarias ni SonarQube detectaban.
3. El enfoque **"defecto = prueba que falla"** permitió medir la refactorización de forma objetiva: 0 → 48 pruebas de defectos en verde, sin regresiones (1024 y 578 pruebas funcionales en verde).
4. SonarQube aportó como red de seguridad del propio refactor: detectó la duplicación del primer intento.
5. Las herramientas de IA aceleran la generación (Playwright agents) y el mantenimiento (healer, auto-healing). También encontraron un defecto de accesibilidad. Pero **requieren supervisión**: el healer puede ocultar defectos reales y el modelo local necesita patrones robustos.

## 8. Recomendaciones concretas

| Prioridad | Recomendación |
|---|---|
| P0 | Ejecutar `scripts/add-password-changed-at.sql` en Supabase antes de publicar; sin la columna, DEF-42 no protege |
| P0 | Hacer push y desplegar por Jenkins a Render y Vercel, y repetir `npm run cy:api` y `npm run cy:security` contra producción para confirmar DEF-34, 35, 38 y 43 allí |
| P1 | Agregar al `Jenkinsfile` del front una etapa `npm --prefix e2e run cy:rq1-rq5` (Chromium) y `cy:bdd`. Hoy el pipeline no corre ninguna E2E |
| P1 | Si Render escala a más de una instancia, mover el limitador de intentos a Redis o al *rate limiting* del proveedor |
| P1 | Crear una cuenta admin de pruebas dedicada (`CYPRESS_ADMIN_*` como credencial de Jenkins) para ejecutar los 5 casos *pending* y limpiar los usuarios `e2e.cy.*` al final |
| P2 | Mover el JWT de `localStorage` a una cookie `HttpOnly; Secure; SameSite=Strict`, como defensa en profundidad además de la CSP |
| P2 | Llevar las cabeceras de accesibilidad y `role="alert"` a los demás formularios (evaluación, QR y reportes) y agregar axe a sus specs |
| P2 | Ejecutar Testsigma o BugBug programados después de cada despliegue, como prueba de aceptación sobre producción |
| P3 | Revisar la Quality Gate para exigir 0 *hotspots* sin revisar y cobertura ≥ 90 % en el código nuevo de todo el proyecto, no solo de las inclusiones actuales |
| P3 | Para Stagehand en CI usar un modelo en la nube (Gemini u OpenAI) o una GPU; en CPU cada inferencia tarda de 1 a 3 minutos |
