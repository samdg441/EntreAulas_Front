import { describe, expect, it } from 'vitest'
import {
  accesoReportes,
  decidirMontajeReportes,
  decidirVistaResumen,
  destinoTras401,
  endpointPorRol,
  esAvisoSinRespuestas,
  hayResumenParaPintar,
  mensajeErrorResumen,
  type ResultadoResumen,
} from '../../../features/evaluations/resumen-ia'

const COMENTARIOS: ResultadoResumen = {
  summary: 'Resumen local a partir de 2 respuestas abiertas.',
  topics: ['claridad'],
  textsCount: 2,
  analysisSource: 'open_text',
}

const AVISO_SIN_DATOS =
  'No se encontraron respuestas abiertas para este profesor en el período seleccionado.'

/**
 * RQ29 en reportes: los comentarios abiertos se pintan, el estudiante y el
 * profesor ajeno reciben el rechazo del servidor, y sin textos no se inventa un resumen.
 */
describe('RQ29 — Resumen automático de comentarios', () => {
  it('los comentarios abiertos producen un resumen que se pinta', () => {
    // Act
    const vista = decidirVistaResumen({ haySesion: true, status: 200, result: COMENTARIOS })
    const endpoint = endpointPorRol('teacher')

    // Assert
    expect(vista, 'vista').to.equal('pintar')
    expect(hayResumenParaPintar(COMENTARIOS), 'pintar').to.equal(true)
    expect(COMENTARIOS, 'resumen').to.include({ analysisSource: 'open_text', textsCount: 2 })
    expect(COMENTARIOS.topics, 'temas').to.include('claridad')
    expect(endpoint, 'endpoint').to.equal('by-professor')
  })

  it('el estudiante y el profesor ajeno no leen ese resumen', () => {
    // Act
    const estudiante = decidirVistaResumen({ haySesion: true, status: 403, result: null })
    const ajeno = mensajeErrorResumen({ response: { status: 403, data: { error: 'No autorizado' } } })
    const montaje = decidirMontajeReportes(null)

    // Assert
    expect(estudiante, 'estudiante').to.equal('error')
    expect(ajeno, 'ajeno').to.equal('No autorizado')
    expect(montaje, 'montaje').to.equal('login')
    expect(esAvisoSinRespuestas(null), 'sin resultado').to.equal(false)
  })

  it('sin comentarios no inventa un resumen de textos', () => {
    // Arrange
    const sinTextos: ResultadoResumen = {
      summary: AVISO_SIN_DATOS,
      topics: [],
      textsCount: 0,
      analysisSource: 'open_text',
    }
    const soloNotas: ResultadoResumen = {
      textsCount: 0,
      ratingsCount: 4,
      analysisSource: 'quantitative_fallback',
    }

    // Act
    const vistaSinTextos = decidirVistaResumen({ haySesion: true, status: 200, result: sinTextos })
    const vistaNotas = decidirVistaResumen({ haySesion: true, status: 200, result: soloNotas })

    // Assert
    expect(vistaSinTextos, 'sin textos').to.equal('aviso-sin-respuestas')
    expect(sinTextos.summary, 'aviso').to.equal(AVISO_SIN_DATOS)
    expect(sinTextos.topics, 'temas').to.be.an('array').and.to.be.empty
    expect(esAvisoSinRespuestas(sinTextos), 'es aviso').to.equal(true)
    expect(vistaNotas, 'solo notas').to.equal('pintar')
    expect(soloNotas, 'fallback').to.include({ analysisSource: 'quantitative_fallback', textsCount: 0 })
  })

  it('sin resultado ni error no pinta un resumen vacío', () => {
    expect(decidirVistaResumen({ haySesion: true, status: 200, result: {} }), 'vista').to.equal('error')
  })

  it('una sesión vencida vuelve al login y un fallo de red muestra el mensaje', () => {
    // Arrange
    const profesor = { token: 'jwt', savedUser: '{}', user: { tipo_usuario: 'profesor', roles: ['profesor'] } }

    // Act
    const vencida = decidirVistaResumen({ haySesion: true, status: 401, result: COMENTARIOS })
    const acceso = accesoReportes(profesor)
    const red = mensajeErrorResumen({ message: 'Network Error' })
    const vacio = mensajeErrorResumen(null)

    // Assert
    expect(vencida, '401').to.equal('login')
    expect(destinoTras401(401), 'destino').to.equal('login')
    expect(destinoTras401(500), 'otro estado').to.equal('seguir')
    expect(acceso, 'acceso').to.equal('ok')
    expect(decidirMontajeReportes(profesor.user), 'montaje').to.equal('reportes')
    expect(red, 'red').to.equal('Network Error')
    expect(vacio, 'vacío').to.equal('No se pudo generar el resumen automáticamente')
  })
})
