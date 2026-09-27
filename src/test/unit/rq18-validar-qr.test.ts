import { describe, expect, it } from 'vitest'
import { decidirGeneracionQr, validarCorreoQr, validarFechasQr } from '../../features/evaluations/qr-validacion'

/**
 * RQ18 en la pantalla — antes de pedir los códigos QR, el formulario
 * revisa el correo, el asunto, los grupos y las fechas.
 * El servidor hace la revisión del token; aquí se prueba lo que ve quien genera el QR.
 */
describe('RQ18 — validar el formulario del QR', () => {
  it('un correo vacío o mal escrito no sale', () => {
    // Arrange
    const vacio = { to: '   ', subject: 'Evaluación', grupoIds: [1] }
    const raro = { to: 'sin-arroba', subject: 'Evaluación', grupoIds: [1] }

    // Act
    const respuestaVacia = validarCorreoQr(vacio)
    const respuestaRara = validarCorreoQr(raro)

    // Assert
    expect(respuestaVacia.ok).toBe(false)
    expect(respuestaRara.ok).toBe(false)
    expect(respuestaVacia.error).toBe('Correo de destino inválido.')
  })

  it('sin asunto el envío se detiene', () => {
    // Arrange
    const cuerpo = { to: 'ana@udemedellin.edu.co', subject: '  ', grupoIds: [1] }

    // Act
    const respuesta = validarCorreoQr(cuerpo)

    // Assert
    expect(respuesta.ok).toBe(false)
    expect(respuesta.error).toBe('El asunto es requerido.')
  })

  it('sin grupos no hay a quién generar el código', () => {
    // Arrange
    const cuerpo = { to: 'ana@udemedellin.edu.co', subject: 'Evaluación', grupoIds: [] }

    // Act
    const respuesta = validarCorreoQr(cuerpo)

    // Assert
    expect(respuesta.ok).toBe(false)
    expect(respuesta.error).toContain('grupoIds')
  })

  it('correo, asunto y al menos un grupo dejan pasar el envío', () => {
    // Arrange
    const cuerpo = { to: 'ana@udemedellin.edu.co', subject: 'Evaluación', grupoIds: [3, 4] }

    // Act
    const respuesta = validarCorreoQr(cuerpo)

    // Assert
    expect(respuesta.ok).toBe(true)
    expect(respuesta.error).toBe(undefined)
  })

  it('la fecha de inicio no puede quedar después de la de fin', () => {
    // Arrange
    const inicio = '2026-06-01'
    const fin = '2026-01-01'

    // Act
    const respuesta = validarFechasQr(inicio, fin)

    // Assert
    expect(respuesta.ok).toBe(false)
    expect(respuesta.error).toBe('La fecha de inicio no puede ser posterior a la de fin.')
  })

  it('si faltan las dos fechas, el formulario no inventa un error', () => {
    // Arrange
    const sinFechas = {}

    // Act
    const respuesta = validarFechasQr(sinFechas.startDate, sinFechas.endDate)

    // Assert
    expect(respuesta.ok).toBe(true)
  })

  it('un cero o un decimal no cuentan como id de grupo', () => {
    // Arrange
    const pedido = { grupoIds: [0, 1.5, -3], startDate: '2026-01-01', endDate: '2026-06-01' }

    // Act
    const respuesta = decidirGeneracionQr(pedido)

    // Assert
    expect(respuesta.ok).toBe(false)
    expect(respuesta.error).toContain('grupoIds')
  })

  it('fechas en orden y un grupo real permiten generar', () => {
    // Arrange
    const pedido = { grupoIds: [0, 12], startDate: '2026-01-01', endDate: '2026-06-30' }

    // Act
    const respuesta = decidirGeneracionQr(pedido)

    // Assert
    expect(respuesta.ok).toBe(true)
  })
})
