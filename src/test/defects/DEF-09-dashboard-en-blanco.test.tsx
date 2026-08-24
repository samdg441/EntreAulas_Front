/**
 * DEF-09 — Una respuesta incompleta deja el dashboard del coordinador en blanco (RQ24)
 *
 * Severidad: Alta | Estado: ABIERTO
 *
 * El componente accede a `t.promedio.toFixed(2)` y a `response.stats` sin
 * comprobar que existan. Si falta cualquiera de los dos, el render lanza y
 * React desmonta el árbol completo: el usuario ve una pantalla en blanco,
 * sin mensaje de error.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardCoordinador from '../../features/dashboard-coordinator/DashboardCoordinador'
import type { User } from '../../types'

vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/Calendar', () => ({ default: () => null }))
vi.mock('framer-motion', async () => import('../mocks/framer-motion'))

const fetchCoordinatorDashboardSummary = vi.fn()
vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorDashboardSummary: (...a: unknown[]) => fetchCoordinatorDashboardSummary(...a),
}))

const coordinador: User = {
  id: 'c1',
  name: 'David',
  type: 'coordinator',
  email: 'd@t.com',
  roles: ['coordinador'],
}

function renderDash() {
  return render(
    <MemoryRouter>
      <DashboardCoordinador user={coordinador} />
    </MemoryRouter>
  )
}

/** La pantalla debe seguir mostrándose aunque el backend mande datos incompletos. */
describe('DEF-09 — El dashboard debe resistir una respuesta incompleta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('un docente sin campo `promedio` no debe dejar la pantalla en blanco', async () => {
    fetchCoordinatorDashboardSummary.mockResolvedValue({
      stats: {
        totalProfesores: 1,
        totalCursos: 1,
        promedioEvaluaciones: 4,
        profesoresEnRiesgo: 0,
        totalEvaluaciones: 2,
      },
      teachers: [{ profesorId: 1, nombre: 'Ana', email: 'a@t.com', totalEvaluaciones: 2 }],
      pagination: { page: 1, pageSize: 8, total: 1, totalPages: 1 },
    })

    renderDash()
    await waitFor(() => expect(fetchCoordinatorDashboardSummary).toHaveBeenCalled())

    expect(document.body.textContent).toContain('Ana')
  })

  it('una respuesta sin `stats` no debe dejar la pantalla en blanco', async () => {
    fetchCoordinatorDashboardSummary.mockResolvedValue({
      teachers: [],
      pagination: { page: 1, pageSize: 8, total: 0, totalPages: 0 },
    })

    renderDash()
    await waitFor(() => expect(fetchCoordinatorDashboardSummary).toHaveBeenCalled())

    expect((document.body.textContent || '').length).toBeGreaterThan(50)
  })
})
