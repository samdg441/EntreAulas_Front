import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { authStorage } from '../lib/storage'
import { estadoSesion, expiracionDelToken } from '../lib/session-expiracion'

const RUTAS_PUBLICAS = ['/login', '/forgot-password', '/reset-password', '/qr-evaluacion']
const AVISO_CERRADO = 'entre-aulas-aviso-sesion'

function avisoCerrado(): number | null {
  const valor = Number(sessionStorage.getItem(AVISO_CERRADO))
  return Number.isFinite(valor) && valor > 0 ? valor : null
}

function enRutaPublica() {
  const path = window.location.pathname || ''
  return RUTAS_PUBLICAS.some((ruta) => path === ruta || path.startsWith(`${ruta}/`))
}

/**
 * Aviso flotante cuando falta menos de una hora de sesión.
 * Extender pide un JWT nuevo de 3 horas. Cerrar descarta el aviso sin tocar la sesión.
 */
export default function SessionExpiryNotice() {
  const { isAuthenticated, logout } = useAuth()
  const [token, setToken] = useState<string | null>(() => authStorage.getToken())
  const [ahora, setAhora] = useState(() => Date.now())
  const [descartadaEn, setDescartadaEn] = useState<number | null>(() => avisoCerrado())
  const [extendiendo, setExtendiendo] = useState(false)
  const [error, setError] = useState('')
  const yaCerro = useRef(false)

  useEffect(() => {
    const leer = () => {
      const actual = authStorage.getToken()
      setToken((previo) => (previo === actual ? previo : actual))
      setAhora(Date.now())
    }
    leer()
    const id = window.setInterval(leer, 15_000)
    return () => window.clearInterval(id)
  }, [isAuthenticated])

  const exp = expiracionDelToken(token)
  const estado = isAuthenticated ? estadoSesion(exp, ahora, descartadaEn) : 'sin-sesion'

  useEffect(() => {
    if (estado !== 'expirada' || enRutaPublica() || yaCerro.current) return
    yaCerro.current = true
    logout()
  }, [estado, logout])

  if (estado !== 'por-vencer' || enRutaPublica()) return null

  const extender = async () => {
    setExtendiendo(true)
    setError('')
    try {
      await authApi.refresh()
      setToken(authStorage.getToken())
      setAhora(Date.now())
      sessionStorage.removeItem(AVISO_CERRADO)
      setDescartadaEn(null)
    } catch {
      setError('No se pudo extender la sesión. Vuelve a intentarlo o cierra sesión.')
    } finally {
      setExtendiendo(false)
    }
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[26rem]">
      <section
        aria-label="Aviso de sesión"
        className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Tu sesión expirará pronto</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Tu sesión expirará pronto por seguridad. ¿Deseas extenderla?
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Cerrar aviso de sesión"
            onClick={() => {
              if (exp) sessionStorage.setItem(AVISO_CERRADO, String(exp))
              setDescartadaEn(exp)
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
            disabled={extendiendo}
            onClick={extender}
          >
            {extendiendo ? 'Extendiendo…' : 'Extender sesión'}
          </button>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  )
}
