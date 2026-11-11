# 4. Refactorización y despliegue final

Cambios derivados de las pruebas (commits convencionales, rama `pruebas-final-juliana`):

| Antes | Después | Origen |
|---|---|---|
| Fondo con foto y capa negra en 18 pantallas; colores fijos | Tokens CSS: modo noche en toda la app | R3 |
| 12 tamaños de letra mezclados (`text-xs…6xl`, `[10px]`) | Escala de 5 niveles; base seleccionable (87.5–125 %) | R3 |
| Header grande + «Acciones rápidas» en cada dashboard | Barra lateral por rol (secciones por tipo de ruta) + calendario | R3 |
| `ManageProfessors`: dos tarjetas, 3 `console.log` por carga | Lista con filtros/orden + detalle con barras 1–5 y umbral 4.0 | R2 |
| Dashboard del coordinador: tarjetas idénticas | Franja de indicadores, medidor de promedio, calendario | R3 |
| Calendario modal sin semántica de grid | Calendario con filas ARIA; error como `status` | DEF-REDI-00/03 |
| Debounce que reiniciaba la página | Reinicia solo si cambia el texto | DEF-REDI-05 |
| Menú lateral cerrado enfocable | `invisible` mientras está cerrado | DEF-REDI-01 |
| Error del back repetía la entrada | Mensaje fijo | DEF-AUD-01 |
| 7 + 6 vulnerabilidades en dependencias | 4 + 3 (quedan `xlsx`, `nodemailer`, `zod`, `express` sin parche compatible) | `npm audit` |

**Despliegue.** Imágenes reconstruidas y levantadas (`entreaulas-front-final` :3001, `entreaulas-back-final` :3000, ambos `healthy`); pruebas posteriores: Cypress 64/64 y Playwright 25/25. Stagehand se evalúa aparte (ver IA). El front desplegado es el build de producción servido por nginx.
