import { describe, expect, it } from 'vitest'
import { decidirAccesoRuta } from '../../features/auth/dashboard-path'
import {
  decidirCargaStatsEstudiante,
  decidirMontajeDashboard,
  normalizeUserType,
  statsAVistaEstudiante,
  statsDesdeApi,
  statsTrasErrorApi,
  STATS_CERO,
  tarjetasEstudiante,
  TITULOS_TARJETAS_ESTUDIANTE,
} from '../helpers/estudiante-stats'

/**
 * RQ10 — Evaluaciones del estudiante (frontend /dashboard)
 *
 * Nodos del grafo:
 *  1    Inicio: abre /dashboard
 *  2    Monta el wrapper del dashboard
 *  3-4  ¿Hay sesión (authUser)? No → /login
 *  5-6  ¿Es estudiante? No → no carga stats
 *  7    GET /api/teachers/student-stats
 *  8-9  ¿Stats OK? No → catch pone ceros
 *  10-11 Pinta tarjetas de pendientes y completadas
 */

const ROLES_NO_ESTUDIANTE = ['profesor', 'docente', 'coordinador', 'admin'] as const

const statsApiOk = {
  evaluacionesCompletadas: 2,
  evaluacionesPendientes: 3,
  materiasMatriculadas: 5,
  promedioGeneral: 4.5,
  progresoGeneral: 40,
}

class RQ10EvaluacionesEstudiante {
  // Nodo 1-2: el wrapper solo monta Dashboard si hay authUser
  N2_montajeSegunSesion() {
    expect(decidirMontajeDashboard(null)).toBe('login')
    expect(decidirMontajeDashboard(undefined)).toBe('login')
    expect(
      decidirMontajeDashboard({ id: 'u1', nombre: 'Ana', apellido: 'Perez', tipo_usuario: 'estudiante' })
    ).toBe('dashboard')
  }

  // Nodo 3-4: sin token, sin savedUser o sin user → /login (App.tsx 244-246)
  N4_sinSesionVaALogin() {
    expect(decidirAccesoRuta({ token: null, savedUser: null, user: null })).toBe('login')
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: null, user: null })).toBe('login')
    expect(decidirAccesoRuta({ token: 'jwt', savedUser: '{}', user: null })).toBe('login')
    expect(decidirCargaStatsEstudiante({ haySesion: false })).toBe('login')
  }

  // Nodo 5: tipo_usuario del back se mapea al type del Dashboard (App.tsx 252-255)
  N5_mapeoTipoUsuario() {
    expect(normalizeUserType('estudiante')).toBe('student')
    expect(normalizeUserType('profesor')).toBe('teacher')
    expect(normalizeUserType('docente')).toBe('teacher')
    expect(normalizeUserType('coordinador')).toBe('coordinator')
    expect(normalizeUserType('admin')).toBe('decano')
    expect(normalizeUserType('ESTUDIANTE')).toBe('student')
  }

  // Nodo 5-6: profesor / coordinador / admin no disparan GET student-stats
  N6_noEsEstudianteNoCargaStats() {
    for (const rol of ROLES_NO_ESTUDIANTE) {
      expect(
        decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario: rol, statsOk: true })
      ).toBe('no-cargar')
    }
    expect(
      decidirCargaStatsEstudiante({ haySesion: true, type: 'teacher', statsOk: true })
    ).toBe('no-cargar')
    expect(
      decidirCargaStatsEstudiante({ haySesion: true, type: 'coordinator', statsOk: true })
    ).toBe('no-cargar')
  }

  // Nodo 5: estudiante sí entra al fetch
  N5_estudianteSiCargaStats() {
    expect(
      decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario: 'estudiante', statsOk: true })
    ).toBe('pintar')
    expect(
      decidirCargaStatsEstudiante({ haySesion: true, type: 'student', statsOk: true })
    ).toBe('pintar')
  }

  // Nodo 8-9: GET falla (red, 401, 403, 500) → catch deja ceros, no rompe el dashboard
  N9_apiFallaMuestraCeros() {
    expect(
      decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario: 'estudiante', statsOk: false })
    ).toBe('ceros')

    const ceros = statsTrasErrorApi()
    expect(ceros).toEqual(STATS_CERO)
    expect(ceros.evaluacionesPendientes).toBe(0)
    expect(ceros.evaluacionesCompletadas).toBe(0)
    expect(ceros.materiasMatriculadas).toBe(0)
    expect(ceros.promedioGeneral).toBe(0)
    expect(ceros.progresoGeneral).toBe(0)

    const tarjetas = tarjetasEstudiante(ceros)
    expect(tarjetas.pendientes.valor).toBe(0)
    expect(tarjetas.completadas.valor).toBe(0)
  }

  // Nodo 8-9: respuesta nula o campos ausentes se leen como 0 (?? 0)
  N9_apiIncompletaSeLeeComoCero() {
    expect(statsDesdeApi(null)).toEqual(STATS_CERO)
    expect(statsDesdeApi({})).toEqual(STATS_CERO)
    expect(
      statsDesdeApi({
        evaluacionesCompletadas: null,
        evaluacionesPendientes: undefined,
      })
    ).toEqual(STATS_CERO)
  }

  // Nodo 7-8: Number() acepta strings que venga el JSON
  N8_apiConNumerosEnString() {
    expect(
      statsDesdeApi({
        evaluacionesCompletadas: '2',
        evaluacionesPendientes: '3',
        materiasMatriculadas: '5',
        promedioGeneral: '4.5',
        progresoGeneral: '40',
      })
    ).toEqual(statsApiOk)
  }

  // Nodo 10: GET 200 se mapea a evaluationsPending / evaluationsCompleted (Dashboard 180-187)
  N10_apiOkMapeaAVista() {
    expect(
      decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario: 'estudiante', statsOk: true })
    ).toBe('pintar')

    const stats = statsDesdeApi(statsApiOk)
    expect(stats).toEqual(statsApiOk)

    const vista = statsAVistaEstudiante(stats)
    expect(vista.evaluationsPending).toBe(3)
    expect(vista.evaluationsCompleted).toBe(2)
    expect(vista.currentCourses).toBe(5)
    expect(vista.averageGrade).toBe(4.5)
  }

  // Nodo 10-11: las tarjetas del estudiante muestran título, cifra y pie del período
  N11_pintaTarjetasPendientesYCompletadas() {
    const tarjetas = tarjetasEstudiante(statsApiOk)
    expect(tarjetas.pendientes).toEqual({
      titulo: TITULOS_TARJETAS_ESTUDIANTE.pendientes,
      valor: 3,
      pie: TITULOS_TARJETAS_ESTUDIANTE.piePendientes,
    })
    expect(tarjetas.completadas).toEqual({
      titulo: TITULOS_TARJETAS_ESTUDIANTE.completadas,
      valor: 2,
      pie: TITULOS_TARJETAS_ESTUDIANTE.pieCompletadas,
    })
    expect(tarjetas.pendientes.titulo).toBe('Evaluaciones Pendientes')
    expect(tarjetas.completadas.titulo).toBe('Evaluaciones Completadas')
  }

  // Nodo 11: el estudiante ve cuántas encuestas le faltan y cuántas ya hizo
  N11_estudianteVeQueEncuestasResponder() {
    const vista = statsAVistaEstudiante(statsApiOk)
    expect(vista.evaluationsPending).toBeGreaterThan(0)
    expect(vista.evaluationsCompleted).toBeGreaterThan(0)
    expect(vista.evaluationsPending + vista.evaluationsCompleted).toBe(statsApiOk.materiasMatriculadas)
  }

  // FALLA a propósito: sin sesión no se pintan stats
  FALLA_N4_sinSesionSeEsperaPintar() {
    expect(decidirCargaStatsEstudiante({ haySesion: false })).toBe('pintar')
  }

  // FALLA a propósito: un profesor no debe disparar GET student-stats
  FALLA_N6_profesorCargaStats() {
    expect(
      decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario: 'profesor', statsOk: true })
    ).toBe('pintar')
  }

  // FALLA a propósito: si el GET falla, el dashboard no inventa cifras
  FALLA_N9_errorApiMuestraDatosReales() {
    const ceros = statsTrasErrorApi()
    expect(ceros.evaluacionesPendientes).toBe(3)
    expect(ceros.evaluacionesCompletadas).toBe(2)
  }

  // FALLA a propósito: las tarjetas no deben mostrar el título de profesor
  FALLA_N11_tarjetaConTituloDeProfesor() {
    const tarjetas = tarjetasEstudiante(statsApiOk)
    expect(tarjetas.pendientes.titulo).toBe('Calificación Promedio')
    expect(tarjetas.completadas.titulo).toBe('Total Evaluaciones')
  }
}

const pruebas = new RQ10EvaluacionesEstudiante()

describe('RQ10 — Evaluaciones del estudiante (frontend)', () => {
  it('Nodo 1-2: sin authUser el wrapper no monta el dashboard', () => pruebas.N2_montajeSegunSesion())
  it('Nodo 3-4: sin sesión → /login', () => pruebas.N4_sinSesionVaALogin())
  it('Nodo 5: tipo_usuario se mapea al type del Dashboard', () => pruebas.N5_mapeoTipoUsuario())
  it('Nodo 5: estudiante sí carga stats', () => pruebas.N5_estudianteSiCargaStats())
  it('Nodo 5-6: no es estudiante → no carga stats', () => pruebas.N6_noEsEstudianteNoCargaStats())
  it('Nodo 8-9: GET falla → muestra ceros', () => pruebas.N9_apiFallaMuestraCeros())
  it('Nodo 8-9: API incompleta se lee como cero', () => pruebas.N9_apiIncompletaSeLeeComoCero())
  it('Nodo 7-8: JSON numérico en string se convierte', () => pruebas.N8_apiConNumerosEnString())
  it('Nodo 10: GET 200 mapea pendientes y completadas', () => pruebas.N10_apiOkMapeaAVista())
  it('Nodo 10-11: pinta tarjetas Pendientes y Completadas', () =>
    pruebas.N11_pintaTarjetasPendientesYCompletadas())
  it('Nodo 11: el estudiante ve qué encuestas responder', () =>
    pruebas.N11_estudianteVeQueEncuestasResponder())
  it('FALLA N4: sin sesión — se espera (mal) pintar', () => pruebas.FALLA_N4_sinSesionSeEsperaPintar())
  it('FALLA N6: profesor — se espera (mal) que cargue stats', () => pruebas.FALLA_N6_profesorCargaStats())
  it('FALLA N9: error API — se espera (mal) cifras reales', () =>
    pruebas.FALLA_N9_errorApiMuestraDatosReales())
  it('FALLA N11: tarjetas — se espera (mal) títulos de profesor', () =>
    pruebas.FALLA_N11_tarjetaConTituloDeProfesor())
})
