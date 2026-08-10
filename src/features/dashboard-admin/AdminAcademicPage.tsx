import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/Card'
import Badge from '../../components/Badge'
import { useAuth } from '../../context/AuthContext'
import { usersApi, FacultadConCarreras } from '../../api/users'
import { Building2, GraduationCap } from 'lucide-react'
import { User } from '../../types'

const fondo = new URL('../../assets/fondo.webp', import.meta.url).href

export default function AdminAcademicPage() {
  const { user: authUser } = useAuth()
  const headerUser: User = {
    id: authUser?.id || '',
    name: `${authUser?.nombre || ''} ${authUser?.apellido || ''}`.trim() || 'Admin',
    type: 'admin',
    email: authUser?.email || '',
  }

  const [facultades, setFacultades] = useState<FacultadConCarreras[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { facultades: list } = await usersApi.academicStructure()
        if (!cancelled) {
          setFacultades(list)
          if (list.length === 1) setExpandedId(list[0].id)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.error || 'No se pudo cargar la estructura académica')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />

      <div className="relative z-10">
        <Header
          user={headerUser}
          title="Entidades Académicas"
          subtitle="Facultades y carreras"
        />

        <main className="max-w-5xl mx-auto p-6 space-y-6">
          <Card className="bg-white shadow-md border border-gray-200 p-6">
            <CardHeader className="pb-2">
              <Link to="/dashboard-admin" className="text-sm text-red-600 hover:underline">
                ← Volver al panel
              </Link>
              <CardTitle className="text-2xl text-gray-900 mt-1">
                Estructura universitaria
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">
                Consulta de facultades y sus carreras asociadas.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {loading && <p className="text-gray-600">Cargando…</p>}
              {error && <p className="text-red-600">{error}</p>}

              {!loading && !error && (
                <div className="space-y-4">
                  {facultades.map((f) => {
                    const open = expandedId === f.id
                    return (
                      <Card key={f.id} className="bg-white border border-gray-200 shadow-sm">
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => setExpandedId(open ? null : f.id)}
                        >
                          <CardHeader className="flex flex-row items-center justify-between p-5">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-red-600" />
                              <div>
                                <CardTitle className="text-lg text-gray-900">{f.nombre}</CardTitle>
                                {f.codigo && (
                                  <p className="text-sm text-gray-500">Código: {f.codigo}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-gray-50">
                              {f.carreras?.length || 0} carrera(s)
                            </Badge>
                          </CardHeader>
                        </button>
                        {open && (
                          <CardContent className="px-5 pb-5 pt-0 space-y-2">
                            {f.descripcion && (
                              <p className="text-sm text-gray-600 mb-3">{f.descripcion}</p>
                            )}
                            {(f.carreras || []).length === 0 ? (
                              <p className="text-sm text-gray-500">Sin carreras registradas</p>
                            ) : (
                              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                                {f.carreras.map((c) => (
                                  <li
                                    key={c.id}
                                    className="flex items-center justify-between px-4 py-3 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium text-gray-900">{c.nombre}</span>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={
                                        c.activa === false
                                          ? 'text-gray-500'
                                          : 'bg-green-50 text-green-700 border-green-200'
                                      }
                                    >
                                      {c.activa === false ? 'Inactiva' : 'Activa'}
                                    </Badge>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                  {facultades.length === 0 && (
                    <p className="text-gray-500 text-center py-10">No hay facultades registradas</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
