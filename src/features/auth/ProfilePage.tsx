import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, Mail, Shield } from 'lucide-react'
import { authApi } from '../../api/auth'
import Header from '../../components/Header'
import Card from '../../components/Card'
import { Avatar, AvatarFallback } from '../../components/Avatar'
import { useAuth } from '../../context/AuthContext'
import { getRoleLabel } from './login-flow'

import fondoImg from '../../assets/fondo.webp'

type Perfil = {
  email: string
  nombre: string
  apellido: string
  tipo_usuario: string
  activo?: boolean
  created_at?: string
  roles?: string[]
  permisos?: string[]
}

const ORDEN_ROLES = ['admin', 'decano', 'coordinador', 'profesor', 'docente', 'estudiante']

const ETIQUETA_PERMISO: Record<string, string> = {
  all: 'Acceso completo al sistema',
  view_evaluations: 'Ver evaluaciones',
  submit_evaluations: 'Enviar evaluaciones',
  create_evaluations: 'Crear evaluaciones',
  view_reports: 'Ver reportes',
  manage_users: 'Gestionar usuarios',
  manage_department: 'Gestionar el departamento',
  manage_faculty: 'Gestionar la facultad',
  view_all_professors: 'Ver todos los docentes',
  view_all_careers: 'Ver todas las carreras',
}

function etiquetaRol(rol: string): string {
  if (rol === 'decano') return 'Decano'
  return getRoleLabel(rol)
}

function etiquetaPermiso(permiso: string): string {
  return ETIQUETA_PERMISO[permiso] ?? permiso.replace(/_/g, ' ')
}

function fechaRegistro(valor?: string): string | null {
  if (!valor) return null
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return null
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ordenarRoles(roles: string[]): string[] {
  return [...roles].sort((a, b) => {
    const ia = ORDEN_ROLES.indexOf(a)
    const ib = ORDEN_ROLES.indexOf(b)
    return (ia === -1 ? ORDEN_ROLES.length : ia) - (ib === -1 ? ORDEN_ROLES.length : ib)
  })
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, getDashboardPath } = useAuth()
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await authApi.getProfile()
        if (!cancelled) setProfile(data as Perfil)
      } catch {
        if (!cancelled) setError('No se pudo cargar el perfil desde el servidor.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const nombrePila = (profile?.nombre ?? user?.nombre ?? '').split(' ')[0]
  const apellidoPila = (profile?.apellido ?? user?.apellido ?? '').split(' ')[0]
  const nombre = `${profile?.nombre ?? user?.nombre ?? ''} ${profile?.apellido ?? user?.apellido ?? ''}`.trim()
  const iniciales = [nombrePila, apellidoPila].filter(Boolean).join(' ')
  const email = profile?.email ?? user?.email ?? ''
  const tipo = profile?.tipo_usuario ?? user?.tipo_usuario ?? ''
  const rolSesion = (user?.selected_role || tipo).toLowerCase()
  const roles = ordenarRoles(profile?.roles?.length ? profile.roles : user?.roles || (tipo ? [tipo] : []))
  const permisos = profile?.permisos ?? user?.permissions ?? []
  const registrado = fechaRegistro(profile?.created_at)
  const activo = profile?.activo

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${fondoImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

      <div className="relative z-10">
        <Header
          showBackButton
          onBack={() => navigate(getDashboardPath())}
        />

        <main className="max-w-3xl mx-auto p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white shadow-md border border-gray-200">
              <div className="p-6 sm:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback
                      className="bg-red-600 text-white text-2xl"
                      text={iniciales || email}
                    />
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-600">Mi perfil</p>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1 break-words">
                      {nombre || 'Tu cuenta'}
                    </h1>
                    {email && (
                      <p className="mt-2 flex items-center gap-2 text-gray-600 break-all">
                        <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                        {email}
                      </p>
                    )}
                    {activo !== undefined && (
                      <span
                        className={`inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                          activo
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {activo ? 'Cuenta activa' : 'Cuenta inactiva'}
                      </span>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </p>
                )}

                {loading ? (
                  <p className="text-sm text-gray-500">Cargando tu información…</p>
                ) : (
                  <>
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Dato
                        icono={<Mail className="h-4 w-4 text-red-600" />}
                        etiqueta="Correo institucional"
                        valor={email || '—'}
                      />
                      <Dato
                        icono={<Shield className="h-4 w-4 text-red-600" />}
                        etiqueta="Tipo de cuenta"
                        valor={tipo ? etiquetaRol(tipo) : '—'}
                      />
                      {registrado && (
                        <Dato
                          icono={<Calendar className="h-4 w-4 text-red-600" />}
                          etiqueta="Registrado el"
                          valor={registrado}
                        />
                      )}
                    </section>

                    {roles.length > 0 && (
                      <section>
                        <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          El rol resaltado es con el que iniciaste esta sesión.
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {roles.map((rol) => {
                            const esSesion = rol.toLowerCase() === rolSesion
                            return (
                              <li
                                key={rol}
                                className={`px-3 py-1.5 rounded-full text-sm border ${
                                  esSesion
                                    ? 'bg-red-50 text-red-700 border-red-200 font-medium'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {etiquetaRol(rol)}
                                {esSesion ? ' · sesión actual' : ''}
                              </li>
                            )
                          })}
                        </ul>
                      </section>
                    )}

                    {permisos.length > 0 && (
                      <section>
                        <h2 className="text-lg font-semibold text-gray-900">Qué puedes hacer</h2>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {permisos.map((permiso) => (
                            <li
                              key={permiso}
                              className="px-3 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-700 border border-gray-200"
                            >
                              {etiquetaPermiso(permiso)}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function Dato({
  icono,
  etiqueta,
  valor,
}: {
  icono: ReactNode
  etiqueta: string
  valor: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icono}
        {etiqueta}
      </div>
      <p className="mt-1 text-gray-900 break-words">{valor}</p>
    </div>
  )
}
