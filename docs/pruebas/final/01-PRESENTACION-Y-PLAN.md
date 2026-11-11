# 1. Presentación del proyecto y plan de pruebas

## 1.1 Proyecto
**EntreAulas** es la plataforma de evaluación docente de la Universidad de Medellín: los estudiantes evalúan a sus docentes (acceso por QR o por lista), y docentes, coordinadores, decanos y administradores consultan resultados, reportes y resúmenes con IA.

| Aspecto | Detalle |
|---|---|
| Tipo de software | Aplicación web de gestión académica (SPA + API REST), con componente de IA (resúmenes y alerta de acoso) |
| Arquitectura | Cliente-servidor en tres capas: SPA React → API Express (rutas → servicios → repositorios) → Supabase (Postgres). Despliegue en contenedores (nginx para el front, Node para el back) |
| Front | React 18.3.1, Vite 7.3.6, TypeScript 5.9, Tailwind 3.4, React Router 7.18, Framer Motion 10.18, Recharts |
| Back | Node 22 (contenedor) / 26 (equipo), Express 4.22, Zod 3.25, JWT, bcrypt, Supabase JS, Gemini |
| Pruebas | Vitest 5.0 (front) y 2.1 (back), Testing Library 16, Supertest 7, Cypress 16.1.1 + Cucumber, axe-core 4.10, Playwright 1.63, Stagehand 4.3 + Ollama (qwen2.5:7b), DeepEval 4.3.3 |
| Calidad / CI | SonarQube Community, Docker 29.9, Jenkins (Jenkinsfile en cada repo) |
| Ramas | `pruebas-final-juliana` en `EntreAulas_Front` y `EntreAulas_Back` |

## 1.2 Alcance individual (Juliana Franco)
Tres requisitos nuevos, descompuestos en **siete funcionalidades** (sin contar login ni CRUD de usuarios):

| Req. | Funcionalidad | HU | Módulo (front / back) |
|---|---|---|---|
| R1 | F1 Vista de auditoría del coordinador | HU-040 | `AuditoriaPage.tsx` · `analytics/auditoria*.ts`, `GET /api/coordinador/auditoria` |
| R2 | F2 Gestión de profesores rediseñada | HU-041 | `ManageProfessors.tsx`, `gestion-profesores.ts` |
| R3 | F3 Modo noche | HU-042 | `preferencias/`, `tailwind.config.js` |
| R3 | F4 Cambio de idioma ES/EN | HU-043 | `i18n/diccionario.ts` |
| R3 | F5 Tamaño de letra y tipografía estándar | HU-044 | escala de 5 tamaños, `index.css` |
| R3 | F6 Dashboard con indicadores y sidebar por rol | HU-045 | `DashboardCoordinador.tsx`, `shell/`, `lib/navegacion.ts` |
| R3 | F7 Calendario de evaluaciones programadas | HU-046 | `AgendaEvaluaciones.tsx` |

El diseño visual siguió la guía *frontend-design*: sistema de tokens (colores por variables CSS, fuente Schibsted Grotesk, escala 14/16/20/28/36 px), una pieza memorable (la franja continua de la ventana de evaluación y la barra de promedio con el umbral 4.0) y sin los patrones genéricos.

## 1.3 Plan de pruebas

**Objetivos.** (1) Verificar F1–F7 con técnicas de caja blanca y negra; (2) demostrar TDD en la auditoría; (3) detectar defectos de accesibilidad, seguridad y regresión; (4) evaluar los componentes de IA; (5) dejar un pipeline y un despliegue reproducibles.

**Fuera de alcance.** Login y CRUD de usuarios (entregas previas); los requisitos de los demás integrantes; rendimiento de la base en producción.

**Estrategia.** Pirámide: unitarias → integración/componente → API/contrato → seguridad → E2E (Cypress, Playwright) → BDD con Screenplay → accesibilidad (axe + manual) → IA (Playwright agentes, Stagehand, DeepEval) → estática (Sonar) → regresión contra la línea base (`testing`) → despliegue y repetición.

**Riesgos y mitigación.**

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| La tabla `auditoria_eventos` no existe en Supabase | Alta | Alto | `disponible:false` + aviso; script SQL idempotente |
| La auditoría tumba otras acciones | Media | Alto | Registro «dispara y olvida»; prueba de regresión |
| Modo noche rompe contraste | Media | Medio | Variables CSS + axe en ambos temas |
| IA local (Ollama en CPU) lenta | Alta | Medio | Patrón observe → act con respaldo CSS; aserciones deterministas |
| Pruebas heredadas obsoletas | Alta | Medio | Comparar con la línea base para atribuir fallas |
| Sin usuarios reales para SUS | Alta | Medio | Kit listo; reportar como pendiente |

**Herramientas.** Ver 1.1. **Responsable:** Juliana Franco (diseño, automatización, ejecución, defectos). **Revisión:** docente del curso.

**Cronograma (fechas reales).**

| Fecha | Actividad |
|---|---|
| 2026-11-10 | Rama, exploración, auditoría (TDD rojo→verde→refactor), diseño y rediseño |
| 2026-11-10 | Pruebas unitarias/componente, Cypress, BDD, Playwright, defectos DEF-REDI |
| 2026-11-11 | Regresión vs. línea base, seguridad (npm audit), Sonar, Docker, pruebas posteriores, DeepEval, matrices y documentos |

**Métricas.** Casos ejecutados/aprobados, cobertura (líneas/ramas), defectos por severidad, densidad de defectos, V(G) máximo, violaciones axe, vulnerabilidades, Quality Gate.

**Criterio de entrada.** Código compila; suites previas verdes; datos simulados. **Criterio de salida.** 100 % de las suites funcionales de F1–F7 verdes; 0 violaciones serias de axe; defectos Alta/Media de mis requisitos corregidos; Quality Gate OK. **Criterio de aceptación.** Cada escenario de `MATRIZ-TRAZABILIDAD-FINAL.csv` en *Pass* o con defecto documentado.

## 1.4 Matriz de trazabilidad
Archivos: `Matriz-Casos-y-Escenarios-Final-Juliana.xlsx` (formato de la clase: escenarios, casos y casos detallados), `RTM-EntreAulas-Final.xlsx` y `MATRIZ-TRAZABILIDAD-FINAL.csv`. 35 casos para 11 escenarios; relaciona HU → RF → escenario → caso → herramienta → estado → defecto → evidencia.
