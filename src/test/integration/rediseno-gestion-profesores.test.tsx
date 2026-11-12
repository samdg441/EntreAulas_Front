/** Gestión de profesores rediseñada: lista con filtros y orden + detalle por docente. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConPreferencias, simularMatchMedia } from '../helpers/render-rediseno'

const fetchResumen = vi.fn()
const fetchStats = vi.fn()
vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorDashboardSummary: (...a: unknown[]) => fetchResumen(...a),
  fetchCoordinatorProfessorStats: (...a: unknown[]) => fetchStats(...a),
}))

import ManageProfessors from '../../features/dashboard-coordinator/ManageProfessors'

const docentes = [
  { profesorId: 1, nombre: 'Ana Pérez', email: 'ana@udemedellin.edu.co', totalEvaluaciones: 42, promedio: 4.6 },
  { profesorId: 2, nombre: 'Carlos Restrepo', email: 'carlos@udemedellin.edu.co', totalEvaluaciones: 31, promedio: 3.4 },
  { profesorId: 4, nombre: 'Jorge Ríos', email: 'jorge@udemedellin.edu.co', totalEvaluaciones: 0, promedio: 0 },
]
const pagina = (teachers: typeof docentes) => ({ stats: {}, teachers, pagination: { page: 1, pageSize: 50, total: teachers.length, totalPages: 1 } })
const estadisticas = {
  summary: { totalEvaluaciones: 31, promedio: 3.4, estudiantesEvaluadores: 25, totalCursos: 2 },
  categories: [{ categoriaId: 1, nombre: 'Metodología', promedio: 3.1 }],
  courses: [{ cursoId: 7, codigo: 'SIS101', nombre: 'Programación I', promedio: 3.4, totalEvaluaciones: 20 }],
}

const lista = () => screen.getByRole('region', { name: 'Docentes' })

describe('ManageProfessors', () => {
  beforeEach(() => {
    simularMatchMedia(false)
    window.localStorage.clear()
    fetchResumen.mockImplementation(async ({ page }: { page: number }) => (page === 1 ? pagina(docentes) : pagina([])))
    fetchStats.mockResolvedValue(estadisticas)
  })

  it('lista a los docentes con su promedio y cuántas evaluaciones tienen', async () => {
    renderConPreferencias(<ManageProfessors />)

    const fila = (await within(lista()).findByRole('button', { name: /Ana Pérez/ }))

    expect(fila).toHaveTextContent('4.60')
    expect(fila).toHaveTextContent('42 evaluaciones')
    expect(within(lista()).getByText('3 docentes')).toBeInTheDocument()
  })

  it('los filtros muestran cuántos docentes hay en cada estado', async () => {
    renderConPreferencias(<ManageProfessors />)
    await within(lista()).findByRole('button', { name: /Ana Pérez/ })

    expect(screen.getByRole('radio', { name: /Todos \(3\)/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /En riesgo \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Sin evaluaciones \(1\)/ })).toBeInTheDocument()
  })

  it('"En riesgo" deja solo a los docentes con promedio menor a 4.0', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<ManageProfessors />)
    await within(lista()).findByRole('button', { name: /Ana Pérez/ })

    await usuario.click(screen.getByRole('radio', { name: /En riesgo/ }))

    expect(within(lista()).queryByRole('button', { name: /Ana Pérez/ })).not.toBeInTheDocument()
    expect(within(lista()).getByRole('button', { name: /Carlos Restrepo/ })).toBeInTheDocument()
    expect(within(lista()).getByText('1 docente')).toBeInTheDocument()
  })

  it('la búsqueda ignora tildes y muestra un estado vacío con ayuda cuando nada coincide', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<ManageProfessors />)
    await within(lista()).findByRole('button', { name: /Ana Pérez/ })

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o correo' }), 'rios')
    expect(within(lista()).getByRole('button', { name: /Jorge Ríos/ })).toBeInTheDocument()

    await usuario.clear(screen.getByRole('searchbox'))
    await usuario.type(screen.getByRole('searchbox'), 'zzz')
    expect(within(lista()).getByText('Ningún docente coincide con tu búsqueda.')).toBeInTheDocument()
    expect(within(lista()).getByText('Prueba con otro nombre o quita los filtros.')).toBeInTheDocument()
  })

  it('ordenar por promedio (menor primero) pone primero al docente en riesgo y al final al que no tiene datos', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<ManageProfessors />)
    await within(lista()).findByRole('button', { name: /Ana Pérez/ })

    await usuario.selectOptions(screen.getByLabelText('Ordenar por'), 'Promedio (menor primero)')

    const nombres = within(lista()).getAllByRole('button', { name: /@udemedellin/ }).map((b) => b.textContent)
    expect(nombres[0]).toContain('Carlos Restrepo')
    expect(nombres.at(-1)).toContain('Jorge Ríos')
  })

  it('al elegir un docente pide sus estadísticas del periodo y las muestra por categoría y curso', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<ManageProfessors />)

    await usuario.click(await within(lista()).findByRole('button', { name: /Carlos Restrepo/ }))

    expect(await screen.findByRole('heading', { name: 'Carlos Restrepo' })).toBeInTheDocument()
    expect(fetchStats).toHaveBeenCalledWith(2, '2026-1')
    expect(await screen.findByText('Metodología')).toBeInTheDocument()
    expect(screen.getByText(/SIS101 · Programación I/)).toBeInTheDocument()
    expect(screen.getByText('Promedio inferior a 4.0: conviene revisar los comentarios.')).toBeInTheDocument()
  })

  it('cambiar el periodo vuelve a pedir las estadísticas', async () => {
    const usuario = userEvent.setup()
    renderConPreferencias(<ManageProfessors />, { route: '/profesores/gestionar?profesor=1' })
    await screen.findByRole('heading', { name: 'Ana Pérez' })

    await usuario.selectOptions(screen.getByLabelText('Periodo'), '2025-2')

    expect(fetchStats).toHaveBeenLastCalledWith(1, '2025-2')
  })

  it('abre directamente al docente indicado en ?profesor= (enlace desde el dashboard)', async () => {
    renderConPreferencias(<ManageProfessors />, { route: '/profesores/gestionar?profesor=2' })

    expect(await screen.findByRole('heading', { name: 'Carlos Restrepo' })).toBeInTheDocument()
  })

  it('si fallan las estadísticas avisa y no inventa datos', async () => {
    fetchStats.mockRejectedValue(new Error('500'))
    const usuario = userEvent.setup()
    renderConPreferencias(<ManageProfessors />)

    await usuario.click(await within(lista()).findByRole('button', { name: /Ana Pérez/ }))

    expect(await screen.findByText('No pudimos cargar las estadísticas de este docente.')).toBeInTheDocument()
    expect(screen.queryByText('Promedio por categoría')).not.toBeInTheDocument()
  })

  it('si falla la lista de docentes muestra una alerta', async () => {
    fetchResumen.mockRejectedValue(new Error('500'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderConPreferencias(<ManageProfessors />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la información')
  })

  it('con una sola página no vuelve a pedir los mismos docentes', async () => {
    renderConPreferencias(<ManageProfessors />)
    await within(lista()).findByRole('button', { name: /Ana Pérez/ })

    expect(fetchResumen).toHaveBeenCalledWith({ page: 1, pageSize: 50 })
    expect(fetchResumen).not.toHaveBeenCalledWith({ page: 2, pageSize: 50 })
    expect(within(lista()).getAllByRole('button', { name: /Ana Pérez/ })).toHaveLength(1)
  })
})
