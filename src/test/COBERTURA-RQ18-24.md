# Cobertura RQ18–RQ24 (frontend)

La nota completa (producto back + front, datos inválidos y % de líneas) está en:

`EntreAulas_Back/src/test/COBERTURA-RQ18-24.md`

Datos preparados: `fixtures/casos-datos.ts`.

| RQ | Pruebas front | Qué cubren |
|---|---:|---|
| RQ18 | 4 | token, sin sesión, API error, OK |
| RQ19 | 6 | dashboards por rol, tipo desconocido, forbidden |
| RQ22 | 3 | vacío, 1–5, −2 / 0 / 99 |
| RQ23 | 5 | promedio, vacío, rangos, período mal, notas fuera de escala |
| RQ24 | 4 | stats en cero, search, search vacío, notas inválidas |
| **Total** | **22** | |

Las pantallas (`QrEvaluationEntry`, `DashboardProfesor`, `ReportsPage`, `DashboardCoordinador`, `App`) **no se ejecutan** con `npm test` (cobertura de líneas 0 %).
