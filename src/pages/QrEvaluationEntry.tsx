import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card'
import Button from '../components/Button'

export default function QrEvaluationEntry() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const token = params.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const redirectTo = useMemo(() => `/qr-evaluacion?token=${encodeURIComponent(token)}`, [token])

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError('No se encontró token en el QR.')
        setLoading(false)
        return
      }

      // Si no hay sesión, mandar al login y volver aquí
      if (!user) {
        localStorage.setItem('redirectTo', redirectTo)
        navigate('/login', { replace: true })
        return
      }

      try {
        setLoading(true)
        setError('')
        const resp = await apiClient.get(`/api/qr-evaluaciones/${token}`)
        const data = resp.data || {}

        // Auto-matrícula del estudiante en el grupo asociado al QR.
        // Si ya estaba inscrito, el backend devuelve alreadyEnrolled=true.
        await apiClient.post(`/api/qr-evaluaciones/${token}/auto-enroll`)

        // Construir objetos mínimos para EvaluationForm (usa teacher/course/group desde location.state)
        const teacher = {
          id: data.profesorId,
          name: data.profesorNombre || 'Docente',
        }

        const course = {
          id: data.cursoId,
          name: data.cursoNombre || 'Curso',
          code: data.cursoCodigo || '',
        }

        const group = data.grupoId ? {
          id: data.grupoId,
          numero_grupo: data.grupoNumero ?? undefined,
          horario: data.grupoHorario ?? undefined,
          aula: data.grupoAula ?? undefined,
        } : undefined

        navigate('/evaluate/form', {
          replace: true,
          state: { teacher, course, group }
        })
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'QR inválido o expirado.'
        setError(typeof msg === 'string' ? msg : 'QR inválido o expirado.')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [token, user, navigate, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="bg-white shadow-md border border-gray-200 p-6 max-w-md w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-900">Cargando evaluación...</CardTitle>
            <CardDescription>Estamos validando el QR y preparando la encuesta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="bg-white shadow-md border border-gray-200 p-6 max-w-md w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-900">No se pudo abrir la encuesta</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Ir a login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

