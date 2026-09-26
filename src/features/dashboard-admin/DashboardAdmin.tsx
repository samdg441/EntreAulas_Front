import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Card, { CardHeader, CardContent, CardDescription, CardTitle } from '../../components/Card'
import Button from '../../components/Button'
import Header from '../../components/Header'
import { User } from '../../types'
import { usersApi } from '../../api/users'
import {
  Users,
  Building2,
  QrCode,
  Shield,
  Mail,
  User as UserIcon,
  ClipboardPlus,
} from 'lucide-react'

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

  const modules = [
    {
      icon: Users,
      label: 'Gestión de Usuarios',
      description: 'Listar, crear, editar y desactivar cuentas',
      path: '/admin/users',
      className: 'bg-red-600 hover:bg-red-700 text-white',
      variant: 'default' as const,
    },
    {
      icon: Building2,
      label: 'Entidades Académicas',
      description: 'Consultar facultades y carreras',
      path: '/admin/academic',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50',
      variant: 'outline' as const,
    },
    {
      icon: QrCode,
      label: 'Generación de QR',
      description: 'Tokens de evaluación por curso y grupo',
      path: '/admin/qr',
      className: 'border-red-300 text-red-600 hover:bg-red-50',
      variant: 'outline' as const,
    },
    {
      icon: ClipboardPlus,
      label: 'Agregar encuesta',
      description: 'Crear preguntas y ampliar evaluaciones',
      path: '/admin/surveys',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50',
      variant: 'outline' as const,
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

        <main className="max-w-6xl xl:max-w-[92rem] mx-auto p-6 lg:p-10 space-y-8 lg:space-y-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
              <CardContent className="space-y-3 lg:py-2">
                <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900">
                  {getGreeting()}, {currentUser.name.split(' ')[0]}
                </h2>
                <p className="text-lg lg:text-xl text-gray-600">
                  Panel de administración. Gestiona usuarios, estructura académica, accesos QR y
                  encuestas.
                </p>
                {statsError && <p className="text-sm text-amber-700">{statsError}</p>}
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-8 lg:min-h-[11.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg lg:text-2xl font-medium text-gray-900">Usuarios</CardTitle>
                <Users className="h-5 w-5 lg:h-8 lg:w-8 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-5xl font-bold text-red-600">
                  {loadingStats ? '…' : userCount === null ? '—' : userCount}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-8 lg:min-h-[11.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg lg:text-2xl font-medium text-gray-900">Facultades</CardTitle>
                <Building2 className="h-5 w-5 lg:h-8 lg:w-8 text-gray-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-5xl font-bold text-gray-800">
                  {loadingStats ? '…' : facultadCount === null ? '—' : facultadCount}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-8 lg:min-h-[11.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg lg:text-2xl font-medium text-gray-900">Carreras</CardTitle>
                <Shield className="h-5 w-5 lg:h-8 lg:w-8 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-5xl font-bold text-green-600">
                  {loadingStats ? '…' : carreraCount === null ? '—' : carreraCount}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl lg:text-3xl text-gray-900">Módulos administrativos</CardTitle>
              <CardDescription className="text-base lg:text-lg">
                Entornos de vital importancia para la administración del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {modules.map((mod) => (
                  <motion.div key={mod.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => navigate(mod.path)}
                      variant={mod.variant}
                      className={`w-full h-auto min-h-[9.5rem] lg:min-h-[12.5rem] py-5 lg:py-8 flex flex-col items-center gap-3 ${mod.className}`}
                    >
                      <mod.icon className="h-8 w-8 lg:h-11 lg:w-11" />
                      <div className="text-center">
                        <div className="font-medium text-lg lg:text-xl">{mod.label}</div>
                        <div className="text-sm lg:text-base opacity-80">{mod.description}</div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>


        </main>
      </div>
    </div>
  )
}
