/** Calendario embebido: muestra las fechas de las evaluaciones programadas (Stub de la API de periodos). */
import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgendaEvaluaciones from '../../components/AgendaEvaluaciones'
import { renderConPreferencias, simularMatchMedia } from '../helpers/render-rediseno'

const HOY = new Date(2026, 10, 10, 12)
const ventanas = [
  { periodoId: 1, ano: 2026, semestre: 2, fechaInicio: '2026-11-03', fechaFin: '2026-11-21' },
  { periodoId: 2, ano: 2027, semestre: 1, fechaInicio: '2027-03-10', fechaFin: '2027-03-25' },
]

describe('AgendaEvaluaciones', () => {
  simularMatchMedia(false)

  it('marca la apertura, el cierre y los días abiertos de la ventana en el mes actual', async () => {
    renderConPreferencias(<AgendaEvaluaciones hoy={HOY} cargar={async () => ventanas} />)

    expect(await screen.findByLabelText(/3 de noviembre.*apertura de la evaluación/)).toBeInTheDocument()
    expect(screen.getByLabelText(/21 de noviembre.*cierre de la evaluación/)).toBeInTheDocument()
    expect(screen.getByLabelText(/12 de noviembre.*evaluación abierta/)).toBeInTheDocument()
    expect(screen.getByLabelText(/25 de noviembre.*sin evaluación/)).toBeInTheDocument()
  })

  it('señala el día de hoy con aria-current', async () => {
    renderConPreferencias(<AgendaEvaluaciones hoy={HOY} cargar={async () => ventanas} />)

    const celda = await screen.findByLabelText(/10 de noviembre.*hoy/)

    expect(celda).toHaveAttribute('aria-current', 'date')
  })

  it('lista las próximas fechas con los días que faltan', async () => {
    renderConPreferencias(<AgendaEvaluaciones hoy={HOY} cargar={async () => ventanas} />)

    expect(await screen.findByText(/Cierra en 11 días/)).toBeInTheDocument()
    expect(screen.getByText(/Abre en 120 días/)).toBeInTheDocument()
    expect(screen.getByText('Periodo 2026-2')).toBeInTheDocument()
  })

  it('no lista periodos que ya cerraron', async () => {
    const cerrada = [{ periodoId: 9, ano: 2025, semestre: 1, fechaInicio: '2025-03-01', fechaFin: '2025-03-15' }]
    renderConPreferencias(<AgendaEvaluaciones hoy={HOY} cargar={async () => cerrada} />)

    expect(await screen.findByText('No hay evaluaciones programadas.')).toBeInTheDocument()
    expect(screen.queryByText('Periodo 2025-1')).not.toBeInTheDocument()
  })

  it('si la API falla muestra un aviso no intrusivo (status, no alert)', async () => {
    renderConPreferencias(<AgendaEvaluaciones hoy={HOY} cargar={async () => { throw new Error('500') }} />)

    const aviso = await screen.findByRole('status')

    expect(aviso).toHaveTextContent('No pudimos cargar las fechas de evaluación.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('el botón de mes siguiente cambia a diciembre y "Hoy" vuelve a noviembre', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<AgendaEvaluaciones hoy={HOY} cargar={async () => ventanas} />)
    await screen.findByText('Noviembre de 2026')

    await usuario.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByText('Diciembre de 2026')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(screen.getByText('Noviembre de 2026')).toBeInTheDocument()
  })

  it('la cuadrícula es una tabla accesible con 7 encabezados de columna', async () => {
    renderConPreferencias(<AgendaEvaluaciones hoy={HOY} cargar={async () => ventanas} />)

    const cuadricula = await screen.findByRole('grid')

    expect(within(cuadricula).getAllByRole('columnheader')).toHaveLength(7)
  })
})
