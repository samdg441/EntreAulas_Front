import { describe, expect, it } from 'vitest'
import {
  decidirVistaResumen,
  endpointPorRol,
  esAvisoSinRespuestas,
  mensajeErrorResumen,
  type ResultadoResumen,
} from '../../features/evaluations/resumen-ia'

const AVISO_CARRERA = 'No se encontraron respuestas abiertas válidas para esta carrera.'
const AVISO_FACULTAD =
  'No se encontraron respuestas abiertas válidas para la facultad en el período seleccionado.'

/**
 * RQ30 en reportes: cada rol pide su alcance. El estudiante no resume la
 * carrera, el profesor no lee a otro y un texto corto de facultad no cuenta.
 */
describe('RQ30 — Resúmenes agregados', () => {
  it('el coordinador resume la carrera con los comentarios de ese alcance', () => {
    // Arrange
    const carrera: ResultadoResumen = {
      summary: 'Comentarios de la carrera sobre claridad.',
      topics: ['claridad'],
      textsCount: 1,
      analysisSource: 'open_text',
    }

    // Act
    const vista = decidirVistaResumen({ haySesion: true, status: 200, result: carrera })
    const endpoint = endpointPorRol('coordinator')

    // Assert
    expect(vista, 'vista').to.equal('pintar')
    expect(endpoint, 'endpoint').to.equal('by-career')
    expect(carrera, 'carrera').to.include({ analysisSource: 'open_text', textsCount: 1 })
  })

  it('el decano pide la facultad y el profesor el suyo', () => {
    // Act
    const facultad = endpointPorRol('decano')
    const profesor = endpointPorRol('teacher')
    const otro = endpointPorRol('student')

    // Assert
    expect(facultad, 'facultad').to.equal('by-faculty')
    expect(profesor, 'profesor').to.equal('by-professor')
    expect(otro, 'resto').to.equal('by-professor')
  })

  it('el estudiante no pide la carrera y el profesor no lee a otro', () => {
    // Act
    const estudiante = decidirVistaResumen({ haySesion: true, status: 403, result: null })
    const ajeno = mensajeErrorResumen({
      response: { status: 403, data: { error: 'No autorizado para consultar otro profesor' } },
    })

    // Assert
    expect(estudiante, 'estudiante').to.equal('error')
    expect(ajeno, 'ajeno').to.be.a('string').and.not.to.be.empty
    expect(ajeno, 'texto').to.include('No autorizado')
  })

  it('un texto corto de facultad no cuenta como comentario abierto', () => {
    // Arrange
    const facultad: ResultadoResumen = {
      summary: AVISO_FACULTAD,
      topics: [],
      textsCount: 0,
    }

    // Act
    const vista = decidirVistaResumen({ haySesion: true, status: 200, result: facultad })

    // Assert
    expect(vista, 'vista').to.equal('aviso-sin-respuestas')
    expect(esAvisoSinRespuestas(facultad), 'aviso').to.equal(true)
    expect(facultad, 'facultad').to.include({ textsCount: 0, summary: AVISO_FACULTAD })
    expect(facultad.summary, 'no es el de carrera').to.not.equal(AVISO_CARRERA)
  })

  it('solo valoraciones de la carrera se pintan como fallback y no como aviso', () => {
    // Arrange
    const notas: ResultadoResumen = {
      textsCount: 0,
      ratingsCount: 3,
      analysisSource: 'quantitative_fallback',
      summary: 'Promedio de la carrera a partir de valoraciones.',
    }

    // Act
    const vista = decidirVistaResumen({ haySesion: true, status: 200, result: notas })

    // Assert
    expect(vista, 'vista').to.equal('pintar')
    expect(esAvisoSinRespuestas(notas), 'no es aviso').to.equal(false)
    expect(notas, 'fallback').to.include({ analysisSource: 'quantitative_fallback', textsCount: 0 })
  })

  it('sin sesión cualquier alcance vuelve al login', () => {
    // Act
    const vista = decidirVistaResumen({ haySesion: false, result: { textsCount: 1, analysisSource: 'open_text' } })

    // Assert
    expect(vista, 'vista').to.equal('login')
  })
})
