import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../helpers/render'
import NotificationDropdown from '../../components/NotificationDropdown'
import { getVentanasEvaluacion } from '../../api/periodos.api'

vi.mock('../../api/periodos.api', () => ({
  getVentanasEvaluacion: vi.fn(),
}))

const estudiante = {
  id: 'est-1',
  email: 'ana@uni.edu',
  nombre: 'Ana',
  apellido: 'Ruiz',
  tipo_usuario: 'estudiante',
}

const ventana = {
  periodoId: 2,
  ano: 2026,
  semestre: 1,
  fechaInicio: '2026-09-28',
  fechaFin: '2026-10-09',
}

describe('RF-NOT-35 — Lista de notificaciones', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 3))
    vi.mocked(getVentanasEvaluacion).mockResolvedValue([ventana])
  })

  it('RF-NOT-35: el estudiante abre la campana y ve el aviso con su acción', async () => {
    // Dado que la evaluación está abierta
    // Arrange
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderConSesion(<NotificationDropdown />, { user: estudiante })

    // Cuando abre la campana
    // Act
    await user.click(await screen.findByRole('button', { name: /notificaciones/i }))

    // Entonces ve el aviso y la acción de evaluar
    // Assert
    expect(await screen.findByRole('heading', { name: 'Notificaciones' })).toBeInTheDocument()
    expect(screen.getByText('Evaluación docente abierta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /evaluar ahora/i })).toBeInTheDocument()
  })

  it('RF-NOT-35: marcar todas como leídas guarda los avisos y quita el pendiente', async () => {
    // Dado que hay un aviso sin leer
    // Arrange
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderConSesion(<NotificationDropdown />, { user: estudiante })
    await user.click(await screen.findByRole('button', { name: /notificaciones \(1 sin leer\)/i }))
    expect(await screen.findByText(/1 notificación no leída/i)).toBeInTheDocument()

    // Cuando marca todas como leídas
    // Act
    await user.click(screen.getByRole('button', { name: /marcar todas como leídas/i }))

    // Entonces el aviso queda registrado como leído
    // Assert
    const guardadas = JSON.parse(localStorage.getItem('notificaciones-leidas') || '[]') as string[]
    expect(guardadas.length).toBeGreaterThan(0)
    expect(screen.queryByText(/no leída/i)).not.toBeInTheDocument()
  })

  it('RF-NOT-35: sin ventanas la lista dice que no hay notificaciones', async () => {
    // Dado que el calendario no tiene ventanas
    // Arrange
    vi.mocked(getVentanasEvaluacion).mockResolvedValue([])
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderConSesion(<NotificationDropdown />, { user: estudiante })

    // Cuando abre la campana
    // Act
    await user.click(await screen.findByRole('button', { name: 'Notificaciones' }))

    // Entonces la lista está vacía
    // Assert
    expect(await screen.findByText('No hay notificaciones')).toBeInTheDocument()
  })
})
