# Pruebas con herramientas de IA para RQ1–RQ5 (Juliana Franco)

Este documento cubre tres herramientas trabajadas en el curso, aplicadas a las seis funcionalidades de Juliana:

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
| **Testsigma** | *Low-code* en lenguaje natural con Copilot y auto-healing | `testsigma/` | En la nube de Testsigma, sobre Vercel y Render |
| **BugBug** | Grabación y reproducción con selectores inteligentes | `bugbug/` | Extensión de Chrome y nube de BugBug, sobre Vercel y Render |

## 1. Propósito de cada una

- **Playwright con agentes:** que la IA **explore** la aplicación, **escriba el plan** y **genere el código** de las pruebas. Luego un tercer agente **las repara** cuando fallan por localizadores. El objetivo es medir cuánto del trabajo de un tester puede delegarse.
- **Testsigma:** escribir pruebas **en lenguaje natural** sobre el sistema desplegado, **generar casos desde el texto de los requisitos** (Copilot) y comprobar si el **auto-healing** absorbe los cambios de la refactorización.
- **BugBug:** **grabar** los flujos como lo haría un usuario y reproducirlos en la nube, con **espera activa** y **selectores alternativos** que reducen la fragilidad. Es la opción con menos barrera de entrada para alguien que no programa.

## 2. Configuración

| Herramienta | Configuración |
|---|---|
| Playwright | `@playwright/test` 1.63.0 con Chromium. Agentes creados con `npx playwright init-agents --loop=claude` (`.claude/agents/*`, `.mcp.json`). Back simulado en memoria con `page.route`. Detalle en `playwright/PLAN-IA.md` |
| Testsigma | Proyecto web y perfil de datos `cuentas-entreaulas`, con parámetros para no subir claves. Entorno `produccion`, 18 casos NLP, CSV importable y prompts para Copilot. Detalle en `testsigma/README.md` |
| BugBug | Proyecto con variables de cuentas, componente "Login como admin" y 16 guiones de grabación. Ejecución en la nube y programada. Detalle en `bugbug/README.md` |

## 3. Pruebas por funcionalidad

| Funcionalidad | Playwright | Testsigma | BugBug |
|---|---|---|---|
| RQ1: alta desde admin | 5 | 5 | 4 |
| RQ2: login | 6 | 5 | 4 |
| RQ3.1: solicitud | 3 (incluye el buzón simulado de RQ4) | 3 | 2 |
| RQ3.2: token | 3 | 2 | 2 |
| RQ4: envío del correo | Verificado en el buzón simulado (RQ3.1) | 1 (buzón real) | 1 (*Inbox* de BugBug) |
| RQ5: nueva clave | 9 | 2 | 3 |
| **Total** | **26** | **18** | **16** |

Cada herramienta incluye escenarios **exitosos**, **alternativos** y **de error**.

## 4. Resultados

| Herramienta | Línea base (antes de la refactorización) | Después del despliegue final |
|---|---|---|
| Playwright | **25 de 26.** La que falla detecta DEF-FE-08 (botón del ojo sin nombre accesible). Ver `docs/pruebas/evidencias/playwright/` | **26 de 26** contra el despliegue en nginx `:3001` (`docs/pruebas/despues/playwright-despues.txt`) |
| Testsigma | Lo registra el equipo en `testsigma/resultados.md` | `testsigma/resultados.md` |
| BugBug | Lo registra el equipo en `bugbug/resultados.md` | `bugbug/resultados.md` |

## 5. Aportes

1. **Encontró defectos sin que se los pidieran.** El planner de Playwright descubrió DEF-FE-08 al leer el árbol de accesibilidad. Los localizadores por rol del generator revelaron que el buscador de usuarios no tiene `<label>`.
2. **Bajó el costo de crear pruebas.** Playwright produjo el plan y 26 pruebas en una iteración. Testsigma y BugBug permiten que personas sin perfil técnico, como un docente o un coordinador, mantengan las pruebas de aceptación.
3. **Las pruebas se rompen menos con la refactorización.** El healer de Playwright, el auto-healing de Testsigma y los selectores alternativos de BugBug reducen el mantenimiento cuando cambia el DOM. La refactorización de DEF-FE-08 a 11 cambia justamente botones, mensajes y wrappers.
4. **Hay más de un punto de vista.** El código generado (Playwright), el lenguaje natural (Testsigma) y la grabación (BugBug) se cruzan con Cypress, que se escribe a mano: si un flujo pasa en las cuatro herramientas, la confianza es mayor.

## 6. Limitaciones

| Herramienta | Limitación |
|---|---|
| Las tres | No conocen las reglas de negocio ocultas: que el token es de un solo uso, que el mensaje es genérico para no enumerar cuentas o que la cuenta inactiva da 401. Hay que dárselas en el plan o en las aserciones |
| Playwright healer | Sin supervisión puede "arreglar" una prueba que falla por un **defecto real**. Con DEF-FE-08 se decidió a mano dejarla en rojo |
| Testsigma y BugBug | Necesitan cuentas reales en producción y crean datos (usuarios `ts.*` y `bb.*`). Las funciones de IA, el buzón y la nube dependen del plan contratado. No hay una forma sencilla de versionar las pruebas junto al código |
| BugBug | Solo Chrome. Los selectores grabados sobre elementos sin nombre accesible (el botón del ojo) son rutas CSS frágiles hasta que se corrige la accesibilidad |
| Testsigma | El NLP es en inglés. Los nombres de los elementos hay que alinearlos con el Recorder la primera vez |

## 7. Conclusión

Las herramientas de IA **no reemplazan el diseño de las pruebas**, porque las reglas de RQ3.2, RQ4 y RQ5 tuvieron que especificarse. Lo que sí hacen es **acelerar la generación** y **reducir el mantenimiento**. Además, **en este proyecto encontraron un defecto de accesibilidad real**, que luego se corrigió en la refactorización.

**Recomendación:**

- Playwright con agentes, para la regresión versionada en el repositorio.
- Testsigma o BugBug, para la aceptación sobre producción, programada después de cada despliegue.
