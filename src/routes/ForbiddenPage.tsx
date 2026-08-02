import { Link } from 'react-router-dom'

/**
 * Acceso denegado (403 en API o guard de rol en el cliente).
 */
export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Acceso no permitido</h1>
        <p className="text-gray-600 mb-6">
          No tienes permisos para ver esta sección. Si crees que es un error, contacta al administrador.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
