# Plan de pruebas generado por el planner — panel rediseñado del coordinador

Semilla: `fixtures/back-coordinador.ts` (back simulado con `page.route`) · Snapshots: `specs/exploracion-final/*.aria.yml`

## 1. Vista de auditoría (`/auditoria`)
1.1 El coordinador ve la tabla con 10 eventos de 23 y el resumen por acción (hallado en `auditoria.aria.yml`).
1.2 Filtrar por acción reduce la tabla y el resumen.
1.3 Buscar por persona ignora tildes.
1.4 Un rango de fechas invertido muestra el error y no consulta.
1.5 Paginación: la página 3 muestra los 3 eventos restantes.
1.6 Exportar CSV descarga un archivo con el encabezado esperado.
1.7 Auditoría no disponible (sin tabla): explica en lugar de mostrar la tabla.
1.8 Un estudiante es enviado a /forbidden.

## 2. Gestión de profesores (`/profesores/gestionar`)
2.1 Lista con promedio y evaluaciones; los chips muestran conteos (Todos 6, En riesgo 2, Sin evaluaciones 1).
2.2 Elegir un docente carga sus estadísticas del periodo.
2.3 Filtro «En riesgo» y orden por promedio.
2.4 Estado vacío cuando la búsqueda no coincide.
2.5 En móvil la lista y el detalle se alternan con «Volver a la lista».

## 3. Dashboard, barra lateral y calendario (`/dashboard-coordinador`)
3.1 Indicadores visibles y accesos agrupados en la barra lateral por sección.
3.2 El calendario marca apertura/cierre de la evaluación programada y lista los días que faltan.
3.3 Ya no existen las «Acciones rápidas».

## 4. Preferencias de accesibilidad
4.1 Modo noche: clase `dark`, persistencia tras recargar y contraste del texto principal ≥ 4.5:1.
4.2 Idioma inglés: textos y atributo `lang`.
4.3 Tamaño de texto: cambia el `font-size` base.
4.4 Teclado: el enlace «Saltar al contenido» es el primer foco y lleva a `#contenido`.
4.5 Sin desplazamiento horizontal a 320 px con letra muy grande.

## Hallazgos de la exploración
- H-1: en el resumen de la auditoría, los conteos son párrafos sueltos (no una lista de definición); se leen bien pero no se anuncian como pares etiqueta/valor. Severidad baja, recomendación: usar `<dl>`.
- H-2: el campo de fecha no explica el formato en inglés (depende del navegador). Severidad baja.
