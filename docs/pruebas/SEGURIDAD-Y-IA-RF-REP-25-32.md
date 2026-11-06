# Seguridad e IA — RF-REP-25, RF-REP-26 y RF-IA-32

Fecha: 2026-11-06. Back en Vitest 2.1.9, front en Vitest 5.0.2, Cypress 16.1.1 contra `https://entreaulas-back.onrender.com`, Playwright 1.63 contra `http://localhost:3001`, DeepEval 4.3.3.

| Requisito | Qué se protege |
|---|---|
| RF-REP-25 | `GET /api/resultados` y la pantalla `/reports/survey-results` |
| RF-REP-26 | `GET /api/resultados/estadisticas`, `estadisticasIndividuales` y la tarjeta Calificación Promedio |
| RF-IA-32 | `GET /api/ai/summarize/by-professor`, `by-career`, `by-faculty` y `AiService.summarizeFromRatings` |

## 13. Pruebas de seguridad

### Análisis estático

SonarQube ya analiza el back con `sonar.tests=src/test` y `sonar.test.inclusions=src/test/**/*.test.ts`, así que entran las pruebas de `src/test/security/rf-rep-25-32.security.test.ts`. En cobertura quedan `resultados-filtros.ts` (RF-REP-25), `calificaciones.ts` (RF-REP-26) y `ai.service.ts` / `ai.routes.ts` (RF-IA-32). `resultados.routes.ts` sigue fuera: solo cablea la ruta.

### Análisis dinámico

| Suite | Resultado |
|---|---|
| Back `src/test/security/rf-rep-25-32.security.test.ts` | 15/15 |
| Front `src/test/security/rf-rep-25-32.security.test.ts` | 11/11 |
| Cypress `e2e/cypress/e2e/security/rf-rep-25-32-seguridad-api.cy.ts` | 8/8 contra la API publicada |

### OWASP, severidad y validación

| Caso | OWASP | Evidencia | Severidad | Validación |
|---|---|---|---|---|
| Cinco GET sin `Authorization` | A01, A07 | 401 `{ error: 'Token de acceso requerido', code: 'NO_TOKEN' }` y el mock de Supabase no se llama | Alta si fallara. El control se sostiene | Vitest y Cypress |
| JWT `alg: none` y JWT firmado con otra clave | A02 | 401. `jsonwebtoken` 9 rechaza `algorithm: none`; el token se armó a mano | Alta | Vitest y Cypress |
| Estudiante en resultados y estadísticas | A01 | 403 `{ code: 'FORBIDDEN_ROLE' }` | Alta | Vitest |
| Profesor con `profesor_id` de otro y SQL en la consulta | A01, A03 | 200 solo con su propio id. El cuerpo no trae el script | Alta | Vitest |
| Coordinador sin `profesor_id` | A01, A05 | 400 `profesor_id es requerido`, sin `stack` | Media | Vitest |
| Coordinador en `by-faculty` | A01 | 403 | Alta | Vitest |
| Estudiante en `/reports` | A01 | redirige a `/forbidden` | Alta | Playwright |
| `periodo_id=8 OR 1=1` y `grupo_id=4; DELETE FROM grupos` | A03 | Antes `parseInt` dejaba pasar el 8 y el 4. Ahora `enteroSiViene` solo acepta dígitos y el filtro llega vacío | Media, corregida | Vitest, después del cambio |
| `DROP TABLE` en la consulta, sin token, contra Render | A03 | 403 del borde de Render (la API, sin esa palabra, responde 401). No vuelven filas ni stack | Baja en el borde | Cypress |
| Nota 99 en el cálculo y en el resumen | A04 | total 2, promedio 4.5, máxima 5. El texto dice `2 respuestas cuantitativas` y `4.50/5`, y no dice `99` | Media, corregida en el TDD | Vitest y DeepEval |
| 99, 0, -1, 1000, HTML y SQL en la tarjeta | A03, A04 | `promedioVisible` devuelve 0. 4.5 se conserva | Media | Vitest del front |
| 500 con HTML en el cuerpo | A03 | `decidirVistaResumen` no lo pinta como resumen | Media | Vitest del front |
| `OPTIONS` desde `https://evil.example` | A05 | `access-control-allow-origin` no es ese origen | Baja | Cypress |
| Cuerpos 401, 400 y 403 | A05 | no contienen `stack` ni `jsonwebtoken` | Baja en estos caminos | Vitest y Cypress |

### Dependencias (`npm audit --omit=dev`, 2026-11-06)

No las introdujeron estos tres requisitos. No se parchearon aquí.

| Repo | Crítica | Alta |
|---|---|---|
| Back | `proxy-addr` | `axios`, `body-parser`, `follow-redirects`, `nodemailer`, `zod` |
| Front | `dompurify` | `follow-redirects`, `tmp`, `xlsx` |

### Recomendaciones

1. Dejar `enteroSiViene` con `/^\d+$/`. `parseInt` recortaba la cadena y un periodo mal formado cambiaba el filtro.
2. DEF-31 sigue abierto: un 500 todavía puede devolver `details`. Estos casos de 400 y 403 ya no lo hacen.
3. Subir las dependencias de la tabla. `xlsx` y `proxy-addr` son las de mayor prioridad.
4. `/reports/survey-results` sigue sin llamar a `GET /api/resultados`. La autorización de los crudos está en la API; la pantalla solo muestra el aviso de parámetros.

## 14. IA aplicada a testing

Cada herramienta cubre una parte distinta. Ninguna sustituye a las otras.

### Stagehand (flujos web)

- Configuración: `AI_PROVIDER=ollama`, `FRONT_URL=http://localhost:3001`, back simulado en el puerto 3000 (`stagehand/src/back-simulado.ts`).
- Escenario: `stagehand/src/rf-rep-25-32-scenario.ts`. Siembra la sesión del profesor, `extract` lee el promedio `4` y el total `3`, comprueba el aviso `Faltan parámetros requeridos` y `observe`/`act` pulsa Generar resumen IA. El respaldo CSS es `#resumen-ia button` si el modelo no encuentra el botón.
- Dato esperado del simulado: `Resumen de los comentarios del docente.`
- Comando: `npm run test:stagehand:rf-rep`.
- Resultado de esta corrida: no se ejecutó. Ollama no respondió en `http://127.0.0.1:11434`.
- Limitación: con `qwen2.5:7b` en CPU, `act` directo falla; el escenario usa observe y luego act, igual que RQ23–RQ25. Hace falta el modelo local y el front en el 3001.

### DeepEval (componente de IA que ya existe)

- Componente: `AiService.summarizeFromRatings`. No llama a Gemini. Node lo ejecuta con `ts-node/register/transpile-only` y Python puntúa el texto.
- Métrica propia `FidelidadCuantitativa` (`deepeval.metrics.BaseMetric`), umbral 1.0. Comprueba el conteo, el promedio y que no aparezcan `99`, `36` ni `<script>`.
- Datos: `[5, 4, 3]`, `[5, 4, 99]`, `[99, 0]`.
- Resultado: 3/3 con score 1.0. Fuente `quantitative_fallback`. Promedios reales `4.00/5` y `4.50/5`.
- Comando, desde el front: `python ia-testing/deepeval/evaluar_resumen.py`.
- Aporte: ata el texto del resumen al cálculo, que es lo que una aserción de HTTP no mira.
- Limitación: no evalúa un resumen de texto abierto generado por un modelo de pago. El fallback cuantitativo es el camino que usa el requisito cuando no hay comentarios.

### Playwright (herramienta adicional de clase)

La suite `ia-testing/playwright` es la que generaron los agentes de Playwright para el resto de requisitos. Se agregó `tests/rf-rep-25-32.spec.ts` y el back en memoria ahora responde `teacher-id`, `teacher-stats` y `summarize`.

- Resultado: 2/2 en Chromium, 4.4 s, con el front que ya estaba en el puerto 3001.
- El profesor ve `4/5.0` y no ve `99/5.0`, la encuesta muestra el aviso, el resumen pinta `Los estudiantes destacan la claridad.` y el estudiante termina en `/forbidden`.
- Comando: `npx playwright test tests/rf-rep-25-32.spec.ts` dentro de `ia-testing/playwright`.
- Aporte: mantiene el flujo de punta a punta sin Ollama y sin la API real.
- Limitación: el back es el simulador del fixture, no Supabase.
