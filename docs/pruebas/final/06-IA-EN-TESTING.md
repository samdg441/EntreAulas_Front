# 7. Inteligencia artificial aplicada a las pruebas

Se usan tres herramientas: **Playwright con agentes** (herramienta adicional), **Stagehand** y **DeepEval**. (BugBug y TestSprite, de la entrega anterior, no se repiten por indicación.)

## 7.1 Playwright con agentes (planner → generator → healer)
- Configuración: `@playwright/test` 1.63, `.mcp.json` (`playwright run-test-mcp-server`), semilla `fixtures/back-coordinador.ts` (back simulado con `page.route`).
- **Planner:** `specs/exploracion-final/explorar-rediseno.spec.ts` guarda el árbol ARIA de 4 pantallas (`*.aria.yml`) y de ahí sale `specs/plan-rediseno.md` (4 secciones, 25 escenarios, 2 hallazgos: H-1 conteos sin `<dl>`, H-2 formato de fecha).
- **Generator:** 3 specs (`tests/rediseno-*.spec.ts`) con localizadores por rol y nombre accesible.
- **Healer / iteraciones:** 1.ª y 2.ª ejecución 7/25 (la prueba no solicitaba el fixture de sesión → se hizo `auto: true`); 3.ª 22/25 (la 1.5 reveló el **defecto real DEF-REDI-05** y 2 flaquezas de `reload` en Vite); 4.ª **25/25**; contra el despliegue en nginx **25/25** (`evidencias/playwright/`).
- Aporte: encontró un defecto real y un reflujo de 570 px; limitación: el «agente» fue Claude Code operando el ciclo, no un servicio autónomo.

## 7.2 Stagehand (automatizar y validar flujos web con IA)
- Configuración: Stagehand 4.3.0, Ollama local `qwen2.5:7b` (CPU), Chromium 156 headless. Escenario `stagehand/src/rediseno-scenario.ts` (`npm run test:rediseno`): barra lateral → **Auditoría** (observe → act), `extract` del total de eventos (esperado 4), **modo noche** con act y verificación determinista (`html.dark`), con respaldo CSS registrado.
- Datos: back simulado ampliado (`back-simulado.ts`: dashboard, estadísticas, periodos y auditoría).
- **Resultado y limitación:** cada paso de IA en CPU (100 % de 8 hilos) tarda más de 10 minutos con la página completa; en este equipo la ejecución no terminó dentro del tiempo útil. El escenario, el back simulado y los scripts quedan entregados y verificados con `tsc`; la **evidencia ejecutada de Stagehand es la de la entrega anterior** (`stagehand/reports/`) más el avance de `rediseno-ollama-*.log`. Recomendación: usar un modelo con GPU o un proveedor en la nube (`AI_PROVIDER=gemini`) para completar la ejecución. (Stagehand se evalúa por separado del análisis posterior al despliegue.)

## 7.3 DeepEval (evaluar un componente de IA existente)
- Componente: `AiService.summarizeOpenResponses` (alerta de acoso RQ31 y resumen RQ29), con Gemini desactivado para que sea determinista y no salga ningún dato.
- Datos: 30 comentarios sintéticos etiquetados (10 acoso, 20 normales) y 3 grupos para resumen (`ia-testing/deepeval/casos_comentarios.json`).
- Métrica propia `DeteccionDeAcoso` (`BaseMetric`) + GEval con juez local (opcional; no se ejecutó por la misma limitación de CPU).
- **Resultados** (`resultados-final.json`): TP 5 · TN 14 · FP 6 · FN 5 → **precisión 0.455, recall 0.5, F1 0.476, exactitud 0.633** (umbrales 0.80 / 0.90: **no cumple**).
  - Falsos negativos: «me acosaba», «tocar el hombro… incómoda», «insinuó», «humilla», lenguaje sexual sin palabra clave → el detector por subcadenas no reconoce conjugaciones ni sinónimos.
  - Falsos positivos: «miedo a reprobar», «tocar los temas», «abusan con los talleres», «temor al examen», «wifi insegura», «ningún disgusto».
- Defectos: DEF-IA-01 (Alta) y DEF-IA-02 (Media). Recomendación: raíces léxicas con límite de palabra, palabras emocionales solo junto a una referencia a la persona, y revisión humana obligatoria.
- Aporte/limitación: la métrica convierte el riesgo cualitativo en un número reproducible; el conjunto es pequeño y sintético, por lo que las cifras son orientativas.
