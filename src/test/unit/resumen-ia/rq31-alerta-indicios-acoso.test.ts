import { describe, expect, it } from 'vitest'
import {
  decidirVistaAlerta,
  muestraBannerAcoso,
  muestraListaDocentesAcoso,
  tituloAlertaAcoso,
  type ResultadoAlerta,
} from '../../../features/evaluations/alerta-acoso'
import { endpointPorRol } from '../../../features/evaluations/resumen-ia'

const CON_ACOSO: ResultadoAlerta = {
  summary: 'Se detectaron indicios en los comentarios de la carrera.',
  topics: ['acoso'],
  textsCount: 1,
  analysisSource: 'open_text',
  acosoDetectado: true,
  mensajeAcoso: 'Hubo acoso en una respuesta. Revisar el protocolo.',
  acosoProfesores: [
    {
      profesorId: '7',
      nombre: 'Ana Perez',
      menciones: 1,
      ejemplos: ['Hubo acoso durante la asesoría'],
    },
  ],
}

const SIN_ACOSO: ResultadoAlerta = {
  summary: 'Comentarios de metodología y claridad.',
  topics: ['claridad'],
  textsCount: 1,
  analysisSource: 'open_text',
  acosoDetectado: false,
  acosoProfesores: [],
}

/**
 * RQ31 en reportes: un comentario con acoso enciende el banner del coordinador.
 * Un comentario normal no alerta y el estudiante no ve la carrera.
 */
describe('RQ31 — Alerta de indicios de acoso', () => {
  it('un comentario con acoso enciende la alerta del coordinador', () => {
    // Act
    const vista = decidirVistaAlerta({ haySesion: true, status: 200, result: CON_ACOSO })
    const endpoint = endpointPorRol('coordinator')

    // Assert
    expect(vista, 'vista').to.equal('alerta')
    expect(endpoint, 'endpoint').to.equal('by-career')
    expect(muestraBannerAcoso(CON_ACOSO), 'banner').to.equal(true)
    expect(CON_ACOSO, 'detección').to.include({ acosoDetectado: true })
    expect(CON_ACOSO.mensajeAcoso, 'mensaje').to.be.a('string').and.not.to.be.empty
    expect(CON_ACOSO.acosoProfesores, 'profesores').to.be.an('array').and.to.have.lengthOf(1)
    expect(muestraListaDocentesAcoso(CON_ACOSO), 'lista').to.equal(true)
    expect(tituloAlertaAcoso(), 'título').to.equal('ALERTA DE ACOSO DETECTADO')
  })

  it('un comentario normal no alerta y el estudiante no ve la carrera', () => {
    // Act
    const vista = decidirVistaAlerta({ haySesion: true, status: 200, result: SIN_ACOSO })
    const estudiante = decidirVistaAlerta({ haySesion: true, status: 403, result: null })

    // Assert
    expect(vista, 'vista').to.equal('resumen')
    expect(muestraBannerAcoso(SIN_ACOSO), 'banner').to.equal(false)
    expect(muestraListaDocentesAcoso(SIN_ACOSO), 'lista').to.equal(false)
    expect(SIN_ACOSO, 'detección').to.include({ acosoDetectado: false })
    expect(SIN_ACOSO, 'mensaje').to.not.have.property('mensajeAcoso')
    expect(SIN_ACOSO.acosoProfesores, 'profesores').to.be.an('array').and.to.be.empty
    expect(estudiante, 'estudiante').to.equal('error')
  })

  it('una mención corta no arma la lista de docentes', () => {
    // Arrange
    const cortas: ResultadoAlerta = {
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: true,
      mensajeAcoso: 'Revisar.',
      acosoProfesores: [],
    }

    // Act
    const vista = decidirVistaAlerta({ haySesion: true, status: 200, result: cortas })

    // Assert
    expect(muestraListaDocentesAcoso(cortas), 'lista').to.equal(false)
    expect(muestraBannerAcoso(cortas), 'banner').to.equal(true)
    expect(vista, 'vista').to.equal('alerta')
    expect(cortas.acosoProfesores, 'menciones').to.be.an('array').and.to.be.empty
  })

  it('sin respuestas o sin sesión no hay banner', () => {
    // Arrange
    const sinDatos: ResultadoAlerta = { textsCount: 0, acosoDetectado: true, mensajeAcoso: 'Hubo acoso' }

    // Act
    const aviso = decidirVistaAlerta({ haySesion: true, status: 200, result: sinDatos })
    const login = decidirVistaAlerta({ haySesion: false, result: CON_ACOSO })

    // Assert
    expect(aviso, 'aviso').to.equal('aviso-sin-respuestas')
    expect(muestraBannerAcoso(sinDatos), 'banner').to.equal(false)
    expect(muestraBannerAcoso(null), 'nulo').to.equal(false)
    expect(muestraListaDocentesAcoso(null), 'lista nula').to.equal(false)
    expect(login, 'login').to.equal('login')
  })
})
