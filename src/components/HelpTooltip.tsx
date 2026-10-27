import { useId, useState } from 'react'
import { CircleHelp } from 'lucide-react'

interface HelpTooltipProps {
  texto: string
  etiqueta?: string
}

/** Pista contextual accesible. Se abre con clic, foco o teclado. */
export default function HelpTooltip({ texto, etiqueta = 'Más información' }: HelpTooltipProps) {
  const id = useId()
  const [abierto, setAbierto] = useState(false)

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label={etiqueta}
        aria-describedby={abierto ? id : undefined}
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
        onBlur={() => setAbierto(false)}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onKeyDown={(evento) => {
          if (evento.key === 'Escape') setAbierto(false)
        }}
      >
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
      </button>
      {abierto && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs font-normal leading-relaxed text-gray-700 shadow-lg"
        >
          {texto}
        </span>
      )}
    </span>
  )
}
