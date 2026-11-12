# 6. Accesibilidad, usabilidad/UX y seguridad

## 6.1 Accesibilidad (WCAG 2.1 A/AA)
Herramientas: axe-core 4.10 (Cypress), comprobaciones manuales de teclado/foco/etiquetas/contraste/mensajes/adaptación visual, medición de reflujo (Playwright) y revisión del árbol ARIA.

| Criterio WCAG | Comprobación | Resultado |
|---|---|---|
| 1.3.1 Información y relaciones | axe en 3 pantallas × 2 temas; `caption`, `th scope`, `role=meter`, labels de filtros | ✔ tras DEF-REDI-03 (calendario sin filas ARIA) |
| 1.4.3 Contraste | axe + cálculo 4.5:1 del h1 en noche | ✔ tras quitar `opacity-80` del chip activo |
| 1.4.4 Cambio de tamaño | 4 niveles (14–20 px) | ✔ |
| 1.4.10 Reflujo | 320/376/390 px con letra muy grande | ✔ tras DEF-REDI-02/04 |
| 2.1.1 Teclado / 2.4.7 Foco | recorrer la sidebar, panel de preferencias con Escape | ✔ |
| 2.4.1 Saltar bloques | «Saltar al contenido» → `#contenido` | ✔ |
| 2.4.3 Orden del foco | menú móvil cerrado oculto | ✔ tras DEF-REDI-01 |
| 3.1.1 Idioma de la página | `lang` = idioma elegido | ✔ |
| 3.3.1 Identificación de errores | rango de fechas con `aria-invalid` y `role=alert` | ✔ |
| 4.1.2 Nombre, función, valor | botón del menú de usuario sin nombre (**violación crítica**) | ✔ tras el `aria-label` |
| 4.1.3 Mensajes de estado | error de calendario como `status` | ✔ |

Barreras halladas y corregidas: 5 (ver DEFECTOS). **Recomendaciones pendientes:** (a) usar `<dl>` en el resumen de auditoría (hallazgo H-1 del planner de Playwright), (b) indicar el formato de los campos de fecha, (c) prueba manual con lector de pantalla real (NVDA/Orca), no realizada en este equipo.

## 6.2 Evaluación heurística de Nielsen (experta, 10 heurísticas)
| Heurística | Hallazgo | Sev. 0–4 | Recomendación |
|---|---|---|---|
| 1 Visibilidad del estado | Cargando, filtros activos con conteo, página X de Y, tabla de auditoría con estado «aún no activa» | 0 | — |
| 2 Lenguaje del usuario | «En riesgo», «Programó una encuesta»; sin jerga técnica | 0 | — |
| 3 Control y libertad | «Limpiar filtros», «Volver a la lista», Escape cierra paneles | 0 | — |
| 4 Consistencia | Una escala de 5 tamaños y acciones con el mismo nombre; la guía «Cómo empezar» sigue en español fijo en otras pantallas | 2 | Traducir las pantallas de otros roles |
| 5 Prevención de errores | Rango de fechas inválido bloqueado; `min/max` en fechas | 0 | — |
| 6 Reconocer antes que recordar | Sidebar por secciones con icono y texto; estado activo | 0 | — |
| 7 Flexibilidad | Preferencias persistentes; exportar CSV; enlace del docente desde el dashboard | 1 | Atajos de teclado |
| 8 Diseño minimalista | Dashboard solo con indicadores y calendario | 0 | — |
| 9 Recuperación de errores | Mensajes dicen qué pasó y qué hacer | 0 | — |
| 10 Ayuda | `HelpTooltip` en cada indicador | 1 | Ayuda en la auditoría |
Limitación: los dos 'no 0' son parciales (el i18n completo cubre solo coordinador, login y shell).

## 6.3 Pruebas con usuarios (SUS, finalización, tiempos, errores)
Protocolo, tareas, hoja de observación y script `usabilidad/sus.py` listos (`usabilidad/`). **No se ejecutó con participantes reales; por eso no se reporta ningún SUS.** Pendiente para completar con el grupo de clase.

## 6.4 Seguridad (OWASP Top 10 2021)
| Categoría | Prueba | Resultado |
|---|---|---|
| A01 Control de acceso | 403 a admin/profesor/estudiante/decano; rol desde la base y no del token; front a `/forbidden`; aislamiento por carrera | ✔ |
| A02 Criptografía/JWT | `alg none`, otra clave, vencido | ✔ 401 |
| A03 Inyección | SQL/traversal/arreglos en filtros; XSS almacenado en auditoría; `<script>` en buscadores | ✔ tras DEF-AUD-01 |
| A04 Diseño inseguro | auditoría de solo lectura; tope `pageSize` 50; búsqueda ≤ 80 | ✔ |
| A05 Configuración | CSP, nosniff, X-Frame-Options en nginx; helmet en la API | ✔ |
| A06 Componentes vulnerables | `npm audit`: Back 7→4, Front 6→3 | Parcial (`xlsx`, `nodemailer`, `zod`, `express` sin parche) |
| A08 Integridad | CSV injection neutralizado; preferencias manipuladas ignoradas | ✔ |
| A09 Registro | la auditoría registra y el fallo del registro se loguea sin romper | ✔ |
| Análisis estático | SonarQube: 0 vulnerabilidades y 0 hotspots en ambos | ✔ |
| Análisis dinámico | pruebas Cypress/Playwright contra el despliegue; **OWASP ZAP no se pudo ejecutar** (la red de Docker de este equipo no enruta) | Pendiente |
