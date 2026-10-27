import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Card, { CardHeader, CardContent, CardDescription, CardTitle } from '../../components/Card'
import Header from '../../components/Header'
import { User } from '../../types'
import { usersApi } from '../../api/users'
import {
  Users,
  Building2,
  QrCode,
  GraduationCap,
  ClipboardPlus,
} from 'lucide-react'
import RoleGuideBanner from '../../components/OnboardingBanner'
import HelpTooltip from '../../components/HelpTooltip'

const fondo = new URL('../../assets/fondo.webp', import.meta.url).href

interface DashboardAdminProps {
  user: User
}

export default function DashboardAdmin({ user }: DashboardAdminProps) {
  const navigate = useNavigate()
  const [userCount, setUserCount] = useState<number | null>(null)
  const [facultadCount, setFacultadCount] = useState<number | null>(null)
  const [carreraCount, setCarreraCount] = useState<number | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const currentUser = user

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingStats(true)
      setStatsError(null)
      try {
        const stats = await usersApi.stats()
        if (cancelled) return
        setUserCount(stats.totalUsers)
        setFacultadCount(stats.totalFacultades)
        setCarreraCount(stats.totalCarreras)
      } catch (e: any) {
        // Fallback: cargar por separado para no dejar todo vacío
        try {
          const [{ users }, structure] = await Promise.all([
            usersApi.list(),
            usersApi.academicStructure().catch(() => ({ facultades: [] })),
          ])
          if (cancelled) return
          setUserCount(users.length)
          setFacultadCount(structure.facultades.length)
          setCarreraCount(
            structure.facultades.reduce((acc, f) => acc + (f.carreras?.length || 0), 0)
          )
          if (!structure.facultades.length) {
            setStatsError(e?.response?.data?.error || 'Algunas métricas no pudieron cargarse')
          }
        } catch (err: any) {
          if (!cancelled) {
            setStatsError(err?.response?.data?.error || 'No se pudieron cargar las estadísticas')
            setUserCount(null)
            setFacultadCount(null)
            setCarreraCount(null)
          }
        }
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '¡Buenos días'
    if (hour < 18) return '¡Buenas tardes'
    return '¡Buenas noches'
  }

  const metrics = [
    {
      label: 'Usuarios',
      value: userCount,
      hint: 'Cuentas registradas en la plataforma',
      help: 'Total de cuentas activas e inactivas. Incluye estudiantes, docentes y directivos. No es un conteo de sesiones abiertas.',
      icon: Users,
      iconClass: 'bg-red-50 text-red-600',
    },
    {
      label: 'Facultades',
      value: facultadCount,
      hint: 'Unidades académicas configuradas',
      help: 'Facultades dadas de alta. Cada una agrupa carreras. Un número bajo puede indicar que la estructura aún no está completa.',
      icon: Building2,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Carreras',
      value: carreraCount,
      hint: 'Programas vinculados a las facultades',
      help: 'Programas académicos activos. Sirve para comprobar que cada facultad tiene sus carreras antes de abrir evaluaciones.',
      icon: GraduationCap,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
  ]

  const modules = [
    {
      icon: Users,
      label: 'Gestión de Usuarios',
      description: 'Crea, edita y desactiva cuentas de estudiantes, docentes y directivos.',
      path: '/admin/users',
      iconClass: 'bg-red-50 text-red-600',
    },
    {
      icon: Building2,
      label: 'Entidades Académicas',
      description: 'Consulta facultades, carreras y la estructura académica activa.',
      path: '/admin/academic',
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      icon: QrCode,
      label: 'Generación de QR',
      description: 'Descarga accesos masivos por asignatura para evaluación en el aula.',
      path: '/admin/qr',
      iconClass: 'bg-red-50 text-red-600',
    },
    {
      icon: ClipboardPlus,
      label: 'Agregar encuesta',
      description: 'Crea preguntas y amplía los instrumentos de evaluación del periodo.',
      path: '/admin/surveys',
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0 pointer-events-none" />

      <div className="relative z-10">
        <Header user={currentUser} />

        <main className="max-w-6xl xl:max-w-[92rem] mx-auto px-4 py-6 sm:p-6 lg:p-10 space-y-6 lg:space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/95 shadow-sm border border-gray-200/80 p-6 lg:p-8">
              <CardContent className="space-y-2 lg:py-1">
                <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900">
                  {getGreeting()}, {currentUser.name.split(' ')[0]}
                </h2>
                <p className="text-base lg:text-lg text-gray-600">
                  Panel de administración de la institución.
                </p>
                {statsError && <p className="text-sm text-amber-700">{statsError}</p>}
              </CardContent>
            </Card>
          </motion.div>

          <RoleGuideBanner
            storageKey="guide_dismissed_admin"
            titulo="¿Cómo gestionar la plataforma?"
            pasos={[
              { titulo: 'Usuarios y roles', detalle: 'Administra cuentas de estudiantes, docentes y directivos.' },
              { titulo: 'Estructura académica', detalle: 'Configura facultades, carreras y asignaturas activas.' },
              { titulo: 'Periodos y encuestas', detalle: 'Define ventanas de fechas y activa los instrumentos de evaluación.' },
              { titulo: 'Códigos QR de facultad', detalle: 'Genera accesos masivos a nivel institucional.' },
            ]}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className="bg-white/95 border border-gray-200/80 shadow-sm transition-all hover:shadow-md p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <HelpTooltip texto={metric.help} />
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                      {loadingStats ? '…' : metric.value === null ? '—' : metric.value}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{metric.hint}</p>
                  </div>
                  <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${metric.iconClass}`}>
                    <metric.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Card className="bg-white/95 shadow-sm border border-gray-200/80 p-5 sm:p-6 lg:p-8">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-2xl text-gray-900">Módulos administrativos</CardTitle>
              <CardDescription className="text-base">
                Accesos directos a la operación de la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {modules.map((mod) => (
                  <button
                    key={mod.path}
                    type="button"
                    onClick={() => navigate(mod.path)}
                    className="group flex h-full flex-col rounded-xl border border-gray-200/80 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${mod.iconClass}`}>
                      <mod.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="mt-4 text-base font-semibold text-gray-900">{mod.label}</span>
                    <span className="mt-1 text-sm leading-relaxed text-gray-600">{mod.description}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
