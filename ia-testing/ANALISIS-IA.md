# Pruebas con herramientas de IA para RQ1–RQ5 (Juliana Franco)

Este documento cubre tres herramientas de IA aplicadas a las seis funcionalidades de Juliana:

| Requisito | Funcionalidad |
|---|---|
| RQ1 | Registro de usuarios desde admin |
| RQ2 | Login |
| RQ3.1 | Solicitud de recuperación |
| RQ3.2 | Validación del token |
| RQ4 | Envío del enlace por correo |
| RQ5 | Restablecer contraseña |

| Herramienta | Tipo | Dónde | Cómo se ejecuta |
|---|---|---|---|
| **Playwright** (agentes planner, generator y healer) | Código generado por IA | `playwright/` | `cd ia-testing/playwright && npm test` |
| **TestSprite** | Agente de IA autónomo por MCP: PRD → plan → código → ejecución → reporte | `testsprite/` y `../testsprite_tests/` | Desde Claude Code, con su nube y un túnel al despliegue local |
| **BugBug** | Grabación y reproducción con espera activa y selectores inteligentes | `bugbug/` | Extensión de Chrome y nube de BugBug, sobre Vercel y Render |

**Cambio de herramienta: TestSprite en lugar de Testsigma.** Testsigma estaba prevista como tercera herramienta, pero no deja crear la cuenta en el momento: el registro queda esperando una aprobación del proveedor, que no llegó a tiempo. Los 18 casos que se diseñaron para Testsigma (`testsigma/casos-rq1-rq5.md`) se conservan y sirven de referencia para comparar lo que propuso TestSprite.

## 1. Propósito de cada una

- **Playwright con agentes:** que la IA **explore** la aplicación, **escriba el plan** y **genere el código** de las pruebas. Después, un tercer agente **las repara** cuando fallan por los localizadores. El objetivo es medir cuánto del trabajo de un tester se puede delegar.
- **TestSprite:** delegar **todo el ciclo** en un agente. A partir de un PRD, analiza el código, normaliza los requisitos, planea los casos, los programa, los ejecuta en la nube con un navegador real y **redacta el reporte con su diagnóstico**. Sirve para medir qué tan autónomo puede ser un agente y qué tan confiables son sus veredictos.
- **BugBug:** **grabar** los flujos como lo haría un usuario y reproducirlos en la nube, con **espera activa** y **selectores alternativos** que reducen la fragilidad. Es la opción más fácil para alguien que no programa.

## 2. Configuración

| Herramienta | Configuración |
|---|---|
| Playwright | `@playwright/test` 1.63.0 con Chromium. Agentes creados con `npx playwright init-agents --loop=claude` (`.claude/agents/*`, `.mcp.json`). Back simulado en memoria con `page.route`. Detalle en `playwright/PLAN-IA.md` |
| TestSprite | Servidor MCP `@testsprite/testsprite-mcp` registrado en Claude Code, con la clave en la configuración local y fuera del repositorio. Plan gratuito (150 créditos). PRD propio (`testsprite/PRD-RQ1-RQ5.md`) para limitar el alcance. Modo Frontend sobre el build de producción en nginx `:3001`. Credenciales de prueba como variables de entorno. Detalle en `testsprite/README.md` |
| BugBug | Proyecto con variables de cuentas, componente "Login como admin", 13 pruebas importadas desde YAML y otras regrabadas. Ejecución en la nube. Detalle en `bugbug/README.md` |

## 3. Pruebas por funcionalidad

| Funcionalidad | Playwright | TestSprite | BugBug |
|---|---|---|---|
| RQ1: alta desde admin | 5 | 5 | 3 ejecutadas |
| RQ2: login | 6 | 4 | 4 |
| RQ3.1: solicitud | 3 (incluye el buzón simulado de RQ4) | 2 | 3 |
| RQ3.2: token | 3 | 1 | 1 |
| RQ4: envío del correo | Verificado en el buzón simulado (RQ3.1) | Solo la confirmación en la UI | — |
| RQ5: nueva clave | 9 | — (retirado: necesita un enlace real) | — |
| **Total** | **26** | **12** (de 16 propuestos) | **11 ejecutadas de 16 planeadas** |

## 4. Resultados

| Herramienta | Antes de la refactorización | Después (versión refactorizada) |
|---|---|---|
| Playwright | **25 de 26.** La que falla detecta DEF-FE-08 (botón del ojo sin nombre accesible). Ver `docs/pruebas/evidencias/playwright/` | **26 de 26** contra el despliegue en nginx `:3001` (`docs/pruebas/despues/playwright-despues.txt`) |
| TestSprite | No se ejecutó: la herramienta se incorporó después de la refactorización | **12 de 12 (100 %)**, en una sola corrida contra el despliegue local refactorizado. Para llegar ahí se depuró el plan propuesto (16 casos): se corrigieron 2 falsos positivos y se retiraron 4 casos. Dejó un hallazgo abierto de control de acceso (TS-H7). 19 créditos. Ver `testsprite/resultados.md` y `../testsprite_tests/testsprite-mcp-test-report.md` |
| BugBug | **11 de 11** en la nube (2026-10-26, Chrome 150, contra Vercel y Render). Solo 4 tienen una aserción real: las regrabadas no verifican el resultado. Ver `bugbug/resultados.md` y `bugbug/evidencias/All_tests_2026-10-26_2.pdf` | Pendiente: la refactorización no está publicada en Vercel ni en Render |

## 5. Aportes

1. **Encontró defectos sin que se los pidieran.** El planner de Playwright descubrió DEF-FE-08 al leer el árbol de accesibilidad. Los localizadores por rol del generator revelaron que el buscador de usuarios no tiene `<label>`.
2. **Bajó el costo de crear pruebas.**
   - Playwright produjo el plan y 26 pruebas en una iteración.
   - TestSprite planeó, programó, ejecutó y reportó 16 casos en unos 5 minutos, por 5 créditos. El plan final, de 12 casos, se ejecuta completo en una sola corrida.
   - BugBug permite que personas sin perfil técnico mantengan pruebas de aceptación.
3. **Los veredictos fueron honestos.** TestSprite no inventó controles que no existen: dijo dos veces que el botón para mostrar la contraseña no estaba donde la especificación del equipo decía. El healer de Playwright tampoco "arregló" la prueba de un defecto real.
4. **Las pruebas se rompen menos con la refactorización.** El healer de Playwright, la ejecución guiada por IA de TestSprite y los selectores alternativos de BugBug reducen el mantenimiento cuando cambia el DOM.
5. **Hay más de un punto de vista.** El código generado (Playwright), el agente autónomo (TestSprite) y la grabación (BugBug) se cruzan con Cypress, que se escribe a mano. Si un flujo pasa en las cuatro, la confianza es mayor.

## 6. Limitaciones

| Herramienta | Limitación |
|---|---|
| Las tres | No conocen las reglas de negocio ocultas: que el token es de un solo uso, que el mensaje es genérico para no enumerar cuentas o que la cuenta inactiva da 401. Hay que dárselas en el plan o en las aserciones. Ninguna prueba un flujo que dependa de un correo real (RQ4 y RQ5) |
| Playwright healer | Sin supervisión puede "arreglar" una prueba que falla por un **defecto real**. Con DEF-FE-08 se decidió a mano dejarla en rojo |
| TestSprite | Sigue al pie de la letra lo que se le dice. Una instrucción ambigua ("la cuenta es de administrador") produjo un **falso positivo** (TC005) y un caso bloqueado, y un error en el resumen del código produjo un caso imposible (TC010). También se equivoca solo: en una corrida buscó el dominio en el login y no en el modal de alta (TC009). El veredicto lo da un **juez de IA** durante la ejecución: 4 de los 12 casos exportan código que solo comprueba que la página cargó, así que el `.py` no sirve tal cual como regresión. Escribe el código con las credenciales en texto plano (se reemplazaron por variables de entorno). Genera en inglés. No propuso los casos de enumeración de cuentas que el equipo sí diseñó |
| BugBug | Al grabar no se crean aserciones: en la ejecución real, 6 de 11 pruebas pasaban sin comprobar nada. La importación desde YAML sí conserva las aserciones, pero los XPath escritos a mano para el desplegable de tipo de usuario no se reprodujeron y hubo que regrabarlos. Solo Chrome |
| TestSprite y BugBug | Crean datos reales en Supabase (usuarios `ts.*` y `bb.*`). Las funciones de IA, el buzón y la nube dependen del plan contratado |

## 7. Conclusión

Las herramientas de IA **no reemplazan el diseño de las pruebas**. Las reglas de RQ3.2, RQ4 y RQ5 tuvieron que especificarse, y en TestSprite y BugBug los resultados engañosos vinieron de instrucciones o grabaciones mal hechas, no de la aplicación.

Lo que sí hacen es **acelerar la generación** y **reducir el mantenimiento**. Además, **en este proyecto encontraron un defecto de accesibilidad real**, que luego se corrigió en la refactorización.

Un 100 % o un 75 % no dicen nada sin revisar **qué se comprobó**:
- BugBug tenía un 100 %, pero solo 4 pruebas con aserción.
- TestSprite llegó al 100 % solo después de depurar el plan, y en el camino encontró un hallazgo real de control de acceso.

**Recomendación:**

- **Playwright con agentes:** para la regresión versionada en el repositorio.
- **TestSprite:** para la exploración y una primera cobertura rápida a partir de los requisitos, revisando el plan antes de ejecutarlo.
- **BugBug:** para la aceptación sobre producción, programada después de cada despliegue, siempre que cada prueba termine con una aserción.
