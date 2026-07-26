import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usersApi, UserSummary } from '../api/users'

/**
 * Ejemplo: listado solo para administradores (GET /api/users).
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { users: list } = await usersApi.list()
        if (!cancelled) setUsers(list)
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e && typeof e === 'object' && 'response' in e
              ? String((e as { response?: { data?: { error?: string } } }).response?.data?.error)
              : 'No se pudo cargar el listado'
          setError(msg || 'Error al cargar usuarios')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando usuarios…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-6">
        <p className="text-red-600">{error}</p>
        <Link to="/dashboard-admin" className="text-red-700 underline">
          Volver al panel de administración
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios (admin)</h1>
          <Link to="/dashboard-admin" className="text-sm text-red-600 hover:underline">
            ← Panel admin
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Activo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="px-4 py-2">{u.tipo_usuario}</td>
                  <td className="px-4 py-2">{u.activo ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
