import { describe, expect, it } from 'vitest'
import { mostrarBarraLateral, rolDeNavegacion, rutaActiva, seccionesPorRol, type RolNav } from '../../../lib/navegacion'
import { DICCIONARIO } from '../../../i18n/diccionario'

const ROLES: RolNav[] = ['estudiante', 'profesor', 'coordinador', 'decano', 'admin']
const rutasDe = (rol: RolNav) => seccionesPorRol(rol).flatMap((s) => s.enlaces.map((e) => e.ruta))

describe('seccionesPorRol', () => {
  it.each(ROLES)('%s: la primera sección es Principal con Inicio y la última es Mi cuenta', (rol) => {
    const secciones = seccionesPorRol(rol)

    expect(secciones[0].clave).toBe('nav.sec.principal')
    expect(secciones[0].enlaces[0].clave).toBe('nav.inicio')
    expect(secciones.at(-1)?.clave).toBe('nav.sec.cuenta')
  })

  it.each(ROLES)('%s: sin rutas repetidas y todas son absolutas', (rol) => {
    const rutas = rutasDe(rol)

    expect(new Set(rutas).size).toBe(rutas.length)
    expect(rutas.every((r) => r.startsWith('/'))).toBe(true)
  })

  it.each(ROLES)('%s: todas las etiquetas existen en el diccionario', (rol) => {
    const claves = seccionesPorRol(rol).flatMap((s) => [s.clave, ...s.enlaces.map((e) => e.clave)])

    expect(claves.filter((c) => !(c in DICCIONARIO))).toEqual([])
  })

  it('solo el coordinador ve la auditoría', () => {
    expect(ROLES.filter((r) => rutasDe(r).includes('/auditoria'))).toEqual(['coordinador'])
  })

  it('el coordinador agrupa sus rutas en secciones por tipo', () => {
    const titulos = seccionesPorRol('coordinador').map((s) => s.clave)

    expect(titulos).toEqual([
      'nav.sec.principal',
      'nav.sec.docentes',
      'nav.sec.encuestas',
      'nav.sec.reportes',
      'nav.sec.control',
      'nav.sec.cuenta',
    ])
  })
})

describe('rolDeNavegacion', () => {
  it('prioriza el rol elegido en la sesión', () => {
    expect(rolDeNavegacion({ selected_role: 'profesor', roles: ['admin', 'profesor'] })).toBe('profesor')
  })

  it('sin rol elegido usa el de mayor jerarquía de la cuenta', () => {
    expect(rolDeNavegacion({ roles: ['estudiante', 'coordinador'] })).toBe('coordinador')
  })

  it.each([
    ['docente', 'profesor'],
    ['teacher', 'profesor'],
    ['administrator', 'admin'],
    ['dean', 'decano'],
    ['COORDINATOR', 'coordinador'],
  ])('reconoce el sinónimo %s como %s', (entrada, esperado) => {
    expect(rolDeNavegacion({ tipo_usuario: entrada })).toBe(esperado)
  })

  it.each([null, undefined, {}, { tipo_usuario: 'desconocido' }])('con %j cae a estudiante', (entrada) => {
    expect(rolDeNavegacion(entrada as never)).toBe('estudiante')
  })
})

describe('rutaActiva', () => {
  const coordinador = seccionesPorRol('coordinador')

  it('coincidencia exacta', () => {
    expect(rutaActiva(coordinador, '/auditoria')).toBe('/auditoria')
  })

  it('elige el prefijo más largo: /reports/survey-results no activa /reports', () => {
    expect(rutaActiva(coordinador, '/reports/survey-results')).toBe('/reports/survey-results')
    expect(rutaActiva(coordinador, '/reports')).toBe('/reports')
  })

  it('una subruta activa su sección padre', () => {
    expect(rutaActiva(coordinador, '/profesores/gestionar/12')).toBe('/profesores/gestionar')
  })

  it('una ruta que solo comparte letras no coincide (/auditoria-x)', () => {
    expect(rutaActiva(coordinador, '/auditoria-x')).toBeNull()
  })
})

describe('mostrarBarraLateral', () => {
  it.each(['/login', '/forgot-password', '/reset-password', '/forbidden', '/qr-evaluacion', '/evaluate/goodbye'])(
    'oculta la barra en %s',
    (ruta) => expect(mostrarBarraLateral(ruta)).toBe(false)
  )

  it.each(['/dashboard-coordinador', '/auditoria', '/evaluate/selection', '/evaluate/form', '/profile'])('muestra la barra en %s', (ruta) =>
    expect(mostrarBarraLateral(ruta)).toBe(true)
  )
})
