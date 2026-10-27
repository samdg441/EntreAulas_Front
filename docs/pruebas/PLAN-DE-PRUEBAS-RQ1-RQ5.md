# Plan de pruebas: EntreAulas, autenticación (RQ1–RQ5)

| Campo | Valor |
|---|---|
| Proyecto | EntreAulas, evaluación docente de la Universidad de Medellín |
| Repositorios | `EntreAulas_Front` (React + Vite) y `EntreAulas_Back` (Node/Express + Supabase) |
| Responsable | Juliana Franco (JulianaFranco140) |
| Rama | `pruebas-Juliana` |
| Versión del plan | 3.0 (final), 2026-10-26 |
| Documentos relacionados | Matriz de trazabilidad: [`MATRIZ-TRAZABILIDAD-RQ1-RQ5.md`](MATRIZ-TRAZABILIDAD-RQ1-RQ5.md)<br>Informe final: [`INFORME-FINAL-PRUEBAS-RQ1-RQ5.md`](INFORME-FINAL-PRUEBAS-RQ1-RQ5.md)<br>Antes y después: [`ANTES-DESPUES-RQ1-RQ5.md`](ANTES-DESPUES-RQ1-RQ5.md) |

---

## 1. Alcance

### 1.1 Funcionalidades bajo prueba (las seis de la integrante)

| ID | Funcionalidad | Historia de usuario | Front | Back |
|---|---|---|---|---|
| **RQ1** | Registro de usuarios desde admin | Como admin, registrar usuarios con contraseña para habilitar su acceso | `features/dashboard-admin/AdminUsersPage.tsx`, `gestionar-usuarios.ts` | `POST /api/auth/create-user` (y `POST /register`) |
| **RQ2** | Login | Como usuario, iniciar sesión y obtener un token según mi rol | `features/auth/Login.tsx`, `login-flow.ts`, `context/AuthContext.tsx` | `POST /login`, `/login-with-role`, `GET /me`, `/profile` |
| **RQ3.1** | Solicitud de recuperación | Que el sistema genere el token de recuperación | `features/auth/ForgotPassword.tsx` | `POST /api/auth/forgot-password` |
| **RQ3.2** | Validación del token | Validar el token de recuperación | `features/auth/ResetPassword.tsx` | `GET /api/auth/validate-reset-token/:token` |
| **RQ4** | Envío del enlace por correo | Recibir el enlace de recuperación por correo | Confirmación en `ForgotPassword` | `enviarCorreoRecuperacion()` (Brevo/SMTP) |
| **RQ5** | Restablecer contraseña | Con un token válido, definir una nueva contraseña | `features/auth/ResetPassword.tsx` | `POST /api/auth/reset-password` |

### 1.2 Fuera de alcance

- Los requisitos de los demás integrantes: RQ6, RQ10, RQ11, RQ13–RQ31.
- La validación de `profesorId` en el coordinador (segunda parte de DEF-31), que pertenece a RQ22/RQ24.
- El contenido visual del correo en clientes reales. El envío se prueba con un buzón SMTP local en las unitarias y con el buzón simulado en las E2E.
- El despliegue en Render y Vercel con los hooks de Jenkins. Se acordó no hacer push en esta entrega; el último despliegue se hizo con las mismas etapas en contenedores locales (sección 8).

---

## 2. Estrategia

Se sigue una pirámide de pruebas con una línea base medida antes de refactorizar:

1. **Línea base.** Se ejecutan todas las suites sobre el tag `v-antes-refactor` y se guardan los resultados en `docs/pruebas/antes/`.
2. **Detección.** Las pruebas nuevas (Cypress, BDD, IA y Stagehand) buscan defectos. Cada defecto se registra con una prueba en `src/test/defects/` que **falla mientras el defecto está abierto**.
3. **Corrección dirigida por pruebas.** Cada corrección se hace en un commit `fix(...)` propio y su prueba de defecto pasa a verde.
4. **Calidad estática.** SonarQube con la Quality Gate antes y después.
5. **Despliegue y regresión.** Se construyen las imágenes Docker, se levantan los contenedores y se repiten todas las suites (sin Stagehand) contra el despliegue.

| Nivel | Qué responde | Dónde |
|---|---|---|
| Unitario | ¿Cada regla (política de clave, dominio del correo, roles) es correcta? | Back `src/test/unit/autenticacion`; front `src/test/unit/autenticacion` |
| Integración y componente | ¿La pantalla reacciona bien a cada respuesta del back? | Front `src/test/integration/rq*` |
| API y contrato | ¿El back responde el código, el cuerpo y las claves acordadas? | Back `src/test/api/rq1-*…rq3-*`; Cypress `e2e/cypress/e2e/api` |
| Seguridad | ¿Resiste JWT falsos, inyección, fuerza bruta y enumeración? ¿Envía cabeceras? | Back `src/test/security`; Cypress `security/` |
| Regresión | ¿El flujo completo sigue funcionando después de cada cambio? | Back `unit/autenticacion/rq1-rq5-regresion-*`; Cypress `regression/` |
| E2E (UI) | ¿El usuario completa cada funcionalidad en el navegador? | Cypress `ui/`, Selenium (`screenplay-selenium`), Playwright |
| BDD + Screenplay | ¿Los criterios de aceptación en Gherkin se cumplen? | Cypress `features/` + `screenplay/` |
| Accesibilidad | ¿Cumple WCAG 2.1 AA? ¿Funciona con teclado y lector de pantalla? | Cypress `accessibility/` (axe-core); `defects/DEF-FE-08` |
| Rendimiento y carga | ¿Responde dentro del presupuesto? ¿Resiste ráfagas? | Back `performance/`, `carga/carga-api.mjs` |
| IA | ¿Qué aportan las herramientas con IA a la generación y el mantenimiento? | `ia-testing/` (Playwright agents, TestSprite, BugBug); `stagehand/` |
| Estática | ¿Mantenibilidad, duplicación, cobertura y vulnerabilidades? | SonarQube (`sonar-project.properties`) |

### 2.1 Técnicas de diseño de casos

- **Partición de equivalencia y valores límite:** longitud mínima de 8 caracteres, cada regla de la política de clave y correos con o sin `@` o dominio.
- **Tablas de decisión:** tipo de usuario elegido frente a los roles de la cuenta, y combinaciones de token y correo.
- **Transición de estados:** token vigente → usado → rechazado, y cuenta activa → inactiva.
- **Caminos básicos:** las pruebas de "cobertura estructural" del back numeran los nodos del grafo de cada endpoint.
- **Pruebas negativas y de abuso:** JWT `alg:none`, JWT con otra clave, inyección SQL/NoSQL, *path traversal*, fuerza bruta y JSON malformado.
- **Exploratorias asistidas por IA:** el planner de Playwright (snapshots ARIA) y `observe` de Stagehand.

---

## 3. Tipos de prueba por funcionalidad

| | Unit | Integr./Comp. | API | Seguridad | Regresión | E2E UI | BDD | A11y | Rend./Carga | IA | Stagehand |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RQ1 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| RQ2 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| RQ3.1 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| RQ3.2 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| RQ4 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | n/a | ✔ | ✔ | ✔ |
| RQ5 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

---

## 4. Herramientas

| Herramienta | Versión | Uso |
|---|---|---|
| Vitest + Supertest + Testing Library | Vitest 3 | Unitarias, integración, API, seguridad y regresión (back y front) |
| Cypress | 16.1.1 (Chromium) | E2E UI, API, seguridad, regresión y accesibilidad |
| @badeball/cypress-cucumber-preprocessor | 28.0.1 | Gherkin en español sobre Cypress |
| Screenplay (propio sobre Cypress) | n/a | Actores, habilidades, tareas, interacciones y preguntas |
| axe-core | 4.10 | Auditoría WCAG 2.1 AA |
| Serenity/JS + WebdriverIO (Selenium) | 3.x / 9.x | E2E previas de RQ1–RQ5 (entrega anterior) |
| **Playwright + agentes de IA** | 1.63.0 | Planner, generator y healer: plan y pruebas generados con IA |
| **TestSprite** | SaaS + MCP | Agente de IA que genera el plan, el código, la ejecución y el reporte a partir de un PRD. Reemplaza a Testsigma, cuya cuenta necesitaba una aprobación del proveedor |
| **BugBug** | SaaS | Grabación con selectores inteligentes y ejecución en la nube |
| **Stagehand + Ollama** | 4.3.0 + qwen2.5:7b | `act`, `observe` y `extract` con IA local |
| SonarQube Community + SonarScanner | Docker | Análisis estático y Quality Gate |
| Docker (node:22, nginx:1.27) | n/a | Imágenes y despliegue |
| Jenkins | Jenkinsfile en cada repo | Pipeline de CI/CD (las mismas etapas se ejecutaron en local) |
| carga-api.mjs | Propio | Carga smoke, estrés, pico y soak |

---

## 5. Responsables y roles

| Rol | Persona | Responsabilidad |
|---|---|---|
| Responsable de RQ1–RQ5 (tester y desarrolladora) | Juliana Franco | Diseño, automatización y ejecución de las pruebas; registro y corrección de defectos; refactorización; documentación |
| Integrantes del equipo | Samuel Gallego (RQ18–RQ25, CI/CD), Andre Rivas (RQ10, RQ11, RQ13, RQ29–RQ31), Esteban Arias (RQ6, RQ14–RQ17, RQ27) | Dueños de sus requisitos; Samuel mantiene los pipelines de Jenkins y los hooks de Render y Vercel |
| Revisión | Docente del curso | Evaluación con la rúbrica |

---

## 6. Cronograma (fechas reales, tomadas de los commits)

| Fecha | Actividad | Entregable |
|---|---|---|
| 2026-08-24 → 09-01 | Pruebas unitarias de RQ1–RQ5 sin mocks | `src/test/unit/autenticacion` |
| 2026-09-07 → 09-15 | Sonar inicial; correcciones de complejidad y regex; separación de servicio y DTO | `auth.service.ts`, `auth.dto.ts` |
| 2026-09-24 | Regresión y *fluent assertions* | `rq1-rq5-regresion-flujo-autenticacion` |
| 2026-10-11 | API, contrato, componente y seguridad | `api/`, `security/`, `integration/` |
| 2026-10-12 | E2E con Selenium + Screenplay (Serenity) | `screenplay-selenium/features/rq1…rq5` |
| 2026-10-25 | Línea base (tag `v-antes-refactor`); Cypress UI, API, seguridad, regresión y a11y | `docs/pruebas/antes/`, `e2e/cypress/e2e/*` |
| 2026-10-26 | BDD + Screenplay en Cypress; Playwright con agentes; BugBug; TestSprite (en lugar de Testsigma); Stagehand | `e2e/cypress/features`, `ia-testing/`, `stagehand/` |
| 2026-10-26 | Refactorización: 11 defectos del back, 7 del front y DEF-47 | Commits `fix(...)` y `refactor(...)` |
| 2026-10-26 | SonarQube antes y después; despliegue en contenedores; pruebas posteriores | `docs/pruebas/despues/` |
| Presentación | Exposición y demostración | `GUION-PRESENTACION.md` |

---

## 7. Entorno y datos de prueba

| Entorno | Front | Back | Datos |
|---|---|---|---|
| Unitario e integración | jsdom | Express en memoria con `fake-supabase` | Fixtures en `src/test/fixtures` |
| E2E UI y BDD | Vite en `:3001` o nginx en `:3001` | Back simulado en memoria (`cy.intercept` y `page.route`) | Cuentas sembradas: admin, estudiante, profesor, coordinador e inactivo (clave `Clave#2026a`) |
| API y seguridad | n/a | Render (antes) y contenedor `entreaulas-back` en `:3000` (después) | Correos inexistentes; nunca se crean usuarios sin el admin de pruebas |
| Stagehand | Vite `:3001` | `stagehand/src/back-simulado.ts` en `:3000` | Mismas cuentas sembradas |
| BugBug | Vercel | Render | Variables del proyecto, sin claves en el repositorio |
| TestSprite | Despliegue local refactorizado (`:3001`, por túnel) | Despliegue local (`:3000`) | Credenciales en la configuración de TestSprite y en variables de entorno, sin claves en el repositorio |

Los secretos (`.env`, tokens de Sonar y Jenkins, credenciales de admin) **nunca** se suben al repositorio.

---

## 8. Criterios

### 8.1 Criterios de entrada

- El código de RQ1–RQ5 compila y la app arranca (`npm run dev` y `npm start`).
- La línea base está registrada y etiquetada (`v-antes-refactor`).
- Hay datos de prueba sembrados o un back simulado disponible.
- SonarQube está accesible (`localhost:9000`) y Docker funciona.

### 8.2 Criterios de salida

- El 100 % de las suites funcionales (unitarias, integración, API, seguridad y regresión) del back y del front pasan.
- Todas las pruebas de defectos de RQ1–RQ5 pasan, salvo las fuera de alcance, que quedan documentadas.
- Cypress (UI, API, seguridad, regresión, a11y y BDD) pasa contra el despliegue final, sin fallos. Los casos que necesitan credenciales reales quedan como *pending* justificados.
- La Quality Gate de SonarQube está en **OK** en los dos proyectos.
- Los contenedores del despliegue final están en estado `healthy`.

### 8.3 Criterios de aceptación (por funcionalidad)

| RQ | Criterio de aceptación |
|---|---|
| RQ1 | Solo un admin autenticado crea usuarios. El tipo es válido, la clave cumple la política (8 caracteres, mayúscula, minúscula, número y especial) y el correo se arma con el dominio institucional según el tipo. No hay duplicados. El autorregistro público no crea roles privilegiados |
| RQ2 | Las credenciales válidas devuelven un JWT y el panel del rol. Las inválidas, el correo inexistente o la cuenta inactiva dan el mismo 401 genérico, en un tiempo similar. Tiene límite de intentos. La redirección posterior al login es solo a rutas internas |
| RQ3.1 | La respuesta es idéntica exista o no el correo. El token tiene 256 bits y vence en 1 h o menos. Solo vale el último enlace. Tiene límite de solicitudes |
| RQ3.2 | El token inexistente, vencido o usado da 400 con un mensaje claro. Un enlace incompleto no consulta al back. Tiene límite de intentos |
| RQ4 | Llega exactamente un correo con un enlace `/reset-password?token=…&email=…` solo a las cuentas activas. El token nunca aparece en la respuesta HTTP en producción |
| RQ5 | Aplica la misma política de clave que el alta. Las contraseñas deben coincidir. El enlace es de un solo uso. La clave anterior deja de servir y se revocan las sesiones previas |
| Transversales | Las respuestas 5xx no tienen detalles internos. Hay cabeceras de seguridad en la API y en el front. El JSON malformado responde 400 en JSON. Cumple WCAG 2.1 AA, sin violaciones serias en los formularios |

---

## 9. Gestión de defectos

- Cada defecto tiene un ID (`DEF-nn` en el back, `DEF-FE-nn` en el front), severidad, requisito, evidencia y una prueba en `src/test/defects/`.
- El registro del back está en `EntreAulas_Back/src/test/HALLAZGOS.md`. Los del front están en la matriz y en el informe final.
- **Severidades:**

  | Severidad | Criterio |
  |---|---|
  | Crítica | Escalada de privilegios |
  | Alta | Abuso sin límite o pérdida de control |
  | Media | Fuga de información o accesibilidad bloqueante |
  | Baja | Endurecimiento o experiencia de uso |

## 10. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Las pruebas contra Render crean datos reales | Solo se usan correos inexistentes. Los casos positivos que crean usuarios necesitan `CYPRESS_ADMIN_*` y quedan *pending* sin esa credencial |
| La IA local (Ollama en CPU) es lenta o imprecisa | Patrón observe → act, verificación del efecto de cada acción, `extract` acotado con `locator` y aserciones finales determinísticas |
| La migración de DEF-42 queda pendiente en Supabase | El código funciona sin la columna (cambia la clave y registra el error). Se entrega el script `scripts/add-password-changed-at.sql` |
| Pruebas intermitentes por carga de CPU (bcrypt 12) | `testTimeout` de 15 s (DEF-47) |
| Limitador en memoria con varias réplicas | Documentado: con más de una instancia se debe mover a Redis |
