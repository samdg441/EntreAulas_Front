import { describe, expect, it } from 'vitest'
import {
  STATS_CERO,
  decidirCargaStatsEstudiante,
  decidirMontajeDashboard,
  normalizeUserType,
  statsAVistaEstudiante,
  statsDesdeApi,
  statsTrasErrorApi,
  tarjetasEstudiante,
} from '../../features/dashboard-student/estudiante-stats'

/**
 * RQ10 en la pantalla del estudiante: sin sesión no hay dashboard,
 * otro rol no hereda estas cifras y un fallo deja las tarjetas en cero.
 */
describe('RQ10 — Evaluaciones del estudiante', () => {
  it('sin sesión el dashboard no se monta', () => {
    // Arrange
    const sesion = { haySesion: false, tipoUsuario: 'estudiante' }

    // Act
    const montaje = decidirMontajeDashboard(null)
    const carga = decidirCargaStatsEstudiante(sesion)

    // Assert
    expect(montaje, 'montaje').to.equal('login')
    expect(carga, 'carga').to.equal('login')
  })

  it('el estudiante ve completadas, pendientes y promedio', () => {
    // Arrange
    const respuesta = {
      evaluacionesCompletadas: 2,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 2,
      promedioGeneral: 4.5,
      progresoGeneral: 100,
    }

    // Act
    const carga = decidirCargaStatsEstudiante({
      haySesion: true,
      tipoUsuario: 'estudiante',
      statsOk: true,
    })
    const stats = statsDesdeApi(respuesta)

    // Assert
    expect(carga, 'carga').to.equal('pintar')
    expect(stats, 'estadísticas').to.include(respuesta)
    expect(stats.evaluacionesPendientes, 'pendientes').to.equal(0).and.to.be.at.least(0)
  })

  it('un profesor no carga las estadísticas del estudiante', () => {
    // Act
    const carga = decidirCargaStatsEstudiante({
      haySesion: true,
      tipoUsuario: 'profesor',
      statsOk: true,
    })

    // Assert
    expect(carga, 'carga').to.equal('no-cargar')
    expect(normalizeUserType('profesor'), 'tipo').to.equal('teacher')
    expect(normalizeUserType('docente'), 'docente').to.equal('teacher')
  })

  it('sin perfil o con error de la API las cifras quedan en cero', () => {
    // Act
    const carga = decidirCargaStatsEstudiante({
      haySesion: true,
      tipoUsuario: 'estudiante',
      statsOk: false,
    })
    const porError = statsTrasErrorApi()
    const porNulo = statsDesdeApi(null)

    // Assert
    expect(carga, 'carga').to.equal('ceros')
    expect(porError, 'error').to.deep.equal(STATS_CERO)
    expect(porNulo, 'nulo').to.deep.equal(STATS_CERO)
  })

  it('un promedio nulo cuenta como cero y las tarjetas usan esos números', () => {
    // Arrange
    const respuesta = {
      evaluacionesCompletadas: 1,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 1,
      promedioGeneral: null,
      progresoGeneral: '100',
    }

    // Act
    const stats = statsDesdeApi(respuesta)
    const vista = statsAVistaEstudiante(stats)
    const tarjetas = tarjetasEstudiante(stats)

    // Assert
    expect(stats, 'estadísticas').to.include({ promedioGeneral: 0, progresoGeneral: 100 })
    expect(vista, 'vista').to.include({
      evaluationsCompleted: 1,
      evaluationsPending: 0,
      currentCourses: 1,
      averageGrade: 0,
    })
    expect(tarjetas.completadas, 'completadas').to.include({
      titulo: 'Evaluaciones Completadas',
      valor: 1,
    })
    expect(tarjetas.pendientes, 'pendientes').to.include({
      titulo: 'Evaluaciones Pendientes',
      valor: 0,
    })
  })

  it('con sesión el estudiante entra al dashboard', () => {
    // Act
    const montaje = decidirMontajeDashboard({ tipo_usuario: 'estudiante' })

    // Assert
    expect(montaje, 'montaje').to.equal('dashboard')
    expect(normalizeUserType('estudiante'), 'tipo').to.equal('student')
    expect(normalizeUserType(undefined), 'vacío').to.equal('student')
  })
})
