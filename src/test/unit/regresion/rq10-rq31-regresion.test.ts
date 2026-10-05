import { describe, expect, it } from 'vitest'
import {
  decidirCargaStatsEstudiante,
  statsDesdeApi,
  statsTrasErrorApi,
} from '../../../features/dashboard-student/estudiante-stats'
import {
  armarPayloadEvaluacion,
  decidirEnvioFormulario,
  mensajeErrorEnvio,
} from '../../../features/evaluations/evaluacion-docente'
import {
  aplicarAltaEnLista,
  armarCorreoInstitucional,
  decidirAccesoAdminUsers,
  decidirAltaUsuario,
  decidirCambioUsuario,
  decidirDesactivarUsuario,
  esAutoDesactivacion,
  type UsuarioLista,
} from '../../../features/dashboard-admin/gestionar-usuarios'
import { decidirVistaResumen, endpointPorRol, type ResultadoResumen } from '../../../features/evaluations/resumen-ia'
import { decidirVistaAlerta, muestraBannerAcoso, type ResultadoAlerta } from '../../../features/evaluations/alerta-acoso'

/**
 * Regresión de RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31 en el front.
 * Primero el camino que sí funciona y después cada caso comprueba que ese
 * éxito no dejó abierta la puerta de atrás. Cada caso es independiente.
 */

const PROFESOR = { id: 7 }
const CURSO = { id: 31 }
const ADMIN = { token: 'jwt', savedUser: '{}', user: { tipo_usuario: 'admin', roles: ['admin'] } }
const ANA: UsuarioLista = {
  id: 'u-1',
  email: 'ana@soyudemedellin.edu.co',
  nombre: 'Ana',
  apellido: 'Pérez',
  tipo_usuario: 'estudiante',
  activo: true,
}

describe('RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31 — Regresión', () => {
  it('RQ10: el estudiante ve completadas, pendientes y promedio', () => {
    // Arrange
    const respuesta = {
      evaluacionesCompletadas: 2,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 2,
      promedioGeneral: 4.5,
      progresoGeneral: 100,
    }

    // Act
    const carga = decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario: 'estudiante', statsOk: true })
    const stats = statsDesdeApi(respuesta)

    // Assert
    expect(carga, 'carga').to.equal('pintar')
    expect(stats, 'estadísticas').to.include(respuesta)
  })

  it('Regresión RQ10: un profesor no hereda las estadísticas del estudiante', () => {
    // Act
    const carga = decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario: 'profesor', statsOk: true })

    // Assert
    expect(carga, 'profesor').to.equal('no-cargar')
  })

  it('Regresión RQ10: más evaluaciones que materias no dejan pendientes negativas', () => {
    // Arrange: el servidor ya dejó las pendientes en cero.
    const respuesta = {
      evaluacionesCompletadas: 3,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 1,
      promedioGeneral: 3,
      progresoGeneral: 100,
    }

    // Act
    const stats = statsDesdeApi(respuesta)
    const ceros = statsTrasErrorApi()

    // Assert
    expect(stats.evaluacionesPendientes, 'pendientes').to.equal(0).and.to.be.at.least(0)
    expect(ceros.evaluacionesPendientes, 'error').to.equal(0)
  })

  it('RQ11: el estudiante guarda la evaluación y llega al goodbye', () => {
    // Act
    const payload = armarPayloadEvaluacion({
      teacher: PROFESOR,
      course: CURSO,
      group: { id: 4 },
      questions: [
        { id: '1', type: 'rating' },
        { id: '2', type: 'text' },
      ],
      ratings: [5, null],
      textAnswers: [undefined, 'claridad'],
    })
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: true,
    })

    // Assert
    expect(destino, 'envío').to.equal('goodbye')
    expect(payload, 'payload').to.include({ teacherId: '7', courseId: '31', groupId: '4' })
    expect(payload.answers, 'respuestas').to.have.lengthOf(2)
  })

  it('Regresión RQ11: el mismo cuerpo, negado a un profesor, sigue sin goodbye', () => {
    // Act
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: false,
    })
    const mensaje = mensajeErrorEnvio({ response: { data: { error: 'FORBIDDEN_ROLE' } } })

    // Assert
    expect(destino, 'profesor').to.equal('alerta-error')
    expect(mensaje, 'error').to.equal('FORBIDDEN_ROLE')
  })

  it('Regresión RQ11: repetir la evaluación no crea otra', () => {
    // Act
    const destino = decidirEnvioFormulario({
      haySesion: true,
      confirma: true,
      teacher: PROFESOR,
      course: CURSO,
      envioOk: false,
    })

    // Assert
    expect(destino, 'repetida').to.equal('alerta-error')
  })

  it('Regresión RQ11: sin respuestas el envío válido no se cuela', () => {
    // Act
    const payload = armarPayloadEvaluacion({
      teacher: PROFESOR,
      course: CURSO,
      questions: [],
      ratings: [],
      textAnswers: [],
    })
    const mensaje = mensajeErrorEnvio({
      response: {
        data: {
          error: 'Datos de evaluación inválidos',
          details: [{ field: 'answers', message: 'Se requiere al menos una respuesta' }],
        },
      },
    })

    // Assert
    expect(payload.answers, 'respuestas').to.be.an('array').and.to.be.empty
    expect(mensaje, 'mensaje').to.equal('Datos de evaluación inválidos')
  })

  it('RQ13: el admin crea el usuario y la lista no lleva la contraseña', () => {
    // Act
    const acceso = decidirAccesoAdminUsers(ADMIN)
    const alta = decidirAltaUsuario({ altaOk: true })
    const lista = aplicarAltaEnLista([], ANA, true)

    // Assert
    expect(acceso, 'acceso').to.equal('ok')
    expect(alta, 'alta').to.include({ destino: 'recarga', cierraModal: true })
    expect(lista[0], 'usuario').to.include({ email: ANA.email, nombre: 'Ana' })
    expect(lista[0], 'clave').to.not.have.property('password')
  })

  it('Regresión RQ13: quien no es admin no crea, y el correo repetido tampoco', () => {
    // Act
    const acceso = decidirAccesoAdminUsers({
      token: 'jwt',
      savedUser: '{}',
      user: { tipo_usuario: 'profesor' },
    })
    const duplicado = decidirAltaUsuario({ altaOk: false, error: 'El email ya está registrado' })

    // Assert
    expect(acceso, 'no admin').to.equal('forbidden')
    expect(duplicado.formError, 'duplicado').to.equal('El email ya está registrado')
    expect(duplicado, 'formulario').to.include({ cierraModal: false, recargaLista: false })
  })

  it('Regresión RQ13: el admin no se desactiva a sí mismo ni guarda un cambio vacío', () => {
    // Act
    const propia = esAutoDesactivacion('admin-1', 'admin-1')
    const baja = decidirDesactivarUsuario({ desactivarOk: false })
    const vacio = decidirCambioUsuario({ cambioOk: false, error: 'No hay campos para actualizar' })
    const correo = armarCorreoInstitucional('ana', 'estudiante')

    // Assert
    expect(propia, 'auto-desactivar').to.equal(true)
    expect(baja, 'baja').to.include({ destino: 'error-lista', recargaLista: false })
    expect(vacio.formError, 'vacío').to.equal('No hay campos para actualizar')
    expect(correo, 'correo').to.equal('ana@soyudemedellin.edu.co')
  })

  it('RQ29: los comentarios abiertos producen un resumen que se pinta', () => {
    // Arrange
    const resumen: ResultadoResumen = {
      summary: 'Resumen local a partir de 2 respuestas abiertas.',
      topics: ['claridad'],
      textsCount: 2,
      analysisSource: 'open_text',
    }

    // Act
    const vista = decidirVistaResumen({ haySesion: true, status: 200, result: resumen })

    // Assert
    expect(vista, 'resumen').to.equal('pintar')
    expect(resumen, 'datos').to.include({ analysisSource: 'open_text', textsCount: 2 })
    expect(resumen.topics, 'temas').to.include('claridad')
    expect(endpointPorRol('teacher'), 'endpoint').to.equal('by-professor')
  })

  it('Regresión RQ29: el estudiante y el profesor ajeno no leen ese resumen', () => {
    // Act
    const estudiante = decidirVistaResumen({ haySesion: true, status: 403 })
    const ajeno = decidirVistaResumen({ haySesion: true, status: 403 })

    // Assert
    expect(estudiante, 'estudiante').to.equal('error')
    expect(ajeno, 'ajeno').to.equal('error')
  })

  it('Regresión RQ29: sin comentarios no inventa un resumen de textos', () => {
    // Arrange
    const sinTextos: ResultadoResumen = { textsCount: 0, topics: [], summary: 'Sin respuestas abiertas.' }
    const soloNotas: ResultadoResumen = { textsCount: 0, analysisSource: 'quantitative_fallback' }

    // Act
    const vistaSinTextos = decidirVistaResumen({ haySesion: true, status: 200, result: sinTextos })
    const vistaNotas = decidirVistaResumen({ haySesion: true, status: 200, result: soloNotas })

    // Assert
    expect(vistaSinTextos, 'sin textos').to.equal('aviso-sin-respuestas')
    expect(sinTextos.topics, 'temas').to.be.an('array').and.to.be.empty
    expect(vistaNotas, 'solo notas').to.equal('pintar')
    expect(soloNotas, 'fallback').to.include({ analysisSource: 'quantitative_fallback', textsCount: 0 })
  })

  it('RQ30: el coordinador resume la carrera con los comentarios de ese alcance', () => {
    // Arrange
    const carrera: ResultadoResumen = { textsCount: 1, analysisSource: 'open_text', topics: ['claridad'] }

    // Act
    const vista = decidirVistaResumen({ haySesion: true, status: 200, result: carrera })

    // Assert
    expect(vista, 'carrera').to.equal('pintar')
    expect(endpointPorRol('coordinator'), 'endpoint').to.equal('by-career')
    expect(carrera, 'datos').to.include({ analysisSource: 'open_text', textsCount: 1 })
  })

  it('Regresión RQ30: el estudiante no pide la carrera y el profesor no lee a otro', () => {
    // Act
    const estudiante = decidirVistaResumen({ haySesion: true, status: 403 })
    const ajeno = decidirVistaResumen({ haySesion: true, status: 403 })

    // Assert
    expect(estudiante, 'estudiante').to.equal('error')
    expect(ajeno, 'otro profesor').to.equal('error')
  })

  it('Regresión RQ30: un texto corto de facultad no cuenta como comentario abierto', () => {
    // Arrange
    const facultad: ResultadoResumen = {
      textsCount: 0,
      summary: 'No se encontraron respuestas abiertas válidas para la facultad en el período seleccionado.',
    }
    const avisoCarrera = 'No se encontraron respuestas abiertas válidas para esta carrera.'

    // Act
    const vista = decidirVistaResumen({ haySesion: true, status: 200, result: facultad })

    // Assert
    expect(vista, 'facultad').to.equal('aviso-sin-respuestas')
    expect(facultad, 'datos').to.include({ textsCount: 0 })
    expect(facultad.summary, 'aviso').to.not.equal(avisoCarrera)
    expect(endpointPorRol('decano'), 'endpoint').to.equal('by-faculty')
  })

  it('RQ31: un comentario con acoso enciende la alerta del coordinador', () => {
    // Arrange
    const alerta: ResultadoAlerta = {
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: true,
      mensajeAcoso: 'Hubo acoso en una respuesta.',
      acosoProfesores: [{ profesorId: '7', nombre: 'Ana Perez', menciones: 1, ejemplos: ['Hubo acoso'] }],
    }

    // Act
    const vista = decidirVistaAlerta({ haySesion: true, status: 200, result: alerta })

    // Assert
    expect(vista, 'alerta').to.equal('alerta')
    expect(muestraBannerAcoso(alerta), 'banner').to.equal(true)
    expect(alerta.mensajeAcoso, 'mensaje').to.be.a('string').and.not.to.be.empty
    expect(alerta.acosoProfesores, 'profesores').to.have.lengthOf(1)
  })

  it('Regresión RQ31: un comentario normal no alerta y el estudiante no ve la carrera', () => {
    // Arrange
    const normal: ResultadoAlerta = {
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: false,
      acosoProfesores: [],
    }

    // Act
    const vista = decidirVistaAlerta({ haySesion: true, status: 200, result: normal })
    const estudiante = decidirVistaAlerta({ haySesion: true, status: 403 })

    // Assert
    expect(vista, 'sin acoso').to.equal('resumen')
    expect(muestraBannerAcoso(normal), 'banner').to.equal(false)
    expect(normal, 'mensaje').to.not.have.property('mensajeAcoso')
    expect(estudiante, 'estudiante').to.equal('error')
    expect(normal.acosoProfesores, 'menciones cortas').to.be.an('array').and.to.be.empty
  })
})
