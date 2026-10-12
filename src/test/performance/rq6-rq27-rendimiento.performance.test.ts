import { afterAll, describe, expect, it } from 'vitest'
import { filasVistaMaterias } from '../../features/dashboard-student/estudiante-materias'
import { decidirGeneracionQr, validarCorreoQr } from '../../features/evaluations/qr-validacion'
import { guardarReporte, medir, type Medicion } from '../helpers/medicion'

const mediciones: Medicion[] = []

describe('RQ15, RQ16 y RQ27 — Rendimiento en el front', () => {
  afterAll(() => {
    guardarReporte('front-rq6-rq27', mediciones)
  })

  it('RQ15: decidir 50.000 grupos tarda menos de 40 ms', () => {
    const grupoIds = Array.from({ length: 50_000 }, (_, i) => (i % 10 === 0 ? 0 : i))
    const m = medir({ escenario: 'decidirGeneracionQr 50k', requisito: 'RQ15', presupuestoMs: 40 }, () =>
      decidirGeneracionQr({ grupoIds, startDate: '2026-01-01', endDate: '2026-06-30' })
    )
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ16: validar 20.000 correos tarda menos de 40 ms', () => {
    const correos = Array.from({ length: 20_000 }, (_, i) => (i % 5 === 0 ? 'no-es-correo' : `ana${i}@udemedellin.edu.co`))
    const m = medir({ escenario: 'validarCorreoQr 20k', requisito: 'RQ16', presupuestoMs: 40 }, () => {
      for (const to of correos) validarCorreoQr({ to, subject: 'Evaluación', grupoIds: [3] })
    })
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
  })

  it('RQ27: pintar 20.000 materias tarda menos de 50 ms', () => {
    const materias = Array.from({ length: 20_000 }, (_, i) => ({
      id: i + 1,
      grupo: {
        numeroGrupo: 1,
        horario: 'Lun 8-10',
        aula: 'A-101',
        curso: { id: i + 1, codigo: `SIS-${i}`, nombre: 'Programación I' },
        profesor: { nombre: 'Ana Pérez' },
        periodo: { codigo: '2026-1' },
      },
    }))
    const m = medir({ escenario: 'filasVistaMaterias 20k', requisito: 'RQ27', presupuestoMs: 50 }, () => filasVistaMaterias(materias))
    mediciones.push(m)
    expect(m.cumple, JSON.stringify(m)).toBe(true)
    expect(filasVistaMaterias(materias)).toHaveLength(20_000)
  })
})
