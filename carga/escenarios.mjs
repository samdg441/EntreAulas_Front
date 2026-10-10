/**
 * Endpoints del back que alimentan RQ19 y RQ22–RQ25, con su criterio de aceptación.
 * - estado: código HTTP esperado (un 401 esperado NO cuenta como error).
 * - p95Ms: el 95 % de las respuestas debe llegar antes de este tiempo.
 * - maxErroresPct: porcentaje máximo de respuestas inesperadas, timeouts o fallos de red.
 */
export function escenarios({ periodo, profesorId }) {
  return [
    {
      nombre: 'health',
      requisito: 'base',
      ruta: '/health',
      auth: false,
      estado: 200,
      p95Ms: 1_000,
      maxErroresPct: 1,
    },
    {
      nombre: 'sin-token-401',
      requisito: 'RQ19',
      ruta: '/api/coordinador/dashboard-summary',
      auth: false,
      estado: 401,
      p95Ms: 1_000,
      maxErroresPct: 0,
    },
    {
      nombre: 'dashboard-summary',
      requisito: 'RQ24',
      ruta: '/api/coordinador/dashboard-summary?page=1&pageSize=8',
      auth: true,
      estado: 200,
      p95Ms: 3_000,
      maxErroresPct: 1,
    },
    {
      nombre: 'reports-overview',
      requisito: 'RQ23/RQ25',
      ruta: `/api/coordinador/reports-overview?period=${periodo}`,
      auth: true,
      estado: 200,
      p95Ms: 8_000,
      maxErroresPct: 1,
    },
    ...(profesorId
      ? [
          {
            nombre: 'profesor-stats',
            requisito: 'RQ22',
            ruta: `/api/coordinador/profesor-stats/${profesorId}?period=${periodo}`,
            auth: true,
            estado: 200,
            p95Ms: 3_000,
            maxErroresPct: 1,
          },
        ]
      : []),
  ]
}
