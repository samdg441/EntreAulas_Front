import { useState } from 'react'
import { X } from 'lucide-react'

interface OnboardingBannerProps {
  rol: string
  pasos: string[]
}

export default function OnboardingBanner({ rol, pasos }: OnboardingBannerProps) {
  const clave = `entre-aulas-guia-${rol}`
  const [visible, setVisible] = useState(() => localStorage.getItem(clave) !== 'oculto')

  if (!visible || pasos.length === 0) return null

  return (
    <section className="rounded-xl border border-red-200 bg-white p-4 shadow-sm" aria-label="Guía de primer ingreso">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Cómo empezar</p>
          <ol className="mt-2 space-y-1 text-sm text-gray-700 list-decimal pl-5">
            {pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-800"
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
