import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConSesion } from '../../helpers/render'

const fetchProfessorSubjects = vi.fn()
const fetchDetailedFacultyProfessors = vi.fn()
const fetchAllCareerResults = vi.fn()

vi.mock('../../../api/teachers', () => ({
  fetchProfessorSubjects: () => fetchProfessorSubjects(),
  fetchDetailedFacultyProfessors: () => fetchDetailedFacultyProfessors(),
  fetchAllCareerResults: () => fetchAllCareerResults(),
}))

import DashboardDecano from '../../../features/dashboard-dean/DashboardDecano'

const decano = { id: 'd1', name: 'Decana Prueba', type: 'decano', email: 'd@udemedellin.edu.co', roles: ['decano'] } as never

describe('Dashboard del decano — sin datos inventados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('si fallan los dos endpoints muestra error y no inventa carreras ni profesores', async () => {
    fetchProfessorSubjects.mockRejectedValue(new Error('500'))
    fetchDetailedFacultyProfessors.mockRejectedValue(new Error('500'))
    fetchAllCareerResults.mockRejectedValue(new Error('500'))

    renderConSesion(<DashboardDecano user={decano} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las carreras y profesores')
    expect(screen.queryByText(/Emilcy|Ingeniería Civil/)).not.toBeInTheDocument()
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('Reintentar vuelve a pedir los datos', async () => {
    fetchProfessorSubjects.mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce({ carreras: [{ id: 1 }], profesores_por_carrera: {} })
    fetchDetailedFacultyProfessors.mockRejectedValue(new Error('500'))
    fetchAllCareerResults.mockResolvedValue({ estadisticas_generales: { promedio_general: 4.26 } })

    renderConSesion(<DashboardDecano user={decano} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('4.3/5.0')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetchProfessorSubjects).toHaveBeenCalledTimes(2)
  })

  it('usa el endpoint alternativo si el principal falla', async () => {
    fetchProfessorSubjects.mockRejectedValue(new Error('500'))
    fetchDetailedFacultyProfessors.mockResolvedValue({
      carreras: [{ id: 1 }, { id: 2 }],
      profesores_por_carrera: { '1': [{ id: 'p1' }] },
    })
    fetchAllCareerResults.mockResolvedValue({ estadisticas_generales: { promedio_general: 0 } })

    renderConSesion(<DashboardDecano user={decano} />)

    expect(await screen.findByText('Sin datos')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
