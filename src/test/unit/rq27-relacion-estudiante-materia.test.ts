import { describe, expect, it } from 'vitest'
import {
  decidirCargaMaterias,
  filasVistaMaterias,
  materiasDesdeApi,
  materiasTrasErrorApi,
  MATERIAS_VACIAS,
} from '../../features/dashboard-student/estudiante-materias'

/**
 * RQ27 / RF-ACA-27 — Relación estudiante–materia (frontend /dashboard)
 *
 * C1  Sin sesión → login (no carga materias)
 * C2  No es estudiante → no-cargar
 * C3  Error de API → lista vacía
 * C4  Payload nulo o mal formado → lista vacía
 * C5  Camino feliz: pinta código, grupo, profesor y periodo
 * C6  Materia sin curso se descarta de la vista
 */

const payloadOk = {
  total: 2,
  materiasMatriculadas: [
    {
      id: 11,
      grupo: {
        numeroGrupo: 1,
        horario: 'Lun 8-10',
        aula: 'A-101',
        curso: { id: 31, nombre: 'Programación I', codigo: 'SIS-101', creditos: 3 },
        profesor: { id: 'prof-1', nombre: 'Ana Pérez' },
        periodo: { id: 41, nombre: 'Periodo 2026-1', codigo: '2026-1' },
      },
    },
    {
      id: 12,
      grupo: {
        numeroGrupo: 2,
        horario: 'Mar 10-12',
        aula: 'B-202',
        curso: { id: 32, nombre: 'Física II', codigo: 'FIS-201' },
        profesor: { nombre: 'Luis Gómez' },
        periodo: { codigo: '2026-1' },
      },
    },
  ],
}

class RQ27RelacionEstudianteMateria {
  C1_sinSesion() {
    expect(decidirCargaMaterias({ haySesion: false, type: 'student', materiasOk: true })).toBe(
      'login'
    )
  }

  C2_noEsEstudiante() {
    expect(decidirCargaMaterias({ haySesion: true, type: 'teacher', materiasOk: true })).toBe(
      'no-cargar'
    )
    expect(decidirCargaMaterias({ haySesion: true, type: 'coordinator', materiasOk: true })).toBe(
      'no-cargar'
    )
  }

  C3_errorApi() {
    expect(decidirCargaMaterias({ haySesion: true, type: 'student', materiasOk: false })).toBe(
      'vacias'
    )
    expect(materiasTrasErrorApi()).toEqual(MATERIAS_VACIAS)
  }

  C4_payloadInvalido() {
    expect(materiasDesdeApi(null)).toEqual({ materiasMatriculadas: [], total: 0 })
    expect(materiasDesdeApi({ materiasMatriculadas: 'no-lista' as unknown as never })).toEqual({
      materiasMatriculadas: [],
      total: 0,
    })
    expect(materiasDesdeApi({ materiasMatriculadas: [payloadOk.materiasMatriculadas[0]], total: 'x' }).total).toBe(1)
  }

  C5_caminoFeliz() {
    expect(decidirCargaMaterias({ haySesion: true, type: 'student', materiasOk: true })).toBe(
      'pintar'
    )
    const data = materiasDesdeApi(payloadOk)
    expect(data.total).toBe(2)
    const filas = filasVistaMaterias(data.materiasMatriculadas)
    expect(filas).toHaveLength(2)
    expect(filas[0]).toMatchObject({
      codigo: 'SIS-101',
      nombre: 'Programación I',
      grupo: 'Grupo 1',
      profesor: 'Ana Pérez',
      periodo: '2026-1',
    })
    expect(filas[1].codigo).toBe('FIS-201')
  }

  C6_sinCursoSeDescarta() {
    const filas = filasVistaMaterias([
      payloadOk.materiasMatriculadas[0],
      { id: 99, grupo: { numeroGrupo: 9 } },
      null,
    ])
    expect(filas).toHaveLength(1)
    expect(filas[0].id).toBe(11)
  }
}

const pruebas = new RQ27RelacionEstudianteMateria()

describe('RQ27 / RF-ACA-27 — Relación estudiante–materia (frontend)', () => {
  it('C1: sin sesión → login', () => pruebas.C1_sinSesion())
  it('C2: no es estudiante → no carga', () => pruebas.C2_noEsEstudiante())
  it('C3: error de API → lista vacía', () => pruebas.C3_errorApi())
  it('C4: payload inválido → lista vacía', () => pruebas.C4_payloadInvalido())
  it('C5: camino feliz pinta materias', () => pruebas.C5_caminoFeliz())
  it('C6: materia sin curso se descarta', () => pruebas.C6_sinCursoSeDescarta())
})
