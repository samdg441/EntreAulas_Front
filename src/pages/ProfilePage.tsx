import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

/**
 * Ejemplo de ruta solo para usuarios autenticados (JWT válido).
 * Datos desde GET /api/auth/profile.
 */
export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await authApi.getProfile()
        if (!cancelled) setProfile(data as Record<string, unknown>)
      } catch {
        if (!cancelled) setError('No se pudo cargar el perfil desde el servidor.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Mi perfil</h1>
        {user && (
          <p className="text-sm text-gray-600 mb-4">
            Sesión local: {user.nombre} {user.apellido} ({user.email})
          </p>
        )}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {profile && (
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(profile, null, 2)}
          </pre>
        )}
        <Link to="/dashboard" className="inline-block mt-4 text-red-600 text-sm hover:underline">
          ← Volver
        </Link>
      </div>
    </div>
  )
}
