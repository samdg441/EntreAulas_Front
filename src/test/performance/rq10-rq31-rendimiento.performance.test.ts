import { afterAll, describe, expect, it } from 'vitest'
import { statsDesdeApi, tarjetasEstudiante } from '../../features/dashboard-student/estudiante-stats'
import { armarPayloadEvaluacion, preguntasSinCalificar } from '../../features/evaluations/evaluacion-docente'
import {
  aplicarCambioEnLista,
  armarCorreoInstitucional,
  type UsuarioLista,
} from '../../features/dashboard-admin/gestionar-usuarios'
import { decidirVistaResumen, endpointPorRol, type ResultadoResumen } from '../../features/evaluations/resumen-ia'
import {
  decidirVistaAlerta,
  muestraListaDocentesAcoso,
  type ResultadoAlerta,
} from '../../features/evaluations/alerta-acoso'
import { guardarReporte, medir, type Medicion } from '../helpers/medicion'

/**
 * Presupuestos de tiempo en el navegador para los volúmenes de estudiante, evaluación,
 * usuarios y resúmenes. Son amplios a propósito: detectan un cambio de complejidad
 * (p. ej. O(n) → O(n²)), no diferencias de milisegundos entre equipos.
 */
const mediciones: Medicion[] = []

function usuarios(n: number): UsuarioLista[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `u-${i}`,
    email: `ana${i}@soyudemedellin.edu.co`,
    nombre: i % 7 === 0 ? 'Ana' : 'Luis',
    apellido: `Pérez ${i}`,
    tipo_usuario: i % 2 === 0 ? 'estudiante' : 'profesor',
    activo: true,
  }))
}

function preguntas(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    type: i % 4 === 0 ? 'text' : 'rating',
  }))
}

function payloadDe(questions: ReturnType<typeof preguntas>) {
  return armarPayloadEvaluacion({
    teacher: { id: 7 },
    course: { id: 31 },
    group: { id: 4 },
    questions,
    ratings: questions.map((q) => (q.type === 'rating' ? 4 : null)),
    textAnswers: questions.map((q) => (q.type === 'text' ? 'claridad en la explicación' : undefined)),
  })
}

describe('RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31 — Rendimiento en el front', () => {
  afterAll(() => {
    guardarReporte('front-rq10-rq31', mediciones)
  })

  it('RQ10: pintar 50.000 estadísticas tarda menos de 40 ms', () => {
    const filas = Array.from({ length: 50_000 }, (_, i) => ({
      evaluacionesCompletadas: i % 6,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 6,
      promedioGeneral: 1 + (i % 5),
      progresoGeneral: 100,
    }))
    const m = medir({ escenario: 'statsDesdeApi 50k', requisito: 'RQ10', presupuestoMs: 40 }, () => {
      for (const fila of filas) tarjetasEstudiante(statsDesdeApi(fila))
    })
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ11: armar el payload de 5.000 preguntas tarda menos de 40 ms', () => {
    const questions = preguntas(5_000)
    const m = medir({ escenario: 'armarPayloadEvaluacion 5k', requisito: 'RQ11', presupuestoMs: 40, repeticiones: 20 }, () =>
      payloadDe(questions)
    )
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
    expect(payloadDe(questions).answers).toHaveLength(5_000)
    expect(preguntasSinCalificar(questions, questions.map(() => 0)).length).toBeGreaterThan(0)
  })

  it('RQ11: el payload escala lineal (10x preguntas ≈ 10x tiempo, nunca 100x)', () => {
    const pocas = preguntas(500)
    const muchas = preguntas(5_000)
    const a = medir({ escenario: 'armarPayloadEvaluacion 500', requisito: 'RQ11', presupuestoMs: 15, repeticiones: 40 }, () =>
      payloadDe(pocas)
    )
    const b = medir({ escenario: 'armarPayloadEvaluacion 5k (escala)', requisito: 'RQ11', presupuestoMs: 40, repeticiones: 40 }, () =>
      payloadDe(muchas)
    )
    mediciones.push(a, b)
    expect(b.medianaMs / Math.max(a.medianaMs, 0.01)).toBeLessThan(30)
  })

  it('RQ13: actualizar un usuario entre 10.000 tarda menos de 20 ms', () => {
    const lista = usuarios(10_000)
    const m = medir({ escenario: 'aplicarCambioEnLista 10k', requisito: 'RQ13', presupuestoMs: 20, repeticiones: 30 }, () =>
      aplicarCambioEnLista(lista, 'u-5000', { nombre: 'Ana' }, true)
    )
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
    expect(aplicarCambioEnLista(lista, 'u-5000', { nombre: 'Ana' }, true)).toHaveLength(10_000)
  })

  it('RQ13: la actualización escala lineal (10x usuarios ≈ 10x tiempo, nunca 100x)', () => {
    const pocos = usuarios(1_000)
    const muchos = usuarios(10_000)
    const a = medir({ escenario: 'aplicarCambioEnLista 1k', requisito: 'RQ13', presupuestoMs: 8, repeticiones: 40 }, () =>
      aplicarCambioEnLista(pocos, 'u-10', { activo: false }, true)
    )
    const b = medir({ escenario: 'aplicarCambioEnLista 10k (escala)', requisito: 'RQ13', presupuestoMs: 20, repeticiones: 40 }, () =>
      aplicarCambioEnLista(muchos, 'u-10', { activo: false }, true)
    )
    mediciones.push(a, b)
    expect(b.medianaMs / Math.max(a.medianaMs, 0.01)).toBeLessThan(30)
  })

  it('RQ13: armar 20.000 correos institucionales tarda menos de 40 ms', () => {
    const locales = Array.from({ length: 20_000 }, (_, i) => (i % 9 === 0 ? 'no vale' : `ana${i}`))
    const m = medir({ escenario: 'armarCorreoInstitucional 20k', requisito: 'RQ13', presupuestoMs: 40 }, () => {
      locales.forEach((local, i) => armarCorreoInstitucional(local, i % 2 === 0 ? 'estudiante' : 'profesor'))
    })
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ29: decidir 20.000 resúmenes de comentarios tarda menos de 30 ms', () => {
    const resultados: ResultadoResumen[] = Array.from({ length: 20_000 }, (_, i) =>
      i % 5 === 0
        ? { textsCount: 0, topics: [], summary: 'Sin respuestas abiertas.' }
        : { textsCount: 2, topics: ['claridad'], analysisSource: 'open_text', summary: 'Resumen local.' }
    )
    const m = medir({ escenario: 'decidirVistaResumen 20k', requisito: 'RQ29', presupuestoMs: 30 }, () => {
      for (const result of resultados) decidirVistaResumen({ haySesion: true, status: 200, result })
    })
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ30: resolver 20.000 alcances de resumen tarda menos de 30 ms', () => {
    const roles = ['teacher', 'coordinator', 'decano']
    const resultados: ResultadoResumen[] = Array.from({ length: 20_000 }, (_, i) =>
      i % 6 === 0
        ? { textsCount: 0, summary: 'No se encontraron respuestas abiertas válidas para la facultad en el período seleccionado.' }
        : { textsCount: 1, analysisSource: 'open_text', topics: ['claridad'] }
    )
    const m = medir({ escenario: 'endpointPorRol y vista 20k', requisito: 'RQ30', presupuestoMs: 30 }, () => {
      resultados.forEach((result, i) => {
        endpointPorRol(roles[i % roles.length])
        decidirVistaResumen({ haySesion: true, status: 200, result })
      })
    })
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ31: decidir 10.000 alertas de acoso tarda menos de 40 ms', () => {
    const alertas: ResultadoAlerta[] = Array.from({ length: 10_000 }, (_, i) => ({
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: i % 5 === 0,
      mensajeAcoso: i % 5 === 0 ? 'Hubo acoso en una respuesta.' : undefined,
      acosoProfesores:
        i % 5 === 0 ? [{ profesorId: String(i), nombre: 'Ana Perez', menciones: 1, ejemplos: ['Hubo acoso'] }] : [],
    }))
    const m = medir({ escenario: 'decidirVistaAlerta 10k', requisito: 'RQ31', presupuestoMs: 40 }, () => {
      for (const alerta of alertas) {
        decidirVistaAlerta({ haySesion: true, status: 200, result: alerta })
        muestraListaDocentesAcoso(alerta)
      }
    })
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })
})
