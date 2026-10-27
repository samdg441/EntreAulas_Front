import { Link, useLocation } from 'react-router-dom'

const ETIQUETA_ROL: Record<string, string> = {
  estudiante: 'estudiante',
  profesor: 'docente',
  docente: 'docente',
  coordinador: 'coordinador',
  decano: 'decano',
  admin: 'administrador',
}

/**
 * Acceso denegado por rol. Explica qué permiso falta, sin una pantalla 403 genérica.
 */
export default function ForbiddenPage() {
  const location = useLocation()
  const state = (location.state ?? {}) as { seccion?: string; roles?: string[] }
  const roles = (state.roles ?? []).map((rol) => ETIQUETA_ROL[rol] ?? rol)
  const detalle =
    roles.length > 0
      ? `Esta sección está reservada para: ${roles.join(', ')}.`
      : 'Tu rol de esta sesión no incluye el permiso de esta sección.'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Permisos insuficientes</h1>
        <p className="text-gray-600 mb-2">{detalle}</p>
        {state.seccion && (
          <p className="text-sm text-gray-500 mb-6">Ruta solicitada: {state.seccion}</p>
        )}
        {!state.seccion && <div className="mb-6" />}
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
        >
          Volver al panel
        </Link>
      </div>
    </div>
  )
}
