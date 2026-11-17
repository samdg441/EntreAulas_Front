import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SurveyQuestion } from '../../../api/surveys.api'
import {
  MENSAJES_PREGUNTA,
  corregirPregunta,
  datosDePregunta,
  validarPregunta,
  type DatosPregunta,
  type PuertoPreguntas,
} from '../../../features/dashboard-admin/preguntas-encuesta'

/**
 * RF-ENC-33 — Corrección de una pregunta de la encuesta (TDD).
 *
 * Escrito ANTES de `preguntas-encuesta.ts`. El back ya acepta PUT /api/evaluations/questions/:id,
 * pero el front no permitía corregir el texto: solo desactivar.
 *
 * Cada caso sigue Dado / Cuando / Entonces y Arrange / Act / Assert.
 * Las aserciones usan el estilo fluido de Vitest (`expect(x).to.be.an('object').that...`).
 *
 * Dobles de prueba (taxonomía de Meszaros):
 *  - Dummy: un puerto que nunca debe usarse; si se usa, la prueba falla.
 *  - Stub:  `updateQuestion` devuelve una respuesta fija del servidor o un error fijo.
 *  - Spy:   `vi.spyOn` sobre el fake para contar llamadas sin cambiar su comportamiento.
 *  - Mock:  `vi.fn()` con expectativas de interacción (`toHaveBeenCalledOnce`, `toHaveBeenCalledWith`).
 *  - Fake:  `BancoEnMemoria`, una implementación real pero en memoria del banco de preguntas.
 */

// ---------- datos de prueba ----------

function pregunta(parcial: Partial<SurveyQuestion> = {}): SurveyQuestion {
  return {
    id: 8,
    categoria_id: 1,
    texto_pregunta: 'El docente explica con claridad',
    descripcion: '',
    tipo_pregunta: 'likert',
    obligatoria: true,
    orden: 1,
    activa: true,
    id_carrera: null,
    ...parcial,
  }
}

function cambios(parcial: Partial<DatosPregunta> = {}): DatosPregunta {
  return { ...datosDePregunta(pregunta()), ...parcial }
}

// ---------- dobles de prueba ----------

/** Dummy: se pasa porque la firma lo exige, pero ninguna de sus operaciones debe ejecutarse. */
const puertoDummy: PuertoPreguntas = {
  updateQuestion: () => {
    throw new Error('El dummy no debía usarse')
  },
}

/** Fake: banco de preguntas en memoria con comportamiento real (guarda y devuelve). */
class BancoEnMemoria implements PuertoPreguntas {
  constructor(public preguntas: SurveyQuestion[]) {}

  async updateQuestion(id: number, datos: DatosPregunta) {
    const actual = this.preguntas.find((p) => p.id === id)
    if (!actual) throw { response: { status: 404, data: { message: 'Pregunta no encontrada' } } }
    const actualizada = { ...actual, ...datos }
    this.preguntas = this.preguntas.map((p) => (p.id === id ? actualizada : p))
    return actualizada
  }
}

// ---------- pruebas ----------

describe('RF-ENC-33 — Corregir una pregunta de la encuesta', () => {
  let banco: BancoEnMemoria

  // FIRST · Independent: cada caso arranca con un banco nuevo; ninguno depende de otro.
  beforeEach(() => {
    banco = new BancoEnMemoria([
      pregunta(),
      pregunta({ id: 9, texto_pregunta: 'El docente llega a tiempo', orden: 2 }),
      pregunta({ id: 20, categoria_id: 2, texto_pregunta: 'La sala tiene buena luz', orden: 1 }),
    ])
  })

  describe('validarPregunta — reglas antes de llamar al servidor', () => {
    it('acepta una corrección válida', () => {
      // Dado un texto nuevo y un orden válido
      // Arrange
      const datos = cambios({ texto_pregunta: 'El docente explica con ejemplos' })

      // Cuando se valida
      // Act
      const error = validarPregunta(datos, banco.preguntas, 8)

      // Entonces no hay error
      // Assert
      expect(error).to.be.null
    })

    it('rechaza un texto en blanco', () => {
      // Dado un texto con solo espacios
      // Arrange
      const datos = cambios({ texto_pregunta: '    ' })

      // Cuando se valida
      // Act
      const error = validarPregunta(datos, banco.preguntas, 8)

      // Entonces pide completar el texto
      // Assert
      expect(error).to.be.a('string').and.equal(MENSAJES_PREGUNTA.textoVacio)
    })

    it.each([0, -3, 1.5, Number.NaN])('rechaza el orden %s', (orden) => {
      // Dado un orden que no es entero positivo
      // Arrange
      const datos = cambios({ orden })

      // Cuando se valida
      // Act
      const error = validarPregunta(datos, banco.preguntas, 8)

      // Entonces explica la regla del orden
      // Assert
      expect(error).to.equal(MENSAJES_PREGUNTA.ordenInvalido)
    })

    it('rechaza un texto repetido en la misma encuesta, sin importar mayúsculas ni espacios', () => {
      // Dado que la pregunta 9 ya dice «El docente llega a tiempo»
      // Arrange
      const datos = cambios({ texto_pregunta: '  el DOCENTE   llega a tiempo ' })

      // Cuando se intenta poner ese texto en la pregunta 8
      // Act
      const error = validarPregunta(datos, banco.preguntas, 8)

      // Entonces avisa que está repetida
      // Assert
      expect(error).to.equal(MENSAJES_PREGUNTA.duplicada)
    })

    it('permite el mismo texto si está en otra encuesta o si es la misma pregunta', () => {
      // Dado un texto que solo existe en la encuesta 2, y el texto propio de la pregunta 8
      // Arrange
      const deOtraEncuesta = cambios({ texto_pregunta: 'La sala tiene buena luz' })
      const elMismo = cambios()

      // Cuando se validan para la pregunta 8 de la encuesta 1
      // Act
      const errores = [
        validarPregunta(deOtraEncuesta, banco.preguntas, 8),
        validarPregunta(elMismo, banco.preguntas, 8),
      ]

      // Entonces ninguno es error
      // Assert
      expect(errores).to.be.an('array').that.has.lengthOf(2).and.deep.equals([null, null])
    })
  })

  describe('corregirPregunta — interacción con el servidor', () => {
    it('envía una sola vez el PUT con el id y el texto recortado (mock)', async () => {
      // Dado un mock del puerto que responde bien
      // Arrange
      const updateQuestion = vi.fn().mockResolvedValue(pregunta({ texto_pregunta: 'El docente explica con ejemplos' }))
      const puertoMock: PuertoPreguntas = { updateQuestion }

      // Cuando el administrador corrige el texto
      // Act
      await corregirPregunta(puertoMock, 8, cambios({ texto_pregunta: '  El docente explica con ejemplos  ' }), banco.preguntas)

      // Entonces el mock recibió exactamente la llamada esperada
      // Assert
      expect(updateQuestion).toHaveBeenCalledOnce()
      expect(updateQuestion).toHaveBeenCalledWith(
        8,
        expect.objectContaining({ texto_pregunta: 'El docente explica con ejemplos', categoria_id: 1 })
      )
    })

    it('devuelve la pregunta que confirma el servidor (stub)', async () => {
      // Dado un stub que responde con la versión guardada
      // Arrange
      const guardada = pregunta({ texto_pregunta: 'El docente explica con ejemplos', orden: 3 })
      const stub: PuertoPreguntas = { updateQuestion: async () => guardada }

      // Cuando se corrige
      // Act
      const resultado = await corregirPregunta(stub, 8, cambios({ texto_pregunta: 'El docente explica con ejemplos', orden: 3 }), banco.preguntas)

      // Entonces el resultado trae la pregunta del servidor
      // Assert
      expect(resultado).to.be.an('object').that.deep.includes({ ok: true, pregunta: guardada })
    })

    it('no toca el servidor si los datos son inválidos (dummy)', async () => {
      // Dado un texto en blanco y un puerto que no debe usarse
      // Arrange
      const datos = cambios({ texto_pregunta: '' })

      // Cuando se intenta corregir
      // Act
      const resultado = await corregirPregunta(puertoDummy, 8, datos, banco.preguntas)

      // Entonces se rechaza localmente, sin excepción del dummy
      // Assert
      expect(resultado).to.deep.equal({ ok: false, error: MENSAJES_PREGUNTA.textoVacio })
    })

    it('no llama al servidor si no hubo cambios (spy sobre el fake)', async () => {
      // Dado un espía sobre el banco en memoria
      // Arrange
      const espia = vi.spyOn(banco, 'updateQuestion')

      // Cuando se guarda sin cambiar nada
      // Act
      const resultado = await corregirPregunta(banco, 8, cambios(), banco.preguntas)

      // Entonces no hubo PUT y la pregunta queda igual
      // Assert
      expect(espia).not.toHaveBeenCalled()
      expect(resultado).to.have.property('ok', true)
    })

    it('el banco queda con el texto corregido (fake)', async () => {
      // Dado el banco en memoria con la pregunta 8
      // Arrange
      const datos = cambios({ texto_pregunta: 'El docente explica con ejemplos' })

      // Cuando se corrige
      // Act
      await corregirPregunta(banco, 8, datos, banco.preguntas)

      // Entonces el estado del banco cambió solo en esa pregunta
      // Assert
      expect(banco.preguntas.find((p) => p.id === 8))
        .to.have.property('texto_pregunta')
        .that.equals('El docente explica con ejemplos')
      expect(banco.preguntas.map((p) => p.texto_pregunta)).to.include('El docente llega a tiempo')
    })

    it('muestra el mensaje del servidor cuando el PUT falla (stub con error)', async () => {
      // Dado un stub que responde 404 con mensaje
      // Arrange
      const stubConError: PuertoPreguntas = {
        updateQuestion: () => Promise.reject({ response: { status: 404, data: { message: 'Pregunta no encontrada' } } }),
      }

      // Cuando se corrige
      // Act
      const resultado = await corregirPregunta(stubConError, 8, cambios({ texto_pregunta: 'Otra' }), banco.preguntas)

      // Entonces el error del servidor llega a la pantalla
      // Assert
      expect(resultado).to.deep.equal({ ok: false, error: 'Pregunta no encontrada' })
    })

    it('usa un mensaje propio si el servidor no explica el error (stub de red)', async () => {
      // Dado un fallo de red sin cuerpo
      // Arrange
      const stubSinRed: PuertoPreguntas = { updateQuestion: () => Promise.reject(new Error('Network Error')) }

      // Cuando se corrige
      // Act
      const resultado = await corregirPregunta(stubSinRed, 8, cambios({ texto_pregunta: 'Otra' }), banco.preguntas)

      // Entonces se muestra un mensaje entendible
      // Assert
      expect(resultado).to.deep.equal({ ok: false, error: MENSAJES_PREGUNTA.falloServidor })
    })
  })

  describe('datosDePregunta — precargar el diálogo de edición', () => {
    it('copia solo los campos editables', () => {
      // Dado una pregunta del banco con campos de solo lectura
      // Arrange
      const original = pregunta({ categoria: { id: 1, nombre: 'Docencia' }, id_carrera: 4 })

      // Cuando se arma el formulario
      // Act
      const datos = datosDePregunta(original)

      // Entonces no viajan id, activa ni la categoría anidada
      // Assert
      expect(datos)
        .to.deep.equal({
          categoria_id: 1,
          texto_pregunta: 'El docente explica con claridad',
          descripcion: '',
          tipo_pregunta: 'likert',
          obligatoria: true,
          orden: 1,
          id_carrera: 4,
        })
        .and.not.have.any.keys('id', 'activa', 'categoria')
    })
  })
})
