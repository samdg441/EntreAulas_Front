import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  celdasDelMes,
  estadoDelDia,
  mesInicial,
  parseFecha,
  resumenEvaluacion,
  textoDias,
} from '../../../lib/calendario'

const getVentanasEvaluacion = vi.fn()
vi.mock('../../../api/periodos.api', () => ({
  getVentanasEvaluacion: () => getVentanasEvaluacion(),
}))

import Calendar from '../../../components/Calendar'

const VENTANA = { periodoId: 2, ano: 2026, semestre: 1, fechaInicio: '2026-09-28', fechaFin: '2026-10-09' }

describe('Lógica del calendario', () => {
  it('parseFecha no se corre de día por la zona horaria', () => {
    const d = parseFecha('2026-10-09')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 9])
  })

  it('marca apertura, días intermedios, cierre y días sin evaluación', () => {
    expect(estadoDelDia(new Date(2026, 8, 28), [VENTANA])).toBe('inicio')
    expect(estadoDelDia(new Date(2026, 9, 2), [VENTANA])).toBe('abierta')
    expect(estadoDelDia(new Date(2026, 9, 9), [VENTANA])).toBe('fin')
    expect(estadoDelDia(new Date(2026, 9, 10), [VENTANA])).toBe('normal')
  })

  it('resumen: abierta con días restantes, próxima con días para iniciar, o ninguna', () => {
    expect(resumenEvaluacion(new Date(2026, 9, 2, 15), [VENTANA])).toMatchObject({ tipo: 'abierta', diasRestantes: 7 })
    expect(resumenEvaluacion(new Date(2026, 8, 20), [VENTANA])).toMatchObject({ tipo: 'proxima', diasParaInicio: 8 })
    expect(resumenEvaluacion(new Date(2026, 9, 20), [VENTANA])).toEqual({ tipo: 'ninguna' })
  })

  it('mesInicial salta al mes de la próxima evaluación', () => {
    const mes = mesInicial(new Date(2026, 6, 15), [VENTANA])
    expect([mes.getFullYear(), mes.getMonth()]).toEqual([2026, 8])
    const actual = mesInicial(new Date(2026, 11, 1), [VENTANA])
    expect(actual.getMonth()).toBe(11)
  })

  it('celdasDelMes empieza en lunes y completa semanas', () => {
    const celdas = celdasDelMes(new Date(2026, 9, 1))
    expect(celdas.length % 7).toBe(0)
    expect(celdas.slice(0, 3)).toEqual([null, null, null])
    expect(celdas[3]?.getDate()).toBe(1)
  })

  it('textoDias', () => {
    expect([textoDias(0), textoDias(1), textoDias(5)]).toEqual(['hoy', 'mañana', 'en 5 días'])
  })
})

describe('Componente Calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 2, 10))
    getVentanasEvaluacion.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('con evaluación abierta muestra el resumen y marca hoy', async () => {
    getVentanasEvaluacion.mockResolvedValue([VENTANA])
    render(<Calendar onClose={vi.fn()} />)

    expect(await screen.findByText('La evaluación docente está abierta')).toBeInTheDocument()
    expect(screen.getByText(/Cierra en 7 días/)).toBeInTheDocument()
    const hoy = document.querySelector('[aria-current="date"]')
    expect(hoy?.getAttribute('aria-label')).toMatch(/hoy, evaluación abierta/)
  })

  it('sin ventanas dice que no hay evaluaciones programadas', async () => {
    getVentanasEvaluacion.mockResolvedValue([])
    render(<Calendar onClose={vi.fn()} />)
    expect(await screen.findByText('No hay evaluaciones programadas')).toBeInTheDocument()
  })

  it('si falla la API muestra un error entendible', async () => {
    getVentanasEvaluacion.mockRejectedValue(new Error('red'))
    render(<Calendar onClose={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las fechas')
  })

  it('Escape y el botón Cerrar llaman a onClose; las flechas cambian de mes', async () => {
    getVentanasEvaluacion.mockResolvedValue([])
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Calendar onClose={onClose} />)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/octubre/i)
    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/noviembre/i)
    await user.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/octubre/i)

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Cerrar calendario' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
