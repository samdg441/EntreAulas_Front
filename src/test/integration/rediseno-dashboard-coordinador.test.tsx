/**
 * Dashboard del coordinador rediseñado: métricas + resumen de docentes + calendario.
 * Mocks de la API (vi.mock) y Stub de las fechas; se verifica además que ya no existan los accesos rápidos.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderConPreferencias, simularMatchMedia } from '../helpers/render-rediseno'

const fetchResumen = vi.fn()
vi.mock('../../api/coordinador.api', () => ({
  fetchCoordinatorDashboardSummary: (...a: unknown[]) => fetchResumen(...a),
}))
vi.mock('../../api/periodos.api', () => ({
  getVentanasEvaluacion: async () => [{ periodoId: 1, ano: 2026, semestre: 2, fechaInicio: '2026-11-03', fechaFin: '2026-11-21' }],
}))

import DashboardCoordinador from '../../features/dashboard-coordinator/DashboardCoordinador'

const usuario = { id: 'u-coord', name: 'David Coordinador', type: 'coordinator', email: 'david@udemedellin.edu.co' } as never

const respuesta = {
  stats: { totalProfesores: 6, totalCursos: 18, promedioEvaluaciones: 4.12, profesoresEnRiesgo: 2, totalEvaluaciones: 157 },
  teachers: [
    { profesorId: 1, nombre: 'Ana Pérez', email: 'ana@udemedellin.edu.co', totalEvaluaciones: 42, promedio: 4.6 },
    { profesorId: 2, nombre: 'Carlos Restrepo', email: 'carlos@udemedellin.edu.co', totalEvaluaciones: 31, promedio: 3.4 },
    { profesorId: 4, nombre: 'Jorge Ríos', email: 'jorge@udemedellin.edu.co', totalEvaluaciones: 0, promedio: 0 },
  ],
  pagination: { page: 1, pageSize: 8, total: 3, totalPages: 1 },
}

describe('DashboardCoordinador', () => {
  beforeEach(() => {
    simularMatchMedia(false)
    window.localStorage.clear()
    fetchResumen.mockResolvedValue(respuesta)
  })

  it('muestra los cuatro indicadores con sus valores', async () => {
    renderConPreferencias(<DashboardCoordinador user={usuario} />)

    const indicadores = await screen.findByLabelText('Indicadores de la carrera')

    expect(await within(indicadores).findByText('18')).toBeInTheDocument()
    for (const etiqueta of ['Profesores', 'Cursos activos', 'Promedio general', 'Docentes en riesgo']) {
      expect(within(indicadores).getByText(etiqueta)).toBeInTheDocument()
    }
    expect(within(indicadores).getByText('4.12')).toBeInTheDocument()
  })

  it('el promedio incluye una escala con el umbral 4.0 accesible como meter', async () => {
    renderConPreferencias(<DashboardCoordinador user={usuario} />)

    const medidor = await screen.findByRole('meter', { name: 'Promedio general' })

    expect(medidor).toHaveAttribute('aria-valuenow', '4.12')
    expect(medidor).toHaveAttribute('aria-valuemax', '5')
  })

  it('ya no hay "Acciones rápidas": esos accesos viven en la barra lateral', async () => {
    renderConPreferencias(<DashboardCoordinador user={usuario} />)
    await screen.findByText('Ana Pérez')

    expect(screen.queryByText(/Acciones R[aá]pidas/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Programar Encuestas/i })).not.toBeInTheDocument()
  })

  it('resalta al docente en riesgo y rotula "Sin datos" a quien no tiene evaluaciones', async () => {
    renderConPreferencias(<DashboardCoordinador user={usuario} />)

    const fila = (await screen.findByText('Carlos Restrepo')).closest('tr')!

    expect(fila).toHaveClass('bg-red-50')
    expect(within(fila).getByText(/3\.40/)).toBeInTheDocument()
    expect(within(fila).getByText(/En riesgo/)).toBeInTheDocument()
    expect(within(screen.getByText('Jorge Ríos').closest('tr')!).getByText('Sin datos')).toBeInTheDocument()
  })

  it('cada docente enlaza a su detalle en la gestión de profesores', async () => {
    renderConPreferencias(<DashboardCoordinador user={usuario} />)

    const enlace = await screen.findByRole('link', { name: 'Ver detalle: Ana Pérez' })

    expect(enlace).toHaveAttribute('href', '/profesores/gestionar?profesor=1')
  })

  it('al buscar pide al servidor el texto recortado y vuelve a la página 1', async () => {
    const usuarioUi = userEvent.setup()
    renderConPreferencias(<DashboardCoordinador user={usuario} />)
    await screen.findByText('Ana Pérez')

    await usuarioUi.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o correo...' }), '  ana ')

    await waitFor(() => expect(fetchResumen).toHaveBeenLastCalledWith({ page: 1, pageSize: 8, search: 'ana' }))
  })

  it('si el servidor falla muestra una alerta y deja las métricas vacías', async () => {
    fetchResumen.mockRejectedValue(new Error('500'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderConPreferencias(<DashboardCoordinador user={usuario} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la información')
    expect(screen.getByText('No se encontraron docentes para el filtro actual.')).toBeInTheDocument()
  })

  it('incluye el calendario con la ventana de evaluación programada', async () => {
    renderConPreferencias(<DashboardCoordinador user={usuario} />)

    expect(await screen.findByRole('heading', { name: 'Calendario de evaluaciones' })).toBeInTheDocument()
    expect(await screen.findByText('Periodo 2026-2')).toBeInTheDocument()
  })

  it('todo el texto cambia a inglés con la preferencia de idioma', async () => {
    window.localStorage.setItem('entreaulas.preferencias', JSON.stringify({ tema: 'claro', idioma: 'en', tamano: 'standard' }))
    renderConPreferencias(<DashboardCoordinador user={usuario} />)

    expect(await screen.findByRole('heading', { name: 'Teacher overview' })).toBeInTheDocument()
    expect(screen.getByLabelText('Degree indicators')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Evaluation calendar' })).toBeInTheDocument()
  })
})
