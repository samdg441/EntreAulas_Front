/**
 * Datos de prueba preparados (aparte de cada requisito).
 * Particiones: comunes, vacíos/cero e inválidos.
 */

export const NOTAS_COMUNES = [1, 3, 4.2, 5] as const
export const NOTAS_INVALIDAS = [-2, 0, 99, null, undefined] as const

export const PERIODOS_VALIDOS = ['2026-1', '2026-2'] as const
export const PERIODOS_INVALIDOS = ['', '2026', '2026-9', 'abc'] as const

export const SEARCH = {
  coincidencia: 'ana',
  sinCoincidencia: 'zzz',
  vacio: '',
} as const

export const DOCENTES_EJEMPLO = [
  { nombre: 'Ana Pérez', email: 'ana@test.com', promedio: 4.2 },
  { nombre: 'Luis Gómez', email: 'luis@test.com', promedio: 3.1 },
]
