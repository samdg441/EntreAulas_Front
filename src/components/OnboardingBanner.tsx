import { useState } from 'react'
import { X } from 'lucide-react'

export type PasoGuia = string | { titulo: string; detalle: string }

interface RoleGuideBannerProps {
  /** Si no hay storageKey, la preferencia queda en `entre-aulas-guia-${rol}`. */
  rol?: string
  storageKey?: string
  titulo?: string
  pasos: PasoGuia[]
}

function claveGuia(rol?: string, storageKey?: string) {
  if (storageKey) return storageKey
  return `entre-aulas-guia-${rol || 'general'}`
}

function textoPaso(paso: PasoGuia) {
  return typeof paso === 'string' ? paso : paso.titulo
}

/** Banner superior para explicar el panel. Se cierra con la X y no vuelve a mostrarse. */
export default function RoleGuideBanner({
  rol,
  storageKey,
  titulo = 'Cómo empezar',
  pasos,
}: RoleGuideBannerProps) {
  const clave = claveGuia(rol, storageKey)
  const [visible, setVisible] = useState(() => localStorage.getItem(clave) !== 'oculto')

  if (!visible || pasos.length === 0) return null

  return (
    <section className="rounded-xl border border-red-200 bg-white p-4 shadow-sm" aria-label={titulo}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{titulo}</p>
          <ol className="mt-2 space-y-1.5 text-sm text-gray-700 list-decimal pl-5">
            {pasos.map((paso) => (
              <li key={textoPaso(paso)}>
                {typeof paso === 'string' ? (
                  paso
                ) : (
                  <>
                    <span className="font-medium text-gray-900">{paso.titulo}:</span> {paso.detalle}
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Ocultar guía"
          onClick={() => {
            localStorage.setItem(clave, 'oculto')
            setVisible(false)
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

export { RoleGuideBanner as OnboardingBanner }
