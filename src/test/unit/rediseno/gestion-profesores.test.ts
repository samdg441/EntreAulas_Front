import { describe, expect, it } from 'vitest'
import {
  UMBRAL_RIESGO,
  contarPorEstado,
  estadoDelDocente,
  filtrarYOrdenar,
  iniciales,
  porcentajeEscala,
  type DocenteResumen,
} from '../../../features/dashboard-coordinator/gestion-profesores'

const d = (id: number, nombre: string, promedio: number, totalEvaluaciones: number, email = `${id}@udemedellin.edu.co`): DocenteResumen => ({
  id, nombre, email, promedio, totalEvaluaciones,
})

const docentes = [
  d(1, 'Ana María Pérez', 4.6, 40),
  d(2, 'Carlos Restrepo', 3.4, 30),
  d(3, 'Jorge Ríos', 0, 0),
  d(4, 'Marta Soto', 4.0, 12),
  d(5, 'Álvaro Gómez', 3.99, 8),
]

describe('estadoDelDocente (valores límite del umbral 4.0)', () => {
  it.each([
    [3.99, 10, 'riesgo'],
    [4.0, 10, 'ok'],
    [4.01, 10, 'ok'],
    [1.0, 1, 'riesgo'],
    [0, 0, 'sinDatos'],
    [3.0, 0, 'sinDatos'],
  ] as const)('promedio %s con %s evaluaciones → %s', (promedio, total, esperado) => {
    expect(estadoDelDocente({ promedio, totalEvaluaciones: total })).toBe(esperado)
  })

  it('el umbral es 4.0', () => expect(UMBRAL_RIESGO).toBe(4))
})

describe('contarPorEstado', () => {
  it('cuenta cada estado y el total', () => {
    expect(contarPorEstado(docentes)).toEqual({ todos: 5, riesgo: 2, ok: 2, sinDatos: 1 })
  })

  it('con lista vacía todo es cero', () => {
    expect(contarPorEstado([])).toEqual({ todos: 0, riesgo: 0, ok: 0, sinDatos: 0 })
  })
})

describe('filtrarYOrdenar', () => {
  const base = { busqueda: '', filtro: 'todos', orden: 'nombre' } as const

  it('busca sin distinguir mayúsculas ni tildes ("alvaro" encuentra "Álvaro")', () => {
    const r = filtrarYOrdenar(docentes, { ...base, busqueda: 'alvaro' })

    expect(r.map((x) => x.id)).toEqual([5])
  })

  it('busca también por correo', () => {
    expect(filtrarYOrdenar(docentes, { ...base, busqueda: '2@udemedellin' }).map((x) => x.id)).toEqual([2])
  })

  it('el filtro "riesgo" deja solo los docentes con promedio menor a 4.0', () => {
    expect(filtrarYOrdenar(docentes, { ...base, filtro: 'riesgo' }).map((x) => x.id).sort()).toEqual([2, 5])
  })

  it('ordena por promedio ascendente y deja al final a quien no tiene evaluaciones', () => {
    const r = filtrarYOrdenar(docentes, { ...base, orden: 'promedioAsc' })

    expect(r.map((x) => x.id)).toEqual([2, 5, 4, 1, 3])
  })

  it('ordena por promedio descendente y también deja al final a quien no tiene evaluaciones', () => {
    expect(filtrarYOrdenar(docentes, { ...base, orden: 'promedioDesc' }).map((x) => x.id)).toEqual([1, 4, 5, 2, 3])
  })

  it('ordena por nombre en español (Álvaro antes que Carlos)', () => {
    expect(filtrarYOrdenar(docentes, base)[0].nombre).toBe('Álvaro Gómez')
  })

  it('no modifica la lista original', () => {
    const copia = [...docentes]
    filtrarYOrdenar(docentes, { ...base, orden: 'evaluaciones' })

    expect(docentes).toEqual(copia)
  })
})

describe('iniciales', () => {
  it.each([
    ['Ana María Pérez', 'AP'],
    ['carlos', 'C'],
    ['  luisa   fernanda ', 'LF'],
    ['', '?'],
  ])('"%s" → %s', (nombre, esperado) => expect(iniciales(nombre)).toBe(esperado))
})

describe('porcentajeEscala (escala 1.0–5.0)', () => {
  it.each([
    [1, 0],
    [3, 50],
    [4, 75],
    [5, 100],
    [6, 100],
    [0.5, 0],
    [Number.NaN, 0],
  ])('%s → %s %%', (promedio, esperado) => expect(porcentajeEscala(promedio)).toBe(esperado))
})
