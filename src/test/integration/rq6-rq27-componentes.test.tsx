import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { renderConSesion } from '../helpers/render'
import ForbiddenPage from '../../routes/ForbiddenPage'
import QrEvaluationEntry from '../../features/evaluations/QrEvaluationEntry'
import AdminQrPage from '../../features/dashboard-admin/AdminQrPage'
import Dashboard from '../../features/dashboard-student/Dashboard'
import { getQrEvaluation, autoEnrollQrEvaluation } from '../../api/evaluations.api'
import { usersApi } from '../../api/users'
import { fetchStudentEnrolledSubjects, fetchStudentStats } from '../../api/teachers'

vi.mock('../../api/evaluations.api', () => ({
  getQrEvaluation: vi.fn(),
  autoEnrollQrEvaluation: vi.fn(),
}))

vi.mock('../../api/users', () => ({
  usersApi: { academicStructure: vi.fn(), gruposByCareer: vi.fn() },
}))

vi.mock('../../api/teachers', () => ({
  fetchStudentStats: vi.fn(),
  fetchStudentEnrolledSubjects: vi.fn(),
}))

vi.mock('../../api/periodos.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/periodos.api')>()
  return {
    ...actual,
    guardarVentanaEvaluacion: vi.fn(),
    getVentanasEvaluacion: vi.fn().mockResolvedValue([]),
  }
})

const estudiante = {
  id: 'u-ana',
  email: 'ana.perez@soyudemedellin.edu.co',
  nombre: 'Ana',
  apellido: 'Pérez',
  tipo_usuario: 'estudiante',
  roles: ['estudiante'],
}

const admin = {
  id: 'u-ada',
  email: 'ada.admin@udemedellin.edu.co',
  nombre: 'Ada',
  apellido: 'Admin',
  tipo_usuario: 'admin',
  roles: ['admin'],
}

describe('RQ6, RQ14, RQ15, RQ17 y RQ27 — Componentes', () => {
  beforeEach(() => {
    vi.mocked(getQrEvaluation).mockReset()
    vi.mocked(autoEnrollQrEvaluation).mockReset()
    vi.mocked(usersApi.academicStructure).mockReset().mockResolvedValue({ facultades: [] })
    vi.mocked(fetchStudentStats).mockReset().mockResolvedValue({
      evaluacionesCompletadas: 1,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 1,
      promedioGeneral: 4,
      progresoGeneral: 50,
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('RQ6: la pantalla de acceso denegado explica que no hay permiso', () => {
    renderConSesion(<ForbiddenPage />)

    expect(screen.getByRole('heading', { name: 'Permisos insuficientes' })).toBeInTheDocument()
    expect(screen.getByText(/no incluye el permiso/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al panel' })).toBeInTheDocument()
  })

  it('RQ17: un QR sin token muestra el error y no llama al back', async () => {
    renderConSesion(<QrEvaluationEntry />, { route: '/qr-evaluacion' })

    expect(await screen.findByText('No se encontró token en el QR.')).toBeInTheDocument()
    expect(getQrEvaluation).not.toHaveBeenCalled()
    expect(autoEnrollQrEvaluation).not.toHaveBeenCalled()
  })

  it('RQ14: si la inscripción falla, no abre la encuesta', async () => {
    vi.mocked(getQrEvaluation).mockRejectedValue({ response: { data: { error: 'QR inválido o expirado.' } } })
    renderConSesion(<QrEvaluationEntry />, { user: estudiante, route: '/qr-evaluacion?token=tok-14' })

    expect(await screen.findByRole('heading', { name: 'No se pudo abrir la encuesta' })).toBeInTheDocument()
    expect(screen.getByText('QR inválido o expirado.')).toBeInTheDocument()
  })

  it('RQ15: confirmar la generación sin fechas ni grupos avisa y no crea QR', async () => {
    const user = userEvent.setup()
    renderConSesion(
      <>
        <Toaster />
        <AdminQrPage />
      </>,
      { user: admin }
    )

    await user.click(await screen.findByRole('button', { name: 'Confirmar generación' }))

    expect(await screen.findByText('Completa Fecha de inicio, Fecha de cierre y Período.')).toBeInTheDocument()
  })

  it('RQ27: el estudiante ve su materia con curso y profesor', async () => {
    vi.mocked(fetchStudentEnrolledSubjects).mockResolvedValue({
      materiasMatriculadas: [
        {
          id: 11,
          grupo: {
            numeroGrupo: 1,
            horario: 'Lun 8-10',
            aula: 'A-101',
            curso: { id: 31, codigo: 'SIS-101', nombre: 'Programación I' },
            profesor: { nombre: 'Ana Pérez' },
            periodo: { codigo: '2026-1', nombre: '2026-I' },
          },
        },
      ],
      total: 1,
    })

    renderConSesion(
      <Dashboard user={{ id: 'u-ana', name: 'Ana Pérez', type: 'student', email: estudiante.email }} />
    )

    expect(await screen.findByText(/Solo se listan materias en las que estás matriculado/)).toBeInTheDocument()
    expect(await screen.findByText('SIS-101 · Programación I')).toBeInTheDocument()
    expect(screen.getByText(/Ana Pérez/)).toBeInTheDocument()
  })

  it('RQ27: si la API de materias falla se muestra el error y no un cero silencioso', async () => {
    vi.mocked(fetchStudentStats).mockRejectedValue(new Error('sin red'))
    vi.mocked(fetchStudentEnrolledSubjects).mockRejectedValue(new Error('sin red'))

    renderConSesion(
      <Dashboard user={{ id: 'u-ana', name: 'Ana Pérez', type: 'student', email: estudiante.email }} />
    )

    expect(await screen.findByText('Error al cargar los datos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
